# ADR-071 — Personal nature discovery pilot

Status: Accepted for bounded implementation; device acceptance pending
Version: 1.0
Date: 2026-10-01

## Founder decision and preflight

The Founder requested concrete, personal, source-grounded experiences and
approved continuing to build the nature/photography slice. This advances
roadmap phases 3/8/9: explicit understanding, guarded opportunities and a
consultable guide. It does not authorize the complete future source programme.

The current app has broad interests and generic destination copy. Its legacy
persona ranking still differs from ADR-065; this pilot does not claim to finish
that programme. Existing source validity and public-location gaps must be
guarded before richer nature proposals are admitted.

## Smallest complete slice

- Optional, reversible, device-local choices: birdwatching and nature photography.
- Feed those choices into existing guarded opportunities and local selection;
  never bypass feasibility, access, freshness or the finite alternatives limit.
- Name the actual source destination, reported species/date where available,
  a suggested activity and estimated travel. Observation is not presence.
- Photography at existing OSM parks/viewpoints is a suggested activity, not
  evidence of golden light, wildlife, verified access or a photogenic view.
- Normalize the existing weather adapter's Unix timestamps to UTC instants;
  reject ambiguous, stale or future evidence rather than renewing it in cache.
- Do not infer public wildlife locations from an identifier or absent privacy flag.
- Missing source coverage remains visible and evergreen experiences remain usable.

No new source, backend, dependency, health access, tracking, paid model call,
public release or model payload expansion. No keys are configured. Existing
eBird client-token design remains a blocker for activation and requires a
server-side boundary plus verified public-location/sensitivity handling.

## Evidence required

Tests cover profile migration/removal, preference effect, feasibility, stale and
missing sources, concrete copy, conservative travel and timestamp integrity.
Web checks are not iPhone evidence. Native acceptance and actual bird-source
activation remain separate gates. Success is a worthwhile visit, not more
profile completion or screen time.
