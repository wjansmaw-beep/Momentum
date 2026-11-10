# ADR-071 — Fresh experience as the main journey

Status: Accepted by the Founder, 2026-11-08
Version: 1.0

The Founder approved the Fresh Concept blueprint, the full interactive prototype,
both appearance modes, and explicitly approved the native build proposal after
being asked whether to replace the old main structure and amend its decisions.

## Product Guardian preflight

Roadmap phases 4–6: translate the reviewed whole journey into the native app.
ADR-067's five-tab first-run shell and ADR-069/070's Guide-only interpretation
conflict with this approved journey. They are amended for the new main entry.
ADR-058's native stack, existing data and specialized runners remain.

## Decision

- Default opening is the new invitation, without mandatory old onboarding.
- Native journey: invitation, preview, contextual guide, optional reflection,
  memories and options. Moddergat is explicitly a reference, not assumed location.
- Light, dark and system choice are persisted centrally, amending ADR-064's
  system-only appearance. The new visual language follows the approved prototype.
- Reuse the single app store and native navigation, preserve old sessions,
  invitations, preferences, memories and specialized runners. No reset or deletion
  is an installation prerequisite. Compatibility functions remain reachable.
- Saving a new reference memory does not infer positive feelings or profile learning.
- Reuse bounded content blocks, verified museum facts, actual audio and map anchor.
  A three-stop walk remains unverified and must not be invented by implementation.
- New model-authored historical Q&A, production hosting, route providers and paid
  services remain separate decisions. Reviewed editorial answers are labelled.
- No automatic external publication is authorized by this design/build approval.

## Verification

Verify fresh entry and existing installs, recovery without overwriting sessions,
appearance override, optional reflection, memory retention, audio interruption,
source visibility and legacy runner access. Typecheck/regressions and exports
support this; physical iPhone behavior must be reported independently.

## Internal iPhone distribution approval - 2026-11-09

The Founder explicitly approved uploading version 0.3.0 to the existing Expo project and building the internal iPhone test version: "Ja bouw de iPhone versie". This authorizes the fresh-concept-preview internal build and installation link. It does not authorize App Store publication or an OTA update to the old preview channel.
