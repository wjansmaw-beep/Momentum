# ADR-074 — M2: voluntary local day plans

Status: Accepted by the Founder, 2026-11-11
Version: 1.0
Date: 2026-11-11

## Product Guardian preflight

Advances roadmap phases 4–6 after Founder acceptance of M1. The Founder reviewed the concrete day-planning proposal and approved it on 2026-11-11. M2 therefore implements the bounded day-plan slice; Living Interface expansion remains separate.

Human moment: I have saved a few experiences and want to combine them into a day without organizing a calendar. Strengthens Wonder → Momentum by reducing repeated searching and preserving the user's chosen order. Success means starting a chosen experience, not filling a schedule.

The current app matches ADR-073: four tabs, saved ideas, optional day suggestions and contextual Prepare/Guide. It has no persisted day-plan model. ADR-060's editorial day timeline is not a user-authored schedule; ADR-073 amended its product direction but explicitly deferred planner implementation. This accepted decision extends that implementation boundary. ADR-072 and broader renderer work remain separate.

## Approved smallest complete slice

- Keep Nu, Plannen, Boek and Jij unchanged as main tabs.
- Plannen opens with saved ideas. A modest 'Maak een dagplan' action reveals planning only by choice; existing plans remain accessible afterwards.
- Create and rename multiple simple day plans. Suggested default name means no required naming form. No mandatory date or time; optional dates and multi-day trips remain a later slice.
- Add multiple saved experiences; prevent duplicate experience IDs within one plan. One experience may belong to several plans.
- Reorder with accessible 'Omhoog' / 'Omlaag' actions; dragging is not required.
- Remove an item from a plan without unsaving it or changing a memory/session. Deleting a plan asks a concise destructive-action confirmation and leaves saved ideas intact.
- Open each experience through the existing OpenExperience flow into Prepare and the existing Guide. Retain active-session conflict protection and explicit resume.
- Do not automatically start the next item, infer completion, alter preferences or create memories from planning.
- Keep existing optional day intelligence available; its suggestions remain distinct from authored plans.

## Design contract

Use shared Minimal 4 semantic tokens, Fraunces headings, system body, thin dividers, inline expansion and one primary contextual action. Same component tree across Dark, Light and Editorial. Saved ideas stay the default surface; no empty timetable, dashboard or mandatory wizard.

Plan detail: editable title, ordered text-led experience list, concise existing duration metadata where valid, 'Voeg ervaring toe' and a per-item start action. Expanded rows contain ordering/removal controls. No invented arrival times, summed feasible itinerary or route optimization. Any displayed activity duration excludes travel and breaks explicitly.

Support Dynamic Type, VoiceOver labels and order announcements, minimum 44-point targets, keyboard-operable web fallback and existing Reduced Motion behavior.

## Data and integration

Reuse Experience snapshots and existing validation principles, AsyncStorage, AppProvider and the shared opening/saving components. Proposed versioned envelope: { version: 1, plans: DayPlan[] } in a new independent key, momentum.day-plans.v1.

DayPlan: id, title, createdAt, updatedAt, ordered items.
PlanItem: id, addedAt, experience snapshot.

Snapshots retain original provenance and expiry; saving never refreshes evidence. Starting a plan item uses the existing source and session checks. Unsave does not orphan a plan because its snapshot is independent. No updates to old saved-list, memory, session, profile or invitation storage keys; existing installs need no destructive migration. New key absence means no plans, not an error.

Unknown versions or malformed data must not be overwritten. Serialize writes, prevent editing before hydration, retain visible save errors and retry actions. Failure loading plans must not block the existing saved list, Guide or Book. Offline local editing works; unavailable media/live data retains existing truthful fallbacks. No new permissions, libraries, services, accounts, cloud sync or external publication.

## Implementation files

- src/product/dayPlans.ts: typed model, operations and validation (new).
- src/app/dayPlans.ts: persistence hook (new).
- src/app/store.tsx: integrate hook in the existing provider.
- src/ui/screens/PlansScreen.tsx: optional plan entry, list and detail.
- src/ui/plans/DayPlanEditor.tsx: focused shared-themed editing view if extraction helps (new).
- tests/dayPlans.test.mjs: model, independence and validation checks (new).
- package.json: include planner tests in existing test:app chain.
- 00_Project/Status.md, Roadmap.md, Open_Questions.md and this ADR: agreed boundary and actual evidence.

Do not change the navigation architecture, Generator Service, renderer contract, runner implementations or memory schema.

## Delivery and acceptance

1. Approve this M2 boundary and record it before application changes.
2. Implement and verify model/persistence; preserve all M1 data.
3. Implement optional editorial plan flow using existing components.
4. Verify creating/renaming plans, adding/removing/reordering, duplicate policy, reload, save failure, corrupt storage, offline access and independence from saved ideas/memories/sessions.
5. Verify plan → Prepare → Guide and resume with another active experience; rerun npm run typecheck and npm run test:app.
6. Inspect all three themes, narrow screens and increased text; report native accessibility checks separately from browser evidence. Deliver screenshots and an internal iPhone build through the existing authorized project/profile after scope approval; no App Store or OTA release.

M2 is complete when multiple experiences remain in the chosen order after restart and can be started safely from the plan, without degrading any M1 flow. Device checks must be reported with actual results and explicit limitations.

## Founder decision

Founder confirmed M2 as the above simple local day-plan slice. Multi-day travel, calendar sync, automatic scheduling, AI itinerary composition and renderer expansion are excluded from this proposal.

## Approval

Founder explicitly approved this concrete proposal ('Ja akkoord') on 2026-11-11. Implement the scoped local day-plan slice and internal iPhone delivery. Broader planning and renderer work remain excluded.

## Delivery evidence

Source 6ac5dd5; typecheck, 125 tests and existing scenarios pass. Actual browser checks cover create, rename, two-item add/reorder, persistence, independent unsave, three themes, guarded opening and runner resume at step 2. Internal iPhone build 0.4.0 (7), EAS 026679bb-4426-42df-89ae-e445a0f4e247, FINISHED. Physical-device review remains open; no public release. Screenshot and detailed evidence are in Momentum_M2_Oplevering.txt and the three M2 theme screenshots in task outputs.

## Founder device acceptance — 2026-11-11

Founder reports 'De test is goed' after the build (7) handoff. The scoped M2 milestone is accepted and complete. This does not assert individually verified accessibility/offline edge cases or authorize further scope.
