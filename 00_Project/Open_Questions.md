# Open Questions

Status: Operational, living document  
Version: 1.0

## Generative capsules

- **Resolved for the current prototype:** generation is a candidate source behind schema sanitization, domain validation, comparative ranking, and explicit disclosure. Missing or failed remote generation falls back to local synthesis. See ADR-036.
- **Partly resolved:** Generator Service v1 uses a local fixture and an optional OpenAI Responses provider with a configurable model. The provider key stays server-side and model storage is disabled. See ADR-037.
- **Still open:** production hosting, gateway and app-attestation, distributed rate limits, redacted observability, the final model after real evaluation, and when verified Living World evidence may enter an evidence-grounded generation envelope.

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
- **Soon:** What is the initial product language, and which repository documents remain English?
- **Soon:** What single sentence explains Momentum to a first-time user without leading with AI?

## Primary experience and autonomy

- **Now:** Does the primary surface always show exactly one Experience Promise, and what happens when confidence is low?
- **Resolved direction:** The smallest active-intent interaction begins with available time and asks at most one desired-outcome question when context is insufficient.
- **Resolved prototype direction:** active intent now asks one material clarification for unknown direction, food form, movement form, or outside tone and scopes the answer to the current moment. See ADR-035.
- **Resolved direction:** The first end-to-end blueprint is “I unexpectedly have about an hour.” Its resulting capsule remains context-dependent.
- **Soon:** When may Momentum proactively surface a detected moment, and how does the user control that initiative?
- **Prototype direction:** `low` local ranking confidence now abstains into one clarification path. The production threshold remains a user-test decision; see ADR-027.
- **Resolved prototype direction:** Now, Today, and Discover use one deterministic local decision engine with editable mock context and structured reasons. Production thresholds remain a user-test question; see ADR-016.
- **Soon:** How many alternatives preserve autonomy without becoming a feed?
- **Resolved premium direction:** `Now` renders one promise at a time and allows immediate replacement from a finite, precomputed set. The first item remains the best match; no row or endless carousel appears. See ADR-028.
- **Resolved direction:** Broader exploration is a conscious-choice surface and does not appear as a feed on `Now`; see ADR-012 and its four-surface refinement in ADR-014.
- **Resolved direction:** The primary product surfaces are `Now`, `Today`, `Discover`, and `Life Book`. Today is a finite day rhythm; Discover supports open intent expression.
- **Resolved prototype direction:** “Why this fits” shows a concise subset of non-sensitive time, explicit preference and feasibility reasons, labelled by certainty; see `Decisions/ADR-013-explanation-and-situational-decline.md`.

## Experience Promises and feelings

- **Resolved direction:** The first interaction prototype tests calm, energy, surprise, connection, and challenge, plus a transparent “choose for me” path.
- **Soon:** How is a desired feeling distinguished from an inferred need in language and learning?
- **Soon:** Who approves Experience Promises for health-adjacent outcomes?
- **Soon:** What evidence threshold permits phrases such as “likely calming” or “good chance of seeing”?

## Experience Capsules

- **Resolved prototype direction:** A complete shake and kettlebell workout test the staged Capsule runner; quiet and route experiences use the same contract without making either activity the product starting point. See ADR-015.
- **Soon:** At what precise point does Momentum hand off to Maps rather than remain active?
- **Soon:** When is a Live Activity genuinely useful instead of extra screen presence?
- **Prototype direction:** an active Capsule and current step persist locally and return through an explicit resume action; completion is never inferred from the handoff. Native return-state refinement remains open. See ADR-027.
- **Soon:** Which experiences require safety or accessibility screening before acceptance?
- **Later:** How should shared or family capsules work when participants have different needs and permissions?
- **Partly resolved:** preparation can choose company, choose a shared meeting pattern, send a versioned web invitation, accept locally as a guest, survive reload, and be left locally. Prototype links expire after 72 hours. The payload excludes private selection context and live-source claims. Account identity, server-backed token expiry, cross-device revocation, native deep links, remote acceptance, shared progress, participant conflicts, and retention remain open. See ADR-028 and ADR-029.

## Memory and learning

- **Soon:** What is the smallest meaningful Memory: feeling, photo, sentence, inferred completion, or a combination?
- **Soon:** When should reflection appear, and when should Momentum remain silent?
- **Partly resolved:** the prototype shows plain-language reflection memories and supports individual deletion plus a full learning reset. Pausing and retention still need a final interaction. See ADR-026.
- **Soon:** How long are moment-level signals retained?
- **Later:** Does a Life view exist, and how can it celebrate lived experience without becoming a performance dashboard?

## Direction, meaning, and guided learning

- **Resolved direction:** Momentum distinguishes near intentions, growth directions, and meaning anchors. They guide but never command selection, and remain visible, reversible, and user-controlled; see ADR-025.
- **Resolved prototype direction:** a sufficiently matched user-confirmed direction may appear as a soft Meaning Thread in Promise, Prepare, and Memory. Weak matches remain absent and no score or obligation is created. See ADR-035.
- **Resolved direction:** learning can be a source-grounded layer inside place, nature, culture, workout, recipe, and other Capsules. “Read a book” is one possible experience, not the definition of learning.
- **Soon:** What is the smallest onboarding or later conversation that can invite direction without asking someone to define their life purpose?
- **Partly resolved:** Profile now supports review, edit, deletion through editing, and pause/resume without a fifth primary surface. Expiry and review timing remain open.
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
- **Later:** Can local curators or users contribute without turning Momentum into social media?

## Business and success

- **Soon:** Who is the first narrow user group and which repeated moment is valuable enough to test?
- **Soon:** What is the business model if success intentionally reduces screen time?
- **Soon:** Which measurements prove meaningful action without invasive monitoring?
- **Later:** How can sponsorship exist without corrupting personal recommendation?

## Questions waiting for Founder decision

1. Approve or amend the document foundation and lift—or retain—the no-application-code gate.
2. Confirm whether Momentum remains the working product name.
3. Approve or amend the active-entry interaction and permission-light prototype content set.
4. Choose the initial product and documentation language.
5. Approve or amend the staged MVP technical boundary and first Capsule pair.
