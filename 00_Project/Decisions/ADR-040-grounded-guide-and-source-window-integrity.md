# ADR-040 — Grounded Guide and Source-Window Integrity

Status: Accepted and implemented  
Version: 1.0  
Date: 2026-07-16

## Problem

Momentum can generate a complete Capsule and can independently retrieve current Living World signals. A premium guide needs those layers to feel coherent without allowing generated language to become factual authority. Cached snapshots also must never receive a new freshness window simply because the app renders them again.

## Decision

Momentum keeps generation and live evidence separate and composes them locally into one Grounded Guide:

1. generation provides a timeless, complete Experience Capsule;
2. verified adapters provide evidence objects with source, observed time, retrieved time, expiry, and certainty;
3. a deterministic overlay may attach only still-current evidence that is relevant to the experience kind;
4. Guide composition turns attached evidence into an optional situated insight;
5. UI surfaces show whether a proposal is newly composed, live-enriched, editorial, evergreen, or expired;
6. the model never sees, edits, paraphrases, or extends the live evidence in this slice.

## Source-window rule

Every expiry is calculated from the original `retrievedAt` timestamp, never from render time or cache-read time. Invalid timestamps expire closed rather than being refreshed. A cached snapshot cannot renew its own evidence window.

- weather and visibility: two hours from retrieval;
- marine model context: three hours from retrieval;
- air-quality model context: six hours from retrieval;
- recent bird observation envelope: twelve hours from retrieval;
- current OpenStreetMap place lead: six hours from retrieval.

These are prototype windows, not permanent scientific guarantees. A source-specific policy may later narrow them.

## Experience behavior

- `Now` shows one compact grounding line on the current card.
- `Today` names current source coverage on the relevant opportunity.
- Promise and Prepare show source name and an explicit `current until` label.
- Presence keeps the same evidence available in the consultable Guide.
- Expired evidence is not shown as current. Promise names that the source window expired and falls back to general guide content.
- A generated outside Capsule can receive verified environmental context, but not a destination or route. Routes remain owned by the Opportunity and Route Composer.

## Failure and global behavior

Missing, expired, or failed sources never remove the complete evergreen Capsule. Momentum says that the guide is editorial or globally usable and does not simulate local depth. This preserves global usefulness while allowing richer source coverage where it genuinely exists.

## Future gate

Sending an evidence envelope to a model, model-authored factual interpretation, new sources, or source-driven route generation remains a separate decision requiring licensing, sensitivity, evaluation, and adversarial validation.
