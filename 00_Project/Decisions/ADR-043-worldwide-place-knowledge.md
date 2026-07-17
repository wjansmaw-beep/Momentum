# ADR-043 — Worldwide Place Knowledge

Status: Accepted and implemented  
Version: 1.0  
Date: 2026-07-17

## Problem

Living World can identify a current opportunity and a public destination, but the guide often reaches the place without explaining what makes the surrounding world meaningful. Static regional packs cannot provide that layer worldwide.

## Decision

Momentum adds a worldwide Place Knowledge layer based on the public MediaWiki API. After explicit location use, it requests nearby Wikipedia pages in Dutch and falls back to English only when no usable Dutch result exists.

Place Knowledge is editorial context, not live evidence. It may deepen Prepare and the on-site guide, but may not prove access, opening, safety, wildlife presence, route feasibility, or current conditions.

## Matching and experience rules

- A place story is attached only when its coordinates are within a bounded distance of the selected destination.
- The original page title, language, URL, retrieval time, and summary stay attached.
- The app visibly credits and links Wikipedia.
- The nearest story is not automatically the reason to travel; a separately accepted Opportunity still supplies the destination and feasibility.
- No story is shown when matching is weak or content is unavailable.

## Privacy and global behavior

The same rounded location already used for Living World is sent only after the user explicitly connects their environment. No profile, calendar, reflection, direction, or identity data is sent. Missing coverage leaves the Experience complete through live evidence, reviewed guidance, and global evergreen fallback.

## Limits

Wikipedia is broad but uneven, community-edited, and not a source for operational claims. Local curator sources, official heritage sources, and other languages require later contracts.

