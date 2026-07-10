# Living World

Status: Foundational concept  
Version: 1.0

The Living World layer answers:

> What is happening in the world now that could become meaningful for this person?

It makes Momentum useful at home, at work, and while travelling without reducing the world to a static directory.

## Opportunity domains

- culture: exhibitions, performances, small concerts, markets, workshops;
- nature: blooms, migration, tides, stargazing, seasonal change, recent observations;
- place: viewpoints, quiet spaces, architecture, local food, temporary access;
- conditions: weather windows, light, snow, wind, water, crowd levels;
- time-bound community life: public activities and local traditions;
- evergreen experiences: recovery, movement, cooking, learning, and connection when no external event is needed.

These are sources of experiences, not user-facing legacy modules.

## Source model

Potential sources include official open data, event organizers, cultural institutions, nature organizations, weather providers, maps and places data, trusted local curators, and verified community contributions.

Every live-world fact needs:

- source and license;
- location and relevant radius;
- start, end, and last-verified time;
- confidence or verification status;
- accessibility, cost, opening, and age information when relevant;
- moderation status for community content.

## From event to experience

The Living World layer does not directly publish raw events to the user. It supplies verified opportunities to the Understanding Engine, which tests personal relevance and feasibility. Wonder then expresses the truthful emotional promise, and Momentum prepares execution.

An event is not automatically a good suggestion. A good suggestion connects a real opportunity with the person's time, place, interest, desired feeling, and practical ability to act.

## Locality and travel

The same system supports:

- **near home:** familiar context with fresh local opportunities;
- **at work:** short experiences possible within current constraints;
- **on holiday:** unfamiliar surroundings with stronger discovery support;
- **in transit:** only safe, realistic suggestions appropriate to the journey.

Location precision should be proportional to the benefit. Approximate location is enough for discovery until exact routing is accepted.

## Freshness and truth

Stale world context destroys trust. Time-sensitive claims must expire automatically. Recent sightings are described as observations, not guarantees. If source confidence is weak, Momentum either lowers the wording or omits the claim.

## Curation principles

- Prefer distinctive, timely relevance over popularity.
- Avoid flooding the system with generic listings.
- Preserve local character and credit sources.
- Separate paid placement from personal recommendation; sponsorship may never secretly affect ranking.
- Protect fragile locations and wildlife by withholding or generalizing precise coordinates when necessary.
- Ensure that cultural and natural suggestions are not limited to already dominant or affluent venues.

## Early product scope

The first implementation should use a small number of reliable sources in one bounded region and a curated catalogue of evergreen experiences. It should prove freshness, fit, and execution before expanding coverage.
