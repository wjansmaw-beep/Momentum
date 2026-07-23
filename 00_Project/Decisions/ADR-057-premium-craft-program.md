# ADR-057 — Premium Craft Program

Status: Approved by the Founder on 2026-07-23  
Version: 1.0  
Date: 2026-07-23

## Context

An independent UI/UX assessment commissioned by the Founder on 2026-07-22 (conducted deliberately without deference to the repository's own design documents) concluded: the app has taste but lacks craft. All mechanisms that make an application feel premium in 2026 are absent — motion, depth layering, typographic contrast, image treatment, and tactile feedback. The assessment identified a root cause in the documented direction itself: the design documents conflate calmness with stillness. Calm is a tempo property, not an absence property.

The Founder's verdict on the assessment: the app must become fully premium.

## Decision

The design philosophy is refined: the moral boundary is not "no motion" but **no motion that captures attention instead of handing it over**. No confetti, streaks, endless carousels, autoplay, or reward loops. Continuity, physics, tactility, and editorial typography are approved means; they serve the promise that technology returns attention to real life. A well-crafted app disappears more completely than a crude one.

The Premium Craft program is approved in two implementation horizons:

### Horizon A — Craft foundation (single PR)

1. Editorial display serif for hero, flow, screen, and memory titles (e.g. Fraunces or Newsreader) via `expo-font` with bundled font assets; system sans remains the UI voice.
2. Real image layer: `expo-image` with placeholder (blurhash/thumbhash where available), fade-in transitions, and disk caching, replacing all remote `ImageBackground` usage; `expo-linear-gradient` replaces the two flat rgba shade rectangles.
3. Tactile feedback via `expo-haptics`: light impact on chip/selection/tab interactions, medium impact on the primary commitment action, success notification on memory save and experience completion.
4. Real icons: `@expo/vector-icons` (or SVG via `react-native-svg` only if needed) replace all Unicode glyph pseudo-icons (`●/○`, `→`, `⌄/⌃`, `✦`, hand-built border glyphs).
5. Entrance choreography with the built-in `Animated` API: staggered reveal of hero layers on Now; spring-based pressed states on primary/secondary buttons replacing the static opacity change.

### Horizon B — Living premium (one or more follow-up PRs)

1. `react-native-reanimated` + `react-native-gesture-handler`: spring physics throughout; the guide sheet becomes drag-to-dismiss; swipe between Now suggestions; pull-to-refresh on Now; hero scroll parallax.
2. `expo-blur`: true frosted material under the bottom navigation and guide sheet.
3. Continuity transitions: the experience image travels from Now through Prepare into Presence (shared-element-style, via overlay or reanimated shared values).
4. Living Canvas motion: sub-perceptual Ken Burns on the hero (≤4% scale, ≥8s cycle), gently animated ambient layers, and a true OLED-dark Phone Away mode with a softly breathing element. All ambient motion must respect reduced-motion settings and never loop conspicuously.
5. Empty and quiet states (silent card, empty Life Book, no-suggestion states) redesigned as first-class editorial moments.

### Approved dependency additions

`expo-font`, `expo-image`, `expo-linear-gradient`, `expo-haptics`, `@expo/vector-icons`, `expo-blur`, `react-native-reanimated`, `react-native-gesture-handler`. Each must be integrated following Expo managed-workflow practice and remain compatible with the web preview where the upstream library supports it (graceful no-op elsewhere, e.g. haptics on web).

### Also approved

- The Profile screen's evaluation/lab surfaces (generator evaluation, coverage matrix, trial evidence) move behind a debug/development flag; the consumer Profile keeps only personal, meaningful controls.
- Reduced-motion accessibility is a hard requirement: every animation introduced by this program must have a reduced-motion path (`AccessibilityInfo.isReduceMotionEnabled()`).

## Scope boundaries

- No gamification, streaks, badges, autoplay, or attention-capturing loops — ever.
- The warm daylight direction (ADR-053), one visual grammar (ADR-051), and the four-surface architecture remain in force; this program deepens them, it does not replace them.
- Horizon C (navigation foundation such as react-navigation, Skia-driven ambient layers, dark appearance) is NOT approved by this ADR and requires a separate ADR when proposed.
- No new external services or accounts; all additions are client-side rendering and feedback libraries.
- Consumer-facing copy tone and the Trust Model remain unchanged.

## Consequences

- `package.json` will gain its first non-Expo-runtime dependencies (Reanimated, gesture handler) in Horizon B; the lockfile and development-build runbook must be updated accordingly (a fresh development build is required for native modules).
- The hand-built `ImageShade` and glyph components are retired as horizons land.
- Definition of done for each horizon PR includes: typecheck clean, generator tests green, reduced-motion behavior verified in code, and a plain-language Founder update in the Obsidian log.
