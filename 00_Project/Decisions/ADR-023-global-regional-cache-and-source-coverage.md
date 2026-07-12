# ADR-023 — Global product, regional sources, local cache

Status: Accepted  
Date: 2026-07-12

## Decision

Momentum is a global product. Dokkum is the first validation region, not a product default in the domain model. Context is keyed by approximate regional cells and device-local time rather than by a fixed city, country, or timezone.

Live World snapshots are cached locally per coordinates rounded to one decimal degree. A cache entry may provide immediate previous context for up to 24 hours, but every previously live receipt becomes `stale` when restored.

## Freshness rules

- Restored cache can explain what was previously known but is never labelled live.
- A cached snapshot older than 24 hours is ignored.
- Dynamic weather, nature, marine, air, or place Experiences require their stricter source freshness window and cannot be composed from stale cache.
- Evergreen Experiences and active intent remain available offline.
- The user can clear every regional Live World cache from Profile.

## Global source coverage

Each source declares its own coverage through source state rather than pretending universal availability:

- weather: broad global forecast coverage;
- air quality: broad model coverage, with European pollen only where provided;
- marine: currently the northern Netherlands coastal pilot only;
- places: a local radius query around the active approximate region;
- eBird: available only when configured and subject to regional public observations;
- calendar: device-local and unrelated to geographic coverage.

Unsupported regions fall back independently per source. One missing regional capability never disables the rest of Momentum.

## Local time

Today, day parts, calendar windows, and user-facing dates use the device locale and timezone. Source timestamps retain their provenance timezone and are normalized before comparison.
