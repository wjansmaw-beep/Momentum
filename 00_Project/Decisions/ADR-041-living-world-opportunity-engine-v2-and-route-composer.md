# ADR-041 — Living World Opportunity Engine v2 and Route Composer

Status: Accepted and implemented  
Version: 1.0  
Date: 2026-07-16

## Problem

A current observation or nearby place is not yet a worthwhile, executable experience. Turning a signal directly into a card can create impossible travel plans, expose sensitive nature, overstate source certainty, or leave too little time to return. Momentum needs a deterministic boundary between Living World evidence and the Experience selection system.

## Decision

Momentum introduces a separate Living World Opportunity Engine. It converts a source-owned signal into a candidate Opportunity only when all of the following are true:

- the regional snapshot is current enough to create new Opportunities;
- the destination is public and precise enough for a platform handoff;
- source-specific expiry has not passed;
- sensitivity and access guards permit the proposal;
- a conservative travel estimate stays within the person's chosen travel limit;
- outbound travel, a meaningful experience, return travel, and a return buffer all fit within the available moment.

A raw signal that fails any rule is withheld rather than weakened into an apparently live card. Withheld reasons are visible only in Momentum Lab diagnostics.

## Opportunity contract

An accepted Opportunity contains source-owned evidence, a public destination, a complete Experience promise, transparent selection reasons, a conservative route budget, and sensitivity guards. Only then may it become an Experience Capsule and enter the existing quality gate and ranking engine.

## Route Composer contract

The prototype Route Composer uses straight-line distance with a conservative road factor to estimate whether an Opportunity is feasible. It chooses walking or cycling only from explicit equipment context and distance. Its plan contains separate budgets for outbound travel, time at the experience, return travel, and a protected return buffer.

This estimate is an eligibility guard, not navigation. Apple Maps owns the actual route and travel time. Prepare shows the estimate, source, expiry, and guard. Immediately before handoff, Momentum checks the source window again; an expired Opportunity is blocked and must be refreshed.

## Nature protection

Recent wildlife evidence may guide an experience only to a public source location. Momentum never promises the animal is still present, never directs people to a nest, and frames the landscape as the durable experience. Local restrictions, signs, and permitted paths always override the suggestion.

## Place protection

OpenStreetMap place leads require a conservatively interpreted `open` state. Momentum states that public data can lag and asks the person to verify access before departure. Unknown or closed access is withheld.

## Global and failure behavior

The engine is additive. No location permission, missing adapters, stale snapshots, failed sources, or insufficient coverage remove the complete global evergreen experience system. Momentum never fabricates local depth to fill a coverage gap.

## Current limits

- The route estimate is not a routing API result and must never be presented as one.
- Only existing eBird public observations and OpenStreetMap place leads enter this slice.
- Driving, transit, accessibility routing, closures, terrain, and synchronized return state remain future work.
- Model-authored live Opportunities, destinations, or routes remain prohibited.

