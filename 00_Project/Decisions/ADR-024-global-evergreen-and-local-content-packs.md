# ADR-024 — Global evergreen and bounded local content packs

Status: Accepted  
Date: 2026-07-13

## Decision

Momentum resolves editorial experiences independently from live-source coverage. The decision engine receives a catalog composed from matching local and regional packs plus a global evergreen fallback.

Language, geography, hemisphere, and season are separate context fields. A device language never proves physical location, and coordinates never silently select a product language.

## Why

The app already loads several context sources globally, but its fixed catalog still exposed the North Netherlands coastal prototype everywhere. That could produce an attractive but impossible Wadden suggestion for a user in another country.

The pack model prevents that drift while preserving the approved flow:

> Human Moment -> candidate selection -> one Experience Promise -> Capsule

## Boundaries

- Unknown regions receive global evergreen experiences rather than fabricated local recommendations.
- A validation-region snapshot cannot unlock local content or live candidates without a user-confirmed approximate location.
- Local editorial packs cannot create live claims.
- Live sources retain their own provenance, freshness, and coverage rules.
- The first content language remains Dutch pending the Founder language decision.
- Regional expansion does not add new navigation surfaces or a listings feed.

## Prototype evidence

Scenario checks cover Dokkum, New York, and Tokyo. Dokkum includes the bounded coastal pack; New York and Tokyo exclude it and retain a non-empty, varied global catalog.
