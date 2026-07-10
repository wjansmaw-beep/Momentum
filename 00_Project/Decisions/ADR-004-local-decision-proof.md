# ADR-004 — Local Explainable Decision Proof

Status: Accepted for prototype validation  
Date: 2026-07-10

## Decision

Before connecting generative AI or private context sources, Momentum will prove candidate filtering and ranking with a small deterministic local Decision Engine.

The prototype now:

1. receives available time and an optional explicitly chosen feeling;
2. compares a bounded candidate catalogue;
3. removes candidates that exceed the time window or require unavailable equipment;
4. ranks feasible candidates using explicit intent, time fit, local profile affinity, friction, and Presence potential;
5. selects one proposal and keeps a compact decision receipt;
6. reports moderate confidence when the winning margin is narrow.

## User-facing behavior

Momentum still shows one Experience Promise. It does not expose a feed or numerical score. A concise explanation states which relevant factors supported the selection and that the current context is a local prototype scene.

“Choose for me” now compares feasible candidates instead of opening a fixed sixth capsule.

## Validated scenarios

- 15 minutes + explicit challenge → short bodyweight challenge; the kettlebell candidate is rejected as too long.
- 60 minutes + explicit challenge → kettlebell strength candidate.
- 60 minutes + choose for me → wonder candidate based on the local trial profile, with medium confidence.

## Boundaries

- This is deterministic prototype logic, not learned intelligence.
- Profile affinity and equipment are visibly local scenario data.
- It does not use Apple data, live world facts, health inference, a backend, or generative AI.
- Safety, freshness, permissions, abstention, and richer candidate generation remain required before real recommendations.
