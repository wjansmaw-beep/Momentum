# ADR-030 — Layered guide, source freshness, and local readiness

Status: Accepted and first interaction prototyped  
Date: 2026-07-15

## Decision

Every active Experience Capsule keeps one explicitly consultable guide. The selected depth changes what is offered, not whether the person can recover essential guidance:

- **quiet:** the current instruction only;
- **guide:** the current instruction, one useful insight, and current sourced world context;
- **deep:** the guide layer plus further source-grounded insights and practical background.

The guide is reversible from Presence and from the phone-away state. It never becomes a content feed and remains subordinate to the real experience.

Live evidence is classified against its own expiry. Expired evidence is not shown as current. When no current source is available, Momentum names the editorial or evergreen basis instead of simulating local live coverage. This makes the same Capsule architecture honest and useful globally while local depth varies by source coverage.

Shared preparation adds three optional, local checks: timing, pace, and practical clarity. They do not block starting and are not transmitted or represented as remote agreement.

## Why

Premium guidance needs depth without forcing screen time. A person may want silence now and still need one fact, route, or instruction later. Source freshness protects trust, while an explicit evergreen fallback prevents arbitrary locations from feeling broken. Local readiness helps people coordinate without violating the account-free truth boundary from ADR-029.

## Boundaries

- This decision does not authorize generated factual claims, new source adapters, accounts, or remote synchronization.
- Muted insight topics remain muted in the consultable guide.
- Safety-critical route or timer information may not be hidden by a guide-depth preference.
- A stale or expired observation may be retained for provenance but cannot be phrased as current.
- Shared readiness is device-local until a later secure session contract exists.

## Implementation shape

Guide composition and evidence freshness are pure product logic outside the main application surface. The visual panel consumes that model. This separation lets later native, wearable, audio, and Live Activity surfaces use the same truth contract without copying presentation logic.
