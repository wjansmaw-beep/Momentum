# ADR-033 — Candidate quality gate and explicit guide adaptation

Status: Accepted and first local implementation prototyped  
Date: 2026-07-15

## Decision

Every composed candidate is audited before ranking. Structurally incomplete candidates are rejected and never shown on Now, Today, or Discover. Expired live evidence may degrade to an honest editorial or evergreen Capsule when execution remains complete. The global catalogue is the fallback if dynamic composition yields no accepted candidates.

Explicit reflection feedback now influences default guide depth and preparation previews. Less-guidance feedback prefers quiet mode; repeated more-guidance feedback may prefer deep mode; muted topics and experience-specific guidance are removed before the person begins. The choice remains reversible per Capsule.

The local Profile exposes aggregate composition counts so automatic behavior is inspectable without external analytics.

## Why

ADR-032 allowed new guide moments to be composed automatically. A separate eligibility gate prevents richer generation from becoming a path for incomplete or stale experiences to reach the person. Applying explicit feedback before Presence makes the guide genuinely adaptive while preserving user control.

## Boundaries

- The gate validates structural completeness and existing provenance; it is not yet a full clinical, dietary, route, accessibility, or legal validator.
- A rejected candidate is not secretly replaced by a similar generated claim. The approved catalogue fallback is used.
- Composition metrics remain local and describe product output, not user behavior.
- No model, backend, account, or new permission is introduced.
