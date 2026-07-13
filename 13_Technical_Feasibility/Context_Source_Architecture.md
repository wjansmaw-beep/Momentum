# Context Source Architecture

Status: Directional  
Version: 1.0

## Purpose

Momentum can add new live content without turning the app into a collection of special-case integrations. Sources do not create cards directly. They publish narrow signals that Understanding may combine into a Human Moment, candidate ranking, Experience Promise, and Capsule.

Momentum is global while source coverage is regional. Adapters report unsupported or unavailable coverage independently; no adapter may make the product assume a specific country, city, language, or timezone.

Editorial content uses the separate pack and fallback contract in `International_Content_Architecture.md`. A matching content pack does not imply that any live source is available, and a live source does not authorize unreviewed local editorial content.

## Source families

### Personal context sources

Calendar, location, recovery, explicit intent, and later device capabilities describe the user's current constraints. Each requires a separate value explanation and permission boundary.

### Living World sources

Weather and light, public nature observations, tides, seasons, cultural events, markets, opening hours, crowds, and closures describe opportunities or constraints in the world. Public does not mean trustworthy by default: provenance, freshness, licensing, and sensitivity remain mandatory.

## Common source contract

Every source must provide:

- a stable source identifier and human-readable name;
- source state: live, unavailable, denied, stale, error, or not configured;
- retrieval and expiry time;
- provenance URL or platform capability;
- bounded structured signals rather than persuasive copy;
- confidence or evidence class;
- graceful fallback;
- privacy and sensitivity rules;
- a visible explanation when the signal affects selection.

## Processing sequence

```text
Source adapter
→ validated signal
→ expiry and sensitivity guard
→ Human Moment
→ candidate feasibility
→ comparative ranking
→ one Experience Promise
→ complete Capsule
```

No source may bypass feasibility, autonomy, Nature Guard, or the user's blocked preferences.

Fast sources publish the first snapshot without waiting for slower discovery sources. Slow sources enrich the snapshot independently; their loading or failure may never hold weather, air, marine context, the evergreen library, or active intent hostage.

Snapshots may be cached in approximate regional cells for fast/offline opening. Restored values are always stale until refreshed and cannot generate new live claims.

## First implementations

- Open-Meteo: live weather, wind, visibility, sunrise, and sunset.
- eBird: optional recent public observations with Nature Guard.
- Calendar: device-local free windows derived from timed busy intervals.
- Open-Meteo Marine: bounded model context for waves, current, and sea-level trend; explicitly not navigation or a safety verdict.
- OpenStreetMap/Overpass: nearby public-place leads with conservative opening-hour interpretation and mandatory local verification.
- Open-Meteo Air Quality: European AQI and seasonal pollen as non-medical environmental context.

## Next source order

1. tides and water safety for the bounded northern region;
2. direct operator opening hours and authoritative closures to corroborate public place data;
3. curated events and cultural moments;
4. seasonal bloom and migration signals;
5. crowds only if a credible, licensed source exists.

The order follows immediate user value and safety, not API availability.
