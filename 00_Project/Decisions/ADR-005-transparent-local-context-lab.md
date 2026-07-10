# ADR-005 — Transparent Local Context Lab

Status: Accepted for prototype validation  
Date: 2026-07-10

## Decision

The prototype includes an optional local context lab behind the “Local moment” control. It lets the Founder change a clearly labelled trial profile and equipment availability without adding questions to the primary experience flow.

## Purpose

The lab demonstrates that the same time window and “choose for me” intent can produce different ranked outcomes as permitted context changes. It also makes hidden prototype assumptions inspectable and correctable.

Available trial profiles are:

- Explorer;
- Mover;
- Connector.

The equipment control indicates whether a kettlebell is available in the work scenario.

## Validated behavior

With one hour and “choose for me”:

- Explorer selects the wonder candidate;
- Mover selects the kettlebell candidate when equipment is available;
- Connector selects the conversation candidate.

Removing the kettlebell makes the engine filter that candidate before ranking.

## Boundaries

- This is a prototype inspection tool, not final onboarding or profile design.
- Values are manual, local, and temporary.
- No private Apple, calendar, health, location, or communication data is accessed.
- The primary flow remains time plus at most one desired-outcome question.
