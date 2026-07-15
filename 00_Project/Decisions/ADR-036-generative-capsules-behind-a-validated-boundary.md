# ADR-036 — Generative Capsules Behind a Validated Boundary

Status: Accepted and implemented  
Version: 1.0  
Date: 2026-07-15

## Context

Active Intent can understand and clarify what a person wants, but until now it could only select or deterministically reframe experiences already present in the catalog. The Founder approved the next step: Momentum may create new experience drafts for the current human moment.

An unconstrained model response would contradict Momentum's trust model. It could invent live-world claims, produce an incomplete recipe or workout, make health claims, expose private profile data, or turn a suggestion into opaque authority.

## Decision

Generation is a candidate source, never a decision maker and never a direct UI source.

The pipeline is:

> Explicit words → optional single clarification → minimal moment request → draft generation → schema sanitization → domain contract validation → personal Meaning Thread → comparative ranking → user choice

Momentum supports two providers behind the same boundary:

1. **Secure remote generator:** an optional server endpoint may return genuinely new drafts. Provider credentials never ship in the app.
2. **Device-local synthesis:** without an endpoint, Momentum creates a new combination from approved language and complete editorial building blocks. It is explicitly labelled as local synthesis, not presented as external AI.

## Data minimization

The remote request contains only the words deliberately entered for this moment, selected clarification terms, day part, chosen company, available minutes, explicitly available equipment, detected experience domains, and the public draft-contract version.

It does not contain calendar event content, precise location, reflections, memories, contacts, health data, long-term profile text, or hidden ranking context.

## Generated-content boundary

Remote output is treated as untrusted data. The client:

- accepts only known fields and experience kinds;
- limits field and collection sizes;
- requires at least two complete execution steps;
- rejects unsupported medical, guaranteed, or absolute safety claims;
- rewrites generated insight provenance to a truthful synthesis label;
- ignores generated live evidence and route plans;
- substitutes a safe editorial image when needed;
- applies the existing domain validators;
- silently falls back to local synthesis when the endpoint is missing, unavailable, malformed, or yields no valid candidate.

Live observations, access, opening hours, routes, weather, and other changing facts remain the responsibility of source-grounded Living World adapters. Generation may interpret verified facts only after a later evidence-envelope contract is approved.

## UX and autonomy

Discover shows whether the proposal was remotely generated or locally combined. Promise repeats that disclosure. Generated candidates compete with trusted catalog candidates; generation does not guarantee selection. The person can change their words, ignore the proposal, choose an alternative, or leave.

No endless generation control is added. The goal is a better next step, not a content machine.

## Configuration

`EXPO_PUBLIC_MOMENTUM_GENERATOR_URL` may point to a secure application-owned endpoint. It is a URL, not a provider secret. The server owns authentication to any model provider, rate limits, abuse controls, logging policy, and the response contract.

## Consequences

- The app already demonstrates adaptive creation without requiring a paid external service.
- A future model provider can be connected without changing the product flow or trusting its output directly.
- Local synthesis remains narrower than genuine model generation, by design.
- Evidence-grounded generation and production retention remain future explicit decisions.
