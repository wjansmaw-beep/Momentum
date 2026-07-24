# ADR-066 — Scene-First Form Language: the app is a film, not a filing cabinet

Status: Approved by the Founder on 2026-07-24  
Version: 1.0  
Date: 2026-07-24  
Amends: ADR-065 (UI form hierarchy)

## Context

ADR-065 fixed a UI form hierarchy (living canvas > editorial chapters > cards only for genuine choice > chips). Reviewing it, the Founder asked the harder question: *are cards necessary at all — design the app from a blank sheet, without carrying the current UI into the decision.*

The blank-sheet answer, accepted by the Founder in conversation on 2026-07-24 ("gooi het roer om"): **no — cards are not needed.** Retaining them "for choice moments" was pragmatism toward existing components, not a design conclusion. Momentum succeeds when the phone goes away; the interface should therefore be a sequence of full scenes, never a collection of tiles. This ADR records the scene-first form language and amends the ADR-065 hierarchy accordingly.

## Decision

The design principle: **the app is a film, not a filing cabinet.** Seven scene rules:

1. **Opening = the world, now.** One full living scene: light, weather and season of the user's own place, one sentence that knows them (the affirmation register), and one lead suggestion woven *into* the scene — not a card pasted onto it. It reads like the film poster of the next few hours.

2. **More options = page through scenes, never pick from tiles.** The at-most-five alternatives (the ADR-059 ceiling, unchanged) are five full scenes the user calmly swipes through — each a poster with its own visible "why now". The ceiling is what makes this possible: five scenes are pageable; fifty would not be, which is exactly why the no-feed invariant is load-bearing. Dots and a first-use swipe hint keep the gesture discoverable.

3. **Choosing = a small ritual.** "This is the one" transforms the *same* scene — the light shifts, the Voorpret begins. No form, no new screen type. The moment's imagery remains the continuous thread (as established in ADR-057/058).

4. **The day = one horizon, not tabs.** Today and Discover converge toward a single calm editorial day-line — morning, afternoon, evening — with discoveries placed at their natural moment ("for Saturday: …"). This is the target form; the existing tab navigation remains during transition and is revisited when the horizon lands.

5. **Memories = a photo book.** Full-bleed images, paged like an album — not a list of tiles.

6. **Profile = invisible.** It lives in the small in-context conversation the app has with the user (ADR-065 renewal 2); never a settings form.

7. **Presence = phone away.** Unchanged — the purest expression of the brand.

**What remains of "cards":** only chips (small tactile choice tokens such as company) and plain text lines inside scenes (packing notes, practical details). The card as a container is eliminated from the experience surfaces.

## Constraints and honest costs

- **Discoverability:** gesture-led interfaces ship with visible affordances (dots, a first-use hint); nothing essential hides behind an undiscoverable gesture.
- **Imagery:** scene-first raises the bar for honest, location-true or licensed imagery; the stock-photo removal (ADR-065 renewal 6) becomes more important, not less.
- **Motion:** scene transitions use the approved spring/motion vocabulary with the hard reduced-motion requirement (ADR-057): reduced motion yields calm cross-fades, never sliding posters.
- **Accessibility:** every scene keeps semantic structure and WCAG AA contrast in both appearances (ADR-061/064).
- **Pressure mechanics remain permanently excluded:** scenes never carry counters, urgency, or comparison.
- The option ceiling (max 5), no-feed invariant, capsule content model, and reversible learning are untouched.

## Phasing

The scene-first language applies from Experience Renewal phase 2 onward:

- **Phase 2A** — Now as living canvas: lead suggestion in-scene, alternatives as swipe posters, "why now" chips on every scene (with the ADR-065 phase-2 profile work following as phase 2B).
- The day-horizon (Today + Discover convergence) and the photo-book Life Book land in later phases (3+), each through its own pull request.
- Prepare (Voorpret, shipped in phase 1) already conforms: story scenes, zero cards.

## Consequences

- `NowScreen` is restructured from hero-plus-card-carousel into a full-screen scene with an in-scene lead and a paged poster set; the match loop (PR #17) carries over as looping pagination.
- The bottom navigation persists through the transition; its removal is decided when the day-horizon lands.
- The ADR-065 hierarchy line "cards only where genuine choice happens" is superseded by this decision: choice happens *in* scenes.
- The current application-code boundary extends through ADR-066.
