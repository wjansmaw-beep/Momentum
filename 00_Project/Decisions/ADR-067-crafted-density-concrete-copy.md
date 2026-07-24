# ADR-067 — Concept v2: crafted density and the concrete-copy doctrine

Status: Approved by the Founder on 2026-07-24  
Version: 1.0  
Date: 2026-07-24  
Amends: ADR-066 (scene-first form language), ADR-061 (affirmation register)

## Context

ADR-066 established the scene-first form language: the app is a film, not a filing cabinet. Its first implementation (phase 2A, branch `scene-first-now`) was reviewed by the Founder on 2026-07-24 and **rejected outright** — the result did not feel premium. A subsequent static concept (v1: full-bleed photography with a few lines of text) was also rejected: the copy read as pseudo-poetry ("afgezaagd") and the interface felt bare ("ik mis nog heel veel in de UI").

The Founder pointed to current premium mobile-UI references (Dribbble, mobile-app-ui). The comparative review found two structural gaps:

1. **Copy.** Premium products let imagery and material carry the emotion, while words carry information — concrete questions, facts and next steps. Momentum's scenes carried the emotion in the *words*, which collapses into mysticism.
2. **Craft.** Premium screens show visible craft: layered materials, frosted panels, charts, rings, badges, segmented controls, avatars, tab bars. The v1 scenes were a photo with three lines — no visible intelligence, no skeleton.

A revised concept (v2: six screens — Nu, Dag, Voorpret, Gids, Boek, Jij — reviewed as images and as an interactive file) was approved by the Founder on 2026-07-24 ("top, dit geeft meer gevoel — verwerk het"). This ADR records concept v2 as the build direction.

## Decision

### 1. The concrete-copy doctrine

**Words carry information; imagery carries emotion.** Every line of interface copy states what *is* or what the user *can do*: facts (wind 3 bft, dry until 23:00), times (golden hour 21:12), distances and durations, and concrete suggestions ("Start om 20:15 — dan loop je het gouden uur mee"). Poetic and mystical phrasing is excluded from UI copy. This amends the application of the affirmation register (ADR-061): personal address remains ("Goedenavond, Wido"), and observations in Boek and Jij remain, but always evidenced and concrete ("je 3e avondwandeling deze maand — gemiddeld een 9"), never lyrical.

### 2. Crafted density

A scene is a composition of crafted components, never a photo with three lines. The approved material vocabulary: full-bleed photography with layered scrims, frosted-glass panels, a match ring, reason tiles with icons, sparkline/bar charts, segmented controls, live badges with pulse, avatars, progress bars, thumbnail strips, and a persistent tab bar. Depth comes from layering, blur, glow and shadow — within the ADR-057 no-attention-capture rule.

### 3. Six-surface structure with a persistent tab bar

The product skeleton is **Nu · Dag · Gids · Boek · Jij**, with Voorpret as a flow state entered from Nu. This amends ADR-066 rule 4 (which targeted tab removal toward a single horizon): the tab bar remains as the premium skeleton; Dag *is* the single editorial day-line, inside that skeleton. ADR-066 rule 6 (profile invisible) is amended: **Jij** is a visible insight surface — "wat Momentum van je weet" (insights, week rhythm, preference chips, humane settings) — never an intake form; per-moment refinement still happens in context (ADR-059/065).

### 4. Visual language

Dark premium stage (near-black) as the primary appearance for experience surfaces, one living green accent (#34c772 family) with restrained glow, display serif (Fraunces) for titles, grotesque (Inter) for UI, large numerals for key figures. WCAG AA contrast required; the light sibling follows ADR-064's automatic appearance.

### 5. Screen inventory (as approved in the v2 concept)

- **Nu** — photographic hero with live badge (countdown to the moment's peak), place + distance, facts row; "Waarom nu" panel with match ring, reason tiles, light sparkline; company segment (Alleen/Samen/Gezin); primary CTA with concrete start time; guide action; small alternatives strip (max-5 ceiling, ADR-059, unchanged).
- **Dag** — weather strip; vertical day-line (past dimmed, free time honoured, now highlighted with action, night quiet); one discovery card for the coming day(s) at its natural moment.
- **Voorpret** — departure countdown with progress; "Zo ga je" (route segments with times); "Neem mee" (concrete packing reasons, e.g. windjack because 14° at return); weather-en-route strip; go CTA.
- **Gids** — route map with progress; next waypoint with distance and why; quiet mode (the guide falls silent on purpose); return-safety (back before the rain); fastest-way-back always present; finish action.
- **Boek** — album page: photo, title, facts; "Momentum merkt" observation (evidenced); three stats; month strip; share action.
- **Jij** — insights (e.g. "jij bent een avondmens"), week-rhythm bars, preference chips, settings in humane language ("Meldingen: alleen als het ertoe doet").

### 6. Boundaries preserved

The option ceiling (5), the no-feed invariant, reversible learning, and the permanent exclusion of pressure mechanics are untouched. The match ring is an **explanation of fit** ("why now", ADR-065) — never a score, ranking, achievement or comparison; it is not tracked over time and never shames. Accounts, Health data and new external sources remain separate Founder decisions.

### 7. Retired

The `scene-first-now` implementation (ADR-066 phase 2A) is rejected and will not be merged; the v1 static concept is superseded by v2.

## Phasing (rebuild plan)

Each phase ships through its own branch and pull request, with typecheck, tests and web export verified, and merges only after explicit Founder approval:

- **R1 — Nu + skeleton.** The v2 Nu surface and the five-tab skeleton (Nu·Dag·Gids·Boek·Jij) replacing the current navigation.
- **R2 — Dag.** The editorial day-line with weather strip and discovery card.
- **R3 — Voorpret.** Countdown, route segments, packing list, weather strip.
- **R4 — Gids.** Underway surface: map, progress, quiet mode, return-safety.
- **R5 — Boek + Jij.** Album page with observations; insight surface with week rhythm.

The concrete-copy doctrine applies to every surface each phase touches.

## Consequences

- Navigation becomes a five-tab persistent skeleton; the ADR-066 tab-removal target is amended.
- The profile gains a visible home (Jij) as insights, not forms.
- All consumer copy is rewritten under the concrete-copy doctrine as surfaces are rebuilt.
- The current application-code boundary extends through ADR-067.
