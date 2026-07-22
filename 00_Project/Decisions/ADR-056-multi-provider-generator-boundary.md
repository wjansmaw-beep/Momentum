# ADR-056 — Multi-Provider Generator Boundary

Status: Proposed — awaiting Founder approval  
Version: 1.0  
Date: 2026-07-22

## Context

Generator Service v1 (ADR-037) implements the provider-independent boundary from ADR-036 with two providers: a local fixture and an optional OpenAI Responses API provider. In practice the OpenAI path has never been runtime-tested: no API key was ever supplied during development, and the only provider path defaults to a model named `gpt-5.6-terra` that does not exist in the OpenAI model catalog. The documented evidence in ADR-037 confirms this honestly — the path is configuration-ready, not exercised.

Meanwhile the app is increasingly developed with interchangeable AI assistants, and the Founder may want generation served by a different model provider than OpenAI. Today that would require editing provider-specific code inside `services/generator/server.mjs`, because the request, response parsing, and health reporting are written directly against the OpenAI Responses API.

## Proposed decision

Introduce a provider-adapter layer inside the Generator Service, keeping every guarantee from ADR-036 and ADR-037 intact:

- Each provider lives in `services/generator/providers/` behind one internal interface (request in, structured drafts out). The server selects exactly one adapter at startup.
- An explicit `MOMENTUM_GENERATOR_PROVIDER` environment variable selects the provider (`fixture`, `openai`, or a future provider). An unknown or missing value falls back to fixture behavior; the service never silently guesses a provider.
- The draft schema in `contract.mjs` remains the single source of truth. Every adapter translates its provider's structured output into that contract; provider-specific response shapes never leak into the app.
- The health and response envelopes report a generic mode `model` plus the provider name, instead of OpenAI-specific naming.
- Server-side timeout, retry, and cost limits are configured per provider, with conservative defaults.
- The contract version (`experience-draft-v1`) is centralized so adapters cannot drift from the app contract.

The local fixture provider remains the default development path and requires no API key.

## Scope boundaries

- No account or authentication system is added.
- No public deployment of the Generator Service without a separate ADR covering managed TLS, durable rate limiting, abuse detection, and attestation (as already stated in ADR-037).
- No change to the client-side request, sanitization, or validation path beyond consuming the generic envelope.
- Model-authored live claims, routes, or evidence remain rejected, exactly as ADR-036 requires.

## Open questions

- Which provider(s) should be implemented first after OpenAI, and by what criteria (quality, cost, data policy)?
- What budget limits per provider are acceptable, and how should the service behave when a limit is reached?
- Should the sanitization and refusal specification be shared as one explicit document so every adapter is tested against the same rules?

## Implementation note

This ADR is a proposal. Any implementation of the adapter layer, new providers, or envelope changes requires explicit Founder approval of this ADR before code is written.
