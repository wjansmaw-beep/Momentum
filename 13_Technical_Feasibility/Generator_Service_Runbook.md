# Generator Service Runbook

Status: Operational  
Version: 1.0

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

## Real model provider

Set server-only environment variables before running `npm run generator`:

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6-terra
MOMENTUM_ALLOWED_ORIGINS=http://127.0.0.1:8081,http://localhost:8081
```

Never prefix `OPENAI_API_KEY` with `EXPO_PUBLIC_`, never commit it, and never send it to the app. `OPENAI_MODEL` is optional.

For a remotely deployed application-owned endpoint, the app may use:

```text
EXPO_PUBLIC_MOMENTUM_GENERATOR_URL=https://api.example.com/v1/experience-drafts
```

## Health

```text
GET http://127.0.0.1:8787/health
```

The response reports `fixture`, `openai`, or `unconfigured`. It never reveals the API key.

## Production prerequisites

Before binding beyond localhost or exposing the endpoint publicly, add:

- managed TLS and a production gateway;
- durable distributed rate limiting;
- approved app/device attestation or equivalent abuse control;
- redacted operational telemetry and retention policy;
- secrets management and key rotation;
- timeout, retry, and provider-budget policies;
- evaluation gates for every prompt or model change.

Do not place a supposed shared secret in the mobile app. Public clients cannot keep it secret.
