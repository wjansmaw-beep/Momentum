# Context Source Architecture

Status: Directional  
Version: 1.0

## Purpose

Momentum can add new live content without turning the app into a collection of special-case integrations. Sources do not create cards directly. They publish narrow signals that Understanding may combine into a Human Moment, candidate ranking, Experience Promise, and Capsule.

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

## First implementations

- Open-Meteo: live weather, wind, visibility, sunrise, and sunset.
- eBird: optional recent public observations with Nature Guard.
- Calendar: device-local free windows derived from timed busy intervals.

## Next source order

1. tides and water safety for the bounded northern region;
2. opening hours and closures for route feasibility;
3. curated events and cultural moments;
4. seasonal bloom and migration signals;
5. crowds only if a credible, licensed source exists.

The order follows immediate user value and safety, not API availability.
