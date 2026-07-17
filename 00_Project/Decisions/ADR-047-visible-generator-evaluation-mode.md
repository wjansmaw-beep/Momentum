# ADR-047 — Visible Generator Evaluation Mode

Status: Accepted and implemented  
Version: 1.0  
Date: 2026-07-17

## Problem

Momentum can already synthesize contextual candidates, use the local Generator Service fixture, and optionally use a server-side model. The product UI does not make those runtime differences clear enough for the Founder to evaluate progress through the actual experience.

## Decision

`Now` exposes one bounded **Momentmaker** action. It creates one fresh contextual candidate and opens that candidate directly as a complete Experience Capsule. The Founder can therefore inspect Promise, Prepare, Presence, and Memory without searching for the generated item in a candidate list.

The UI distinguishes these runtime states:

- **Demonstration synthesis:** the Generator Service contract is exercised with reviewed fixture content and no paid model;
- **AI synthesis:** a server-side model produced the draft before the existing sanitization, domain validation, composition audit, and ranking boundaries;
- **Local synthesis:** the remote service is absent or unavailable and the device combines approved building blocks;
- **Offline:** the configured development service cannot currently be reached and the local fallback remains active.

## Product boundaries

- Momentmaker is an evaluation control, not an engagement feed.
- One explicit tap creates one candidate.
- The candidate uses one chosen preference domain plus minimal practical moment context.
- The resulting card carries visible provenance.
- Fixture output must never be labelled as AI-generated.
- A generated draft cannot author live facts, route claims, health claims, or private-context inferences.
- The full Capsule quality gate still applies before presentation.

## Privacy

The contextual request contains only a selected domain, day part, available time, company, and explicitly available equipment. It does not include location, agenda content, reflections, memories, goals, or chat history.

## Evaluation purpose

This mode lets the Founder judge whether synthesis improves the real product flow rather than evaluating architecture through documentation alone. Production hosting, API credentials, authentication, distributed rate limits, and model evaluation remain separate gates.

