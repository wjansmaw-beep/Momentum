# ADR-032 — Automatic Guide Composer before generative AI

Status: Accepted and first deterministic implementation prototyped  
Date: 2026-07-15

## Decision

All candidate Experiences pass through a Guide Composer before ranking surfaces them. The first Composer automatically adds missing guide moments from current evidence, route structure, and reviewed experience-kind contracts. It preserves existing curated moments, rejects expired evidence, caps the total at three, and labels automatically composed guidance.

This deterministic Composer is the required boundary for later generative AI. A future model may propose grounded wording or synthesis, but may not bypass evidence, expiry, provenance, safety, privacy, muting, or guide-density validation.

## Why

Static cards proved the experience language, but Momentum's value depends on cards that change with place, time, live sources, and the person. Those cards cannot all be written beforehand. Automatic composition makes dynamic cards rich now while preventing an unconstrained model from inventing the world.

## Current behavior

- Live nature and place Experiences receive guide moments automatically.
- Editorial catalogue Experiences with fewer than three moments can be completed from their experience-kind contract.
- Current source evidence remains inspectable separately.
- The UI states when guidance was automatically composed.
- No external AI service or new personal-data transfer is introduced.

## Deferred

Selecting a model, sending data off-device, generated-source synthesis, moderation, evaluation datasets, editorial approval workflows, and cost controls require a later decision. Until then, “automatic” means deterministic composition from approved inputs, not free generation.
