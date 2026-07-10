# ADR-008 — Progressive Foreground Location Handoff

Status: Accepted for capability proof  
Date: 2026-07-10

## Decision

The wonder capsule may ask for one-time foreground location only after the user has accepted the experience and reached preparation.

Before the operating-system prompt, Momentum explains the immediate value:

> Use a global location once to let Apple Maps search for nearby green space.

The user can continue without sharing location. Denial or failure does not block the experience.

## Data handling

- Only foreground permission is requested.
- Background location and Android foreground location services are disabled.
- Android precise location is removed from the generated manifest; coarse location remains.
- Coordinates are rounded to two decimal places before use, approximately kilometre-level for this proof.
- Coordinates remain in component memory and are not persisted, logged, synchronized, or sent by Momentum.
- Opening the explicit Apple Maps link transfers the rounded search location to Apple only after the user taps the handoff action.

## Experience behavior

The handoff searches Apple Maps for a park or green space near the rounded location. Momentum then enters its quiet observation capsule and waits for the user to return.

This is a capability proof, not a verified Hidden Gem recommendation. Momentum does not claim that a particular place is open, safe, special, or currently suitable.

## Platform boundary

- The implementation uses `expo-location` foreground permission and React Native `Linking`.
- A development build is the preferred real-device test environment.
- Apple Maps map links are regular HTTP links that open Maps on supported Apple platforms.
- Expo's generated iOS metadata may contain standard location description keys, but the app does not request background permission and background location modes are disabled.

## Next validation

Test permission grant, denial, revocation, unavailable location, map handoff, and return behavior on a physical iPhone before treating this as MVP-ready.
