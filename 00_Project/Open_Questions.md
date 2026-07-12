# Open Questions

Status: Operational, living document  
Version: 1.0

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
- **Resolved direction:** The first end-to-end blueprint is “I unexpectedly have about an hour.” Its resulting capsule remains context-dependent.
- **Soon:** When may Momentum proactively surface a detected moment, and how does the user control that initiative?
- **Soon:** What confidence or ambiguity threshold requires a clarifying question rather than selection?
- **Soon:** How many alternatives preserve autonomy without becoming a feed?
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
- **Soon:** How does Momentum resume after a handoff without falsely assuming completion?
- **Soon:** Which experiences require safety or accessibility screening before acceptance?
- **Later:** How should shared or family capsules work when participants have different needs and permissions?

## Memory and learning

- **Soon:** What is the smallest meaningful Memory: feeling, photo, sentence, inferred completion, or a combination?
- **Soon:** When should reflection appear, and when should Momentum remain silent?
- **Soon:** What does the user see and control in the learned profile?
- **Soon:** How long are moment-level signals retained?
- **Later:** Does a Life view exist, and how can it celebrate lived experience without becoming a performance dashboard?

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

- **Soon:** Which bounded region and sources are suitable for the first pilot?
- **Soon:** How fresh must each type of live claim be?
- **Soon:** Who is responsible for licensing, attribution, correction, and removal?
- **Soon:** How are sensitive wildlife and fragile places protected?
- **Later:** How does Living World scale internationally without losing local character?
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
