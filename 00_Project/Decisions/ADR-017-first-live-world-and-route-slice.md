# ADR-017: First Live World slice combines verified signals with a route request

Status: Accepted  
Date: 2026-07-12

## Context

The Founder authorized moving the Living World layer forward because timely world context and prepared execution are central to Momentum's differentiation. Earlier technical guidance deferred live claims until provenance, freshness, privacy, and route handoff were explicit.

## Decision

The first live slice uses one bounded region and three progressive capabilities:

1. live weather, wind, visibility, sunrise, and sunset from a public forecast source;
2. recent public bird observations when an eBird API token is configured;
3. an Experience Composer that turns a valid opportunity into a sourced promise, preparation, a route request, Presence, and Memory.

The app remains useful when either source fails. It never replaces missing live data with a fabricated live claim.

## Nature guard

- A sighting is an observation, never a guarantee of current presence.
- Private, obscured, sensitive, stale, or coordinate-less records cannot produce an exact destination.
- Momentum routes only to a public source location or a separately curated access point, never a nest or inferred animal position.
- The experience must remain worthwhile without seeing the species.
- Exact sensitive coordinates never enter Memory or sharing copy.

## Route boundary

Momentum composes the purpose, destination, time budget, and route request. Apple Maps owns final walking or cycling directions. The first slice does not claim to generate verified recreational trail geometry itself.

## Consequences

- Live source status and last refresh are visible.
- Dynamic experiences contain provenance and expiry.
- Source failure degrades to the existing evergreen library.
- Additional tides, events, openings, crowds, and closures join only through the same source contract.

