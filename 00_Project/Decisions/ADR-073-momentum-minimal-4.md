# ADR-073 — Momentum Minimal 4.0

Status: Accepted by the Founder, 2026-11-10  
Version: 1.0

## Product Guardian preflight

Advances roadmap phases 4–6. The Founder approved four permanent tabs,
shared themes and the phased plan, explicitly restricting implementation to
the first milestone. Existing FreshHome and five-tab navigation conflict with
this direction; ADR-071 and ADR-067 are amended for the main entry.

## Approved first milestone

- Nu → contextual refinement → save → Plannen → Voorpret → existing Guide.
- Exactly four main tabs: Nu, Plannen, Boek, Jij. Preparation and guidance are
  contextual flows, with explicit resume access and no mandatory onboarding.
- One ranked recommendation. Refinement reruns existing intelligence with
  temporary intent/context; never silently modifies durable preferences.
- Plannen initially contains only saved experiences, with no required dates.
- One component layout, Dark/Light/Editorial semantic palettes, persisted
  manual selection and optional system Dark/Light.
- Photography-led minimal hierarchy, Fraunces editorial titles, system body,
  inline disclosure, accessible targets and reduced-motion behavior.
- Preserve generator, existing guide/runners, snapshots, invitations, memories
  and preferences. Save ideas separately; saving is not positive learning.
- Old source expiry survives snapshots. No invented locations or media rights.

## Amendments and limits

Amends ADR-014/060/067 navigation and ADR-061/064/069/071 appearance. Native
stack (ADR-058), source/privacy boundaries and shared session remain.
ADR-060's prohibition on planning mechanics is amended in product direction;
day and multi-day planners are NOT part of this implementation milestone.
ADR-072 remains a proposed renderer extension: no broad renderer rebuild or
new model-output contract is authorized here. This replaces the unaccepted
Minimal 3.0 ADR-073 draft, not an accepted historical ADR.
No new service, dependency, cloud sync, public deployment or App Store release.

## Verification

Typecheck and existing app tests; focused tests for temporary ranking,
saved-snapshot validation and persistence failure handling. Inspect the actual
rendered app in all themes. Report browser evidence separately from native
iPhone verification. Review this milestone before exposing further planning.

## First milestone evidence — 2026-11-10

Implemented locally: four tabs, temporary ranked refinements, saved ideas,
shared themes and existing Prepare/Guide continuity. No planner or renderer
expansion. Typecheck and app suites pass (80 generator, 13 affirmation,
24 guide/milestone tests plus scenarios). iOS bundle export succeeds. Browser
checks at 390x844 cover all themes, saved-list restoration, session resume and
task restoration. Screenshots and a plain-language report are in the task
outputs. Physical iPhone, VoiceOver and offline/device failure tests remain
outstanding; no new IPA or publication is claimed.

## Visual approval and internal test delivery — 2026-11-10

Founder approved the appearance and instructed completion of this milestone
after the proposed next step was a new iPhone build. Authorizes version 0.4.0
internal distribution to the existing registered iPhone through the existing
Expo project. Isolated minimal4-preview channel, same bundle identifier and
local data. No App Store release, old-channel OTA, or planner expansion.
Record source in Git and deliver installation/test instructions. Physical
device results must remain explicitly unverified until actually tested.

## Internal build delivered — 2026-11-10

EAS build `07bfd5e9-65da-46d3-a892-3fd96bc9ba2b` finished successfully:
0.4.0 (4), internal, minimal4-preview, source `89721ce`, same bundle identity.
Source is preserved on the existing GitHub feature branch. Typecheck and all
app suites passed again before upload. Installation/test instructions are in
the task outputs. This completes the first implementation/build handoff,
not physical-device acceptance or approval of later phases.
