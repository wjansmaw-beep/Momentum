# ADR-007 — Clarify When Ranking Is Close

Status: Accepted for prototype validation  
Date: 2026-07-10

## Decision

When “choose for me” produces two leading experience directions with a narrow score margin, Momentum asks one discriminating question instead of presenting the top candidate as an authoritative answer.

The clarification:

- compares the highest-ranked direction with the strongest runner-up from a different feeling family;
- describes desired outcomes rather than activity categories;
- asks only what attracts the user slightly more now;
- applies only to the current Human Moment;
- immediately re-ranks with the explicit answer as the strongest signal.

## Purpose

This turns uncertainty into an honest, low-friction interaction. It preserves autonomy without showing a feed and prevents false confidence from becoming part of the product voice.

## Validated scenario

For the Explorer trial profile with one available hour:

- wonder ranks first;
- challenge is the strongest different-direction runner-up;
- the margin is five prototype points;
- confidence is medium, so Momentum asks one clarification.

## Boundaries

- Prototype scores are comparative, not measures of human value.
- The threshold is provisional and requires user testing.
- Explicitly selected feelings do not trigger this clarification.
- If no responsible candidate exists, future behavior must support abstention rather than forcing a choice.
