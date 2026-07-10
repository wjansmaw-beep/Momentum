# Understanding Engine

Status: Foundational concept  
Version: 1.0

The Understanding Engine answers:

> Which experience is most likely to be meaningful for this person in this moment?

It is not a single AI prompt. It is an explainable decision system that combines permitted context, explicit intent, experience candidates, uncertainty, and feedback.

## Context model

### Personal context

Durable and editable preferences: interests, desired feelings, accessibility needs, routines, disliked experiences, relationships the user chooses to represent, and prior outcomes.

### Moment context

Time available, current location granularity, company, energy or recovery indicators, weather, calendar constraints, and explicit active intent.

### World context

Current opportunities such as opening hours, events, seasonal nature, conditions, travel time, crowd information, recent observations, and source freshness.

### Product context

Experience feasibility, required equipment, cost, preparation, safety, repetition, and whether a complete Experience Capsule is available.

## Decision pipeline

1. **Collect:** access only permitted, relevant context.
2. **Normalize:** convert signals into typed facts with source, time, confidence, and sensitivity.
3. **Generate:** retrieve feasible experience candidates; generative AI may phrase or enrich but must not invent availability.
4. **Filter:** remove unsafe, closed, inaccessible, unaffordable, impossible, or recently rejected candidates.
5. **Score:** assess contextual fit, desired outcome, feasibility, novelty, likely value, trust, and friction.
6. **Diversify:** avoid repetitive suggestions while preserving relevance.
7. **Select:** prefer one strong candidate; abstain when confidence or value is too low.
8. **Explain:** provide a short human-readable rationale using only details appropriate to reveal.
9. **Learn:** update reversible preferences from explicit and sufficiently reliable feedback.

## Hybrid intelligence

Deterministic rules should protect safety, permissions, feasibility, freshness, and known constraints. Ranking models may identify patterns. Generative AI may compose natural promises and guidance from verified facts.

AI must not be the sole authority for:

- health or safety constraints;
- permission decisions;
- factual live-world claims;
- whether an event is open or a route is available;
- high-impact sensitive inferences.

## Honest suggestion object

Every selected suggestion should be representable as structured data containing:

- experience identifier and type;
- intended felt outcome;
- context facts used;
- reasons for and against;
- confidence and freshness;
- Experience Promise;
- execution requirements;
- handoff capability;
- privacy classification;
- source provenance;
- fallback if execution fails.

The user-facing wording may be simple, but the decision must remain auditable.

## Abstention and graceful degradation

Momentum may say it lacks enough context, offer a general but useful experience, or ask one small question. It must work without optional Apple or third-party permissions and improve progressively as trust grows.

No suggestion is better than an intrusive, repetitive, unsafe, or fabricated one.

## Learning principles

- Explicit feedback outweighs inferred preference.
- Recent situational rejection does not erase durable interest.
- Variety is useful, but never at the expense of feasibility.
- The system learns desired outcomes as well as activity preferences.
- Users can inspect and correct the model in plain language.
- Sensitive context is minimized and retained only as long as justified.

## What becomes defensible

Momentum's long-term product knowledge is not access to generic AI. It is the carefully validated relationship between context, emotional promise, feasibility, timing, user choice, and experienced outcome.
