# ADR-021 — OpenStreetMap places are leads, not guarantees

Status: Accepted  
Date: 2026-07-12

## Decision

Momentum uses the public OpenStreetMap/Overpass ecosystem to discover a bounded set of named nearby places: cafés, libraries, community centres, museums, galleries, viewpoints, and parks.

An OpenStreetMap object does not prove current access or opening. A place may become a live candidate only when its `opening_hours` value is either `24/7` or matches the conservative simple weekday-and-time grammar implemented by Momentum. Missing, complex, overnight, or ambiguous hours remain `unknown` and cannot be described as open.

## Guardrails

- Every place claim is attributed to OpenStreetMap.
- Opening status expires after six hours.
- Copy says “according to simple public hours,” never “confirmed open.”
- The Capsule asks the user to verify current local information.
- Apple Maps owns route feasibility.
- Local signs, access restrictions, closures, and operator information override the source.
- Unknown or closed places may not generate a live place Experience.
- Overpass loads as a progressive enrichment and may not delay faster Live World sources or the evergreen library.

## Consequence

This is a useful discovery layer, not a verified venue directory. Direct operator or authoritative opening sources remain a later corroboration step.
