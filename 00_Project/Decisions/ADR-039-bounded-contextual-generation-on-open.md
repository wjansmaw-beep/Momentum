# ADR-039 — Bounded Contextual Generation on Open

Status: Accepted and implemented  
Version: 1.0  
Date: 2026-07-16

## Human moment

A person opens Momentum without typing a request. The product should still be capable of presenting a fresh possibility, while keeping `Now` centred on one proposal and avoiding invisible profile disclosure.

## Decision

The Generator Service contract gains a second request mode: `contextual-suggestion`.

The device chooses exactly one Experience domain from directions the person explicitly selected during onboarding or in Profile. A contextual request may contain only:

- that one domain;
- day part;
- available minutes;
- chosen company;
- explicitly available kettlebell state;
- contract version and request mode.

It does not contain free-form goals, directions, aspiration text, ranking scores, learning events, reflections, memories, calendar content, location, weather, health, contacts, or other private context. Active Intent remains a separate mode containing the words deliberately entered for the current request.

## Selection and frequency

- The device requests at most one fresh contextual candidate for a day-part signature.
- A valid result is cached locally for six hours and invalidates when the practical signature or chosen domain changes.
- The candidate enters the same Blueprint validation, Guide composition, composition audit, feasibility filtering, personal ranking, and finite-alternative policy as every other candidate.
- Generation never guarantees that it wins `Now` or appears in `Today`.
- `Now` still renders one card at a time; `Today` remains finite.
- If the service is absent or rejected, the existing local synthesis or trusted catalogue remains complete.

## Verified Living World overlay

The model still receives no Living World facts and cannot produce live claims. After generation and only when the person has explicitly enabled global location context, the app may attach a separate, current, source-labelled weather or air-quality overlay to an outside Capsule. This evidence:

- comes only from the existing adapters;
- keeps its own source, retrieval time, expiry, and forecast status;
- is shown as context rather than a guarantee;
- cannot create a destination or route;
- expires independently of the generated Capsule.

Routes and place claims remain the responsibility of verified Opportunity and Route composition, not generative copy.

## Autonomy and screen time

The contextual candidate adds freshness to the existing decision, not another surface or feed. The person can replace it, decline it, correct it, open Discover, or do nothing. No background notification or proactive interruption is authorized by this decision.

## Success signal

The slice succeeds when Momentum can provide a novel but complete candidate on open, explain its origin honestly, preserve the one-card interaction, and continue to work identically when generation or live context is unavailable.
