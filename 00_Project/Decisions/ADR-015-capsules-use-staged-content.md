# ADR-015: Capsules use staged content instead of one generic step

Status: Accepted  
Date: 2026-07-12

## Context

The first four-surface prototype proved navigation and shared transitions, but recipes, workouts, family activities, learning, and restoration each stopped at one representative Presence step. That demonstrates interaction but cannot yet carry a person through a complete experience.

## Decision

Every experience supplies a bounded Capsule Content Plan with:

- preparation items visible before commitment;
- ordered steps shown one at a time;
- optional duration, repetition, round, or completion metadata;
- a guidance mode: staged, quiet, or trusted handoff;
- one clear completion condition and optional Memory prompt.

The shared runner renders the plan, while the experience controls its content. A recipe, workout, family activity, and route therefore share progression behavior without being forced into the same visual or instructional shape.

## Boundaries

- One current step remains visually dominant.
- Timers are optional and never imply medical or performance precision.
- Handoffs remain preferable for navigation.
- The user may move back, continue, or finish without penalty.
- Prototype content is illustrative and must not be presented as professional dietary, medical, or coaching advice.

## Consequences

The prototype can now test complete shake and workout capsules as well as logical applications for food, restoration, family, learning, walking, and cycling.

