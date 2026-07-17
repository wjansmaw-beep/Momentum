# ADR-046 — OpenStreetMap Public Outdoor Anchors

Status: Accepted and implemented  
Version: 1.0  
Date: 2026-07-17

## Problem

The first OpenStreetMap place adapter requires a supported `opening_hours` value. This is appropriate for cafés, libraries, museums, galleries, and community venues, but it excludes many globally useful outdoor discoveries that do not need conventional opening hours.

## Decision

Momentum may treat a bounded set of named OpenStreetMap features as **public outdoor anchor leads**:

- `tourism=viewpoint`;
- `leisure=park`;
- `tourism=artwork`;
- `historic=monument`;
- `historic=memorial`.

An anchor is rejected when OSM marks access as `no`, `private`, or `customers`, or identifies it as indoors. A known closed opening window still blocks the Opportunity.

## Truth boundary

An outdoor anchor may provide a candidate destination because its tag describes a visitable or publicly observable physical feature. It does not prove that the route, entrance, terrain, opening, or current local situation is safe or accessible.

Every resulting Experience therefore:

- names OpenStreetMap as the place-lead source;
- requires suitable current outside conditions;
- keeps the conservative travel, return, and buffer contract;
- tells the person to remain on public routes and obey local signs;
- lets Apple Maps or the configured route provider verify travel;
- remains valuable through the wider place, not a guaranteed access claim.

## Global behavior

The Overpass query uses nodes, ways, and relations within a bounded local radius and derives a center for mapped areas. Outdoor anchors share the same source failure and cache degradation behavior as existing OSM place leads. Missing coverage never removes evergreen Experiences.

## Limits

Nature reserves, beaches, trails, surf locations, swimming water, playgrounds, and other feature classes are not approved by this decision. They require their own access, safety, season, and sensitivity contracts.

