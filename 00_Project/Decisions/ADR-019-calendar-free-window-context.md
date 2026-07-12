# ADR-019 — Calendar supplies free windows, not personal meaning

Status: Accepted  
Date: 2026-07-12

## Decision

Calendar is the first private Apple context source. Momentum requests it progressively from Profile and only after explaining the immediate value: detecting usable free windows.

On iOS, reading events requires full Calendar access. There is no read-only access level. Momentum therefore applies a stricter application boundary than the platform permission:

- event title, notes, location, attendees, calendar name, and identifier are discarded;
- all-day entries and events marked free do not block time;
- only start and end timestamps of timed busy events are converted into free windows;
- calculation happens locally and raw event data is not persisted;
- refusal or failure preserves manual time entry and the evergreen experience library.

## Product behavior

When a current free window exists, its remaining minutes replace the prototype time budget for Now. Today is generated from actual free windows rather than fixed demonstration windows. The explanation may state that free calendar time was used, but never reveal event contents.

## Technical boundary

The integration uses the official `expo-calendar` module and requires an iOS development build. Expo Go and the web preview cannot provide real calendar context; they show an explicit unavailable state and retain manual context.

## Expansion rule

Calendar is a Context Source, while weather, sightings, tides, events, openings, crowds, and closures are Living World Sources. Both publish bounded, timestamped signals into Understanding. New sources must define provenance, freshness, minimum data, failure behavior, and a user-visible reason before entering ranking.
