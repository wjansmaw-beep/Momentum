import { createServer } from 'node:http';
import { CONTRACT_VERSION, validateDrafts, validateRequest } from './contract.mjs';
import { createBudgetTracker } from './budget.mjs';
import { createFixtureProvider } from './providers/fixture.mjs';
import { estimateCostUsd, selectProvider } from './providers/provider.mjs';

const env = process.env;
const port = Number(env.MOMENTUM_GENERATOR_PORT || 8787);
const host = env.MOMENTUM_GENERATOR_HOST || '127.0.0.1';
const allowedOrigins = new Set((env.MOMENTUM_ALLOWED_ORIGINS || 'http://127.0.0.1:8081,http://localhost:8081').split(',').map((origin) => origin.trim()));

// Exactly one provider is selected at startup (ADR-056). A missing or unknown
// MOMENTUM_GENERATOR_PROVIDER falls back to fixture; keys are never guessed.
const provider = selectProvider(env, process.argv);
const fixtureProvider = createFixtureProvider();
const budget = createBudgetTracker(env);

const requestCounts = new Map();
// Memory-leak fix (ADR-056): expired per-address windows are swept
// periodically instead of accumulating for the lifetime of the process.
const sweep = setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [address, record] of requestCounts) if (record.startedAt < cutoff) requestCounts.delete(address);
}, 60_000);
sweep.unref();

const json = (response, status, payload, origin) => {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': origin && allowedOrigins.has(origin) ? origin : 'http://127.0.0.1:8081',
    vary: 'origin',
    'x-content-type-options': 'nosniff',
  });
  response.end(JSON.stringify(payload));
};

const readBody = async (request) => {
  let size = 0; const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16_384) throw new Error('request_too_large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

const withinRateLimit = (address) => {
  const now = Date.now();
  const current = requestCounts.get(address);
  if (!current || now - current.startedAt > 60_000) { requestCounts.set(address, { startedAt: now, count: 1 }); return true; }
  current.count += 1;
  return current.count <= 20;
};

// The effective provider for this moment. A selected model provider that is
// unconfigured or budget-exhausted never silently serves model output under a
// fixture label or vice versa: mode follows the provider that actually ran.
const resolveRuntime = () => {
  const isModel = provider.kind === 'model';
  const configured = !isModel || provider.isConfigured(env);
  const budgetExhausted = isModel && configured && !budget.canSpend();
  const active = isModel && configured && !budgetExhausted ? provider : fixtureProvider;
  return { active, isModel, configured, budgetExhausted };
};

const logModelCall = (active, usage, latencyMs) => {
  const model = active.modelName(env);
  const estimatedCostUsd = estimateCostUsd(model, usage);
  budget.record(estimatedCostUsd);
  // Operational log per model call: provider, model, tokens, latency, and the
  // estimated cost line only. Never prompt or draft content (ADR-036/ADR-056).
  console.log(JSON.stringify({
    event: 'generator_model_call',
    provider: active.name,
    model,
    inputTokens: usage?.inputTokens ?? null,
    outputTokens: usage?.outputTokens ?? null,
    latencyMs,
    estimatedCostUsd: estimatedCostUsd === null ? null : Number(estimatedCostUsd.toFixed(6)),
    budget: budget.status(),
  }));
};

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'access-control-allow-origin': origin && allowedOrigins.has(origin) ? origin : 'http://127.0.0.1:8081',
      'access-control-allow-methods': 'POST,GET,OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '600',
    });
    response.end(); return;
  }
  if (request.method === 'GET' && request.url === '/health') {
    const { active, isModel, configured, budgetExhausted } = resolveRuntime();
    json(response, 200, {
      ok: true,
      service: 'momentum-generator',
      mode: isModel && !configured ? 'unconfigured' : active.kind,
      provider: isModel && !configured ? provider.name : active.name,
      configuredProvider: provider.name,
      model: active.kind === 'model' ? active.modelName(env) : undefined,
      budgetExhausted: budgetExhausted || undefined,
      budget: isModel ? budget.status() : undefined,
    }, origin); return;
  }
  if (request.method !== 'POST' || request.url !== '/v1/experience-drafts') { json(response, 404, { error: 'not_found' }, origin); return; }
  if (!origin || !allowedOrigins.has(origin)) { json(response, 403, { error: 'origin_not_allowed' }, origin); return; }
  if (!withinRateLimit(request.socket.remoteAddress || 'unknown')) { json(response, 429, { error: 'rate_limited' }, origin); return; }

  try {
    const parsed = validateRequest(await readBody(request));
    if (!parsed.ok) { json(response, 400, { error: 'invalid_request', message: parsed.error }, origin); return; }
    const { active, isModel, configured, budgetExhausted } = resolveRuntime();
    if (isModel && !configured) { json(response, 503, { error: 'provider_not_configured' }, origin); return; }
    if (budgetExhausted) {
      console.log(JSON.stringify({ event: 'generator_budget_exhausted_fixture_fallback', configuredProvider: provider.name, budget: budget.status() }));
    }
    const startedAt = Date.now();
    const raw = await active.generate(parsed.value, env);
    if (active.kind === 'model') logModelCall(active, raw.usage, Date.now() - startedAt);
    const drafts = validateDrafts(raw, parsed.value);
    if (!drafts.length) { json(response, 422, { error: 'no_valid_draft' }, origin); return; }
    json(response, 200, {
      contractVersion: CONTRACT_VERSION,
      mode: active.kind,
      provider: active.name,
      model: active.kind === 'model' ? active.modelName(env) : undefined,
      budgetExhausted: budgetExhausted || undefined,
      drafts,
    }, origin);
  } catch (error) {
    if (!(error instanceof SyntaxError) && !(error instanceof Error && error.message === 'request_too_large')) {
      console.warn(JSON.stringify({ event: 'generator_call_failed', provider: provider.name, reason: error instanceof Error ? error.message.slice(0, 120) : 'unknown' }));
    }
    const code = error instanceof Error && error.message === 'request_too_large' ? 413 : error instanceof SyntaxError ? 400 : 502;
    json(response, code, { error: code === 502 ? 'generation_failed' : 'invalid_request' }, origin);
  }
});

server.listen(port, host, () => {
  const { isModel, configured } = resolveRuntime();
  const mode = isModel ? `${provider.name}:${provider.modelName(env)}${configured ? '' : ' (not configured)'}` : provider.name;
  console.log(`Momentum Generator listening on http://${host}:${port} (${mode})`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
