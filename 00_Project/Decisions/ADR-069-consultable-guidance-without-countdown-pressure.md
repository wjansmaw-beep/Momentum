# ADR-069 — Consultable guidance without countdown pressure

Status: Accepted by Founder on 2026-09-25
Version: 1.0

## Decision and authority

After reviewing the personal live-guide direction, the Founder requested:
“Bouw het direct in de app zo scheelt dat tokens. We testen daarna wel”.
This replaces the separate clickable prototype with a bounded implementation
in the existing app, advancing roadmap phases 4/9. Automatic regression checks
still precede distribution to the existing private iOS preview channel.

Amend ADR-067 only as follows:

- Preparation expresses the experience and approximate commitment, not an
  invented departure countdown or promised completion clock.
- Weather and travel preparation are contextual, not applied to indoor
  workouts. Existing route safety and source disclosures remain available.
- Outside guidance is freely consultable by topic, with no completion bar or
  obligation to traverse every step. Ending and putting the phone away remain
  explicit, always available choices.
- Timers are optional aids only for timed movement/food steps. No general
  experience countdown; the phone-away screen shows a timer only when chosen.
- Saving a memory does not preselect a positive evaluation. A note is visible
  in the book; absent feedback is not converted into a neutral or positive vote.

Keep crafted-density typography, photography, materials and five tabs. This
slice does not redesign Nu/Dag, implement nearby recognition or authorize
health access, background location, sources, dependencies or provider changes.
ADR-068 request boundaries and ADR-063 private-network limits remain intact.

## Evidence and rollback

Test domain-specific preparation, optional evaluation and guide navigation.
Run existing regressions and exports. Real iPhone appearance, interruptions,
large text and preservation of existing memories require Founder testing.
Web or automated results are not native acceptance.
Keep the previous preview update available for rollback; no storage reset,
migration or native runtime change is required.
