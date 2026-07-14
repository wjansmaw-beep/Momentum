# ADR-028 — Premium Living Guide and direct alternatives

Status: Accepted and first interaction prototyped  
Date: 2026-07-14

## Decision

Momentum advances beyond the bounded MVP into a premium, continuously changing guide to the world around the person. `Now` still renders exactly one Experience Promise at a time and presents the strongest contextual match first. The person may immediately replace it with a small, precomputed set of deliberately different alternatives without opening Discover or entering a feed.

The selected experience grows into richer preparation and a configurable Capsule:

- expectation and meaning before a packing checklist;
- live or editorial depth with visible provenance;
- an explicit choice of company;
- a system share invitation before synchronized accounts exist;
- quiet, guide, or deeper guidance;
- a Presence view that remains easy to consult but can become almost empty with one action.

## Why

One recommendation protects attention, but a single unchangeable recommendation makes Momentum feel narrower than the world it interprets. Immediate alternatives preserve agency and discovery while keeping one visual center. Rich preparation and situated guidance make the result feel like a living personal guide instead of a thin activity card.

## Choice boundary

- Only one promise is visible at a time.
- The first promise is always the best current match.
- Alternatives are prepared before display and should differ meaningfully in experience kind or lens.
- The prototype begins with at most three suggestions for the same Human Moment.
- Reaching the end should lead to active intent or a changed lens, not infinite consumption.
- `Not now` remains situational; `not for me` remains an explicit personal correction.

This refines ADR-012 and ADR-014. It does not authorize a row of cards, an endless carousel, or a recommendation feed on `Now`.

## Sharing boundary

The first implementation uses the operating-system share sheet to send the promise, duration, and intended company. It does not claim shared progress, account synchronization, acceptance state, or private profile exchange. Those require a later identity, deep-link, invitation, and privacy design.

## Presence boundary

Momentum remains consultable during execution, but the person can enter a minimal Presence state and reopen the guide with one action. Quietness never hides safety-critical information, an active timer, or a necessary route handoff.

## Global boundary

This architecture applies to arbitrary locations. A place used in design review is a scenario, never a fixed product region. Local depth comes from source-backed live signals and reviewed content packs; missing coverage falls back honestly to global experiences.
