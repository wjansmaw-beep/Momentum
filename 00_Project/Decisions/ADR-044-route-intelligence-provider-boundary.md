# ADR-044 — Route Intelligence Provider Boundary

Status: Accepted and implemented  
Version: 1.0  
Date: 2026-07-17

## Problem

The conservative Route Composer protects a time budget without pretending to know path geometry. Momentum needs a future route service, but must not make a public demo endpoint production infrastructure or silently transmit precise coordinates.

## Decision

Momentum introduces a provider-independent Route Intelligence boundary. Candidate selection remains conservative and local. Only after the user explicitly opens the route may an application-owned routing endpoint receive source, destination, and travel mode for a final check.

When no endpoint is configured, Apple Maps remains the truthful fallback and owns actual navigation. When a configured provider reports travel beyond the protected budget, Momentum blocks the handoff and explains that the moment no longer fits.

## Provider contract

The optional endpoint accepts source coordinates, destination coordinates, and walking or cycling mode. It returns a provider label, distance in metres, and duration in minutes. Momentum validates values, uses a timeout, and never accepts generated destination or safety claims from the route response.

## Boundaries

- No public OSRM demonstration server is used as product infrastructure.
- No OSM tile scraping, bulk download, or background route tracking is introduced.
- Route geometry, closures, elevation, terrain, accessibility, driving, and transit remain future contracts.
- A route check is short-lived execution context and is not written to the personal profile.

