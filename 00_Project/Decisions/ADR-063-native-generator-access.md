# ADR-063 — Explicit Native-Client Access to the Generator Service

Status: Approved by the Founder on 2026-07-24  
Version: 1.0  
Date: 2026-07-24

## Context

ADR-062 activated real-device testing on the Founder's iPhone and deliberately deferred one code change: live model generation from the phone. The generator service enforces an Origin check on `POST /v1/experience-drafts`, and React Native `fetch` on a device sends no `Origin` header at all, so calls from the iPhone received `403 origin_not_allowed` even when the server was reachable on the home network. Until now the phone therefore ran the approved local synthesis path only.

The Founder approved live Kimi (Moonshot) generation from the real iPhone app in conversation on 2026-07-24.

## Decision

- Native clients are admitted **explicitly and narrowly**: the native app sends the fixed header `X-Momentum-Client: native` on every generator call, and the server admits a request without an `Origin` header only when that header matches exactly.
- The browser path is **unchanged**: browser calls carry an `Origin` and are governed by the `MOMENTUM_ALLOWED_ORIGINS` allowlist only. A non-allowlisted origin is rejected even when the client header is present.
- Requests without an Origin and without (or with a wrong) client header keep receiving `403 origin_not_allowed`, exactly as before.
- The header is **explicit client identification, not a secret and not authentication** — anyone on the same network could send it. It is legitimate scope only on the Founder's own home network, combined with the existing guard rails that already apply regardless of origin: rate limiting (20 requests per minute per address), the daily call limit, and the budget ceiling.
- Public deployment of the generator service with real authentication remains a **separate release blocker** on the roadmap and requires its own ADR (Generator Service Runbook, production prerequisites). This decision does not weaken that blocker in any way.
- For LAN reachability the server is started with `MOMENTUM_GENERATOR_HOST=0.0.0.0` (existing configuration); the app receives the PC's LAN address through `EXPO_PUBLIC_MOMENTUM_GENERATOR_URL`, which is respected on native exactly as on web. The operational procedure is recorded in `00_Project/Device_Testing_Runbook.md`.

## Scope boundaries

- This decision covers the private home-network development path only: the Founder's iPhone talking to the Founder's PC on his own network.
- No API keys or shared secrets enter the app, the repository, or any document; the provider key stays server-only.
- No new provider, endpoint, request payload, or product feature is approved. The `experience-draft-v1` contract and all validation gates are untouched.
- App/device attestation, public authentication, TLS, and public deployment remain unapproved future scope.

## Consequences

- `services/generator/server.mjs` replaces the blanket "no Origin → 403" rule with an explicit decision: allowlisted origin, or the fixed native client header when no origin is present. The server module is restructured so this decision is testable in-process; observable behavior for browsers is identical.
- `src/product/generativeExperience.ts` sends `X-Momentum-Client: native` on native platforms only; the web build is byte-for-byte unchanged in its request headers.
- New contract tests (`services/generator/test/nativeAccess.test.mjs`) pin the three access paths and the LAN-binding configuration with real HTTP against the fixture provider — no API key or spending involved.
- The Device Testing Runbook now describes the working procedure (LAN binding, app URL env, Windows Firewall on port 8787, PowerShell and git-bash commands) instead of listing this change as a next step.
- Live Kimi generation from the phone is verified on the Founder's own network in a later session; the contract tests and a fixture-provider smoke test are the evidence boundary of this change set.
