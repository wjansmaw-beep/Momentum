import { createServer } from 'node:http';
import { draftSchema, validateDrafts, validateRequest } from './contract.mjs';
import { createFixtureDraft } from './fixture.mjs';
import { buildPrompt } from './prompt.mjs';

const port = Number(process.env.MOMENTUM_GENERATOR_PORT || 8787);
const host = process.env.MOMENTUM_GENERATOR_HOST || '127.0.0.1';
const fixtureMode = process.argv.includes('--fixture') || process.env.MOMENTUM_GENERATOR_MODE === 'fixture';
const model = process.env.OPENAI_MODEL || 'gpt-5.6-terra';
const allowedOrigins = new Set((process.env.MOMENTUM_ALLOWED_ORIGINS || 'http://127.0.0.1:8081,http://localhost:8081').split(',').map((origin) => origin.trim()));
const requestCounts = new Map();

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

const outputText = (payload) => {
  if (typeof payload?.output_text === 'string') return payload.output_text;
  for (const item of payload?.output ?? []) for (const content of item?.content ?? []) if (content?.type === 'output_text' && typeof content.text === 'string') return content.text;
  return '';
};

async function generateWithOpenAI(request) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      store: false,
      reasoning: { effort: 'low' },
      input: [{ role: 'developer', content: [{ type: 'input_text', text: buildPrompt(request) }] }],
      text: { format: { type: 'json_schema', name: 'momentum_experience_drafts', strict: true, schema: draftSchema } },
      max_output_tokens: 3200,
    }),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`openai_${response.status}:${detail}`);
  }
  const payload = await response.json();
  const text = outputText(payload);
  if (!text) throw new Error('openai_empty_output');
  return JSON.parse(text);
}

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
    json(response, 200, { ok: true, service: 'momentum-generator', mode: fixtureMode ? 'fixture' : process.env.OPENAI_API_KEY ? 'openai' : 'unconfigured', model: process.env.OPENAI_API_KEY ? model : undefined }, origin); return;
  }
  if (request.method !== 'POST' || request.url !== '/v1/experience-drafts') { json(response, 404, { error: 'not_found' }, origin); return; }
  if (!origin || !allowedOrigins.has(origin)) { json(response, 403, { error: 'origin_not_allowed' }, origin); return; }
  if (!withinRateLimit(request.socket.remoteAddress || 'unknown')) { json(response, 429, { error: 'rate_limited' }, origin); return; }

  try {
    const parsed = validateRequest(await readBody(request));
    if (!parsed.ok) { json(response, 400, { error: 'invalid_request', message: parsed.error }, origin); return; }
    if (!fixtureMode && !process.env.OPENAI_API_KEY) { json(response, 503, { error: 'provider_not_configured' }, origin); return; }
    const raw = fixtureMode ? { drafts: [createFixtureDraft(parsed.value)] } : await generateWithOpenAI(parsed.value);
    const drafts = validateDrafts(raw, parsed.value);
    if (!drafts.length) { json(response, 422, { error: 'no_valid_draft' }, origin); return; }
    json(response, 200, { contractVersion: 'experience-draft-v1', mode: fixtureMode ? 'fixture' : 'model', provider: fixtureMode ? 'momentum-fixture' : 'openai-responses', model: fixtureMode ? undefined : model, drafts }, origin);
  } catch (error) {
    const code = error instanceof Error && error.message === 'request_too_large' ? 413 : error instanceof SyntaxError ? 400 : 502;
    json(response, code, { error: code === 502 ? 'generation_failed' : 'invalid_request' }, origin);
  }
});

server.listen(port, host, () => {
  const mode = fixtureMode ? 'fixture' : process.env.OPENAI_API_KEY ? `openai:${model}` : 'unconfigured';
  console.log(`Momentum Generator listening on http://${host}:${port} (${mode})`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
