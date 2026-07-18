# ADR-052 — Content-first premium experience

Status: Accepted and implemented  
Version: 1.0  
Date: 2026-07-18

## Problem

The unified visual foundation improved consistency, but the core journey still felt like a prototype. Too many equally prominent panels, small labels, and disconnected controls made the interface visible before the experience. The visual identity of an Experience also disappeared too quickly between Promise, Prepare, and Presence.

## Decision

Momentum uses a content-first hierarchy:

1. The experience is the visual base layer.
2. Navigation and controls form a quiet functional layer above it.
3. One current choice receives primary emphasis; supporting context remains subordinate.
4. Photography and atmosphere continue through Promise, Prepare, and Presence so commitment feels like one journey rather than separate screens.
5. Premium quality comes from fewer, stronger surfaces, deliberate rhythm, and readable hierarchy — not from adding glass effects to every panel.
6. Primary touch targets remain at least 44 points high and small functional labels are avoided in the core journey.
7. The web preview may use a restrained framed canvas to make the mobile composition legible on large displays. Native mobile remains the product reference.

No new product surface or feature is introduced by this decision.

## Research basis

This direction follows Apple's current platform guidance:

- Human Interface Guidelines: hierarchy, harmony, consistency, and content-led design — https://developer.apple.com/design/human-interface-guidelines
- Materials: reserve Liquid Glass for the functional layer and use standard materials for content — https://developer.apple.com/design/human-interface-guidelines/materials
- Accessibility: readable, adaptable interfaces and appropriately sized controls — https://developer.apple.com/design/human-interface-guidelines/accessibility/

## Implementation

- The shared palette has warmer neutral surfaces, clearer text contrast, and restrained sage and gold accents.
- Prepare keeps the selected Experience visible as a cinematic expectation surface.
- Presence uses the Experience image as a quiet backdrop, a single focused stage, and a visually separated control footer.
- Core contextual labels and facts use more legible sizes.
- The web build uses a subtle mobile canvas boundary instead of floating as an unframed narrow column on desktop.

## Consequences

The core flow should feel calmer, more coherent, and more emotionally continuous. Controls remain easy to consult but do not compete with the experience.

Future work must still validate image contrast, Dynamic Type, Reduce Motion, native material behavior, and performance on physical devices. Platform materials should be adopted natively when available rather than imitated with excessive transparency.
