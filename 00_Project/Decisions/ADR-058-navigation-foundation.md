# ADR-058 — Navigation Foundation and True Image Continuity

Status: Approved by the Founder on 2026-07-23  
Version: 1.0  
Date: 2026-07-23

## Context

ADR-057 approved the Premium Craft program in two horizons and explicitly deferred Horizon C. Horizon B (PR #7) delivered spring physics, glass, gesture interactions and a coordinated approximation of image continuity — but true shared-element transitions are impossible on the hand-built `surface`/`flowStage` state machine, which also carries structural UX debts: no native screen transitions, fragile scroll-state handling, no deep-link structure beyond the invite URL, and every transition hand-rolled.

On 2026-07-23 the Founder approved applying Horizon C.

## Decision

Horizon C is approved in the following scope:

### Approved now

1. **Navigation foundation**: adopt `react-navigation` (native-stack) with `react-native-screens` and `react-native-safe-area-context` as the single navigation mechanism for the four surfaces (Now, Today, Discover, Life Book), the flow stages (Promise/Prepare/Presence/Remember), Profile, Onboarding, and the invite screens. The hand-built `surface`/`flowStage` string state machine is retired as the navigation mechanism. Platform-native transitions (push, modal, gesture-driven pop on iOS, predictive back on Android) become the default.
2. **True shared-element image continuity**: the experience image travels as a shared element from Now through Prepare into Presence, using the navigation foundation (e.g. Reanimated 4 shared transitions or an equivalent supported technique). Reduced-motion users receive crossfades instead.
3. **Design-token and style refactor** needed to sustain the above: split the monolithic inline StyleSheet and screen components out of `App.tsx` into `src/ui/` modules, extend `theme.ts` with spacing/elevation/motion tokens, and retire the deprecated token aliases. This is an internal restructure; no visual regression is permitted.
4. The existing invite URL handling migrates to navigation deep links; behavior unchanged.

### Deferred (NOT approved by this ADR)

- `react-native-skia` ambient layers and shader-driven effects.
- Dark appearance / second tone.
- Video or cinemagraph content (`expo-video`).
- Any change to product flows, ranking, content, or the four-surface architecture.

## Scope boundaries

- All ADR-057 constraints remain in force: no attention-capturing motion, hard reduced-motion support, warm daylight direction, one visual grammar.
- No behavior change visible to the user except: native transitions, shared-element continuity, and (where the foundation fixes it) correct scroll-state preservation and back behavior.
- The web preview must keep working; where native-stack features are unavailable on web, graceful fallback transitions apply.
- Dependencies approved: `@react-navigation/native`, `@react-navigation/native-stack`, `react-native-screens`, `react-native-safe-area-context`, plus any peer strictly required by them. Nothing else.

## Consequences

- `App.tsx` shrinks to an app shell; screens move to `src/ui/screens/`. This is the largest single restructure since the prototype began; the PR must demonstrate zero behavioral regression by typecheck, the generator test suite, and a web export build.
- A fresh development build is required for native devices after this lands (react-native-screens / safe-area-context are native modules).
- Definition of done additionally requires: deep-link invite flow verified in code, back behavior verified on Android code paths, and a plain-language Founder update in the Obsidian log.
