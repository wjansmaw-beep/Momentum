# Recovery evidence — 24 September 2026

Status: Local working-tree record; not a release approval  
Version: 1.0

## Evidence boundary

Local HEAD is `f55c4fd4a6b562a3f9d67939e4ce18890d744bb6`. The existing working branch is `fix/memory-startup-hydration`. On 24 September its uncommitted Memory repair and tests were still present; this documentation session does not change them. Remote GitHub state, installed iPhone binary and provider settings were not freshly checked. Revalidate this snapshot when continuing from another checkout or date.

The Founder reports the app runs on his iPhone. That is not evidence that this local patch is installed, that all audit findings are fixed or that release is approved.

## Memory startup guard — narrow local repair

Scope: `src/app/store.tsx` now blocks writes to `momentum.memories.v2` until a successful read yields a list or confirms that the key is missing. Read rejection, malformed JSON and non-list values do not unlock writes. No schema migration, data reset, retention change or photo deletion was included.

Recorded execution on 19 September:

| Check | Result / limit |
|---|---|
| New storage tests before repair | 10 of 11 failed, including a write of the initial empty list while the read was pending. Fictitious storage only. |
| `npm run test:app` after repair | Passed: typecheck, 80 generator tests, 13 tone tests, then-current 11 storage tests and both scenario runners. |
| Final `npm run test:memory-storage` | 12 passed after adding the initial-state assertion. |
| Web export | Passed with two workers: 1,142 modules, 48 assets. |
| GitHub CI | The new suite is configured locally; no hosted run was started. |
| iPhone / update / rollback | Not performed for this patch. |

The test harness executes the actual Memory effect bodies with mocked asynchronous storage and checks their state/dependency wiring through the TypeScript parser. It is not a mounted React, StrictMode or native lifecycle test. Structural changes to the store require deliberate harness updates.

These are recorded prior results, not freshly rerun on 24 September. The documentation-only session does not claim new runtime validation.

**Remaining Memory limits:** a failed read leaves new writes blocked for the session, without a new visible recovery action. Edits made during slow/failed hydration are not guaranteed durable. The twelve-entry limit, stored date labels, durable photo ownership, deletion/export behavior and full record validation remain separate work. This guard does not recover already lost data or make Memory a proven durable archive.

## Open audit work — not silently closed by green tests

The 18–19 September audit/review is the basis for this queue. Findings must be rechecked against the code when their individual repair starts; this is not a fresh exhaustive audit.

- **Truth and privacy:** default Dokkum context, explicit location confirmation, stale facts, source-ID validation and the narrower ADR-068 payload need repair/reconciliation. Personal direction/meaning words must not be retroactively authorized because the implementation sends them.
- **Generator and distribution:** the generic preview's fixed home-network endpoint, identification-versus-authentication boundary, concurrent budget accounting, retry/timeout behavior and per-step cache remain open. No public generator deployment or new paid test is approved here.
- **Build chain:** audit findings and Expo compatibility require a fresh version/security check before updates. No dependency change was made in this recovery slice.
- **Native behavior:** invite acceptance, background/resume behavior, accessibility, update data preservation and rollback require specific device evidence.
- **UX and learning:** irrelevant outdoor preparation for workouts, generic countdowns, nominal duration presented as elapsed time, preselected positive feedback and hidden personal notes remain review findings. The personal live-guide proposal is not yet implemented.
- **Automation:** the new Memory suite is wired into local `test:app` and CI configuration. The audit's other proposed test additions are not claimed complete; in particular the separate existing Nu/briefing suites are not newly wired by this documentation session.

The earlier full audit, iPhone checklist, UX review, written design proposal and detailed Memory handoff are retained in the Founder's Momentum Obsidian vault / audit workspace. They are not repository ADRs. This portable summary records the immediate evidence boundary without depending on those machine-local paths.

## Release and decision gates

Approved scope is recorded in [Status](Status.md); immediate choices in [Open Questions](Open_Questions.md#current-decision-gates--2026-09-24); sequencing in [Roadmap](Roadmap.md#current-work-queue--2026-09-24). Public release and wider internal distribution are not cleared by this record. An isolated fictional-data design prototype may proceed separately from release repairs when commissioned.

For a later testbuild containing the Memory patch: retain a fictitious saved entry, close/reopen, verify it remains, add another, close/reopen again and record the build identity. Do not reinstall or wipe storage to hide a failure. This ordinary device check complements rather than replaces the asynchronous failure tests.

## Next bounded assignment

Recommended: a separate clickable prototype of one discovery experience and one indoor workout, using clearly fictional data and the written September design proposal. Show Nu → Voorpret → guide/phone-away → optional Memory, plus no-location and missing-source behavior. Retain rich visual craft; make activity-specific guidance testable. No production app changes, new sources, model calls, health access or background location. Deliver a Founder walkthrough and the exact ADR-067 amendment needed before implementation; do not broaden ADR-068 triggers implicitly.

This is a recommendation, not a started task. No commit, merge, cloud build or publication has been performed in the recovery/documentation sessions.
