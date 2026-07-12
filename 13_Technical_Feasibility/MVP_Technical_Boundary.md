# MVP Technical Boundary

Status: Directional engineering recommendation  
Version: 1.0

## Goal

Build the smallest product proof that demonstrates:

> A person can declare an unexpected opening, receive one meaningful proposal, correct it, begin a complete Experience Capsule, and return to life.

The first proof validates the interaction and philosophy before attempting passive context intelligence.

## Development environment decision

Expo Go is optional, not a product constraint. Cursor is not required; it is an editor rather than a build architecture.

Momentum can be developed in this repository with Codex using Expo and React Native. When native iOS capabilities are needed, use an Expo development build and EAS Build:

- EAS can create iOS cloud builds from Windows without local Xcode;
- an installable development build for a physical iPhone requires Apple signing and therefore a paid Apple Developer account;
- native modules, entitlements, config plugins, and iOS app extensions can remain part of the same project;
- a Mac with Xcode is useful for direct native debugging and the iOS Simulator, but it is not required to begin or to trigger EAS iPhone builds.

Official sources:

- [Expo: Create a development build on EAS](https://docs.expo.dev/develop/development-builds/create-a-build/)
- [Expo: iOS app extensions](https://docs.expo.dev/build-reference/app-extensions/)
- [Expo: EAS Build](https://docs.expo.dev/build/introduction/)

## Stage 0 — Visual interaction proof

Environment: Expo / React Native. Expo Go may be used where convenient, but compatibility with Expo Go is not a requirement. Starting directly with a development build is acceptable and becomes preferable once native capability work begins.

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

### Weather and first Living World slice

The Founder lifted the first Living World gate on 2026-07-12. Public weather/light data and optional token-based eBird observations may now be integrated through the approved Live Source Contract and Nature Guard. Missing sources must degrade to evergreen content. Broader events, tides, crowds, openings, and closures remain gated per source.

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

Recommended implementation route:

1. create the Expo/React Native application in this repository;
2. keep the first slice free of unnecessary native dependencies;
3. configure `expo-dev-client` and EAS early enough that Expo Go does not shape the architecture;
4. produce an EAS iOS development build when a physical iPhone and Apple signing are available;
5. add native Apple capabilities one validated adapter at a time.

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
