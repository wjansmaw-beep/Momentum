# ADR-045 — Place Knowledge Lens

Status: Accepted and implemented  
Version: 1.0  
Date: 2026-07-17

## Problem

ADR-043 enriches a Living World Opportunity when a nearby story also matches its selected destination. Ordinary editorial, deterministic, or generated Capsules remain generic even when Momentum already has relevant place knowledge around the user. This makes worldwide coverage depend too strongly on a separate live destination source.

## Decision

Momentum may apply one nearby Place Knowledge story as a **local knowledge lens** to outside, culture, or learning Experiences that do not already contain a route or destination-specific story.

The lens deepens an already feasible Experience. It never creates the Experience, changes its destination, proves access, or becomes a live claim. Nearby stories are distributed across the finite candidate set so the same story does not dominate every perspective.

## Experience behavior

- Prepare may show one credited “story of the place” beneath the practical and route-independent context.
- The consultable guide makes the same story available at one bounded guide moment.
- Deep guidance keeps the story available as optional background.
- The story does not rewrite the Experience Promise or imply that the person must visit the article coordinate.
- Missing or distant knowledge leaves the Experience unchanged.

## Selection and privacy

Only stories already retrieved through the approved Place Knowledge adapter may be used. The first prototype requires the story coordinate to be within four kilometres of the rounded connected environment. Lens allocation is deterministic, device-local, and sends no profile or Experience data to Wikipedia.

## Limits

Semantic matching between a story and the precise route or activity remains future work. Until a grounded relevance model exists, the UI calls this a story from the environment rather than a story about the selected path.

