# ADR-038 — Generated Capsule Continuity

Status: Accepted and implemented  
Version: 1.0  
Date: 2026-07-16

## Decision

A generated draft is not treated as a transient search result. After the provider and domain boundaries from ADR-036 and ADR-037 accept it, the app:

1. runs it through the same Guide Composer used by trusted catalogue experiences;
2. runs the resulting experience through the structural composition audit;
3. labels its origin on the selection card and Promise;
4. previews its real Capsule stages before commitment;
5. stores a complete Experience snapshot inside an active local session;
6. stores the same snapshot with an optional local Memory.

This lets a generated Capsule survive navigation and reload during Prepare or Presence, and lets its Memory reopen the experience that was actually lived rather than an unrelated catalogue fallback.

## Boundaries

- The snapshot is local application state, not a remotely synchronized account object.
- Generated copy does not become editorial truth or a reusable live-world claim.
- A snapshot preserves provenance and disclosure.
- The generator still cannot provide routes, weather, observations, opening times, private Apple context, or other unverified facts.
- The response contract and generated domain must match the request that the user explicitly shaped; unrelated but otherwise valid output is rejected on both service and application boundaries.
- Existing memories and sessions without snapshots continue to resolve through the trusted catalogue.

## Experience consequence

Discover may still show one best proposal and one genuinely different direction. A generated proposal now visibly communicates that it is a complete journey with preparation, staged Presence, optional guidance, and Memory. This adds confidence without turning Discover into a feed or exposing implementation diagnostics as product content.

## Failure behavior

If generation, Guide composition, or structural validation fails, the existing trusted local candidate path remains available. If a legacy stored session has no snapshot, Momentum resolves its identifier against the current accepted catalogue as before.
