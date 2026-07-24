# ADR-064 — Evening Tone and Expansion Program

Status: Approved by the Founder on 2026-07-24  
Version: 1.0  
Date: 2026-07-24

## Context

ADR-058 deliberately left three capabilities unapproved ("Skia ambient layers, dark appearance, and video/cinemagraph content remain unapproved"), and the roadmap carried two further undecided ideas: broader transport options (public transport / car) and multilingual support. On 2026-07-24 the Founder reviewed the full list and approved **all five directions** in conversation, asking for them to be introduced.

This ADR records that approval and fixes the boundary for each direction, so implementation can proceed phase by phase without new approval rounds for what is already decided — and with explicit approval still required for what is not.

## Decision

The following five directions are approved, each within the boundaries stated:

1. **Evening tone (dark appearance).** A dark sibling of the ADR-061 fresh color language: same grammar, roles, and restraint, tuned for evening use. `userInterfaceStyle` moves from `light` to `automatic` so the app follows the device's appearance. WCAG AA contrast is preserved in both appearances. No pressure mechanics, no gamified "night mode" framing — the tone simply follows the time of day.

2. **Skia atmosphere layers.** `@shopify/react-native-skia` is approved as a dependency for ambient visual atmosphere (light, depth, weather-like mood) in the Living Canvas and related surfaces. Skia layers follow the ADR-057 philosophy strictly: they must never capture attention instead of handing it over, and the hard reduced-motion requirement applies — reduced motion removes animated Skia layers entirely.

3. **Video / cinemagraph content in the Living Canvas.** `expo-video` (or the SDK-recommended equivalent) is approved for muted, looping, ambient cinemagraph-style content. Only bundled, self-produced, or properly licensed assets may ship; hotlinked or unlicensed stock is excluded. A still-image fallback is mandatory (reduced motion, low bandwidth, older devices).

4. **Broader transport options (public transport / car).** Prepare-time transport refinement may advise honestly across walking, cycling, public transport, and car, inside the existing capsule-content model. **No live external transport integrations** (public-transit APIs, traffic services, booking links) are approved by this ADR; any such integration requires its own ADR with a privacy and cost assessment.

5. **Multilingual support.** Internationalisation infrastructure is approved: user-facing strings move to a translation layer, with Dutch as the primary and default language. Additional languages are added deliberately, one at a time. Live model-generated translation of user-facing content is not approved; translations are reviewed static assets.

## Sequencing (plan, not boundary)

Implementation order: **evening tone → Skia atmosphere layers → transport options → video/cinemagraphs → multilingual** (smallest and safest first; multilingual last because it touches every user-facing string). The Founder may reorder at any time; the boundary above is unaffected by order.

## Scope boundaries

- Pressure mechanics (scores, ratings, streaks, social proof) remain permanently excluded, regardless of appearance or content richness (ADR-061).
- Each direction lands through its own pull request(s) with the standard verification gate (typecheck, all test suites, web export) and, where native modules are added (Skia, video), a new development build before real-device use (ADR-062).
- No new external service integration is approved; the eBird key migration and generator authentication remain separate release blockers on the roadmap.
- PRIMX stays excluded as navigation/architecture; only its color inspiration (already absorbed via ADR-061) survives.

## Consequences

- `app.json` `userInterfaceStyle` will change from `light` to `automatic` when the evening tone lands (amending the ADR-018-era repair that set it to `light` because no dark palette existed — after this program, one does).
- The design system (`src/design/theme.ts`) gains an evening palette sibling of the ADR-061 light palette; appearance selection follows the device, never an in-app upsell or toggle with pressure framing.
- Dependencies `@shopify/react-native-skia` and `expo-video` are pre-approved for the phases that need them; each must still be pinned to the version in `bundledNativeModules.json` for the project's Expo SDK.
- The translation layer introduces one source-of-truth strings location; new UI copy enters through it from that phase onward.
- The current application-code boundary extends through ADR-064.
