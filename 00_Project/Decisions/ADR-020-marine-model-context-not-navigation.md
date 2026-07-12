# ADR-020 — Marine model context is not navigation or safety advice

Status: Accepted  
Date: 2026-07-12

## Decision

Momentum adds a bounded northern-coast Marine source using the Open-Meteo Marine API. It retrieves modelled wave height, wave period, sea-level height including tides, and ocean-current data without an API key.

The source is contextual evidence only. Coastal accuracy is limited and the data is not suitable for navigation. Momentum therefore:

- labels values as model or forecast;
- never calls a route safe because marine values look favorable;
- never replaces official warnings, local signs, access rules, or nautical information;
- expires the signal after three hours;
- keeps the experience worthwhile when the source fails;
- initially limits use to the northern coastal pilot region.

## Product consequence

Marine evidence may strengthen Wonder and timing for a coastal experience, but cannot bypass route feasibility, public access, weather guards, or user choice. A modeled rising or falling water level is phrased as a trend, not as an exact local high- or low-tide time.

## Deferred official tide source

Rijkswaterstaat remains the preferred Dutch authority. Its public data is discoverable, but a stable direct realtime reuse contract was not sufficiently verified for this implementation. Momentum will not scrape Waterinfo or invent an undocumented endpoint. A later adapter may replace or corroborate the model source after licensing, station mapping, and API behavior are verified.
