# ADR-060 — Discover as Travel Guide, Today as Timeline, Responsive Affirmation

Status: Approved by the Founder on 2026-07-23  
Version: 1.0  
Date: 2026-07-23

## Context

From the Founder's idea log (2026-07-23), with explicit approval to implement ("voer dat door zo goed als je kunt"):

1. **Discover** should become a travel-guide overview — a Lonely Planet-like view of the surroundings with beautiful happenings, working on every location (home town or holiday destination), and clearly different in feel from the single-suggestion Now surface.
2. **Today** should show the day as a **timeline**.
3. The **affirmation line** (ADR-059) should respond to more: live feedback from the user and live world signals such as weather and time, and also the user's **energy level**.

The Founder explicitly noted the Discover design direction is not yet fixed ("hoe dit eruit ziet weet ik nog niet") and delegated the visual design to the build team within the established design language.

## Decision

### 1. Discover becomes a travel guide ("Reisgids")

- Discover transforms from a candidate list into an editorial overview of the surrounding area: sections such as nearby highlights, food & drink, nature, quiet places, and notable happenings, composed from the existing worldwide place knowledge (ADR-043/046), live-world sources, and the content catalog.
- It works on **any location**, not only the home region — reusing the global regional-cache and source architecture (ADR-023). On a holiday destination it presents that area with the same richness as at home.
- It must **feel different from Now**: Now is one promise for this moment; Discover is a calm magazine-like browse of where you are. Browsing here is intentional (ADR-012) — it remains curated sections with a modest, finite number of cards per section, never an infinite scroll.
- Honesty rules unchanged: place knowledge stays "leads, not guarantees" (ADR-021); no invented facts; evergreen fallback when sources are unavailable; source freshness stays visible where relevant.

### 2. Today becomes a timeline

- Today presents the day's moments as a vertical timeline: time blocks in chronological order with the current-or-next editorial lead preserved (ADR-055), each block anchored to its time window.
- The timeline is editorial, not a calendar: no hour-grid, no scheduling mechanics — it shows the shape of the day as Momentum proposes it.

### 3. Responsive affirmation (ADR-059 extension)

- The affirmation composer gains two inputs: (a) **live feedback** — the user's recent reflections and experience outcomes already captured by the reversible learning model; (b) **self-reported energy** — an optional, on-device check-in (e.g. calm chips: laag / rustig / vol energie) offered lightly on Now, never required, never framed as a measurement.
- Energy may gently influence ranking (lower energy → closer, calmer suggestions) through the existing transparent local engine; all learning stays on-device and reversible (ADR-018/026).
- HealthKit or sensor-inferred energy remains out of scope (unchanged boundary).
- Tone rules from ADR-059 remain hard requirements and now also cover energy-aware phrasing (never judgmental about low energy).

## Scope boundaries

- The four-surface architecture stays: Now / Today / Discover / Life Book keep their identities; this ADR deepens Today and Discover, it does not merge them.
- No feed mechanics anywhere: finite sections, finite cards, no pull-for-more content loops (pull-to-refresh remains a manual refresh gesture only).
- No new external services or accounts; Discover composes from sources already approved (OpenStreetMap, Open-Meteo, AQI, eBird-optional, content catalog, place knowledge).
- Premium Craft rules (ADR-057) apply: serif editorial voice, real image layer, reduced-motion everywhere, no attention-capturing patterns.
- No new dependencies beyond those already approved in ADR-056/057/058.

## Consequences

- DiscoverScreen is substantially redesigned; TodayScreen gains a timeline presentation; the affirmation composer and localIntelligence gain feedback/energy inputs; a lightweight energy check-in joins Now.
- The visual design of the travel guide is delegated to the build team within the design language; the result must pass the Founder's preview review before merge.
- Definition of done: typecheck clean, all tests green (including affirmation tone scenarios extended for energy/feedback phrasing), web export builds, and a plain-language Founder update in the Obsidian log.
