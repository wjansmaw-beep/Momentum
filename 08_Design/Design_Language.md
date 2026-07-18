# Design Language

Status: Directional, pre-UI  
Version: 1.0

Momentum should feel like an invitation into life, not a destination on a screen: calm, personal, emotionally compelling, useful at a glance, and quiet once action begins.

## Unified visual foundation

Momentum uses one platform-native system type family throughout the product. A single family prevents the interface from feeling assembled from separate concepts; hierarchy is created with weight, scale, spacing, and contrast.

The palette is deliberately restrained and daylight-led: warm parchment around the experience, near-white raised surfaces, deep botanical-charcoal text, and one quiet umber/bronze action accent. Photography owns the strongest color in the product. Dark material is reserved for image overlays, temporary controls, and moments where Presence needs the surroundings to recede; it is not the default application chrome.

Category accents are low-saturation mineral, clay, blue, or mauve hints rather than a persistent green system tint. They may identify the character of an experience, but never compete with the Living Canvas, Experience Promise, or primary action. Light surfaces must remain warm rather than clinical white, and every image transition must preserve readable contrast without dimming photography more than necessary.

Core control, card, hero, and pill radii come from shared tokens. Consumer surfaces, Capsule stages, and the consultable guide must use the same visual grammar. See ADR-051.

## The primary surface: Now

The primary state is not a dashboard, feed, or “Today” overview. It responds to the present context and generally contains:

1. **Living Canvas** — atmospheric imagery, subtle motion, or color that makes the likely experience felt;
2. **Experience Promise** — one specific sentence about what awaits or how the user may feel;
3. **Wonder detail** — a small number of truthful details that create desire;
4. **direct action** — language specific to the experience;
5. **compact feasibility** — time, distance, cost, conditions, or equipment;
6. **Why this fits** — concise and available, but visually secondary;
7. **active-intent entrance** — a subtle way to say what the user has room for now.

The user sees one primary suggestion. Alternatives must not visually compete with it.

## Visual hierarchy: desire, action, trust

The first glance should answer:

1. What might I experience or feel?
2. Can I begin easily?
3. Why is this a reasonable suggestion?

This preserves transparency without leading with algorithmic justification.

## Living Canvas

The canvas expresses the promise; it is not decoration. Motion is slow, optional, and respects reduced-motion settings. Visuals accurately represent the likely experience, text stays accessible, and performance and battery cost are part of design quality.

## Experience Capsule

Accepting a suggestion transforms the promise into a focused capsule instead of an unrelated detail page:

- **prepare:** only what is needed before beginning;
- **begin:** one obvious action;
- **during:** only the current step or essential cue;
- **finish:** a quiet transition back to life;
- **remember:** one optional, lightweight reflection.

Walks may hand off to Maps. Recipes show ingredients and one step at a time. Workouts show one movement or interval. Recovery experiences show a rhythm or timer. Shared philosophy does not require identical layouts.

## Active intent and exploration

“I have time now” opens a small layer, not a large library. Ask only for inputs that change the proposal: available time, desired feeling, company, and essential constraints. Broader exploration may exist for self-direction, but remains finite, contextual, and inspiration-led.

## Day rhythm and navigation

Today is an editorial rhythm, not a planner or productivity timeline. Each opening receives enough photographic space to feel like a possibility, while time remains a quiet orientation above it. The sequence should read as a day unfolding rather than as tasks waiting to be completed.

Primary navigation is a quiet, persistent dock. Selection is communicated close to the icon instead of turning an entire navigation cell into a competing card. It remains easy to reach but visually subordinate to the current experience.

## Feeling language

Activity categories are internal organization, not the primary promise. Interface language begins with outcomes: come to rest, feel strong, begin with energy, be surprised, reconnect, or discover something worth remembering.

Copy is warm, concise, non-commanding, and specific. Avoid exaggerated wellbeing claims, generic AI enthusiasm, guilt, and productivity language.

## Motion, sound, and haptics

Motion communicates continuity: the suggestion expands into the experience and dissolves as the experience begins. Haptics may acknowledge commitment or offer a rare cue. Sound is opt-in. No sensory effect exists only to keep the user engaged.

## Accessibility and inclusion

Dynamic Type, screen readers, contrast, touch targets, and reduced-motion settings are first-class. Color never carries meaning alone. Experience promises account for mobility, sensory, dietary, cost, and social constraints when known and permitted.

## North Star test

Within seconds, the user should understand what awaits, feel a truthful pull toward it, see how easy it is to begin, and remain fully free to choose otherwise.
