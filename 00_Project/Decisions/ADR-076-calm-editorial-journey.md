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
## Implementation increment — 2026-11-12

Shared editorial actions now use borderless text rows except for the primary action. Shared consumer heading styles use system sans with restrained sizes. DiscoverChapter uses one heading, puts its available photo before the story, and groups optional depth, observation and provenance into the same inline disclosure component. Completion controls were removed from the adaptive discovery presentation without deleting completedTaskIds or changing persistence. Specialized runners are outside this component and retain functional controls. This is an implementation increment, not full M4 delivery: chapter-specific places/practical data, in-app route guidance, compact mode navigation and remaining full-app migration are still open. Typecheck and all 129 existing tests plus scenarios pass after this increment; visual/native validation remains pending.

## Place information increment — 2026-11-12

Added optional chapter-level VisitPlace and source-dated practical information without rewriting old snapshots. Destination resolution prefers the current chapter; invalid chapter coordinates do not silently fall back to the museum. The adaptive Guide map action opens its in-app Navigate presentation. This is destination access, not yet routed walking guidance. Contextual opening/admission disclosures use the same simple inline rows. Museum source reviewed 2026-11-12: its published season ended October 31, so the UI explicitly marks that period as expired; no current-open claim. Published prices are qualified and linked. Relevant data absence is not inferred as free/open. New tests cover destination precedence, legacy fallback, invalid points, stale hours and unsafe/missing evidence. Full app suite: 134 tests plus scenarios passed; final typecheck and five focused practical-data tests also passed after the header map-action change. No native/browser verification or M4 build claimed yet. Multi-location route/content/media and full-app visual migration remain underway.

## Compact Guide increment — 2026-11-12

Product Guardian: advances M4 reading and calm-navigation acceptance within ADR-076, roadmap phases 4–6. The previous large mode bar, repeated cover/headings and framed adaptive chapter container conflicted with the approved reading-first direction. Engineer: reuse GuideScreen, DiscoverChapter and the same session updates; no renderer fork or storage migration.

Compact text modes now sit above content. A bounded, inline chapter selector navigates existing chapter positions without recording completion. Adaptive reading no longer duplicates its cover/header in an outer card. Chapter changes reset reading scroll and route status; mode scenes reset per chapter. Back and next remain accessible; early finishing/discard remain available under one disclosure. Navigate uses inline source/practical disclosures rather than several competing primary buttons. The external route option is explicitly external; genuine in-app walking guidance is still outstanding.

Validation: typecheck and test:app pass (80 generator + 13 affirmation + 41 guide tests, plus scenario checks). Fresh web export succeeds. Actual-app browser at 390×844 verifies menu selection of chapter 2, return to top, no task completion control, published hours/prices disclosure, and reload → resume restoring chapter 2 in Discover. Initial typography/spacing visually inspected in Dark. Small follow-up changes to aria-expanded, scene remounting and previous-button styling pass typecheck and the same full tests; those final details await another visual pass. Native VoiceOver, Dynamic Type, Reduced Motion and final all-theme layouts remain unverified. This increment does not complete M4 or establish an 8.5 score.

## Foreground map orientation increment — 2026-11-12

Product Guardian / Engineer: ADR-076 explicitly permits foreground position after an immediate user action. Reuses installed expo-location and react-native-maps; no new provider, background permission, service or persistence. The native orientation map starts with the verified destination and offers one position sample on request. Its native subscription is removed after the first sample, timeout, unmount or background transition. Position is discarded on background/hide. Denial and failure retain the destination map. Map controls use the calm shared palette and 48 pt targets; no route polyline or fabricated travel distance.

Seven service tests cover denied permission, synchronous first sample before handle creation, cancellation during permission, late handle after timeout, invalid coordinates, active subscription cancellation and native permission failure. Full typecheck and test:app pass: 141 counted tests (80 + 13 + 48) plus scenarios. Native map rendering/permission behavior remains untested on a physical iPhone; these tests establish resource lifecycle, not device acceptance or a verified walk.

Research follow-up: the nature manager publishes a route map and official interactive route 6719 at itfryskegea.viewer.routemaker.nl. Published text contains differing approximate route lengths; do not use either as the complete Momentum tour distance. Keunstwurk's monument map link gives 53.4062204795235,6.07275610571287, whereas the existing photo metadata candidate is elsewhere and is a camera position. Neither is promoted to a verified entrance without reconciliation. Factory opening/pricing is explicitly published with Sunday exceptions; no claim of current opening. Five-place routing/media work remains open.

## Place-specific image increment — 2026-11-12

Product Guardian / Engineer: extends the approved five-place media contract without introducing another renderer or generator block type. Optional editorial.photoKey resolves only through a curated registry. Existing museum/wonen snapshots retain their local original photograph; unknown keys and unrelated introductions cannot inherit it. Shared DiscoverChapter uses the resolved local asset, aspect ratio, alt text, caption and existing credit disclosure. All asset choices remain deterministic. A checked 2023 factory landscape photograph by Agnes Monkelbaan is bundled as a 227 KB Wikimedia proportional thumbnail under CC BY-SA 4.0, documented in assets/images/ATTRIBUTION.md; it is not yet a complete factory chapter or route.

Validation: typecheck and full test:app pass, 145 counted tests plus scenarios. Four new checks cover old snapshots, unrelated place introduction, unsafe/unknown keys and correct factory credit. New asset visually inspected. Native rendering and the finished five-location composition remain open. No claim of final score or device validation.

## Five-place anchors increment — 2026-11-12

Product Guardian / Researcher / Engineer: progresses the approved multi-place journey. A separate moddergatPlaces catalog holds museum, statue, memorial, factory and a west-access dike/gate for Peazemerlannen. Public OSM map extract reconciles the statue/memorial points and factory BAG address; the nature manager's published map supplies access context. Data attribution: © OpenStreetMap contributors, ODbL (https://www.openstreetmap.org/copyright). OSM points and sources are recorded individually, and no route line, distance or live opening is inferred. This catalog does not replace the old museum experience or expose an unfinished route.

The earlier Keunstwurk map link is inconsistent with its named monument; use OSM node 310870671 for position, retain Keunstwurk for history. Nature gate foot=yes does not certify accessibility; the nearby path has uneven ground. Factory road traffic and a possible dike connection require route review. Published Sunday factory hours/free public access remain conditional; nature seasonal/dog rules and unknown charges stay explicit. Source evidence and exact review URLs are in the task's Momentum_M4_Bronnen_en_Route.txt; raw map excerpt is retained in work for review.

Validation: three catalog tests verify independent destinations, preservation of old museum steps, conditional factory access and nature restrictions. This is source/map verification, not field validation; five-place stories, remaining media, connected walking guidance and final iPhone build are still open.
Full typecheck and test:app pass: 148 counted tests (80 + 13 + 55) plus scenarios. Later note-only wording edits do not alter the checked catalog behavior.

## Five-place narrative increment — 2026-11-12

Product Guardian / Experience Designer / Engineer: the new moddergat-five-places-v1 experience now contains all five stories, editorial leads, voluntary observations, depth, source provenance and chapter-specific map anchors. It uses the existing Experience model, renderer and session. Existing reference-moddergat-v1 remains untouched. The new experience is deliberately not promoted into Nu until the missing media and walking connections are reviewed; this is an incomplete implementation artifact, not a completed route. Thirty minutes is explicitly an editorial reading/stopping allowance, excluding travel/walking, not a sourced route estimate.

The public walking graph review found mapped village connections with stairs and a missing connection to the factory when excluding 80 km/h roads. Nearest-node snapping can land below the statue on the road and is not adequate entrance verification. No computed route geometry/distances or inferred shortcut were added to the app. Remaining work includes a defensible route approach, three additional reviewed photographs, catalog integration, full-app visual migration and native verification. These gaps cannot be covered by a quality score.
Validation: typecheck and test:app pass, 151 counted tests (80 + 13 + 58) plus scenarios. New tests verify independent identity, five sourced chapter destinations and resume without task completion. No native or field validation is claimed.

## Complete reviewed chapter media and core reading — 2026-11-12

Product Guardian / Experience Designer / Engineer: all five new journey chapters now resolve to distinct locally bundled, inspected photographs. Added Gouwenaar's 2010 public-domain Fisherwoman photo, Agnes Monkelbaan's 2023 CC BY-SA 4.0 photograph of a memorial names wall, and Dominicus Johannes Bergsma's 2023 CC BY-SA 4.0 Wadden view near Paesens-Moddergat. The nature caption explicitly identifies an environment view, not the selected access gate. Full credits and sources are recorded in assets/images/ATTRIBUTION.md. Images are Wikimedia proportional thumbnails with no crop, recoloring or generated content.

The reading contract requires the main story to be directly readable. Inspection found showInsight=false suppressed the entire editorial story as if it were optional context. For editorial-place composition only, the renderer now retains core story and evidence when quiet guidance is chosen; optional depth remains suppressed. Legacy non-editorial insight behavior is unchanged. This implements the accepted M4 direct-reading contract and does not rewrite saved data or preferences.

Validation: typecheck, full test:app (153 counted tests: 80 + 13 + 60, plus scenarios) and fresh Expo web export pass. New checks verify five distinct reviewed photos and saved snapshot retention of photo keys/destinations. Existing tests now explicitly distinguish editorial core content from optional legacy insights. Raw asset appearance inspected; final five-chapter mobile composition, native testing and route review remain open. The new journey is still not catalog-promoted.

## Published walking approaches — 2026-11-12

Product Guardian / Researcher / Engineer: advances approved M4 in-app place guidance without replacing the map, session or renderer. Waddentour's published village brochure (https://waddentour.nl/wp-content/uploads/2022/08/folder-moddergat.pdf, walk 2, steps 22–24) describes the dike-crest connection west from the monument to the factory and descent by the bench/gate. This supplies textual evidence where the reviewed OSM graph lacked continuous geometry. The nature manager supplies the eastern access context. Source review is not a field test or current closure guarantee.

Optional WalkingApproach content stores a named origin, concise instructions, limitations and source/date metadata on the new journey's chapter place. Navigate displays this within the existing app, with inline source disclosure and failed-link feedback. No GPS-derived instructions, inferred line, distance, arrival detection, live rerouting or paid service were added. The first museum stop and legacy snapshots do not acquire invented approaches. Historic task/session data remains untouched. The new journey is still pending catalog integration and visual/device review.

Validation: typecheck and full test:app pass (153 existing counted tests plus scenarios). A subsequent focused journey test additionally checks named origins, source links and unchanged legacy routing; see the task test log for the result. Native maps, field access and final M4 acceptance remain unverified.

## Catalog entry and calm Nu — 2026-11-12

Product Guardian / Engineer / Reviewer: after reviewed media and published walking approaches, offer the new five-place journey explicitly through Nu alongside the original references. A separate curatedExperiences module avoids circular imports and leaves existing reference IDs and saved snapshots intact. This is a source-backed itinerary for internal review, not field-validated live routing. Published limitations remain in preparation and Navigate.

Nu now has three top-level choice/explanation disclosures without nested menus. Temporary refinement and time remain scoped to this moment; explicit durable feedback remains explained within the recommendation disclosure. Save is directly reachable. Reference visits show chapters and own pace rather than an unsupported total walking duration. Guide adds the modest place label and uses own-pace wording for reference visits.

Validation: typecheck and full test:app pass, 154 counted tests (80 generator, 13 affirmation, 61 Guide) plus scenarios; fresh web export passes. Actual browser verified choosing the five-place journey, save, active-session replacement guard, preparation, five chapter choices, chapter-4 factory source-backed approaches, and reload then Plannen resume restoring chapter 4 / Navigate. Museum Discover inspected at 390 x 844. This is not native map, VoiceOver or field validation. Prepare still contains excessive separate sections and is the next presentation correction. Full theme/narrow-screen review, final screenshots, native build and Founder acceptance remain open.

## Calm preparation and accessible choices — 2026-11-12

Product Guardian / Experience Designer / Engineer / Reviewer: Prepare previously showed every route, chapter and packing section as a separate open panel, contrary to ADR-076. These sections now use the shared inline disclosure pattern. Remove duplicate title, reference-visit weather placeholder panel, decorative row/check tiles, framed settings containers and glowing pill CTA. Keep a single wrapping start action, company choice, preparation/depth/transport state, source evidence, route preview, participant and invitation controls. No change to session, storage, Generator or runner ownership.

The UI review exposed missing semantics on coordination options and ineffective web selection announcements. Coordination and guidance controls now expose radio roles and explicit checked state for web/native; custom disclosures expose expanded state. Failed place-source opening gives feedback instead of silently failing. Reference invitation wording no longer implies that the editorial duration includes walking or travel. No invitation was transmitted during testing.

Validation: full test:app passes (154 counted tests plus scenarios) after the presentation change; typecheck and fresh web export pass again after final accessibility fixes. Browser at 390 x 844 confirms the calm initial layout, inline company choices, shared-preparation controls, restored company/depth after reload, correct accessible checked/expanded states and Guide start restoring chapter 4 / Navigate. Native VoiceOver, large Dynamic Type and full all-theme/narrow-layout audit remain open. This increment is not a finished M4 build or quality-score acceptance.

## Remaining consumer surfaces and internal build candidate — 2026-11-12

Product Guardian / Engineer / Reviewer: apply the accepted reading-first direction to Plannen, Boek and Jij without data migration. Saved-list management is revealed on demand; Profile settings expand directly beneath their own row. Existing insights and week visualization remain. Book shows the stored personal note immediately, with statistics and explicit durable preference learning behind one disclosure. Photos lose the decorative overlay/frame; unavailable media has a readable fallback and sharing failures give feedback. Avoid double horizontal padding on narrow Book screens. An absent curated hero becomes a small honest message rather than a large empty panel.

Remember remains the existing owner and save/skip flow: personal note first, optional inline reflection and one primary save action. The untouched outcome is neutral rather than a presumed positive response, consistent with the approved optional-neutral-memory contract. No existing memory or learned signal is rewritten. Book no longer infers solo company from absent participant names or implies reference-visit reading duration was measured walking time. Planned duration for other capsules is explicitly labelled planned. Invitation and day-plan duration wording follow the same boundary. Location permission purpose text now accurately includes the previously approved, explicitly requested Guide position; no additional entitlement or background use is introduced.

Validation: full typecheck and test:app pass, 155 counted tests (80 generator + 13 affirmation + 62 Guide) plus scenarios; final small padding/fallback edits typechecked. New test rejects invented solo company/measured duration for reference memories. Browser verifies flat Profile controls, Light and Editorial at 320 pt, chapter narrative in Editorial, preserving the theme after reload, saving a clearly labelled test memory and showing its exact note after reload. No invitation or personal photo was transmitted. Previously verified current/legacy session restoration remains intact. Native map/permissions, device accessibility, offline cold start, audio interruptions and field guidance remain unverified. This is an internal iPhone review candidate, not completion or a final 8.5 rating.
