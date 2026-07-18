# ADR-053 — Warm daylight visual direction

Status: Accepted and implemented  
Version: 1.0  
Date: 2026-07-18

## Problem

The charcoal and sage foundation made Momentum coherent, but it placed a persistent dark-green character over every experience. That reduced the visual authority of hero photography and made distinct places, food, movement, culture, and recovery experiences feel more alike than intended.

## Decision

Momentum adopts a warm daylight visual foundation:

1. Application chrome uses parchment, ivory, and near-white surfaces with deep botanical-charcoal text.
2. Photography owns the strongest color and emotional atmosphere.
3. The primary interface accent is restrained umber/bronze rather than sage green.
4. Experience accents may use a controlled range of clay, mineral blue, muted teal, ochre, and mauve. They communicate character, not old product modules.
5. Dark material is reserved for legible image overlays, temporary floating controls, and focused Presence states.
6. Light does not mean stark white: surfaces remain warm, calm, and low-glare.
7. Text on photography uses dedicated high-contrast image tokens rather than inheriting surface text colors.

This decision changes visual direction only. It does not add navigation, features, or data access.

## Rationale

A lighter neutral frame lets every Living Canvas feel like its own place and moment. It also supports a calmer editorial rhythm while keeping the interface distinct from a dark entertainment feed. Restricting dark material to imagery and focused execution preserves cinematic depth where it adds meaning.

## Implementation

- shared color tokens now separate light application surfaces from on-image and dark-glass roles;
- core consumer surfaces use warm light neutrals and dark readable typography;
- the default action color is warm umber;
- controlled experience accents no longer repeat a dominant yellow-green tint;
- Promise, Prepare, Presence, Memory, and generated tiles use explicit on-image contrast tokens.

## Consequences

Hero photography should feel larger, clearer, and more varied. The interface should feel premium through restraint, whitespace, typography, and material hierarchy rather than through an overall tint.

Image contrast, Dynamic Type, reduced transparency, dark appearance as a possible later user preference, and native material behavior still require physical-device validation.
