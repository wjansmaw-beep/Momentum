# ADR-061 — Fresh Color Language, Purposeful Affirmation, Phase Function Enrichment

Status: Approved by the Founder on 2026-07-24  
Version: 1.0  
Date: 2026-07-24

## Context

After reviewing the app in preview, the Founder gave design feedback on 2026-07-24, supported by a color concept image from the earlier PRIMX exploration:

1. The current colors do not appeal; the concept's fresh look — white cards on a cool light background, a confident green call to action, and per-phase accent colors — is preferred.
2. The affirmation line may not become vague or floaty; it must give concrete direction.
3. The text at the top of Now is too large.
4. Several functions seen in other apps (and the concept) are missing: in-card route map preview, richer reflection, photos in memories, visible learning.

The Founder's explicit constraints, agreed in conversation: pressure mechanics (match percentages, star ratings, "others went before you" social proof) are never adopted; PRIMX as navigation/architecture stays out (existing rule); only the color language and content richness transfer. The Founder approved the resulting proposal in full ("Ik ben het volledig met je eens. Akkoord").

## Decision

### 1. Fresh color language (amends ADR-053)

The warm daylight base is refreshed, not replaced:

- **Base**: cool light background (#F7F6FA family), pure white cards, keeping the light-chrome principle of ADR-053.
- **Primary action**: confident deep green (#208049 family) replaces muted umber for primary calls to action.
- **Phase accents** as a semantic system: Now = green, Prepare = blue, Presence = deep immersive (dark card with purple accent), Remember/Memory = amber, Life Book = sea-teal. Accents are used sparingly: one accent role per surface, never decorative noise.
- Photography remains the warmth source; amber/umber tones persist as photographic and accent-support hues.
- Typography (Fraunces display serif + system sans), radii, motion, and reduced-motion rules are unchanged.
- WCAG AA contrast remains a hard requirement for all text/background pairs introduced.

### 2. Purposeful affirmation (amends ADR-059/060)

- Every affirmation must contain a **concrete anchor**: a time, a place, or an action ("Om 15:00 heb je twee uur — genoeg voor jouw wandeling naar het wad"). Pure atmosphere wording without anchor is not allowed; the composer must fall back to the neutral line when no anchor is available.
- The affirmation presentation is reduced: a modest line above the hero (kicker scale, not title scale), so it guides without competing with the promise.
- Tone rules from ADR-059/060 remain (affirming, never pressuring, energy-aware).

### 3. Phase function enrichment

- **Route map preview**: Prepare and route cards gain an in-app map preview of the destination/route area. Implementation: `react-native-maps` with OpenStreetMap tile overlay on native; a graceful styled fallback on web. Apple Maps remains responsible for actual navigation (ADR-041 unchanged); the preview is orientation, not routing.
- **Richer reflection** (Remember): feeling chips, "would you do this again" (misschien / waarschijnlijk / zeker), and a free-text note — feeding the existing reversible learning model. No scores.
- **Photos in memories**: the user may attach photos to a Life Book memory via `expo-image-picker` (explicit user action, on-device storage only). No camera auto-capture, no upload, no analysis.
- **Soft visible learning**: Life Book may surface gentle, honest learnings ("Momentum merkt: wandelen bij lage energie werkt goed voor je") derived from the learning model — phrased as observations, never percentages, scores, or streaks, and only when the underlying evidence exists.

### Approved dependency additions

`react-native-maps`, `expo-image-picker` (Expo SDK-compatible versions). Nothing else.

## Scope boundaries

- Pressure mechanics are permanently excluded: no match percentages, ratings, rankings-of-people, scarcity, or social proof counts.
- PRIMX remains excluded as product navigation or architecture (unchanged rule); only visual color language transfers.
- No accounts, no new external services; maps use the already-approved OpenStreetMap source family; photos never leave the device.
- All ADR-057 craft rules (motion discipline, reduced motion) and privacy budgets remain in force.

## Consequences

- `src/design/theme.ts` receives the new token set; all screens shift to the fresh base; affirmation composer + NowScreen header change; Prepare/Remember/LifeBook gain the enrichment features.
- A fresh development build is required for native (react-native-maps, expo-image-picker).
- Definition of done: typecheck clean, all tests green (affirmation tone scenarios extended to require an anchor), web export builds, plain-language Founder update in the Obsidian log, and Founder preview review before merge of the visual change.
