# Private places pilot — qualification stage

Status: local request boundary only; not a deployed or secured service.
Governance: ADR-072. EUR 0 ceiling. No new app endpoint configured.

Run `node --test services/places/test/*.test.mjs`.

The module constructs a fixed Geoapify request. It intentionally does not fetch,
log, expose an HTTP endpoint or accept a user profile. It has **no** deployed
authentication, persistent quotas or response/access validation yet. Never
wire it to the app or publish it as an unprotected proxy.

Next gate: provision a provider key outside chat/repository and execute one
public-reference request. Inspect the actual source/category/access fields,
record a redacted schema report, reject reserve/indoor/private/closed leads.
If the response cannot prove the required classification, stop; do not infer
access from a nice name or parent category. Any needed detail request counts
toward the same global thirty-attempt limit and needs its cost verified first.

Only after that evidence: Worker auth + atomic D1 counters + bounded responses,
privacy/retention checks, then native Keychain access and explicit consent.
Account creation/terms and secret provisioning are Founder handoff steps.

Protocol documentation checked 2026-10-02:
https://apidocs.geoapify.com/docs/places/
POST uses a fixed URL, x-api-key header, category list and a circle filter.
No provider calls were made by the unit tests. Fixture keys are deliberately fake.
