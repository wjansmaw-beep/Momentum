# ADR-077 — M5: location-aware return to the Guide

Status: Accepted scope by Founder, 2026-11-13
Version: 1.0

## Product Guardian

Founder explicitly approves M5 and immediate work: relevant nearby story when reopening an active Moddergat journey, voluntary location, manual choice, truthful offline/permission fallback. This advances the contextual Presence flow; it does not complete M4's outstanding device checks or certify its 8.5 target. M4's deferred-location boundary is amended only for this slice. No new service, dependency, background permission or parallel Guide.

## Experience and small design prototype

Keep the current chapter visible. Add one thin-rule disclosure, 'Verhaal bij je locatie', in the existing reading flow across Guide modes. Initially collapsed and off. Expanded copy explains: one location check when returning to this Guide, no location history. Explicit enable action requests foreground permission; no prompt on opening the app. The voluntary session setting survives restart, but positions and proposals do not.

After enabling and returning: 'Bij jou in de buurt: [place]' with 'Lees dit verhaal' and quiet 'Blijf bij dit verhaal'. The proposal never advances a chapter, starts audio, records completion or changes mode. Acceptance alone opens the corresponding Discover chapter. Dismissal silences that chapter's proposal for this Guide visit; reopening may offer it again. If already at the current chapter, report this quietly. Ambiguous/poor/stale location, no nearby verified point, denied permission and timeout explain that manual chapter selection remains available. No claim of arrival, access, opening or walking distance follows from proximity.

## Engineering contract

Use existing readForegroundPosition, expo-location foreground APIs, current chapter place models and shared session persistence. Only moddergat-five-places-v1 is enabled in M5. Store a validated optional boolean in AdaptiveGuideState; older snapshots default false. Never store coordinates, inferred visits or location history, and never send them to Generator Service. Reuse current sourced practical information unchanged.

One bounded sample when the focused Guide opens or app returns from background after opt-in. Cancel on loss of foreground/focus, session/chapter change or disable. Automatic calls use existing permission only; only the explicit enable button can prompt. Sixty-second cooldown prevents repeated automatic requests; explicit retry remains possible. A new accepted sample replaces the old candidate; stale callbacks cannot update another chapter. A proposal expires after 30 seconds and must be freshly checked to act thereafter.

Conservative initial matching parameters, to tune with field evidence: sample age at most 30 seconds, accuracy 0–35 metres, candidate distance plus accuracy at most 120 metres. Require nearest/runner-up distance gap greater than twice accuracy plus 15 metres. These are selection thresholds, not GPS guarantees or walking routes. Invalid coordinates, missing provenance, unknown/negative accuracy and future samples fail closed. No automatic chapter jumping, background tracking, new route engine or generated events.

## Validation and delivery

Test exact place, current chapter, neighbouring ambiguity, distant position, poor/stale/future samples, missing evidence and malformed coordinates. Preserve old session restoration and opt-in sanitization. Check foreground cancellation and existing tests, typecheck, browser composition and honest web fallback. Native reopening, permissions and field selection require iPhone testing. Deliver a small internal build using existing distribution; no public release.

Expected files: guidance/nearbyStory.ts; guidance/adaptiveGuide.ts; app/store.tsx; ui/guide/useNearbyStory.ts; ui/guide/NearbyStory.tsx; ui/guide/AdaptiveGuide.tsx; ui/screens/GuideScreen.tsx; targeted tests and project records.

## First implementation verification

Typecheck, all 164 counted tests (80 generator, 13 affirmation, 71 Guide) plus existing scenarios pass; nine new selection/restoration tests included in test:app. Web export succeeds. Browser verifies restored museum chapter, collapsed/expanded location disclosure and truthful iPhone-only location fallback without requesting browser permission. Native permission/reopening and field accuracy remain untested. Stored preference is a validated boolean; no coordinate persistence added. iPhone build pending.

## Internal build delivered — 2026-11-13

EAS aa6f2b26-dd69-4df4-a64b-12cdd8898ba0 FINISHED: iOS 0.4.0 (11), source d76637d, existing minimal4-preview internal distribution. No public release or native acceptance claimed. Founder test instructions and actual web screenshot are in task outputs.
