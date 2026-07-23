# ADR-059 — Living Now Surface: Affirmation, Richer Finite Choice, Contextual Refinement

Status: Approved by the Founder on 2026-07-23  
Version: 1.0  
Date: 2026-07-23

## Context

The Founder contributed two product ideas (Obsidian idea log, 2026-07-23) and refined them in conversation:

1. The Now surface should offer a richer set of options for the same moment — one best match stays primary, aligned with the time blocks Today already shows, and opening the app generates fresh candidates for that moment.
2. The text at the top of Now should be dynamic and directional — refined by the Founder into an **affirmation**: composed per person, per day, from live elements (day part, weather, free time) and the person's chosen directions/goals.
3. Certain choices that currently live in Profile (company such as family, transport mode) do not belong there — they belong in the refinement of a specific card during preparation.
4. The follow-up cards (guide, route/place cards) are not rich enough.

ADR-055 explicitly parked "the contextual personal day line" as an open question requiring separate approval. This ADR answers that question and approves the related Now/Prepare changes.

## Decision

### 1. Daily affirmation line on Now

- The top of Now carries a personal affirmation line, composed **deterministically** (no model required) from: day part, current live elements (weather/live-world context when available), the person's chosen directions, and — when present — their stated goals or meaning threads.
- Tone rules are strict: affirming and invitational, never guilt, streaks, pressure, or quantified self-judgment. It acknowledges the person and the day ("Rustige avond, frisse lucht — jouw wandeling past hier precies"), it does not measure them.
- With no profile or live context, the line falls back to a calm neutral variant (current behavior).
- This closes the ADR-055 open question; the neutral fallback requirement is hereby replaced by this mechanism.

### 2. Richer finite options for the moment

- Now keeps one primary hero, but the finite alternative set grows to a maximum of **5 options for the same moment**, ranked by the same transparent engine and aligned with the time blocks already visible in Today.
- Opening the app may generate a small contextual candidate **set** (2–3 drafts) instead of a single candidate, within the existing bounded-contextual-generation rules (ADR-039: same privacy budget, same exclusion of private data, same cache discipline). Each generated candidate still competes through the normal quality gate and ranking; generation never bypasses validation.
- Hard invariant: **never a feed**. No infinite scroll, no "more like this", no engagement mechanics. Five calm options maximum, swipeable as introduced in Horizon B.

### 3. Choices move from Profile to Prepare refinement

- Per-moment choices — company (alleen / partner / gezin / vrienden) and transport mode — are made **in the Prepare flow**, as refinement of the specific experience card ("Hoe ga je?", "Met wie?"). Choices made there apply to that experience and may softly inform future suggestions through the existing reversible learning model.
- Profile retains only broad identity-level preferences (directions, pace, boundaries). Per-moment choice controls are removed from Profile; Profile never requires per-outing logistics.

### 4. Richer guide and supporting cards

- The guide sheet and the supporting cards in Prepare (route/arrival plan, place knowledge, live evidence) are enriched within the approved capsule-content model: layered sections with clear editorial hierarchy, capsule-specific information shapes (ADR-055), imagery where the capsule provides it, and the guide moments structure (ADR-031) made visibly present rather than flattened.
- Richness means depth and craft, not volume: every card keeps one clear purpose; the calm visual grammar and reduced-motion requirements remain in force.

## Scope boundaries

- The product invariant "one excellent suggestion is preferred over a feed" is preserved through the explicit 5-option ceiling.
- Privacy budgets unchanged: affirmation uses only on-device data; generation follows ADR-036/039 unchanged.
- No accounts, no new external integrations, no new dependencies beyond what ADR-056/057/058 approved.
- Discover keeps its intentional, separate character (ADR-012); the richer candidate set benefits Discover's contextual leads but does not turn Discover into an infinite browse surface.
- No attention-capturing copy or motion anywhere in these changes.

## Consequences

- `src/product` (generation set support, affirmation composer), `src/app/store.tsx`, NowScreen, PrepareScreen, ProfileScreen, and guide components will change.
- The affirmation composer is deterministic and unit-testable; scenario coverage for tone rules (no pressure language) is required in the generator test suite or a new scenario file.
- Definition of done: typecheck clean, 42/42 generator tests green, web export builds, and a plain-language Founder update in the Obsidian log.
