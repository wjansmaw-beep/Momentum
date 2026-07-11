# ADR-013: Explain compactly and treat “Not now” as situational

Status: Accepted  
Date: 2026-07-11

## Context

The primary opening needs to preserve trust and agency without turning the promise into an algorithm report. The prototype also needs a real decline state rather than forcing acceptance or another suggestion.

## Decision

The primary promise includes a collapsed “Waarom dit nu past” control. When opened, it shows only a small set of non-sensitive reasons and identifies whether each reason is known, explicitly chosen or calculated in the local prototype.

The same surface offers “Niet nu”. Declining removes the current promise and lets Momentum become quiet while leaving the active-intent entrance available. A situational decline does not alter durable preferences or trigger another recommendation automatically.

## Consequences

- Explanation remains secondary to desire and action.
- The prototype clearly states which live sources were not used.
- Rejection does not create a feed or pressure the user to choose again.
- The user can restore the same suggestion if the decline was accidental.

## Sources

- `06_Trust/Trust_Model.md`
- `09_Experience/North_Star_UI.md`
- `03_Understanding/Understanding_Engine.md`
