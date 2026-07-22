# Generator Service Runbook

Status: Operational  
Version: 1.1

## Local proof without an API key

In one terminal:

```text
npm run generator:fixture
```

In another terminal:

```text
npm run web
```

The web app automatically uses `http://127.0.0.1:8787/v1/experience-drafts`. If the service stops, Discover falls back to device-local synthesis without breaking the experience flow.

The same endpoint supports two explicit request modes:

- `active-intent`: requires the person's current words or clarification;
- `contextual-suggestion`: accepts no free profile text and requires exactly one locally selected approved domain.

Both return the same `experience-draft-v1` response contract. Do not broaden the contextual request with goals, reflection, calendar content, location, live facts, or hidden ranking signals.

Run the provider contract tests at any time (fully mocked, no keys or spending):

```text
npm run test:generator
```

## Provider selection (ADR-056)

The service runs exactly one provider, selected explicitly:

```text
MOMENTUM_GENERATOR_PROVIDER=fixture | openai | anthropic | moonshot
```

A missing or unknown value falls back to the fixture provider, and `--fixture` remains the CLI shortcut. The service never guesses a provider from which API keys happen to be present. Per provider, set the server-only environment before running `npm run generator`:

```text
OPENAI_API_KEY / OPENAI_MODEL             (default gpt-5.4-mini)
ANTHROPIC_API_KEY / ANTHROPIC_MODEL       (default claude-haiku-4-5-20251001)
MOONSHOT_API_KEY / MOONSHOT_MODEL         (default kimi-k2.6)
MOONSHOT_BASE_URL                         (default https://api.moonshot.ai/v1; use https://api.moonshot.cn/v1 for China-hosted keys)
```

A selected model provider without its key answers `503 provider_not_configured` and reports `unconfigured` in health. Never prefix a provider key with `EXPO_PUBLIC_`, never commit it, and never send it to the app. All model env names without values are listed in `services/generator/.env.example`.

For a remotely deployed application-owned endpoint, the app may use:

```text
EXPO_PUBLIC_MOMENTUM_GENERATOR_URL=https://api.example.com/v1/experience-drafts
```

## Health

```text
GET http://127.0.0.1:8787/health
```

The response reports `mode` (`fixture`, `model`, or `unconfigured`), the effective `provider`, the `configuredProvider`, the `model` when a model provider runs, and the `budget` status. When the budget or daily call limit is reached, health reports `budgetExhausted: true` and the effective mode is honestly `fixture`. It never reveals any API key.

## Budgets, limits, and logging

- `MOMENTUM_GENERATOR_DAILY_CALL_LIMIT` (default 100) and `MOMENTUM_GENERATOR_BUDGET_EUR` (default 10 — the Founder ceiling) bound model spending per UTC day per process. An explicit `0` blocks all model calls. The EUR ceiling is compared against estimated USD costs via a fixed planning rate (`MOMENTUM_GENERATOR_USD_PER_EUR`, default 1.09); estimates use indicative list prices and are a safety net, never billing truth.
- On exhaustion the service stops model calls, serves the fixture path, logs the event, and marks health and responses with `budgetExhausted: true`. The `mode` field always names what actually ran; a model answer is never labeled fixture or vice versa.
- Recommended (Founder decision 2026-07-22): also configure hard spending limits in each provider dashboard (OpenAI usage limits, Anthropic workspace limits, Moonshot balance alerts) so the ceiling holds even if the service guard fails.
- Each model call logs provider, model, input/output tokens, latency, and the estimated cost line as structured JSON. Prompt and draft content is never logged.

## Timeout and retry

Each provider call has an outbound AbortController timeout (`MOMENTUM_GENERATOR_TIMEOUT_MS`, default 20000 ms). Failed calls are retried at most twice with backoff, only for HTTP 429/5xx. Timeouts, aborts, and network errors are never retried. The Moonshot adapter additionally performs exactly one validation retry when the model returns malformed JSON.

## Adding a provider adapter

1. Create `services/generator/providers/<name>.mjs` exporting `create<Name>Provider()` that returns the interface documented in `providers/provider.mjs`: `name`, `kind`, `isConfigured(env)`, `generate(request, env, options?)`, `modelName(env)`, `healthLabel()`.
2. Use the shared helpers in `provider.mjs` (`fetchWithRetry`, `requestTimeoutMs`, `maxOutputTokens`, price table) so operational behavior stays consistent.
3. Register the factory in the `factories` map in `provider.mjs` and add its indicative price to `modelPricesUsdPerMillion`.
4. Translate the provider response into raw `draftSchema` objects; never leak provider-specific shapes past the adapter. `contract.mjs` validateDrafts remains the only acceptance gate.
5. Add contract tests under `services/generator/test/` with a fully mocked fetch (valid payload, malformed output, blocked claims, domain violation, timeout path), then run `npm run test:generator`.

## Production prerequisites

Before binding beyond localhost or exposing the endpoint publicly, add:

- managed TLS and a production gateway;
- durable distributed rate limiting;
- approved app/device attestation or equivalent abuse control;
- redacted operational telemetry and retention policy;
- secrets management and key rotation;
- evaluation gates for every prompt or model change.

Do not place a supposed shared secret in the mobile app. Public clients cannot keep it secret.
