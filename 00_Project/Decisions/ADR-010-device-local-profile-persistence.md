# ADR-010: Persist the explicit trial profile locally

Status: Accepted  
Date: 2026-07-10

## Context

The prototype can adapt its local ranking from an explicitly selected trial profile, equipment availability and optional post-experience reflection. Resetting that learning whenever the app closes prevents the user from seeing whether Momentum can become more personally useful over time.

## Decision

Persist only the explicit trial-profile state on the device:

- selected profile preset;
- declared kettlebell availability;
- bounded affinity adjustments derived from optional reflection;
- the number of locally processed reflections.

Do not persist location, inferred private context, raw activity history or reflection text. Invalid or outdated stored values fall back safely to defaults. Selecting another trial profile resets learned adjustments.

## Consequences

- Web, Android and later iOS sessions can demonstrate continuity without an account or backend.
- The UI must accurately say that the profile is stored locally on the device rather than only for the current session.
- This storage is a product proof, not authorization for a hidden behavioral profile.
- A future privacy control should expose a direct reset before the profile becomes part of an MVP.

## Philosophy alignment

The change makes adaptation visible and useful while keeping data collection minimal, local and under explicit user control.
