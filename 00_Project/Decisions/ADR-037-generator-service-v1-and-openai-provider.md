# ADR-037 — Generator Service v1 and OpenAI Provider

Status: Accepted and implemented  
Version: 1.0  
Date: 2026-07-15

## Decision

Momentum implements the provider-independent boundary from ADR-036 as a small server-side service. The service supports:

- a local fixture provider for complete end-to-end development without API spending;
- an optional OpenAI Responses API provider using Structured Outputs;
- a configurable model, currently defaulting to `gpt-5.6-terra` as the documented balance of intelligence and cost;
- server-side prompt, schema, request, and draft validation;
- no provider credentials in Expo;
- `store: false` for model requests;
- a 16 KB request limit, per-process rate limit, origin allowlist, and no-store responses.

The model is asked for one complete capsule, not a list. It receives only the explicit moment request approved by ADR-036. The service refuses or removes unsupported claims and never accepts live evidence or route data from model output.

## Development mode

On web, the app probes the local service at `127.0.0.1:8787`. If it is absent, malformed, unavailable, or rejects the draft, the app silently uses its device-local synthesis. `npm run generator:fixture` runs the service without an API key and truthfully marks its response as fixture output.

## Production boundary

This service protects the model-provider key but is not yet a complete public production edge. A deployed mobile endpoint still needs managed TLS, durable distributed rate limiting, abuse detection, observability with redaction, and an approved device/app-attestation or gateway strategy. A public client secret embedded in Expo is explicitly rejected as fake authentication.

## Provider choice

The OpenAI provider is the first implementation, not permanent product architecture. `OPENAI_MODEL` can change the supported model without changing the app contract. Another provider may be added only if it satisfies the same structured contract, privacy boundary, refusal behavior, and validation path.

Official implementation references: [Responses text generation](https://developers.openai.com/api/docs/guides/text?api-mode=responses), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), and the current [model catalog](https://developers.openai.com/api/docs/models).

## Evidence

The local service was exercised end to end for movement, food, learning, and connection requests. Each returned a validated three-step capsule. A real OpenAI request was not executed because no API key was supplied; that path remains configuration-ready rather than falsely reported as runtime-tested.
