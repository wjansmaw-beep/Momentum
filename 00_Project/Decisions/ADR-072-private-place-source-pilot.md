# ADR-072 — Private online place-source pilot

Status: Accepted for staged implementation; activation gates open
Version: 1.0
Date: 2026-10-02

## Founder approval

The Founder explicitly approved the proposed Geoapify / Cloudflare private
pilot with a EUR 0 ceiling, no paid upgrade and a stop when payment is required.
This extends ADR-071 only for the bounded source service below, not the public
generator or a general production release. Phases 3/8/9, Product Guardian first.

## Scope and sequence

1. Qualify real Geoapify place responses using public reference regions and a
   securely configured key. Missing access/category evidence is a stop gate.
2. Only after qualification: a Cloudflare Worker with restricted Founder access,
   server secrets and D1-backed atomic counters; free plans only.
3. Explicitly consented coarse-region request; local personal ranking remains
   on device. No profile, health, agenda, photos, reflection or free text payload.
4. One park/viewpoint photography experience through the existing invitation,
   preparation, guide, Maps and optional memory flow. No invented live claims.
5. Native acceptance on the Founder phone before any broader test distribution.

Maximum radius 4.5 km, twenty returned place candidates, thirty provider
attempts/day globally, counted before dispatch including errors, no automatic
retry. Counters must survive concurrency/restarts and fail closed on errors.
No reserve/trail/beach expansion, eBird activation, route provider or model calls.
Provider class labels alone are not proof of public access; reserve subtypes
under park are excluded. Source receipt, retrieval time and expiry remain distinct
from actual observation/update time; cache never renews original evidence.

## Security, costs and acceptance

Own revocable device credential, never the fixed client-identification header.
No provider/device secrets bundled in app, Git, EXPO_PUBLIC config or logs.
Keychain storage may require an Expo-compatible native module and new build;
inspect compatibility and existing build entitlements before adding it.
HTTPS, fixed upstream host, bounded payload/response, no arbitrary URL forwarding.
No raw location/credential request logs; temporary source storage at most two
hours in active storage. Provider metadata/backup retention must be checked
before activation; no blanket EU-only or anonymity promise.

The EUR 0 ceiling is not an existing enforcement guarantee. Verify free account
plans and own fail-closed caps before deployment. Founder accepts account terms
and enters secrets securely; no credential in chat. No automatic upgrade.
Freeze activation if provider evidence, privacy terms or free tier cannot meet
the requirements. Tests with invented fixtures are not live-source proof.

Current status: decision recorded; local request contract/probe preparation only.
No accounts, paid services, deployment, new app build or source key configured.
