// Internal provider interface for the Momentum Generator Service (ADR-056).
//
// A provider adapter is a plain object with this shape:
//
//   name: string
//     Stable identifier reported in health and response envelopes (display label).
//   kind: 'fixture' | 'model'
//     'model' means the output is produced by a remote model provider; 'fixture'
//     means local deterministic content. The envelope `mode` mirrors this kind
//     and must always be truthful (ADR-036/ADR-056).
//   isConfigured(env) => boolean
//     True only when the adapter has everything it needs (for example its API
//     key). Selection never infers a provider from present keys; this only
//     gates whether an explicitly selected model provider can serve requests.
//   generate(request, env, options?) => Promise<{ drafts: object[], usage?: { inputTokens: number, outputTokens: number } }>
//     Receives the validated, data-minimized request from contract.mjs and
//     returns raw draft objects in the draftSchema shape. Raw output is always
//     untrusted: contract.mjs validateDrafts remains the only acceptance gate.
//     `usage` is optional token accounting for cost logging and the budget.
//   modelName(env) => string | undefined
//     The concrete model identifier for envelopes and logging (model providers).
//   healthLabel() => string
//     Short human description for logs.
//
// The server selects exactly ONE adapter at startup through selectProvider():
// the explicit MOMENTUM_GENERATOR_PROVIDER value ('fixture' | 'openai' |
// 'anthropic' | 'moonshot'), or the --fixture CLI shortcut. A missing or
// unknown value falls back to the fixture provider; the service never guesses
// a provider from which API keys happen to be present.
//
// Adapters should use the shared helpers below so timeout, retry, token, and
// cost behavior stay consistent across providers. Adding a provider means:
// create providers/<name>.mjs with a create<Name>Provider() factory, register
// it in `factories`, and add contract tests under services/generator/test/.

import { createFixtureProvider } from './fixture.mjs';
import { createOpenAIProvider } from './openai.mjs';
import { createAnthropicProvider } from './anthropic.mjs';
import { createMoonshotProvider } from './moonshot.mjs';

const factories = {
  fixture: createFixtureProvider,
  openai: createOpenAIProvider,
  anthropic: createAnthropicProvider,
  moonshot: createMoonshotProvider,
};

export const providerNames = Object.keys(factories);

export function selectProvider(env, argv = []) {
  // --fixture stays as an explicit CLI shortcut; MOMENTUM_GENERATOR_MODE is a
  // legacy alias kept so existing local setups keep working.
  if (argv.includes('--fixture') || env.MOMENTUM_GENERATOR_MODE === 'fixture') return createFixtureProvider();
  const requested = (env.MOMENTUM_GENERATOR_PROVIDER || '').trim().toLowerCase();
  if (!requested) return createFixtureProvider();
  const factory = factories[requested];
  if (!factory) {
    console.warn(`Momentum Generator: unknown MOMENTUM_GENERATOR_PROVIDER "${requested}"; falling back to fixture.`);
    return createFixtureProvider();
  }
  return factory();
}

// Outbound request timeout per provider call (ADR-056: conservative default).
export const requestTimeoutMs = (env) => {
  const value = Number(env.MOMENTUM_GENERATOR_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 20_000;
};

// Replaces the previously hardcoded 3200 max_output_tokens.
export const maxOutputTokens = (env) => {
  const value = Number(env.MOMENTUM_GENERATOR_MAX_OUTPUT_TOKENS);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 3200;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Shared outbound fetch with an AbortController timeout and bounded retry.
// Retries happen at most `retries` times and only for 429/5xx responses;
// timeouts, aborts, and network errors are never retried (ADR-056).
export async function fetchWithRetry(url, options, { timeoutMs = 20_000, retries = 2, fetchImpl = globalThis.fetch } = {}) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, { ...options, signal: controller.signal });
      if ((response.status === 429 || response.status >= 500) && attempt < retries) {
        await sleep(400 * (2 ** attempt));
        continue;
      }
      return response;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error('unreachable');
}

// Approximate USD list prices per 1M tokens, as of 2026-07, used only for
// cost estimation against the Founder budget ceiling (ADR-056). Update when
// provider pricing changes; estimates are indicative, never billing truth.
export const modelPricesUsdPerMillion = {
  'gpt-5.4-mini': { input: 0.75, output: 4.50 },
  'gpt-5.4-nano': { input: 0.20, output: 1.25 },
  'gpt-5.4': { input: 2.50, output: 15.00 },
  'claude-haiku-4-5-20251001': { input: 1.00, output: 5.00 },
  'claude-sonnet-4-6': { input: 3.00, output: 15.00 },
  'kimi-k2.6': { input: 0.95, output: 4.00 },
  'kimi-k2.5': { input: 0.50, output: 2.80 },
};

export function estimateCostUsd(model, usage) {
  const price = model ? modelPricesUsdPerMillion[model] : undefined;
  if (!price || !usage) return null;
  const input = Number.isFinite(usage.inputTokens) ? usage.inputTokens : 0;
  const output = Number.isFinite(usage.outputTokens) ? usage.outputTokens : 0;
  return ((input * price.input) + (output * price.output)) / 1_000_000;
}
