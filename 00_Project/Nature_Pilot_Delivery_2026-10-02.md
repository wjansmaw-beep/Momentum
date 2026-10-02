# Personal nature pilot delivery

Status: Local verification complete; iOS preview published; iPhone acceptance pending
Version: 1.0
Date: 2026-10-02

## Scope

ADR-071, phases 3/8/9, branch `feat/personal-nature-discoveries`.
Optional local birdwatching/photography interests in Jij, validated additive
profile migration, guarded opportunity composition, a bounded explainable
ranking preference and visible estimated outbound/on-site/return/buffer budget.
No new source, provider, dependency, personal payload or background activity.

Bird copy names the reported species, destination and report calendar date,
without claiming current presence. Photography is a suggested activity at
existing parks/viewpoints, not a new claim about wildlife or lighting.
Old inferred-public bird caches are withheld; missing privacy flags are not
public evidence. Reports older than seven calendar days or future dates fail
closed; the existing two-day API query is unchanged. UTC date-boundary
conservatism may withhold a valid local report, never promote a future date.

Weather uses Open-Meteo `timeformat=unixtime`, keeping `timezone=auto` for day
selection. Seconds become absolute UTC timestamps without adding a local offset.
See [official time-format documentation](https://open-meteo.com/en/docs).
Opportunity expiry uses the earlier observation/retrieval window. Ambiguous,
future or expired weather cannot support an outdoor place proposal.

Routed duration already includes its return buffer; ranking no longer adds
another five minutes when a buffer of at least five minutes is present.
Other experience durations retain their existing extra margin.

## Executed local checks

- Typecheck passed.
- 129 automated tests: 80 generator, 13 tone, 12 Memory storage, 24 experience
  presentation/discovery (9 new nature tests).
- Existing content-catalogue and personal-memory scenario runners passed.
- Final web export passed. Browser: permission-free onboarding, Nu, Jij,
  both interests selected and visually retained after reload; missing bird
  coverage visible and no assumed Dokkum in Jij. Checkbox roles added; native
  screen-reader behavior is not established by the browser accessibility tree.
- EAS preview environment checked: no variables configured. Local dotenv
  loading disabled for exports; no inherited EXPO_PUBLIC values found.

Fictional unit fixtures do not prove real sightings or provider coverage.
No iPhone, real model credentials, eBird token, location permission, VoiceOver
or native dynamic-text test was performed.

## Remaining gates and rollback

Real birds require a secure server-side source boundary and verified public
destination/sensitivity contract. The legacy EXPO_PUBLIC_EBIRD_API_KEY path
still exists but is unconfigured; do not activate it or insert a key.
The full persona-ranking removal, broad profile, wider source catalogue,
photograph relevance and remaining Memory/privacy audit items are not solved.

Existing iOS preview/runtime 0.1.0 is the only intended distribution target.
Rollback candidate: `b8c885d7-afea-44e4-b4f3-0a06e2e3d470` (previous Nu update).
No main merge or public production release.

### Verified preview publication — 2026-10-02

- Code commit: `29467e5aa330024fc11974d69b90979a86cb5c0c`, pushed to own branch.
- iOS export passed; channel/branch `preview`, runtime `0.1.0`.
- Update group: `db8ef9fa-1ec1-4155-9d97-0459c4999222`.
- iOS update: `01a0faee-48ae-7431-898b-6b435eead6a8`.
- Published `2026-10-02T04:45:15.310Z`, confirmed with EAS update:view.
- Existing untracked local audit exports explain the CLI commit asterisk;
  tracked application files were clean at publication.
- Browser deselection also checked: the optional coverage text disappears
  when both interests are removed. This is not native screen-reader proof.

Publication does not prove delivery to or acceptance on the Founder's phone.

## Founder iPhone acceptance

1. Open/reopen online without reinstalling; existing memories must remain.
2. Jij → Mijn richting & voorkeuren: choose both new interests; reopen and
   verify retention, then deselect and verify removal. No permissions requested.
3. Without location: no assumed Dokkum; missing bird coverage is explicit.
4. With voluntarily connected location and sufficient time: if current sources
   offer a park/viewpoint, check specific place, photography activity and
   estimated travel. No promise of sightings or golden-hour light.
5. Open its guide, check source/access cautions and optional Maps handoff;
   actual route/time must be checked in Maps. No forced general timer.
6. Offline/missing-source fallback remains usable; check large text and screen
   reader selection states. Record screen, steps and unexpected result.
