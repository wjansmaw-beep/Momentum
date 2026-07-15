# ADR-029 — Shared Capsule invitation and local participation

Status: Accepted and first web interaction prototyped  
Date: 2026-07-15

## Decision

Momentum may turn an accepted Experience Promise into a Shared Capsule before Presence. The first complete slice supports:

- choosing `together` or `family` when the experience allows it;
- deciding whether people leave together or meet at the start;
- sharing a versioned invitation link;
- opening that link on another Momentum web client;
- accepting with only a local display name;
- preparing and entering Presence as a guest;
- showing the ready participants on the active device;
- preserving a shared-memory label locally after reflection.

This slice is deliberately account-free. It proves the experience and privacy language before choosing identity or synchronization infrastructure.

## Human moment

Someone sees an experience that would be more meaningful with another person and wants to move from “this might be good” to “shall we do this together?” without copying plans, explaining the activity again, or exposing private context.

## Privacy boundary

The invitation contains only:

- a version and invitation identifier;
- experience identifier, title, promise, and duration;
- host display name;
- intended company;
- selected guide depth;
- the shared meeting choice;
- creation time.

It does not contain ranking reasons, calendar data, health context, location history, inferred needs, profile preferences, reflection history, or live-source payloads. The receiving device resolves the experience from its own approved content and must revalidate any live information independently.

## Truthful state boundary

Without a backend, the host cannot know whether an invitation was accepted elsewhere. The host therefore sees `invited`, not `accepted`. The guest sees local participation on the receiving device. Presence progress, timers, location, readiness, and completion are not synchronized.

The interface must never imply remote agreement or shared progress until a secure session service exists.

## Presence boundary

One device may carry the shared guide while everyone else puts their phone away. The active device shows who is locally part of the experience and retains the reversible guide/phone-away choice from ADR-028. The guide does not require every participant to keep Momentum open.

## Failure behavior

- An invalid or incompatible invitation is not accepted.
- If the experience is unavailable in the receiving version, Momentum explains this instead of substituting an unrelated experience.
- A failed share or clipboard action does not create a false `invited` state.
- Declining the invitation changes no durable preference.

## Deferred production contract

Production synchronization requires a separate decision covering authenticated or guest identity, expiring invitation tokens, revocation, participant consent, conflict handling, data retention, abuse controls, and secure deep links. This ADR does not authorize that infrastructure.

