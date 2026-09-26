# Open Questions

Status: Operational, living document  
Version: 1.1

## Current decision gates — 2026-09-24

This reconciliation closes stale questions only where an existing approval provides the answer. It does not retrospectively authorize implementation drift. The Founder supports the audit direction; the following concrete boundaries still need to be settled or explicitly recorded before affected work:

- **Design amendment, partly resolved 2026-09-26:** ADR-069 covers the first activity-specific guide slice; ADR-070 records the approved Nu invitation repair without start-clock pressure, numerical match or unconfirmed location/weather. Dag and broader discovery remain follow-up work. No broadening of ADR-068 request triggers.
- **Weather timestamp integrity:** the existing timezone-auto adapter stores local timestamps without an offset. Nu now rejects these ambiguous observations. Normalize the existing adapter and verify remote-zone, DST and cached-expiry behavior in a separate repair; do not silently treat a remote clock as device-local time.
- **Memory:** retention/export policy and durable photo/deletion behavior; visible recovery when storage cannot be read. The locally tested startup guard is not a complete answer. ADR-026 learning-signal deletion does not establish deletion of Life Book entries or photos.
- **Briefing privacy:** the implementation's free direction/meaning words are not automatically permitted by ADR-068's narrower payload. Define the exact permitted data before a real-provider test; do not silently legalize the discrepancy through documentation.
- **Generator operations:** clarify total versus daily/process budget enforcement, hard provider limits, and the exact approval for paid tests. The audit found enforcement gaps; documentation is not proof they are fixed.
- **Distribution:** choose the intended test audience and safe configuration before widening beyond the existing home-network boundary. Public generator infrastructure remains a separate ADR/release gate.

See [recovery evidence](Recovery_Status_2026-09-24.md) for known gaps and the [roadmap](Roadmap.md#current-work-queue--2026-09-24) for order. These gates do not reopen existing ADR approvals.

## Generative capsules

- **Resolved for the current prototype:** generation is a candidate source behind schema sanitization, domain validation, comparative ranking, and explicit disclosure. Missing or failed remote generation falls back to local synthesis. See ADR-036.
- **Resolved provider boundary:** ADR-037's initial fixture/OpenAI service is extended by ADR-056 to explicit fixture, OpenAI, Anthropic and Moonshot adapters. Keys remain server-side; no app-provider switch is implied by changing the development assistant.
- **Still open:** production hosting, gateway and app-attestation, distributed rate limits, redacted observability and the final model after real evaluation. ADR-068 resolves only the narrow receipt-bound outside-briefing evidence envelope; broader evidence or personal data is not authorized by that exception.
- **Resolved for Founder evaluation:** `Now` may expose one explicit Momentmaker action that opens one newly synthesized candidate as a complete Capsule. Fixture, model, local fallback, and offline states remain visibly distinct. See ADR-047.
- **Resolved for controlled variety and evaluation:** a bounded non-identifying variation key may select another complete valid Capsule within the same domain and practical context. Optional post-experience generator-quality signals remain local and separate from durable personal learning. See ADR-048.
- **Resolved for Founder coverage review:** Momentum Lab may explicitly test one experience kind and practical context at a time, opening the ordinary complete Capsule flow and aggregating local quality coverage per kind. The bench never becomes a consumer feed or changes ordinary context and preference. See ADR-049.
- **Resolved for structured Founder coverage:** a local fourteen-scenario core matrix recommends the next missing context across all seven kinds. Completing it shows prototype coverage only; it does not establish real-user or production-model quality. See ADR-050.
- **Resolved for local continuity:** an accepted generated Capsule is Guide-composed, structurally audited, stored with an active local session, and preserved with its optional Memory. It does not silently become editorial or live-source truth. See ADR-038.
- **Resolved for bounded initiative:** opening Momentum may produce one cached contextual candidate from one explicitly chosen domain and minimal practical context. No private free text or location enters that request. Verified environmental evidence may be attached only afterwards by its owning adapter. See ADR-039.
- **Resolved for deterministic grounding:** source evidence can enrich a generated or editorial Capsule after generation, with visible origin and expiry. Cached data never receives a renewed source window (ADR-040). ADR-068 additionally permits outside-only model wording grounded in cited source facts, in Voorpret and bounded underway requests. Invented facts/routes, new sources and broader model interpretation remain unapproved.

## Resolved direction — personal model (2026-07-12)

- The smallest useful onboarding is permission-free and asks only consciously chosen preferences and practical constraints.
- Learned signals are shown in Profile and can be reset independently of memories.
- A situational decline (`Not now`) never changes durable preference.
- Only explicit corrections and explicit positive reflection may affect future ranking.
- Repetition penalties remain necessary even when an experience scores highly.

The exact wording, accessibility validation, and migration to native Apple capabilities remain open implementation questions.

## How to use this document

This file records consequential questions without silently deciding them. When resolved, move the decision into a dated decision record, link it here, and update affected documents.

Priority labels:

- **Now:** blocks approval or the next phase;
- **Soon:** needed before engineering or MVP scope;
- **Later:** important, but should not expand current scope.

## Identity and language

- **Now:** Is Momentum the final product name, a working title, or the name of one stage in the Experience Loop?
- **Now:** Should the loop stage also be called Momentum if the product keeps that name?
- **Resolved product language:** Dutch is primary/default under ADR-064; additional languages require deliberate reviewed additions. This repository retains English technical documents and the Founder vault carries Dutch explanations.
- **Soon:** What single sentence explains Momentum to a first-time user without leading with AI?

## Primary experience and autonomy

- **Now:** Does the primary surface always show exactly one Experience Promise, and what happens when confidence is low?
- **Resolved direction:** The smallest active-intent interaction begins with available time and asks at most one desired-outcome question when context is insufficient.
- **Resolved prototype direction:** active intent now asks one material clarification for unknown direction, food form, movement form, or outside tone and scopes the answer to the current moment. See ADR-035.
- **Resolved direction:** The first end-to-end blueprint is “I unexpectedly have about an hour.” Its resulting capsule remains context-dependent.
- **Soon:** When may Momentum proactively surface a detected moment, and how does the user control that initiative?
- **Prototype direction:** `low` local ranking confidence now abstains into one clarification path. The production threshold remains a user-test decision; see ADR-027.
- **Resolved prototype direction:** Now, Today, and Discover use one deterministic local decision engine with editable mock context and structured reasons. Production thresholds remain a user-test question; see ADR-016.
- **Resolved bound:** at most five options for one moment (ADR-059, preserved by ADR-067), never a feed. Usability within that bound still needs testing.
- **Resolved premium direction:** `Now` renders one promise at a time and allows immediate replacement from a finite, precomputed set. The first item remains the best match; no row or endless carousel appears. See ADR-028.
- **Resolved direction:** Broader exploration is a conscious-choice surface and does not appear as a feed on `Now`; see ADR-012 and its four-surface refinement in ADR-014.
- **Resolved current structure:** ADR-067 amends the original four surfaces to Nu · Dag · Gids · Boek · Jij, with Voorpret as a flow state. The finite day rhythm and intentional discovery remain purposes, not permission for a feed.
- **Resolved prototype direction:** “Why this fits” shows a concise subset of non-sensitive time, explicit preference and feasibility reasons, labelled by certainty; see `Decisions/ADR-013-explanation-and-situational-decline.md`.

## Experience Promises and feelings

- **Resolved direction:** ADR-059 closes ADR-055's contextual day-line question through deterministic composition and neutral fallback; ADR-061 requires a concrete anchor and ADR-067 requires concrete rather than mystical copy. Quality and tone remain test obligations, not an unresolved permission to invent inner states.

- **Resolved direction:** The first interaction prototype tests calm, energy, surprise, connection, and challenge, plus a transparent “choose for me” path.
- **Soon:** How is a desired feeling distinguished from an inferred need in language and learning?
- **Soon:** Who approves Experience Promises for health-adjacent outcomes?
- **Soon:** What evidence threshold permits phrases such as “likely calming” or “good chance of seeing”?

## Experience Capsules

- **Resolved prototype direction:** A complete shake and kettlebell workout test the staged Capsule runner; quiet and route experiences use the same contract without making either activity the product starting point. See ADR-015.
- **Partly resolved:** route Experiences show their conservative plan and source window during Prepare, then offer a Maps handoff at the first Presence step. Momentum blocks an expired source window and Apple Maps owns the real route. Native return-state refinement and route recalculation remain open. See ADR-041.
- **Soon:** When is a Live Activity genuinely useful instead of extra screen presence?
- **Prototype direction:** an active Capsule and current step persist locally and return through an explicit resume action; completion is never inferred from the handoff. Native return-state refinement remains open. See ADR-027.
- **Soon:** Which experiences require safety or accessibility screening before acceptance?
- **Later:** How should shared or family capsules work when participants have different needs and permissions?
- **Partly resolved:** ADR-028/029 define the local web invitation prototype, with 72-hour expiry and no private ranking context in the payload. Native invite repair is approved by ADR-065, but native end-to-end acceptance is not established by the September audit. Account identity, server-backed expiry/revocation, synchronized remote acceptance/progress, participant conflicts and retention remain unresolved; approval of native repair does not authorize a new synchronization service.

## Memory and learning

- **Soon:** What is the smallest meaningful Memory: feeling, photo, sentence, inferred completion, or a combination?
- **Soon:** When should reflection appear, and when should Momentum remain silent?
- **Partly resolved:** ADR-026 provides individual learning-signal deletion and a full learning reset. These are not proof of Life Book entry/photo deletion. Memory durability, retention and recovery gaps remain recorded in the current decision gates above.
- **Soon:** How long are moment-level signals retained?
- **Later:** Does a Life view exist, and how can it celebrate lived experience without becoming a performance dashboard?

## Direction, meaning, and guided learning

- **Resolved direction:** Momentum distinguishes near intentions, growth directions, and meaning anchors. They guide but never command selection, and remain visible, reversible, and user-controlled; see ADR-025.
- **Resolved prototype direction:** a sufficiently matched user-confirmed direction may appear as a soft Meaning Thread in Promise, Prepare, and Memory. Weak matches remain absent and no score or obligation is created. See ADR-035.
- **Resolved direction:** learning can be a source-grounded layer inside place, nature, culture, workout, recipe, and other Capsules. “Read a book” is one possible experience, not the definition of learning.
- **Soon:** What is the smallest onboarding or later conversation that can invite direction without asking someone to define their life purpose?
- **Partly resolved:** direction review/edit and pause/resume remain part of the profile contract; ADR-067 now gives Jij a visible primary surface. Expiry and review timing remain open.
- **Partly resolved:** deterministic composition may combine current evidence, route contracts, and reviewed experience-kind guidance and is visibly labelled. A future language model may only propose grounded drafts behind the same validation boundary. Model choice, review thresholds, evaluation, and off-device data remain open. See ADR-032.
- **Partly resolved:** all current composed candidates pass a structural quality gate before ranking and rejected candidates fall back to the approved catalogue. Domain-specific safety, accessibility, dietary, route, and licensing validators remain required before open generative composition. See ADR-033.
- **Prototype resolved:** representative Capsules use at most three stage-specific guide moments; Presence shows only the current one and deeper content remains explicitly consultable. Field validation may lower this per experience type. See ADR-031.
- **Soon:** How should Momentum detect progress without converting goals into streaks, quotas, or identity judgments?
- **Partly resolved:** users can choose quiet, guide, or deep guidance and reopen the same guide from Presence. Topic-specific depth, audio timing, and editorial review workflows remain open. See ADR-030.
- **Prototype direction:** reflection offers two explicit scopes: this experience only or the insight topic across experiences. Kind- and source-level scope remain unneeded until testing shows value.

## Trust, onboarding, and permissions

- **Now:** What useful experience can Momentum provide before any optional permission is granted?
- **Now:** Which questions are necessary in the smallest onboarding?
- **Soon:** Which permission is first requested in the MVP, at what moment, and for what immediate value?
- **Soon:** How are approximate and precise location used differently?
- **Soon:** What is processed on-device, and what may leave the device?
- **Later:** Can communication data ever meet Momentum's trust standard, or should it remain out of scope?

## Apple and platform feasibility

- **Resolved direction:** The first visual interaction proof uses explicit input and labelled mock context; real Apple context begins in a development build.
- **Resolved research:** Calendar is unavailable in current Expo Go; HealthKit, Live Activities, widgets, App Intents, and Foundation Models require native iOS capabilities or extensions.
- **Soon:** Revalidate the capability matrix immediately before implementation because Apple and Expo support changes.
- **Soon:** Which platform handoffs can return useful state without invasive tracking?
- **Later:** How portable should the core system be to Android or other wearables?

## Living World

- **Resolved direction:** Momentum is globally usable; Dokkum is only the first validation region. Source coverage degrades independently and cached context is regional, stale-labelled, and barred from generating new live claims. See ADR-023.

- **Resolved first slice:** Dokkum and the surrounding northern region form the initial prototype region. Weather/light is the first public live adapter; eBird is optional when a token is configured. See ADR-017.
- **Soon:** How fresh must each type of live claim be?
- **Soon:** Who is responsible for licensing, attribution, correction, and removal?
- **Soon:** How are sensitive wildlife and fragile places protected?
- **Resolved direction:** Living World scales without losing local character by keeping global evergreen experiences available everywhere and enriching them with reviewed, bounded local and regional packs. Live sources keep independent provenance and freshness. Localization remains a separate decision; see ADR-024.
- **Resolved first Opportunity boundary:** a current signal becomes a candidate only with a public destination, valid source window, sensitivity guard, conservative round-trip budget, meaningful experience time, and return buffer. eBird and OpenStreetMap are the only current inputs; new source classes and true routing remain gated. See ADR-041.
- **Resolved first interpretation layer:** suitable outside places and public wildlife Opportunities may combine source-owned place or observation evidence with current weather, using the earliest expiry. Routed Opportunities include a behavioral Arrival Plan, not invented path geometry, and the finite alternatives protect perspective diversity. See ADR-042.
- **Resolved first place-knowledge layer:** a nearby Wikipedia story may deepen Prepare and Presence while remaining clearly separate from live access, route, opening, safety, and wildlife claims. Dutch falls back to English and missing coverage never breaks the Experience. See ADR-043.
- **Resolved route-provider boundary:** a configured application-owned route service may verify time and distance only after explicit route intent; without it, the conservative local estimate and Apple Maps handoff remain truthful. Geometry, closures, terrain, accessibility, transit, and production provider choice remain open. See ADR-044.
- **Resolved first knowledge-lens boundary:** one nearby credited story may deepen a suitable route-free Capsule without creating its destination, changing feasibility, or becoming a live claim. Semantic route-to-story matching and additional official or curator sources remain open. See ADR-045.
- **Resolved first outdoor-anchor expansion:** named parks, viewpoints, public artwork, monuments, and memorials in OpenStreetMap may become guarded destination leads when they are not tagged private, closed, or indoor. Trails, beaches, reserves, swimming, surf, and other safety-sensitive classes remain gated. See ADR-046.
- **Later:** Can local curators or users contribute without turning Momentum into social media?

## Business and success

- **Soon:** Who is the first narrow user group and which repeated moment is valuable enough to test?
- **Soon:** What is the business model if success intentionally reduces screen time?
- **Soon:** Which measurements prove meaningful action without invasive monitoring?
- **Later:** How can sponsorship exist without corrupting personal recommendation?

## Original foundation checklist — reconciled 2026-09-24

This original checklist is retained as history, not a blanket set of current blockers. Item 1 was resolved by the foundation approval recorded in Status. Existing active-entry and staged prototype approvals remain valid for items 3 and 5 within their ADR boundaries. Item 4's product language is resolved by ADR-064. No new decision on the final product name is inferred. Use the current decision gates above for the immediate work.

1. Approve or amend the document foundation and lift—or retain—the no-application-code gate.
2. Confirm whether Momentum remains the working product name.
3. Approve or amend the active-entry interaction and permission-light prototype content set.
4. Choose the initial product and documentation language.
5. Approve or amend the staged MVP technical boundary and first Capsule pair.
