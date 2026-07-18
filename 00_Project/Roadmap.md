# Momentum Product Roadmap

Status: Operational  
Version: 1.0

## Purpose

This roadmap orders product learning. It is not a release-date promise. Each phase reduces a different uncertainty before Momentum earns the right to become more complex.

The four continuous tracks are Philosophy, Experience, Understanding, and Trust. Design and Technology implement them only after their current questions are clear.

## Phase 1 — Constitution

**Goal:** establish why Momentum exists and what must remain true.

**Deliverables**

- Manifesto and Core Principles;
- core Experience Loop;
- Trust and autonomy invariants;
- repository and AI working agreements.

**Definition of Done**

- foundational documents are internally consistent and Founder-approved;
- old PRIMX modules are no longer the product structure;
- every later feature can be tested against the Constitution.

**Current state:** drafted; awaiting explicit Founder approval.

## Phase 2 — Experience

**Goal:** define how relevance becomes desire, action, Presence, and Memory.

**Deliverables**

- Feeling Library;
- Experience Promise guidance;
- Living Canvas philosophy;
- Experience Capsule patterns;
- North Star UI narrative;
- representative end-to-end experience blueprints.
- a reusable staged Capsule Content Contract with complete representative food, workout, quiet, and handoff plans;
- a Meaning Thread and Guided Learning contract for place, nature, workout, food, culture, and interest-led experiences;

**Definition of Done**

- walking, workout, breathing, recipe, place, and event experiences can be described without legacy modules;
- intended feelings are clear without making guarantees;
- the first 30 seconds and the transition out of the app are coherent;
- accessibility and low-context states are covered.

## Phase 3 — Understanding

**Goal:** specify how Momentum selects, explains, abstains, and learns.

**Deliverables**

- Human Moment model, taxonomy, detection, and expiry;
- separation of context, Human Moment, explicit intent, and inferred need;
- experience candidate selection and comparative ranking;
- translation from selected experience to Experience Promise and Capsule;
- a reusable Human Moment Blueprint and the first end-to-end blueprint for an unexpected free hour;
- context model and data sensitivity classes;
- candidate and suggestion schemas;
- deterministic safety and feasibility rules;
- ranking hypotheses and feedback model;
- permission-value map and graceful degradation;
- Living World source-quality model.
- separate, reversible context for near intentions, growth directions, and user-confirmed meaning anchors;
- information provenance for editorial knowledge, live facts, curator knowledge, and generated synthesis;
- a shared, transparent local decision prototype used by Now, Today, and Discover before live integrations;

**Definition of Done**

- the same context produces explainable candidate selection;
- raw signals are not confused with Human Moments or user intent;
- an activity is selected only after the moment is understood;
- one Human Moment can responsibly produce different experience forms as context and explicit intent change;
- missing permissions do not make the product useless;
- live claims require provenance and freshness;
- abstention, correction, and deletion behavior are specified;
- high-risk inferences are explicitly excluded.

**Implementation note (2026-07-12):** a first device-local personal model now influences Now, Today, and Discover through explicit onboarding choices, reversible feedback, repetition control, and diversity-aware ranking. ADR-018 defines its trust boundary.

## Phase 4 — Design

**Goal:** translate the approved experience language into a coherent, testable interface.

**Deliverables**

- Experience Blueprints and journey maps;
- North Star visual explorations;
- information hierarchy and interaction model;
- Feeling-to-visual language;
- motion, haptics, typography, color, imagery, and accessibility rules;
- prototypes for passive and active intent.
- a four-surface interaction architecture for Now, Today, Discover, and Life Book;
- a Today orchestration blueprint and open intent-expression model;
- an active-intent interaction blueprint covering time entry, adaptive clarification, correction, abstention, and transition into a Capsule;
- a North Star visual flow for the first active-intent challenge scenario;

**Definition of Done**

- users understand the promise and commitment within seconds;
- users can accept, decline, or redirect without confusion;
- users understand the difference between immediate guidance, day opportunities, deliberate discovery, and memory;
- transitions into representative capsules are prototype-tested;
- visual polish strengthens action without increasing consumption;
- the Founder approves a design direction without declaring exploratory pixels final.

## Phase 5 — Engineering

**Goal:** choose the smallest technical foundation that can test the core experience.

**Deliverables**

- verified platform capability matrix, especially Apple integrations;
- staged technical boundary from Expo Go interaction proof to native iOS capabilities;
- system architecture and data model;
- privacy and on-device processing plan;
- source ingestion and freshness approach;
- technology choices and testing strategy;
- first vertical-slice specification.

**Definition of Done**

- every dependency serves a validated experience requirement;
- Expo Go, development-build, and native-extension boundaries are explicit;
- unavailable platform access has a fallback;
- privacy boundaries and data lifetimes are implementable;
- the vertical slice can be built without speculative engines.

**Implementation note (2026-07-12):** the first private Apple context slice is implemented with `expo-calendar`: progressive permission, local free-window calculation, no event-content retention, manual fallback, and development-build boundary. See ADR-019.

## Phase 6 — First Product / MVP

**Goal:** prove that one contextual promise can move real users into a worthwhile experience.

**Initial hypothesis:** one experience, one promise, one capsule, one handoff or minimal guide, and one optional reflection.

**Deliverables**

- onboarding with immediate value and progressive permission requests;
- passive suggestion and lightweight active intent;
- one high-quality vertical slice;
- fallback experience with minimal permissions;
- instrumentation aligned with life outside the app;
- small, consented user test.

**Definition of Done**

- users understand and begin the experience without coaching;
- at least some users report that the suggestion was worth doing;
- the experience does not depend on prolonged screen use;
- failures and rejection preserve trust;
- evidence determines the next slice.

**Implementation note (2026-07-14):** the permission-light prototype now persists and resumes an active Capsule, preserves step progress across reloads and platform handoffs, abstains into clarification at low ranking confidence, keeps reflection optional, and exposes clearable local proof counts for starts, completions, reflections, and skips. Real user evidence is still required. See ADR-027.

## Phase 7 — Learning System

**Goal:** improve relevance without surveillance or opaque identity judgments.

**Deliverables**

- reversible preference learning;
- outcome and situational feedback separation;
- repetition and diversity controls;
- user-facing corrections and explanation;
- evaluation for relevance, novelty, trust, and unintended bias.
- user-controlled review of near intentions, growth directions, and meaning anchors without goal pressure;

**Definition of Done**

- explicit corrections reliably change behavior;
- a single decline does not erase an interest;
- users can inspect and remove learned signals;
- relevance improves without requesting unnecessary context.

**Implementation note (2026-07-14):** the prototype now separates outcome from aspect-level reflection, stores explicit corrections in a visible local personal memory, migrates earlier profiles, and lets guidance, duration, intensity, relevance, travel tolerance, and insight-topic corrections influence later experiences. Individual signals and all learned memory can be removed; derived preferences are rebuilt from what remains. Retention policy remains open. See ADR-026.

**Implementation note (2026-07-14):** directions can now be paused without deletion, and guidance feedback distinguishes one experience from a whole insight topic. See ADR-027.

## Phase 8 — Living World

**Goal:** responsibly expand timely, local opportunities.

**Deliverables**

- first bounded-region live weather/light adapter and optional recent-bird adapter;
- Opportunity and Route Composer with provenance, expiry, sensitivity guard, and Maps handoff;
- bounded regional source pilots;
- cultural and natural opportunity ingestion;
- licensing, moderation, freshness, and fragile-location protection;
- travel-mode research;
- curator and community contribution model.

**Definition of Done**

- live opportunities are current, credited, and actionable;
- false or stale claims are detected and expire;
- coverage improves Wonder without becoming a listings feed;
- expansion is justified by demonstrated user value.

**Implementation note (2026-07-12):** marine model context is now live for the northern coastal pilot with explicit coastal-accuracy and non-navigation boundaries. An official Rijkswaterstaat realtime adapter remains deferred until its direct reuse contract is verified; see ADR-020.

**Implementation note (2026-07-12):** nearby public places with conservatively interpreted opening hours and non-medical air-quality/pollen context now join the same source contract. See ADR-021 and ADR-022.

**Implementation note (2026-07-13):** editorial experiences now resolve through bounded local/regional packs plus a global evergreen fallback, independently of live-source coverage. Dokkum, New York, and Tokyo scenario checks protect global behavior; see ADR-024.

**Implementation note (2026-07-17):** nearby Wikipedia stories can now deepen selected Opportunities worldwide without becoming live or operational evidence. A provider-independent route boundary performs an optional final travel check only after explicit route intent, with Apple Maps as the honest fallback. See ADR-043 and ADR-044.

**Implementation note (2026-07-17):** the Place Knowledge Lens can now enrich suitable editorial, deterministic, and generated Capsules near the connected environment without creating a destination or changing feasibility. One credited story remains optional in Prepare and the consultable guide. See ADR-045.

**Implementation note (2026-07-17):** the global OpenStreetMap adapter now admits a bounded set of public outdoor anchor leads—parks, viewpoints, public art, monuments, and memorials—without pretending they have verified access. Known restrictions, current outside conditions, route budget, local signs, and source attribution remain hard boundaries. See ADR-046.

**Implementation note (2026-07-17):** `Now` now exposes a bounded Momentmaker evaluation action and visible generator runtime status. Demonstration fixture synthesis, server-side AI synthesis, local synthesis, and an unavailable service are labelled separately; one generated candidate opens directly as a complete Capsule for Founder review. See ADR-047.

## Phase 9 — Premium Living Guide

**Goal:** make Momentum feel like a continuously changing, personal guide to the world rather than a collection of activity cards.

**Deliverables**

- one visible best suggestion with a finite, immediate alternative path;
- a Living World interpretation that can enrich arbitrary locations without pretending equal source coverage;
- preparation led by expectation, company, guide depth, provenance, and practical readiness;
- quiet, guide, and deeper Capsule behavior;
- consultable Presence plus an explicit phone-away state;
- invitation sharing, followed later by privacy-designed synchronized participation;
- richer situated guidance for routes, nature, culture, food, movement, and other experience forms.

**Definition of Done**

- changing suggestion feels like changing perspective, not browsing a feed;
- preparation makes the experience desirable and understandable before listing equipment;
- the guide is useful at the point of experience and can disappear without becoming inaccessible;
- local depth is source-grounded and global fallback remains complete;
- sharing never exposes private ranking context;
- new breadth continues to serve Understanding → Wonder → Momentum → Presence → Memory.

**Implementation note (2026-07-14):** the first prototype now precomputes a finite Now suggestion set, keeps one card visible, adds richer expectation-first preparation, company and system sharing, three guide-depth choices, and a reversible phone-away Presence state. Synchronized participation and deep links remain future work. See ADR-028.

**Implementation note (2026-07-15):** Shared Capsule v1 now creates a versioned web invitation, provides a privacy-first receiving and acceptance flow, supports leave-together or meet-there preparation, carries local participants into Presence, and can label a local memory as shared. Acceptance and progress remain device-local; accounts, secure tokens, native deep links, and remote synchronization remain deferred. See ADR-029.

**Implementation note (2026-07-15):** shared preparation now persists locally across reloads, malformed and 72-hour-expired invitations fail explicitly, local participation can be withdrawn, and shared Memory keeps each person's reflection private. Remote revocation still requires a session service. See ADR-029.

**Implementation note (2026-07-15):** Presence now has one reversible, layered guide for quiet, guide, and deep use. Current evidence is filtered by its own expiry, editorial and evergreen fallback are named honestly, and Shared Capsules can locally check timing, pace, and practical readiness without implying remote synchronization. Guide composition is separated from presentation for later native surfaces. See ADR-030.

**Implementation note (2026-07-15):** representative food, workout, route, family, recovery, learning, and culture Capsules now contain multiple stage-specific guide moments. Preparation previews the selected depth, current source evidence links to its origin with observation time, and Memory may close the Meaning Thread with a non-prescriptive trace. See ADR-031.

**Implementation note (2026-07-15):** every candidate Experience now passes through an automatic Guide Composer. Dynamic Living World cards derive up to three guide moments from current source evidence, route structure, and reviewed experience-kind contracts; expired evidence is excluded and automatic composition is visible. This is deterministic groundwork for later grounded generative AI, not an external model integration. See ADR-032.

**Implementation note (2026-07-15):** composed candidates now pass a structural quality gate before ranking. Incomplete cards are withheld, degraded source coverage falls back honestly, and local Profile controls expose aggregate composition status. Explicit reflection feedback now affects default guide depth and removes muted content from preparation as well as Presence. See ADR-033.

**Implementation note (2026-07-15):** complete Experience composition is now separated from Guide composition. A first deterministic Blueprint Composer interprets explicit intent through reviewed domain contracts and validators before the existing guide, quality and ranking boundaries. Prepare, Memory and Profile are quieter consumer surfaces, with diagnostics separated into Momentum Lab. No external model or backend is active. See ADR-034.

**Implementation note (2026-07-15):** active intent now asks at most one material clarification before recomposition, including food form, movement form, outside tone, or an unknown desired direction. A first complete bodyweight blueprint expands real execution without material. User-confirmed near, growth, and meaning directions may continue as a soft Meaning Thread through Promise, Prepare, and Memory without goals, streaks, or inferred purpose. See ADR-035.

**Implementation note (2026-07-15):** Active Intent can now request new capsule candidates through a provider-independent generation boundary. Untrusted drafts are sanitized, domain-validated, ranked against trusted candidates, and visibly disclosed; a complete device-local synthesis keeps the flow useful without an external endpoint. See ADR-036.

**Implementation note (2026-07-15):** Generator Service v1 now implements the remote boundary with a validated fixture provider and an optional server-only OpenAI Responses provider using Structured Outputs. Web development can exercise the complete service path without a key; production gateway, attestation, distributed limits, and real model evaluation remain explicit gates. See ADR-037.

**Implementation note (2026-07-16):** accepted generated drafts now pass through the same Guide Composer and structural audit as other candidates, visibly preview their staged Capsule, persist as a complete local active-session snapshot, and remain reopenable from their own Memory. Generated content remains separate from verified Living World evidence. See ADR-038.

**Implementation note (2026-07-16):** `Now` and `Today` may now receive one locally cached contextual generator candidate based only on one explicitly chosen domain and minimal practical moment context. It competes through the existing decision engine and never creates a feed. When global location context is explicitly enabled, source-owned current environmental evidence may be attached after generation without entering the model or creating a route claim. See ADR-039.

**Implementation note (2026-07-16):** the first Grounded Guide now composes generated or editorial Capsules with still-current source-owned evidence entirely on-device. Evidence windows derive from their original retrieval time, never refresh through cache reuse, and are visible from `Now` and `Today` through Promise, Prepare, and the Presence Guide. Expired coverage falls back explicitly to general guide content. See ADR-040.

**Implementation note (2026-07-16):** Living World signals now pass through Opportunity Engine v2 before they can become Experience candidates. Public destination, source expiry, sensitivity, chosen travel limit, conservative outbound and return time, meaningful experience time, and return buffer are all required. Prepare exposes that contract and Presence rechecks expiry before handing navigation to Apple Maps. Withheld signals remain diagnostics rather than weakened cards. See ADR-041.

**Implementation note (2026-07-16):** Opportunity Engine v3 can now combine a verified public place or observation with still-current suitable outside conditions, expires at the earliest required source window, creates a bounded Arrival Plan for on-site Presence, and protects perspective diversity across the finite alternative set. It does not generate path geometry or introduce a new source. See ADR-042.

**Implementation note (2026-07-18):** Generator evaluation now covers two complete controlled variants for each of the seven experience kinds, with practical moment context and explicit equipment affecting the result. Optional post-experience quality signals are aggregated locally in Momentum Lab and never become personal-profile learning. Verified live evidence still enters only after generation through its owning adapters. See ADR-048.

**Implementation note (2026-07-18):** Momentum Lab now provides a Founder-only evaluation bench for one explicit experience kind and practical context at a time. Every test still opens the normal complete Capsule and contributes only local per-kind coverage evidence; `Now` remains one suggestion at a time. See ADR-049.

## Advancement rule

A phase may begin discovery before the prior phase is fully complete, but implementation may not use unresolved foundational questions as silent assumptions. Founder approval is required to lift the no-application-code gate.
