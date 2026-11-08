# ADR-069 — Adaptive Guide first implementation

Status: Accepted from explicit Founder direction on 2026-11-08  
Version: 1.0

## Decision and authorization

The Founder chose the handoff's earlier concept, reviewed the interactive design positively, and instructed: clear decisions may be implemented without a repeated approval step. Record clear accepted decisions before or with their implementation. Ask only when a material choice is unresolved. This does not authorize automatic publication, paid services or unrelated scope.

## Product Guardian preflight

This advances Roadmap phase 4 design into the first phase 6 vertical slice. Current main f55c4fd has one Guide with steps, expandable depth and phone-away, not three presentation modes. ADR-067's visual direction differs from the chosen forest/ivory editorial concept. Its five primary surfaces remain; the active Guide uses a local three-mode bar. The current FlowFrame already omits the app tab bar. ADR-068 exists and is implemented although Status still names earlier boundaries.

## First slice

- Reuse GuideScreen, navigation, the Experience contract and activeSession. No second store or navigator.
- Outside, culture and learning experiences use Navigate, Discover and Immerse; other execution flows retain their existing UI.
- Discover presents existing, provenance-labelled insights and the current instruction as a voluntary, reversible task. No new historical claims or fabricated assets.
- Persist mode, stable chapter identity and task IDs inside the existing local session, preserving old-session compatibility. A change of instruction invalidates its old completion identity.
- Navigate initially uses existing route handoff and truthful absence when no verified route plan exists. Interactive maps are a subsequent slice, not represented as implemented.
- Immerse offers observation and the existing phone-away state. Audio is unavailable until a real player and asset exist; no fake playback.
- Preserve timers, guide-depth controls, muted topics, current-source expiry, reflection, shared context and existing capsule types.

Amends ADR-067 only for the active Guide's visual/presentation layer and extends ADR-030/031 with local task state. Route and model boundaries in ADR-044 and ADR-068 remain unchanged. No new dependencies, external sources, background tracking, audio provider or free-form AI answers.

## Validation

Typecheck, existing suites, web export, and focused session identity/migration tests. Browser or device inspection must be reported separately; automated pure-model tests do not prove native accessibility or layout.
