# Consultable guide — delivery evidence

Status: Implemented; private iPhone acceptance pending
Version: 1.0

## Scope

ADR-069, phases 4/9. No new dependencies, provider calls, permissions, sources,
background location, storage resets or native runtime changes. This is not the
complete premium redesign. Nu/Dag, retention/deletion and public generator
security remain separate work.

- Voorpret: same photographic experience, approximate duration, no departure
  countdown; preparation follows the activity. Indoor workouts have no travel
  card, weather card or weather-derived packing.
- Gids: outside and navigation-handoff experiences (including cycling) have
  direct topic selection and no progress bar. Completion is always voluntary.
  Route safety checks and sources remain. Workouts retain one changing card.
- Timers: only positive timed movement/food steps; never auto-started.
  Phone-away shows a timer only after it was chosen, and returns to the same topic.
- Memory: no preselected vote; absent feedback is distinct from neutral.
  Note-only saving does not change affinity. The user's note is visible in Boek.

## Verification performed

- Typecheck, 80 generator tests, 13 tone tests, 12 storage tests, 7 new
  activity/feedback regressions and both existing scenario runners.
- Web export and browser walkthrough with fresh test-only storage, no optional
  permissions: workout preparation, untimed next exercise, phone-away and return,
  save a note without choosing a vote, observe that note in Boek.
- Browser checking exposed cycling classified as movement; the presentation
  rule was corrected to recognize navigation handoff rather than mislabel it a workout.
- The final export was opened again: cycling showed “Open mijn gids”, direct
  last-topic selection worked without intermediate steps, and the guide was
  visually inspected in the browser. The existing cycling photograph still
  depicts a racing group; editorial image relevance remains follow-up work.

These are local/web checks, not real iPhone, locked-screen timer, provider-key,
screen-reader or public-release evidence. Existing Nu still showed a default
place, weather-led workout rationale, match score and arbitrary start clock.
Existing Boek minutes represent planned duration, not measured workout time.

## Founder iPhone checks

1. Open/reopen the updated app; old memories must still exist.
2. Choose outside/cycling: no Voorpret countdown; select guide topics in any order.
3. Put the phone away, reopen: same topic, no general timer.
4. Choose an indoor workout: relevant equipment, no weather/travel preparation;
   skip to the next exercise without starting a timer.
5. Try a timed exercise: explicit start/pause; also test locking/unlocking the
   phone. Background timer accuracy is not established by this change.
6. Save a sentence without a vote: see it in Boek; restart and check persistence.
7. Check light/dark mode and large text; report screen, action and screenshot
   for any clipping, crash, missing memory or unwanted countdown.

No public release approval. Rollback candidate before this slice:
iOS preview group c7bb7115-a23e-409d-82bc-07be32410f50, runtime 0.1.0.
Use an explicit EAS republish of that group only if needed; do not reset local data.
The new update identifier and exact published commit are recorded in the
dated Founder handoff after publication.
