# ADR-068 — Living World Mode: APIs for Facts, AI for Meaning

Status: Approved by the Founder on 2026-09-02  
Version: 1.0  
Date: 2026-09-02

## Context

The live-world snapshot already powers Nu with real, sourced facts — weather, sun times, air quality, water, bird sightings, and nearby places — each carrying a receipt that names its source and its measurement moment. Voorpret (the anticipation screen) did not share in that: its copy was derived entirely from the experience model and the schedule, so the screen could say "a lovely evening walk" while unable to say anything true about *this* evening.

The Founder's directive: Voorpret should speak with real facts. The design principle that governs how is sharp — **APIs deliver facts, AI delivers meaning, never the other way around.** A language model that invents a temperature or a bird sighting would break the honesty the receipt system was built to protect; a language model that explains why tonight's actual conditions matter for this walk is exactly the meaning layer the product wants.

## Decision

- A new, deliberately narrow route `POST /v1/living-world-briefing` on the existing generator service produces a **briefing**: 2–4 editorial sentences that connect the real facts of the moment to the experience ahead. The route has its own contract version `living-world-briefing-v1`; the `experience-draft-v1` contract and every existing route remain byte-for-byte untouched.
- **Scope is outside experiences only.** Other kinds keep their existing Voorpret content unchanged.
- **The payload is bounded by receipts.** The client sends only facts already present in its live-world snapshot, each with the name of the source receipt that measured it. A fact without a live receipt never enters the payload — a fact whose source cannot be shown is not a fact the product may use. At most 8 facts per request.
- **Citation is mandatory, on both sides.** Every briefing sentence must reference at least one fact by id. The server validates the request (kind must be `outside`; facts without a source are dropped; fewer than 2 facts rejects the request) and validates the response (2–4 sentences, at most 220 characters each, every sentence citing at least one known fact id, no blocked claims such as medical or guaranteed-outcome language). The client applies the identical gate again after the network. A sentence citing an invented fact is dropped; when fewer than 2 valid sentences remain, the whole briefing is unavailable.
- **Honest degradation is the design, not an accident.** The fixture provider quotes the facts verbatim, each with its own citation — the most honest fallback there is, and the floor below which the product never sinks. The Moonshot provider receives a dedicated instruction: use only the given facts, cite every sentence, when in doubt leave it out, connect the facts to the moment but never predict them.
- **Access is identical to the draft route (ADR-063).** Browser calls are governed by the Origin allowlist; the native app sends `X-Momentum-Client: native`. The same rate limit, daily call limit, and budget ceiling apply; on budget exhaustion the route falls back to the fixture provider exactly as the draft route does.
- **The client caches for 15 minutes** per combination of experience, day part, and fact signature — the facts themselves change slowly, and repeated identical prompts are waste, not freshness.
- **The UI has three honest states.** The "Waarom nu echt" card on Voorpret shows a loading line while facts are gathered; when live, 2–4 sentences with a deduplicated source line and a footnote stating whether the wording came from the model or from the fixture; when anything fails — no location, no receipts, no server, an invalid answer — the card is simply absent and Voorpret shows its existing content. No skeleton that pretends to be content, no error theater.
- Surfacing the briefing through Siri / App Intents is a **later step**, explicitly not part of this decision.

## Scope boundaries

- Outside experiences only; food, culture, and all other kinds are untouched.
- No new data sources, no new provider, no secrets in the app or the repository; the provider key stays server-only.
- The payload carries the experience's id, kind, title, promise, duration and distance, the sourced facts, and the day part — nothing personal about the user beyond what the screen itself already shows.
- The `experience-draft-v1` contract, the Nu-vers-kaarten feature, and all existing generator behavior are unchanged.
- Public deployment, authentication, and TLS remain governed by the existing release blocker (ADR-063); this decision does not weaken it.

## Consequences

- Server: new `services/generator/briefing.mjs` (contract version, request validation, sentence validation), `buildBriefingPrompt` in `prompt.mjs`, `generateBriefing` on the fixture and Moonshot providers, and the route in `server.mjs` ahead of the draft handler. Nine new contract tests pin validation and the full path with real HTTP against the fixture provider — no API key or spending involved.
- Client: `src/liveworld/briefingFacts.ts` holds the pure core (fact building from the snapshot, the response gate) with no React Native or network imports, so it is deterministically testable; `src/liveworld/livingWorldBriefing.ts` is the async loader (cache, request, timeout, silent fallback); `PrepareScreen.tsx` renders the three-state card.
- Verification boundary of this change set: typecheck clean; 73 generator-service tests, 73 + 13 app tests, and 3 briefing scenario tests green; web-export screenshots of the loading, live, and fallback states.
- Later steps, each requiring their own decision: Siri / App Intents surfacing, briefing support for non-outside kinds, and a live model run on the Founder's device as evidence beyond the fixture path.
