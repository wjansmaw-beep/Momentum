# ADR-051 — Unified Visual Foundation

Status: Accepted and implemented  
Version: 1.0  
Date: 2026-07-18

## Problem

The prototype accumulated multiple title treatments, duplicated color values, inconsistent radii, and competing green, gold, and category accents. Individual screens remained usable, but the product no longer felt like one calm premium companion.

## Decision

Momentum uses one app-wide system type family. Hierarchy comes from size, weight, spacing, and contrast rather than from switching between serif and sans-serif families.

The shared visual foundation consists of:

- warm charcoal backgrounds and quiet raised surfaces;
- warm off-white primary text and restrained neutral secondary text;
- one soft sage action accent;
- one restrained warm accent for temporal or exceptional context;
- low-saturation category hints that never overpower the Experience Promise;
- shared control, card, hero, and pill radii;
- shared theme tokens used by consumer flows and the consultable guide.

## Product boundary

Photography remains the emotional Living Canvas. Color supports hierarchy and recognition; it does not become the experience itself. Dynamic category color may identify a Capsule, but primary action, navigation state, trust surfaces, and typography remain visually consistent.

This decision establishes a direction, not final pixels. Later visual refinement must preserve accessibility, platform-native text behavior, reduced cognitive load, and the sequence desire → action → trust.

## Implementation

The Expo prototype now centralizes the palette, typography family, and core radii in `src/design/theme.ts`. The primary Now hierarchy, Capsule headings, buttons, Today cards, clarification surfaces, and consultable guide use the same foundation.

A second refinement pass reduces competing tinted panels in Promise, Prepare, and Presence. These stages now share neutral surfaces and use sage only for primary action, state, and trustworthy live context, so the experience becomes visually quieter after commitment.

The same hierarchy now extends across Today, Discover, and Life Book. Day opportunities, active-intent input, generated Capsule previews, memories, and primary navigation use the shared neutral surfaces, system typography, and restrained semantic accents instead of introducing separate visual dialects.

Onboarding, Shared Capsule invitations, Memory, and Profile complete the same end-to-end system. Trust and live-state panels use a restrained semantic edge rather than a fully tinted card, while reflective and account-free surfaces remain visually subordinate to the experience itself.
