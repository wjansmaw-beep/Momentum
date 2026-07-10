# MVP Technical Boundary

Status: Directional engineering recommendation  
Version: 1.0

## Goal

Build the smallest product proof that demonstrates:

> A person can declare an unexpected opening, receive one meaningful proposal, correct it, begin a complete Experience Capsule, and return to life.

The first proof validates the interaction and philosophy before attempting passive context intelligence.

## Stage 0 — Visual interaction proof

Environment: Expo / React Native, initially compatible with Expo Go where practical.

Use:

- explicit “I have time now” entry;
- time choices;
- one desired-outcome question;
- labelled scenario context;
- one Experience Promise at a time;
- correction and abstention states;
- one or two representative Capsules;
- local state only.

Do not use:

- real calendar, HealthKit, WeatherKit, background location, Live Activities, widgets, App Intents, accounts, backend, or generative AI;
- fake claims that the app observed personal context;
- an infinite candidate library.

Success means the experience is understandable, attractive, correctable, and quieter after commitment.

## Stage 1 — Real-device capability proof

Environment: Expo development build on iPhone.

Add only:

- foreground approximate location after a nearby-experience request;
- Apple Maps handoff for one route-based Capsule;
- a local timer/haptic flow for one non-route Capsule;
- device persistence for explicit preferences and current capsule state;
- real permission denial and revocation states.

Calendar remains optional for this stage. The product should prove value before asking for full read access.

## Stage 2 — Calendar value experiment

Use `expo-calendar` in a development build only after the user has experienced the active-entry value.

Test one narrow promise:

> Let Momentum notice open time without using event meaning.

Engineering and privacy requirements:

- request full calendar access honestly;
- process the minimum interval data needed;
- avoid storing titles, notes, attendees, or locations;
- derive temporary occupied windows locally where feasible;
- show a manual-time fallback when denied;
- verify behavior across permission states and limited/missing data.

This experiment proves calendar value; it does not authorize general life inference.

## Deferred capabilities

### HealthKit

Defer until a visible health/fitness experience justifies the access and App Store eligibility has been reviewed. Start with explicit capacity input.

### WeatherKit and Living World

Defer live claims until source provenance, freshness, attribution, and secure service/native integration are designed. Early prototypes use clearly labelled scenario data.

### Live Activities and widgets

Defer until a Capsule proves that glanceable state reduces screen interaction. They require native extension work and should serve validated behavior.

### App Intents and Foundation Models

Defer until the core active interaction works inside the app. Later, App Intents may offer “I have one hour” from Siri or Shortcuts, while Foundation Models may structure intent or phrase verified promises.

### Passive proactive detection

Defer until initiative preferences, interruption rules, calendar value, and notification behavior are validated. The MVP is user-initiated.

## First implementation recommendation

When the Founder lifts the no-code gate, build one vertical interaction slice:

1. Now surface with one scenario-based Experience Promise.
2. “I have time now.”
3. Select one hour.
4. Choose calm, energy, surprise, connection, challenge, or “choose for me.”
5. Show one corresponding promise from the approved prototype content set.
6. Change direction without repeating the time input.
7. Accept and transform into a Capsule.
8. Complete or exit with one optional reflection.

Recommended first Capsule pair:

- **quiet pause/breathing:** proves minimal Presence and disappearance;
- **bodyweight challenge:** proves timed step guidance without external platform dependency.

This pair tests two different experience forms while remaining truthful without optional permissions.

## Why a route-based experience is not first

A nature or cultural route is emotionally central to Momentum, but its strongest form depends on location, verified live detail, travel calculation, media provenance, and a Maps handoff. Beginning with it would mix product validation with platform and content complexity.

It should become the first real-device capability slice after the permission-light interaction works—not the first coded screen.

## Gate to application code

Application implementation still requires explicit Founder approval under `AGENTS.md`.

Before lifting the gate, confirm:

- the active-entry blueprint is accepted;
- the two first Capsules are accepted;
- the product remains useful without permissions;
- scenario data is visibly distinguished from real context;
- the initial product language is chosen;
- the first visual direction is sufficient to guide implementation without freezing exploration.

