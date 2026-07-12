# ADR-016: All proposal surfaces use one local decision engine

Status: Accepted  
Date: 2026-07-12

## Context

The four-surface prototype initially used a fixed experience on Now, a fixed day sequence on Today, and a separate keyword matcher in Discover. That proves navigation but contradicts the intended architecture: context and explicit intent should converge before candidate selection.

## Decision

The permission-light prototype uses one deterministic local decision engine for Now, Today, and Discover.

The engine:

- accepts an explicit, user-editable prototype context;
- applies hard feasibility filters before preference scoring;
- lets present-tense intent outrank profile affinity;
- scores time-window fit, company, preparation burden, and profile affinity;
- returns structured reasons and comparative confidence;
- can abstain when no candidate is responsibly feasible;
- never labels mock values as live Apple, weather, health, or calendar data.

Today calls the same engine for several meaningful time windows and applies diversity. Discover adds the user's own words to the same ranking process.

## Consequences

- Changing the prototype moment or profile visibly changes multiple surfaces.
- `Why this fits` can use engine reasons rather than static marketing copy.
- The prototype becomes a transparent test harness for later Apple integrations.
- This deterministic engine is not represented as production AI.

