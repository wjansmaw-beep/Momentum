# ADR-026 — Reflection memory is explicit, visible, and reversible

Status: Accepted and prototyped  
Date: 2026-07-14

## Decision

Momentum may learn from reflection only when the person gives an explicit signal. A reflection can describe both the overall outcome and the aspect that should change next time, such as less explanation, a shorter experience, lower intensity, less travel, or a topic that was not useful.

These corrections become part of a local personal memory. They influence later selection and guidance, are summarized in the profile, and can be reset by the person.

## Why

“This was less pleasant” is too ambiguous to guide the next experience. The problem may have been the activity, duration, intensity, travel, amount of guidance, or a particular information layer. Aspect-level reflection allows Momentum to improve without inventing motives or silently redefining the person.

## Boundaries

- “Not now” is situational and never becomes durable preference learning.
- Notes are memories, not automatically interpreted personality facts.
- Meaning anchors and life direction are never inferred from negative reflection.
- A topic is muted only after an explicit “this content is not useful” correction.
- The prototype stores this memory locally on the device.
- The person can inspect a plain-language summary and clear learned memory.
- Individual signal removal and retention periods remain follow-up decisions.

## Prototype behavior

The first implementation can learn:

- more or less guidance;
- preference for shorter experiences;
- lighter or stronger intensity;
- reduced travel tolerance;
- lower relevance for an experience kind;
- muted guided-insight topics;
- explicit repeat, worthwhile, and not-for-me signals.

The learning remains a soft ranking influence. Feasibility, safety, time, company, and explicit user intent still take precedence.

## Consequences

Reflection becomes a product input rather than only a saved memory. The profile needs a visible personal-memory section, migration from the earlier profile shape, and scenario tests that prove explicit corrections change later behavior without turning a single situational decline into a permanent judgment.
