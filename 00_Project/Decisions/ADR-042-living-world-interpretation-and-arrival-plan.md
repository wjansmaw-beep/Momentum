# ADR-042 — Living World Interpretation and Arrival Plan

Status: Accepted and implemented  
Version: 1.0  
Date: 2026-07-16

## Problem

Opportunity Engine v2 establishes whether a current place or observation can responsibly become an Experience candidate. It does not yet make the world feel alive enough: place, weather, visibility, and source context remain separate, route guidance ends at arrival, and the finite alternative set can overrepresent one Experience kind.

## Decision

Opportunity Engine v3 adds three deterministic interpretation layers without adding a new external source:

1. **source composition:** a suitable outdoor place or public wildlife Opportunity may combine its place or observation receipt with still-current Open-Meteo conditions;
2. **arrival planning:** every routed Opportunity receives an on-site pattern describing the anchor, usable time, bounded exploration radius when relevant, and explicit return trigger;
3. **perspective diversity:** the finite current Opportunity set selects the strongest candidate per Experience kind before filling remaining positions by score.

The app still shows one suggestion at a time. Diversity affects only the immediate finite alternatives and never creates a listings feed.

## Source composition rules

- Source facts retain their own label, observed time, retrieval time, expiry, certainty, and ownership.
- The Opportunity expires at the earliest required source window.
- Current conditions may strengthen Wonder but cannot invent a place, path, event, species presence, or access claim.
- Known unsuitable outside conditions withhold an outside Opportunity rather than hiding the constraint.
- Non-outdoor place Opportunities do not inherit environmental claims merely because those signals exist.

## Arrival Plan contract

An Arrival Plan is not a generated route geometry. It is one of three reviewed patterns:

- **open observation:** use a public source location as an anchor, stay on permitted paths, and never pursue wildlife;
- **anchored loop:** begin and end at a verified public destination, choose only accessible paths on site, and turn back by a defined time when no clear loop exists;
- **single place:** focus on one detail, story, taste, meeting, or question and preserve the return budget.

The optional radius is a behavioral boundary around the anchor, not a mapped or guaranteed walking route. Apple Maps continues to own actual navigation to the destination.

## User experience

Prepare shows:

- complete outbound, experience, return, and buffer budget;
- source mix and current-until window;
- access or nature guard;
- the Arrival Plan and return trigger.

Presence turns the Arrival Plan into the on-site guide step. The person can still put the phone away or consult the layered guide.

Momentum Lab exposes aggregate source mix, number of perspectives, accepted candidates, and withheld reasons. These diagnostics do not enter the consumer card.

## Limits and next gates

- No actual loop geometry, closures, terrain, accessibility, driving, or transit routing is created.
- No new source adapter is authorized by this decision.
- Marine context remains separate until a destination-specific coastal applicability rule exists.
- Cultural events, tides, moon, verified opening detail, and area closures require their own source contract and decision.

