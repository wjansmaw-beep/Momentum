# ADR-049 — Founder Generator Evaluation Bench

Status: Accepted and implemented  
Version: 1.0  
Date: 2026-07-18

## Problem

Controlled generator variety exists, but evaluating it through the ordinary `Now` cycle makes coverage difficult to judge. Changing the real prototype context or personal preferences for every test would also contaminate the product experience being evaluated.

## Decision

Momentum Lab contains a Founder-only Momentmaker evaluation bench. It can explicitly choose:

- one of the seven approved experience kinds;
- available time;
- day part;
- company;
- kettlebell availability when movement is selected.

One test action opens exactly one complete generated Capsule through Promise, Prepare, Presence, and Memory. The bench never renders a candidate grid and does not alter the user's profile, durable preference, calendar context, ordinary `Now` ranking, location permission, or current Living World source state.

## Evaluation coverage

Local prototype evidence records, per experience kind:

- valid generated Capsules shown;
- completed generated Capsules evaluated;
- optional positive quality signals for personal fit, surprise, executability, and useful content.

The absence of a positive signal is not interpreted as a negative preference. These counts support Founder coverage review only and are not production analytics.

## Grounding and validation

The bench uses the same generator request, schema validation, domain guardrails, Guide composition, structural audit, and post-generation Living World enrichment boundaries as ordinary synthesis. It has no privileged path around safety or provenance controls.

## Product boundary

The evaluation bench belongs only in the disclosed Momentum Lab. Consumer surfaces retain one best suggestion at a time, finite direct alternatives, and deliberate Discover for active intent.
