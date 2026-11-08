# ADR-070 — Complete the Adaptive Guide for iPhone testing

Status: Accepted from Founder instruction, 2026-11-08  
Version: 1.0

## Authorization

The Founder requested an active app goal to finish the combined Momentum brief as far as possible into an iPhone-testable app. This extends ADR-069 beyond its first slice. Clear implementation decisions may proceed without repeated approval.

## Product Guardian preflight

Advances roadmap phases 4–6: experience design, platform feasibility and a complete device-testable vertical slice. The current Guide has modes but lacks interactive orientation, typed editorial chapters, complete reference packs and playable audio. A browser export does not establish iPhone readiness. The existing preview build also points to one private LAN server, which cannot be assumed available on the Founder's phone.

Preserve Understanding → Wonder → Momentum → Presence → Memory, existing runners and all five primary surfaces. The earlier concept governs the active Guide. Tasks remain optional; chapter selection and arrival remain explicit. No automatic arrival or background location is introduced.

## Accepted scope and sequence

1. Complete shared Guide presentation and interactive native orientation using the existing map dependency. Keep external route handoff; never invent geometry. Show a usable destination list without map tiles or location permission.
2. Define validated, typed editorial chapters and allowed blocks, adapting existing steps through the same Guide and session store. Add reviewed Moddergat and a materially different nature reference pack, with claim sources and truthful imagery provenance.
3. Add real, explicitly started listening with transcript, interruption handling and honest unavailable/error states. Choose a bounded implementation compatible with Expo; do not add paid audio services automatically.
4. Preserve source expiry, current generation validation, privacy and local fallbacks. Contextual questions must remain evidence-bound; no fabricated historical answers or unrestricted UI generation.
5. Validate existing functions, native bundling, accessibility, safe areas, persistence and failure states. Prepare an iPhone install/open path and a concrete device test checklist. Device-only checks remain unverified until run on a device.

## Distribution and boundaries

Use the existing Expo project and bundle identifier. Prepare an isolated internal preview without the developer's fixed LAN endpoint. Cloud signing, installation and account-specific actions depend on available credentials and device registration. Do not activate paid services, publish to the public App Store or change account security as an inferred implementation detail. The other dirty local Momentum workspace remains untouched.

## Evidence of completion

### Listening implementation decision — 2026-11-08

Use Expo Audio 56 with a directly declared SDK-compatible Expo Asset peer. Playback uses locally bundled WAV narrations of the five reviewed reference stories, synthesized offline in Dutch and clearly identified as a computer voice. This provides actual play/pause, elapsed time, duration, relative seeking and transcript without a paid service. No recording, microphone access, background playback or lock-screen control is enabled. Mode/chapter departure releases the player; app inactivity and navigation blur pause it, with explicit user resumption. Public voice licensing/quality and physical-device interruption behavior remain release checks.

The first dependency resolution selected Expo Asset 58 through a wildcard audio peer, which failed native bundling. Explicitly declaring the SDK 56 asset version resolved the mismatch. Both iOS and web export then passed. Twelve guide/content/audio-asset tests and typecheck pass; they do not prove acoustic quality or native playback.

### Distribution evidence — 2026-11-08

The Expo CLI is authenticated as the existing project owner. Read-only EAS history returned completed physical-iPhone builds, including preview `d1fb26fd-8e5f-4f8c-a2e1-590d33b6a264` from 2026-10-25, app version 0.1.1. These builds predate this work. Existing signing/device registration should be inspected/reused before asking the Founder to repeat setup. No new build or OTA update has been submitted yet. Adding native audio requires a fresh binary; do not publish its JavaScript over an older incompatible runtime.

Completion requires a working, accessible end-to-end reference journey plus preservation checks, a second pack proving renderer reuse, real audio verification or an explicit unresolved limitation, and an iPhone-testable artifact with install instructions. Automated checks and web previews are supporting evidence, not proof of native device behavior.
