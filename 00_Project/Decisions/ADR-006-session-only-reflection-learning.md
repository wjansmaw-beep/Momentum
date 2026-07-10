# ADR-006 — Session-only Reflection Learning

Status: Accepted for prototype validation  
Date: 2026-07-10

## Decision

The optional completion reflection now adjusts the selected feeling affinity inside the local trial profile for the current app session.

- “Yes” creates a modest positive adjustment.
- “A little” creates a very small positive adjustment.
- “No” creates a modest negative adjustment.
- Skipping creates no adjustment.

The adjustment can influence later “choose for me” rankings without changing explicit present-tense intent.

## Transparency and control

- The completion screen states that only the local trial profile is adjusted.
- The local context lab shows how many session reflections have been applied.
- Selecting a trial profile again clears all learned adjustments.
- Nothing is persisted, synchronized, uploaded, or inferred from completion alone.

## Purpose

This is a reversible proof that Memory can improve later Understanding without turning reflection into a performance score or an opaque identity judgment.

## Boundaries

- This is not production learning logic.
- A single answer must not become a durable preference in the future product.
- Situational outcome, lasting preference, and experience quality still require separate learning signals.
- User-inspectable editing, deletion, retention, and on-device persistence remain future work.
