## M4 Founder feedback and simplification — 2026-11-12

Founder reports build 9 tests work very well. ADR-076 now authorizes removal of the redundant phone-away controls and screen, retaining observation and listening. Location-relevant storytelling on reopening is a future direction only. Verification of this refinement is in progress; no additional native test coverage is inferred from general feedback.

## M4 internal iPhone review candidate — 2026-11-12

EAS build ada866bb-5228-4f34-8e66-b00c58283ad1 is FINISHED: iOS 0.4.0 (9), source f80aaca, existing internal minimal4-preview distribution. Feature branch feat/adaptive-guide-first-slice is pushed; main is unchanged. Includes calm full consumer surfaces, five-place Moddergat content, optional published walking directions and native destination/foreground-position map. No live turn-by-turn routing or complete new-journey audio series is claimed.

Validation: typecheck, 155 counted tests plus scenarios, web export, browser save/resume and memory flows, 320/390 pt Light/Editorial checks and earlier Dark checks. Screenshots and the Dutch test report are in the task outputs. Provisional weighted internal score 8.39/10; interaction/accessibility remains 7.5 pending native evidence. The >=8.5 target and minimum 8/category are NOT achieved. Founder iPhone acceptance, full device accessibility/offline/permission checks, remaining theme combinations and field usefulness remain open. No next milestone or public release.
## M4 catalog and preparation progress — 2026-11-12

The five-place Moddergat journey is now explicitly available from Nu, with distinct sourced photography, optional published walking approaches and unchanged old reference IDs/snapshots. Nu has flat disclosures; Prepare uses calm inline sections, one start action and accessible company/guidance controls. Browser verifies save to Plannen, reload, chapter-4 Navigate resume and restored preparation choices. Typecheck, 154 counted app tests plus scenarios and web export pass; final accessibility markup typechecked and browser-verified. No native or field validation or final quality score claimed. Remaining: full-app visual audit including Book/Profile/plan management, all themes and narrow layouts, screenshots, internal iPhone build and Founder acceptance. Live turn-by-turn routing is not implemented; source-based directions and the existing native destination map are the available guidance.
## M4 implementation in progress — 2026-11-12

Approved ADR-076 is being implemented in small increments: shared calm typography/actions, discovery without completion controls, per-chapter destination resolution, sourced practical disclosures and compact Guide modes/chapter selection. 134 tests plus scenarios and typecheck pass; browser verifies museum chapter selection and session restoration. Five-place licensed content, verified walking connections/in-app guidance, remaining full-app polish and native review are still open. No final score or iPhone delivery claimed.
## M4 approved with practical place information — 2026-11-12

Founder approves the M4 visual prototype and requests adaptive place menus, opening times/costs where relevant, and navigation within the app. ADR-076 records approval and the actual map/routing capability gap. Implement the approved calm reading design and preserved flows; investigate verified in-app walking guidance without new paid/location-sharing services or invented routes. No 8.5 score or delivery is claimed yet.
## M3 internal delivery — 2026-11-11

ADR-075 implemented in source 2c818d9. First Moddergat chapter uses the existing Guide with editorial composition, locally bundled original photo, inline context, unchanged persisted task identity, sources and quiet observation. Original factual story/narration retained; old snapshots remain unchanged. Typecheck, all 129 app tests and scenario checks pass; web export passes. Browser verifies all themes, 320/390 px layout, disclosure/task interaction, reload recovery, chapter transitions, 16-second audio playback and phone-away return. EAS 2c70b731-9d61-42b0-8567-1f2c096d159b FINISHED, 0.4.0 (8), internal minimal4-preview. Founder iPhone acceptance remains open: native VoiceOver, large Dynamic Type, Reduced Motion, audio interruptions, offline cold start, missing-media/storage failure recovery and field usefulness are not claimed as tested. No next milestone, public release or broad renderer expansion.
## M3 approved — 2026-11-11

ADR-075 accepted: one editorial Moddergat chapter, shared Guide and existing snapshots preserved. Implementation and verification underway. No broader renderer or planner expansion.

## M2 accepted on iPhone — 2026-11-11

Founder confirms 'De test is goed' following delivery of internal build 0.4.0 (7). M2 is complete and accepted for its ADR-074 scope. This is general device acceptance; individual VoiceOver, Dynamic Type and offline stress cases were not separately reported. No next milestone is started or authorized by this acceptance. Entries below retain the historical delivery evidence.

## M2 internal delivery — 2026-11-11

ADR-074 implemented in source 6ac5dd5. Optional local day plans, independent snapshots, reorder/rename/remove controls and shared Prepare/Guide entry. Typecheck and 125 tests plus existing scenarios pass. Browser verifies creation, two-item reorder, reload, independence from unsaving, all themes, active-session guard and Guide resume at step 2. EAS 026679bb-4426-42df-89ae-e445a0f4e247 FINISHED: 0.4.0 (7), internal minimal4-preview. Native device acceptance, VoiceOver, Dynamic Type, offline cold start and performance remain open. No multi-day planner or renderer expansion.

## M2 approved — 2026-11-11

ADR-074 is Founder-approved: optional local day plans from saved ideas, ordering and existing Prepare/Guide entry. No dates, trip planning, new services or renderer expansion. Implementation and verification in progress; M1 data remains intact.

## Founder device feedback — 2026-11-10

Founder confirms after the build (6) correction that the app works well and asks to proceed to the next goal. This records general device acceptance of M1, not separate verification of VoiceOver, large Dynamic Type, denied GPS or offline edge cases. The exact next milestone (optional day planning versus Living Interface expansion) is being clarified; no additional application scope is assumed.

## M1 iPhone layout correction — 2026-11-10

Founder reports the app works and provided an iPhone screenshot showing the Guide phone-away action overflowing. The existing Guide action row now wraps; button and label widths are bounded and touch height is at least 44 pt. No behavior or data model changed. Typecheck and all 118 existing tests pass; browser verification at 320 pt confirms the action stays within its container. EAS `fc2e4a00-a2f7-483c-bc45-0c28b6703c85` FINISHED, version 0.4.0 (6), source `6c4c6e2`, replaces build (5). Physical-device verification of this fix, including larger system text, remains open. M2 has not started.
## M1 refined delivery — 2026-11-10

M1 implementation and internal delivery complete: EAS `dcfbbd41-c379-4da1-a175-3e8ea316b0e7` FINISHED, 0.4.0 (5), source `1c49164`, internal minimal4-preview. Replaces build (4) for review. Typecheck, 118 counted tests and existing scenarios pass. Browser checks verified four tabs, refinement/fallback, save/unsave, restored saved ideas, all three persisted themes, contextual recipe preparation, guarded day entry, and Guide restoration at step 2. Updated screenshots and a requirement-by-requirement report are in the task outputs. Physical iPhone testing remains open (no device connected here); filled personal Book data was not visually tested in this browser. M2 and broader renderer/planner work have not started. Historical entries below describe earlier audit stages.

## M1 refinement audit — 2026-11-10

Founder requested removal of visible overlap with earlier versions within M1. Review found a second Nu presentation, a nested old profile, unrelated outdoor preparation for indoor runners, and unguarded entry from day suggestions/memories. These are being corrected within ADR-073, not M2. The single profile now includes appearance and existing insights/settings. Day intelligence is retained in a text-led optional surface. NuDetails resolves to the main Nu component. Shared opening/saving controls preserve active sessions and separate saved ideas from explicit preference learning. Recept preparation no longer invents a departure or weather packing; route buttons require a verified destination. Current typecheck and 118 counted tests plus existing scenarios pass. Physical device acceptance remains open; build (4) predates these refinements. Final visual/flow audit and replacement internal build are in progress.

## Minimal 4.0 delivery — 2026-11-10

The approved first milestone is delivered for Founder device testing. EAS iOS build `07bfd5e9-65da-46d3-a892-3fd96bc9ba2b` is FINISHED: version 0.4.0 (4), internal distribution, minimal4-preview, source commit `89721ce`. Source is on `feat/adaptive-guide-first-slice`; main was not changed. Typecheck and all 117 counted tests plus existing scenarios pass. Browser verification covers themes, saved ideas, preparation, Guide and restoration. Physical installation, VoiceOver, Dynamic Type, Reduced Motion, denied GPS and offline cold start remain unverified. No day/trip planner or broad renderer expansion was included. Older delivery entries below are historical.

## Minimal 4.0 — 2026-11-10

ADR-073 is Founder-approved for the first milestone only: four tabs, three themes, temporary intelligent refinement, saved ideas and existing preparation/Guide. Day/trip planning and broad renderer expansion remain deferred. This supersedes older conflicting entry/navigation summaries below. Physical iPhone verification of this milestone remains outstanding.

## Internal iPhone build - 2026-11-09

Founder explicitly authorized internal distribution. Expo build `6b50c923-0ff3-40ff-8595-8e91d88b3a2f` finished successfully: version 0.3.0 (3), fresh-concept-preview, existing registered iPhone. No App Store publication or old-channel OTA. Physical installation and behavior remain unverified.

## Fresh start approved — ADR-071

The Founder explicitly approved the new main journey and its native build proposal. ADR-071 supersedes the five-tab/Guide-only boundary below for the new entry. Preserve existing data and runners; implement the full reviewed journey with light/dark/system. Work in progress, not device-verified.

# Momentum Project Status

Status: Active  
Version: 2.0

## Application-code boundary: approved through ADR-070

2026-11-08: ADR-070 extends the accepted scope to completing the combined Adaptive Guide brief for iPhone testing, including interactive orientation, typed chapters, reference packs, real listening and device distribution preparation. Work is in progress; no installed iPhone build has yet been verified. This supersedes the later-slices limitation of ADR-069 below.

2026-11-08: ADR-068 already governs the implemented live-world briefing. ADR-069 records the Founder's accepted earlier-concept direction and authorizes the first Adaptive Guide slice: shared modes, editorial Discover, local voluntary task state and honest route/audio fallbacks. Clear decisions no longer require repeated approval. Interactive maps, actual audio and broader AI questions remain later slices. This entry supersedes earlier boundary summaries below.

This file is the single source of truth for the current application-code boundary. Every AI coding agent must read it at the start of each session, before proposing or implementing any change. Only the Founder can extend the boundary, through an ADR.

## Current phase

The Founder approved the document foundation on 2026-07-10 and requested the first application slice. On 2026-07-14 the Founder explicitly advanced the product into the Premium Living Guide direction, and on 2026-07-15 approved the account-free Shared Capsule prototype, layered consultable guide, richer guide moments, automatic deterministic guide and Experience Blueprint composition, the pre-ranking candidate quality gate, adaptive active intent, Meaning Thread continuity, generative capsule candidates behind a validated provider-independent boundary, and Generator Service v1 with a local fixture plus optional OpenAI provider. On 2026-07-16 generated Capsule continuity, bounded contextual generation on open, the deterministic Grounded Guide with source-window integrity, the Living World Opportunity Engine v2 with conservative Route Composer, and deterministic Living World interpretation with an Arrival Plan were approved. On 2026-07-17 worldwide Place Knowledge, the provider-independent Route Intelligence boundary, the local Place Knowledge Lens, bounded OpenStreetMap public outdoor anchors, and visible Generator Evaluation Mode were approved. On 2026-07-18 controlled variation across all seven experience kinds, separate local Generator Evaluation evidence, and a Founder-only evaluation bench were approved. Application code may implement accepted decisions through ADR-049. Accounts, production synchronization, public generator deployment/authentication, model-authored live claims or routes, new external integrations, or other unrecorded scope still require explicit approval.

ADR-050 additionally approves the Founder-only generator coverage matrix. The current application-code boundary therefore extends through ADR-050.

ADR-051 additionally approves the unified visual foundation: one system type family, restrained semantic color roles, shared radii, and one visual grammar across consumer flows and guidance. The current application-code boundary therefore extends through ADR-051.

ADR-052 additionally approves the content-first premium journey and photographic continuity through Promise, Prepare, and Presence.

ADR-053 additionally approves the warm daylight visual direction: light neutral application chrome, photography-led color, a restrained umber/bronze action accent, and no persistent green cast. Amended by ADR-061 (fresh color language).

ADR-054 additionally approves the premium-coherence pass: consumer language instead of evaluation language, editorial Today hierarchy, memory-led Life Book, validated Meaning Threads, aligned timers, a consultable guide sheet, and one code-native navigation grammar. The current application-code boundary therefore extends through ADR-054.

ADR-055 additionally approves the Living Interface: direct transformation from suggestion to adaptive invitation and preparation, capsule-specific information shapes, a current-or-next editorial lead in Today, contextual Discover, and a memory-led Life Book. The contextual personal day line open question is resolved by ADR-059.

ADR-056 additionally approves the multi-provider generator boundary: a provider-adapter layer in the Generator Service (fixture, OpenAI, Anthropic, Moonshot) behind explicit `MOMENTUM_GENERATOR_PROVIDER` selection, a generic `model`/`fixture` envelope, a centralized contract version, and server-side timeout, retry, call-limit, and budget guard rails with truthful fallback to fixture behavior. The current application-code boundary therefore extends through ADR-056.

ADR-057 additionally approves the Premium Craft program: the design philosophy is refined from "no motion" to "no motion that captures attention instead of handing it over". Horizon A (editorial display serif, real image layer with expo-image and gradient shades, haptics, real icons, entrance choreography) and Horizon B (spring physics via Reanimated and gesture handler, true blur material, image continuity from Now through Presence, Living Canvas ambient motion, first-class empty states) are approved, including the listed dependency additions, a debug flag for Profile lab surfaces, and a hard reduced-motion requirement. The current application-code boundary therefore extends through ADR-057.

ADR-058 additionally approves Horizon C in limited scope: the react-navigation native-stack foundation (with react-native-screens and react-native-safe-area-context) replacing the hand-built surface/flowStage state machine, true shared-element image continuity from Now through Presence, the supporting design-token and style refactor out of App.tsx, and invite deep links via navigation. Skia ambient layers, dark appearance, and video/cinemagraph content remain unapproved. The current application-code boundary therefore extends through ADR-058.

ADR-059 additionally approves the Living Now Surface: a deterministic daily affirmation line on Now (affirming, never pressuring; closes the ADR-055 open question), a richer finite option set of maximum 5 per moment with small contextual candidate sets on open, per-moment company/transport refinement in Prepare instead of Profile, and richer guide and supporting cards within the approved capsule-content model. The no-feed invariant is preserved through the explicit option ceiling. The current application-code boundary therefore extends through ADR-059.

ADR-060 additionally approves: Discover as an editorial travel guide of the surroundings working on any location (finite curated sections, never a feed), Today as an editorial day timeline, and the affirmation extension with live user feedback and an optional self-reported energy check-in that may gently inform ranking. Sensor-inferred energy (HealthKit) remains out of scope. The current application-code boundary therefore extends through ADR-060.

ADR-061 additionally approves: a fresh color language amending ADR-053 (cool light base, white cards, confident deep-green primary action, per-phase accent colors; WCAG AA preserved), purposeful affirmations requiring a concrete anchor with reduced header presentation, and phase function enrichment (in-app route map preview via react-native-maps with OpenStreetMap tiles, richer reflection, photos in memories via expo-image-picker on-device only, and soft visible learning phrased as observations). Pressure mechanics (scores, ratings, social proof) are permanently excluded; PRIMX stays excluded as architecture. The current application-code boundary therefore extends through ADR-061.

ADR-062 additionally approves real-device testing through EAS Build development builds: the iOS identity `com.wjansmaw.momentum`, internal-distribution dev-client builds on the Founder's registered iPhone, and the Device Testing Runbook procedure. Live model generation from the phone remains a documented follow-up code change; the offline local synthesis path is the approved default. No product scope changes. The current application-code boundary therefore extends through ADR-062.

ADR-063 additionally approves explicit native-client access to the Generator Service: the native app identifies itself with the fixed header `X-Momentum-Client: native`, and the server admits requests without an Origin header only when that header matches exactly. The browser path (Origin allowlist) is unchanged, and the header is explicit client identification — not authentication — scoped to the Founder's own home network. Public generator deployment with real authentication remains a separate release blocker. The current application-code boundary therefore extends through ADR-063.

ADR-064 additionally approves the Evening Tone and Expansion Program: an evening (dark) sibling of the ADR-061 color language with `userInterfaceStyle: automatic`, ambient Skia atmosphere layers under the ADR-057 no-attention-capture rule, muted looping video/cinemagraph content with a mandatory still fallback and licensed-or-owned assets only, honest multi-modal transport advice without live external transport integrations, and internationalisation infrastructure with Dutch as the primary language. Implementation follows the recorded sequence (evening tone → Skia → transport → video → multilingual), each through its own pull request. Pressure mechanics remain permanently excluded. The current application-code boundary therefore extends through ADR-064.

ADR-065 additionally approves the Experience Renewal program: Prepare becomes Voorpret (anticipation as narrative scenes, smart defaults, at most one question, soft countdown; numbered step rails, readiness checkboxes and intake forms removed), the hidden persona model is removed from ranking in favour of a broad progressively growing profile, every suggestion carries visible "why now" reasons from live data, consumer copy speaks the affirmation register with machine language moved to a why/source layer, the together flow is made real on native via the momentum:// scheme within a closed circle, dead modules and fabricated day structure are removed (including the Dokkum fallback, replaced by an explicit location flow), and season plus hobby signals are switched on to steer content and live sources. A UI form hierarchy is fixed: living canvas (Now) > editorial chapters (Discover) > story scenes (Voorpret) > cards only for genuine choice > chips; map-first, chat UI and feeds are excluded. Implementation follows four phases, starting with copy renewal + Voorpret. Health data, accounts, and new external sources remain open Founder decisions requiring their own ADRs. Pressure mechanics remain permanently excluded. The current application-code boundary therefore extends through ADR-065. Amended by ADR-066 (scene-first form language).

ADR-066 additionally approves the scene-first form language, amending the ADR-065 UI hierarchy: the app is a film, not a filing cabinet — opening is one living scene with the lead suggestion woven in, alternatives are at most five swipeable poster scenes with visible "why now", choosing is a ritual that transforms the same scene into Voorpret, the day converges toward one editorial horizon, memories become a photo book, the profile is invisible, and Presence stays phone-away. Cards as containers are eliminated from experience surfaces; chips and text lines remain. Gesture discoverability, reduced-motion fallbacks, and WCAG AA in both appearances are required. The option ceiling, no-feed invariant, and navigation transition are preserved. The current application-code boundary therefore extends through ADR-066. Amended by ADR-067 (crafted density and concrete copy).

ADR-067 additionally approves concept v2 as the build direction after the Founder rejected the scene-first phase-2A implementation and the first static concept: the concrete-copy doctrine (words carry information, imagery carries emotion; poetic and mystical phrasing excluded from UI copy), a crafted-density material vocabulary (frosted panels, match ring, reason tiles, charts, segmented controls, badges, progress bars), a six-surface structure with persistent tab bar (Nu · Dag · Gids · Boek · Jij, with Voorpret as flow state), Jij as a visible insight surface instead of an invisible profile, and a dark premium stage with one living green accent as the primary appearance. The match ring is an explanation of fit, never a score or comparison; the option ceiling, no-feed invariant, and pressure-mechanics exclusion are preserved. The rejected scene-first-now implementation is retired. Rebuild follows phases R1–R5 (Nu+skeleton, Dag, Voorpret, Gids, Boek+Jij), each through its own pull request with Founder approval. The current application-code boundary therefore extends through ADR-067.

## M4 phone-away refinement delivered — 2026-11-12

Source 3c63830 removes phone-away controls/overlay and unused styles, preserving observation, narration, timers and session data. Typecheck, 155 tests plus scenarios, web export and browser resume/mode checks pass. Internal iOS build 0.4.0 (10), 52303230-1cf4-4471-8cd4-f12a420d0bad, FINISHED. Founder general acceptance applies to build 9; this small refinement has not yet been retested on a physical device. Location-aware return remains future-only. No final quality-score uplift inferred.
