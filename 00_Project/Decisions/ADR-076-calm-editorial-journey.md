# ADR-076 — M4: calm editorial journeys

Status: Accepted by the Founder, 2026-11-12
Version: 1.0
Date: 2026-11-11

## Product Guardian

Advances roadmap phases 4–6 through correction of the reading experience, not additional engagement mechanics. Founder reports M3 works but its panels, menus and visual hierarchy distract from the experience. Ten supplied screenshots establish the desired photo-first, text-led, inline-disclosure language. M3 currently has three chapters at one museum, not the desired five-place journey. Current implementation is therefore not sufficient evidence of product alignment.

## Proposed amendments

- ADR-073: retain four tabs, three semantic palettes and all data/services. Propose system sans-serif for consumer headings as well as body, replacing the default Fraunces display hierarchy on these surfaces. Use one place title, approximately 26–30 pt, body 17 pt with accessible scaling. Fraunces assets need not be deleted.
- ADR-069/075: remove task completion controls and completed counters from cultural discovery flows. A voluntary observation replaces the task UI. Persist current chapter/mode; advancing records position, not completion, presence, learning or a memory. Preserve historical task data without displaying it as an obligation. Do not remove functional recipe/workout checklists or timers.
- ADR-075: extend from one museum chapter to five independently sourced places. Keep one Guide, renderer and session. Compact Navigate/Discover/Immerse text controls and an expandable place list replace the large permanent mode bar. No automatic GPS advance or mandatory arrival acknowledgement.
- ADR-074: planning mechanics and snapshot independence remain unchanged; only shared presentation is refined.

## Reading and interaction contract

Photo, modest place label, one title, optional short lead, then main story. No factual story hidden behind a disclosure. Photo credit is compact but still includes attribution/license access. Separate factual content from editorial invitation without repeating provenance labels throughout the page.

Use borderless full-width disclosure rows with a thin separator and plus/minus. Expanded text stays on the same background. No nested disclosures. Proposed Guide rows: Verdiep het verhaal; Kijk eens om je heen; Feiten en bronnen. Show only rows with meaningful content. No non-functional Ask AI entry. One forward action; back is quiet. Listen/pause and map remain reachable without competing large buttons. End-of-journey reflection stays optional. Existing shared invitations, finish and resume remain available.

Nu retains one intelligent recommendation; alternative choices become simple rows, still invoking real temporary refinement. Saved items and plans use text-led lists, with management actions revealed on demand. Voorpret combines practical information without repeated panels. Boek preserves photographs/notes; Jij preserves insight visualizations, settings and privacy controls. All themes share structure. No new backend, dependency or generator schema.

## Multi-place model and migration proposal

Current Experience.visitPlace is experience-level. Add an optional validated chapter destination using a shared place type: stable place id, name, coordinate, address where known, provenance URLs, verification date and access note. Resolve current chapter destination first, legacy visitPlace/routePlan second. Distinguish a verified point from a verified walking connection; coordinates alone never authorize a route polyline or distance.

Give the five-place curated journey a new stable experience identity rather than silently replacing reference-moddergat-v1 inside saved plans/sessions. Old snapshots remain immutable and playable; offer the current journey explicitly through Nu. Use the same renderer for old and new data. Preserve existing source expiry, exact audio/transcript matching and absence fallbacks. Each new chapter must receive verified media or an explicit honest absence; final visual acceptance requires authentic licensed imagery at each approved place. No reused museum image masquerading as another destination.

## Route and source work still required

Candidate narrative sequence: museum, Vissersvrouw, Vissersmonument, garnalenfabriek, Peazemerlannen. This is NOT a verified walking order. Validate each point, paths and current access constraints before presenting an itinerary. Founder amendment 2026-11-12: make in-app navigation the intended primary experience; external route-app handoff remains an optional fallback, not mandatory. Museum website confirms factory history but its header address is the museum address: do not reuse it as factory coordinates. Nature manager distinguishes accessible routes and seasonal closures; do not infer all-area access. No guaranteed current opening or accessibility certification.

Initial evidence: https://www.museummoddergat.nl/de-garnalenfabriek/ ; https://keunstwurk.nl/art/monument-voor-de-omgekomen-vissers/ ; https://www.itfryskegea.nl/gebieden/peazemerlannen/ ; https://www.itfryskegea.nl/natuurroutes/peazemerlannen/ . Image rights for four additional locations, entrance/path coordinates and connected route remain open.

## Implementation sequence after approval

1. Shared typography/disclosure/action variants, preserving primary action semantics and 44 pt targets; accessible focus/expanded state and reduced motion.
2. Existing Guide composition and task-free position semantics, legacy snapshot tests, compact modes and per-chapter destination resolver.
3. Five-place verified content/media/route assembly with honest fallbacks and unchanged generator boundaries.
4. Nu/Voorpret/Plannen/Boek/Jij targeted visual migration, including all reachable management and error states.
5. Typecheck, test:app, browser visual/flow checks, internal iPhone build and Founder device assessment.

Expected files: src/design/theme.ts; src/ui/editorial.tsx; src/ui/ImageCredit.tsx; src/ui/guide/AdaptiveGuide.tsx; src/ui/guide/GuideOrientationMap.tsx; src/ui/screens/GuideScreen.tsx; src/ui/screens/MinimalNowScreen.tsx; PrepareScreen.tsx; PlansScreen.tsx; LifeBookScreen.tsx; ProfileScreen.tsx; src/ui/plans/DayPlanEditor.tsx; src/product/experienceModel.ts; referenceExperiences.ts; referenceImages.ts; src/guidance/guideDestination.ts; adaptiveGuide.ts; src/app/store.tsx only where necessary for position/destination integration; associated tests and licensed assets. Inspect source again before editing; no wholesale replacement.

## Acceptance and score

Weighted rubric: reading 25%, calm menus 20%, journey 20%, interaction/accessibility 15%, trustworthy sources/media 10%, consistency/preservation 10%. 0=absent/broken, 5=usable with substantial friction, 8=criteria met with minor issues, 10=polished and supported by device evidence. Target total >=8.5 and each category >=8. Internal score is provisional without Founder iPhone acceptance. Missing native evidence remains explicitly unverified. Data loss, blocked core flows, unverified factual navigation and inaccessible core actions are release blockers regardless of score.

Verify current/legacy sessions, saved plans and memories; source expiry; denied GPS; offline cold start; media absence; audio interruptions; Dynamic Type; VoiceOver; Reduced Motion; all themes; narrow layouts; full loop and runner regression. Do not claim tests from screenshots. No automatic next milestone or public release.

## Approval request

Review task outputs Momentum_M4_Ontwerpproef.html and Momentum_M4_Nulmeting.txt. Approve sans-serif hierarchy, inline disclosure language, task-free discovery and five-place integration scope before application implementation.

## Founder approval and adaptive practical information — 2026-11-12

Founder approves the visual prototype ('dit ziet er heel goed uit') and requests context-dependent menus, a navigation action, opening times and costs where appropriate, with easy travel to the place without leaving Momentum. This is approval to implement the agreed M4 design; do not request the same approval again.

Add practical disclosures according to the place: Naar deze plek; Openingstijden; Toegang en kosten. Render information that matters for the selected place. Unknown is not free, unrestricted or open. For relevant missing information show a concise unknown state and a source/check action, rather than hiding uncertainty. Record provenance, checked date, applicable period, currency and conditions where available. Only show 'nu open' with sufficient current schedule/time-zone/exception evidence; otherwise show published hours with qualification. Preserve compact credit/license access and all existing error behavior.

Current code evidence: GuideOrientationMap is an embedded react-native-maps view with a destination marker, zoom/recenter, no displayed user location and no pedestrian routing engine. A marker is not route guidance. Extend the existing map within the shared session for per-place navigation. Offer optional foreground position only after an explicit location action, preserve useful destination view if denied, and never invent a direct-line walking path. Seek verified walking geometry/route instructions for the curated journey. True dynamic turn-by-turn routing is a capability gap to investigate, not a capability already delivered. Do not add paid providers, transmit location to a new service or introduce background tracking without separate scoped authorization. Any capability limitation must be stated in delivery rather than silently forcing users out of the app.

This supersedes the external-route-only assumption in the initial proposal. Full-app design and five-place quality scope remain; practical data may be refined iteratively, but missing navigation capability cannot be hidden behind a passing design score.