# Candidate Quality Gate

Status: Directional, first local implementation approved  
Version: 1.0

## Purpose

Automatic composition is useful only when incomplete output cannot silently reach the person. The Candidate Quality Gate sits after content and guide composition but before ranking on Now, Today, or Discover.

## Pipeline

> Candidate -> guide composition -> quality audit -> accepted or rejected -> ranking -> one Experience Promise

Ranking never repairs a broken candidate. It only compares candidates that have already earned eligibility.

## Rejection checks

A candidate is rejected when it lacks any of the following:

- a non-empty title, Experience Promise, and expectation;
- a positive, finite duration;
- at least one complete Capsule step;
- at least one supported company state;
- a destination name when a route plan exists.

Rejected candidates do not appear as lower-confidence alternatives. The catalogue fallback remains available when dynamic candidates fail.

## Degraded but usable

A candidate may remain eligible with a visible or internal degraded state when:

- live evidence expired and the Capsule can honestly continue with editorial or evergreen fallback;
- no optional guide moment exists but the execution itself is complete.

Degraded never means unsafe. Missing access, safety, or essential execution information requires rejection or a later feasibility rule.

## Personal guidance

Only explicit, reversible feedback changes default guide depth:

- a request for less guidance prefers quiet mode;
- repeated requests for more context may prefer deep mode;
- a muted experience or topic is already excluded from the preparation preview and active guide;
- the person can still select another depth for the current Capsule.

Behavioral inference alone does not silently increase information density.

## Transparency

The local prototype exposes aggregate counts for checked, automatically composed, live-grounded, and rejected candidates. These are operational counts, not analytics and not a score of the person.

## Future generative AI

Any model-generated candidate must pass this gate plus later domain-specific safety, accessibility, licensing, and factual-grounding validators. A fluent candidate receives no special trust.
