# ADR-027 — MVP reliability before more breadth

Status: Accepted and prototyped  
Date: 2026-07-14

## Decision

Momentum strengthens the complete active loop before adding more engines or source categories. The permission-light prototype now preserves an active Capsule locally, resumes at the last step, abstains from presenting a confident primary promise when local ranking confidence is low, and records only minimal local proof counts for starts, completions, reflections, and skipped reflections.

## Why

The document and engine foundation is ahead of evidence that the whole product loop works for people. More breadth would not answer whether someone understands, begins, completes, and benefits from the current experience.

## Reliability behavior

- A committed Capsule persists locally with experience, stage, current step, origin, and update time.
- Returning to the app offers an explicit resume action; Momentum does not falsely assume completion after a platform handoff.
- Low confidence produces a quiet clarification path or no action, not a polished but weak recommendation.
- Reflection remains optional.
- Local prototype evidence contains counts only. It stores no note content, location, activity content, or external analytics identity.
- Evidence can be cleared independently from memories and preference learning.

## Personal control refinements

- A direction can be paused without deletion and stops influencing ranking while paused.
- “No explanation for this experience” and “less about this topic” are separate explicit corrections.
- Both corrections remain visible and reversible through personal memory.

## Boundaries

- Resume state is not proof that the experience was completed.
- Local counts are development evidence, not product-success evidence.
- Real user validation remains required.
- Background detection, notifications, HealthKit, Live Activities, and native return-state integration remain deferred to an approved development-build stage.
