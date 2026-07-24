# ADR-065 — Experience Renewal: anticipation over administration

Status: Approved by the Founder on 2026-07-24  
Version: 1.0  
Date: 2026-07-24

## Context

On 2026-07-24 the Founder commissioned a deep review of the entire product: a full codebase and copy audit plus independent market research into premium experience apps (Calm, Airbnb, Komoot, AllTrails, Merlin Bird ID, BirdCast, Partiful, Day One, Polarsteps and others). The Founder's stated vision: *let people experience beautiful things together in beautiful places*, by combining live world data (location, weather, nature signals, season, time) with a broad personal profile (health/energy, household composition, travel style, hobbies such as cycling, birding, photography, culture, food). On opening, the app must feel deeply premium and genuinely connected to the user.

The audit's core finding, accepted by the Founder: **the infrastructure is right, the experience layer is not.** The live-world engine, the capsule model, the no-feed invariant, reversible learning, and the visual system are at vision level. But what the user sees and reads is a decision engine with forms: a hidden four-persona ranking model, a Prepare phase that reads like a worksheet (numbered steps, readiness checkboxes that "do not block starting", four operational questions), machine language on the consumer surface ("conservative pre-estimate", "source window", "CONFIDENCE HIGH", "probably fits your moment"), a "together" flow that only works on web and simulates participation locally, a fabricated day structure when no calendar is linked, and a hard-coded Dokkum region fallback. Hobbies, household composition, and health do not exist in the profile; the car preference from onboarding is collected and then ignored; season is computed but filters nothing.

The Founder approved the resulting renewal direction in conversation on 2026-07-24, including the UI form hierarchy and the recorded phasing.

## Decision

The **Experience Renewal** program is approved, in seven parts, with a UI form hierarchy and a four-phase implementation order.

### The seven renewals

1. **Prepare becomes Voorpret (anticipation).** Expectation leads: the promise and imagery land first. Logistics are told as the first scenes of the story ("bring a layer, the dike is windy"), never as a worksheet. Smart defaults replace interrogation: at most one explicit question per preparation. Numbered step rails, readiness checkboxes, and the four-question intake are removed. When a moment is planned for later, a soft countdown carries one atmospheric practical note per day. Meta-language about the app itself ("guide remains available", source-window validity notices) leaves the main surface.

2. **Profile as a conversation that grows.** The hidden `PrototypeProfile` persona model is removed from ranking. A broad profile (household composition, hobbies, energy, travel style) grows progressively: questions arrive in context, never as a form, and every answer visibly improves suggestions. Collected-but-unused signals (the ignored car preference) either take effect or stop being asked.

3. **"Why now" on every suggestion.** Each suggestion carries two or three visible reasons drawn from live data (time, weather, nature signals, season). Transparent reasoning is the premium feeling itself; unexplained personalization reads as generic AI.

4. **Copy renewal.** The consumer surface speaks the affirmation register: concrete time, light and weather; present tense; one sensory detail per sentence; no superlatives; suggestions end with their reason. Machine and source language (confidence labels, source-window notices, algorithmic hedging such as "probably", negative-first disclaimers, engineering honesty like "does not block starting") moves to a "why / source" layer one tap deeper. Banned as consumer headline copy: algorithm scores, provider names, validation mechanics. The affirmation line remains the tone benchmark.

5. **Together made real.** The invite flow is repaired on native via the `momentum://` scheme; a guest can receive and respond without installing the app. The shared circle is closed by default: no counters, no visible guest-list as social currency, no public comparison. Local-simulation language ("response not yet synchronized") is replaced by honest consumer phrasing or removed.

6. **Removal of what works against the vision.** Dead modules are deleted (`src/decision/localDecision.ts`, `composeLiveExperience` and `composeNearbyPlaceExperience` in `liveWorld.ts`, `todayMoments`, the unused pollen field). Fabricated day windows are no longer presented as the user's real day; without a calendar the day view shows honest open space. The hard-coded Dokkum fallback is replaced by an explicit location-permission flow with a truthful neutral state. Lab-evaluation chips leave the Remember reflection (the debug lab surface retains them). Fixed stock photography that can never be the user's place is phased out in favour of location-true or licensed imagery.

7. **Season and hobbies switched on.** Season actually filters and ranks content (the existing unused `seasons` capability). Hobbies become first-class profile signals that steer which live sources are consulted (bird data for birders, culture sources for culture lovers) instead of all sources for everyone.

### UI form hierarchy

The form follows the phase, never the reverse:

1. **Now — a living canvas, not a card.** The screen is the moment: image, light, time, one lead suggestion large; remaining options as a quiet filmstrip, not a card stack.
2. **Discover — an editorial magazine, not a tile grid.** Full-bleed chapters with large headlines; finite, never a feed (invariant preserved).
3. **Voorpret — a story that unfolds, zero cards.** Scenes the user reads through; continuity of the moment's imagery across phases (Now → Voorpret → Presence → Memory) is the red thread.
4. **Cards only where genuine choice happens.** The option set, the memory list, practical chips: peer comparison is the one legitimate card context.
5. **Explicitly not chosen:** map-first as home (tool feeling; the map remains a layer inside Discover and Voorpret), conversational/chat UI (conflicts with calm and with "phone away"), any feed (permanently excluded).

### Explicitly not approved (open Founder decisions)

- **Health data (HealthKit or equivalent)** — remains out of scope (ADR-060); the Founder will decide separately whether voluntary, soft health context enters the profile.
- **Accounts and persistent companions** — remain out of scope; required later for recurring together-experiences, subject to their own ADR.
- **New external sources** (e.g. Trektellen.nl, public-transit data, event calendars) — each requires its own mini-ADR with privacy and cost assessment (ADR-064 already requires this for transport).

### Phasing

- **Phase 1 — Copy renewal + Voorpret.** Largest felt win, smallest risk: consumer copy across surfaces and the Prepare transformation.
- **Phase 2 — Profile conversation + why-now.** Persona removal, broad profile signals, visible reasons.
- **Phase 3 — Together + removal.** Native invite repair, honest states, dead code and fabricated structure deleted.
- **Phase 4 — Season, hobbies, sources.** Content filtering, hobby-steered sources, first new source proposals (each with its own mini-ADR).

ADR-064's expansion program (evening tone shipped; Skia, transport, video, multilingual pending) remains approved; its remaining phases resume after Experience Renewal phase 1 lands, unless the Founder directs otherwise.

## Scope boundaries

- Pressure mechanics (scores, ratings, streaks, social proof) remain permanently excluded; the renewal never adds counters, urgency, or comparison.
- The no-feed invariant, the option ceiling (max 5), reversible learning, and the capsule content model are untouched.
- Every phase lands through its own pull request(s) under the standard verification gate; copy changes that affect scenario tests are updated in the same PR and reported.
- The generator contract, provider boundary, budget guard, and ADR-063 native access are unchanged; broader context in generation requests (hobbies, household) is introduced only in phase 2 within the approved bounded payload pattern.
- PRIMX stays excluded as architecture.

## Consequences

- The Prepare screen is restructured from worksheet into narrative scenes; supporting components (step rail, readiness checkboxes) are deleted rather than hidden.
- `src/product/localIntelligence.ts` loses the persona tables and ID-coupled affinity logic; ranking rests on real profile signals and live context only.
- A "why / source" presentation layer is introduced so honesty remains one tap away without polluting the consumer surface.
- The store's fabricated day structure is replaced by truthful states; location onboarding gains an explicit, consumer-phrased permission moment.
- Dutch UI copy across screens is rewritten in the affirmation register; a copy style guide accompanies phase 1 as the reference for all future text.
- The current application-code boundary extends through ADR-065.
