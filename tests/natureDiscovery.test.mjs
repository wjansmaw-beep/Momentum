import test from 'node:test';
import assert from 'node:assert/strict';
import { hydratePersonalProfile, defaultPersonalProfile } from '../src/profile/personalModel';
import { composeLivingWorldOpportunities, opportunityToExperience } from '../src/liveworld/opportunityEngine';
import { unixSecondsToIso, isCurrentInstant, recentBirdDate } from '../src/liveworld/sourceTime';
import { rankForMoment } from '../src/product/localIntelligence';
import { nowInvitation } from '../src/ui/now-v2/nowInvitation';

// Entirely fictional fixtures. No real sightings, coordinates or provider calls.
const context = { availableMinutes: 60, company: 'solo', dayPart: 'midday', profile: 'balanced', hasKettlebell: false };
const options = { maxTravelMinutes: 20, bike: false };
const world = () => ({
  regionLabel: 'Fictieve testregio', coordinates: { latitude: 0, longitude: 0 }, retrievedAt: new Date(Date.now() - 60000).toISOString(),
  weather: { observedAt: new Date(Date.now() - 60000).toISOString(), temperature: 15, windSpeed: 5, visibilityMeters: 10000, weatherCode: 0 },
  sources: ['ebird', 'open-meteo', 'openstreetmap-places'].map((id) => ({ id, state: 'live' })),
  placeKnowledge: [],
  birdObservations: [{ commonName: 'Testvogel', scientificName: 'Test species', observedAt: new Date(Date.now() - 86400000).toISOString(), latitude: 0, longitude: .001, locationId: 'Lfixture', locationName: 'Fictieve vogelplek', publicLocation: true, publicLocationBasis: 'explicit-source-flag' }],
  nearbyPlaces: [{ id: 'fixture', name: 'Fictief park', kind: 'park', latitude: 0, longitude: .001, openingState: 'unknown', accessBasis: 'public-outdoor-lead', openingNote: 'toegang te controleren' }],
});
const compose = (snapshot = world(), interests = [], moment = context) => composeLivingWorldOpportunities(snapshot, moment, { ...options, natureInterests: interests });

test('old profiles migrate without inferred interests; invalid values are removed', () => {
  assert.deepEqual(defaultPersonalProfile().natureInterests, []);
  assert.deepEqual(hydratePersonalProfile({ preferredKinds: ['outside'] }).natureInterests, []);
  assert.deepEqual(hydratePersonalProfile({ natureInterests: ['birds', 'birds', 'health', null, 'nature-photo'] }).natureInterests, ['birds', 'nature-photo']);
  assert.deepEqual(hydratePersonalProfile({ natureInterests: 'birds' }).natureInterests, []);
  assert.deepEqual(hydratePersonalProfile({ natureInterests: [] }).natureInterests, []);
});

test('photography choice creates concrete place guidance and can be removed', () => {
  const photo = compose(world(), ['nature-photo']).ready.find((item) => item.kind === 'open-place');
  assert.equal(photo.title, 'Fotografeer Fictief park');
  assert.match(photo.wonder, /OpenStreetMap/);
  assert.match(photo.route.arrivalPlan.instruction, /ruim beeld.*detail/);
  assert.doesNotMatch(JSON.stringify(photo), /gouden uur|libelle|gegarandeerd/);
  assert.equal(compose().ready.find((item) => item.kind === 'open-place').title, 'Ontdek Fictief park');
  const indoor = world(); indoor.nearbyPlaces[0] = { ...indoor.nearbyPlaces[0], kind: 'museum', openingState: 'open', accessBasis: 'opening-hours' };
  assert.equal(compose(indoor, ['nature-photo']).ready.find((item) => item.kind === 'open-place').natureTopics, undefined);
});

test('bird invitation names species, place, report date and uncertainty', () => {
  const bird = compose().ready.find((item) => item.kind === 'recent-nature');
  assert.equal(bird.title, 'Vogels kijken bij Fictieve vogelplek');
  assert.match(bird.wonder, /eBird.*Testvogel.*Fictieve vogelplek.*\d{4}-\d{2}-\d{2}/);
  assert.match(bird.wonder, /alweer weg/);
});

test('old cache/public inference, missing source, stale and future reports never become bird proposals', () => {
  for (const mutate of [
    (s) => { delete s.birdObservations[0].publicLocationBasis; },
    (s) => { s.birdObservations[0].publicLocation = false; },
    (s) => { s.sources[0].state = 'error'; },
    (s) => { s.birdObservations[0].observedAt = '2000-01-01'; },
    (s) => { s.birdObservations[0].observedAt = '2999-01-01'; },
    (s) => { s.birdObservations[0].observedAt = 'invalid'; },
  ]) { const s = world(); mutate(s); assert.equal(compose(s, ['birds']).ready.some((item) => item.kind === 'recent-nature'), false); }
});

test('missing, ambiguous, stale, future or unsuitable weather withholds outdoor place', () => {
  for (const mutate of [
    (s) => { delete s.weather; },
    (s) => { s.sources[1].state = 'error'; },
    (s) => { s.weather.observedAt = '2026-10-01T12:00'; },
    (s) => { s.weather.observedAt = new Date(Date.now() - 3 * 3600000).toISOString(); },
    (s) => { s.weather.observedAt = new Date(Date.now() + 3600000).toISOString(); },
    (s) => { s.weather.windSpeed = 80; },
    (s) => { s.sources[2].state = 'stale'; },
  ]) { const s = world(); mutate(s); assert.equal(compose(s, ['nature-photo']).ready.some((item) => item.kind === 'open-place'), false); }
});

test('future/expired snapshots, insufficient time and invalid coordinates are withheld', () => {
  for (const delta of [-3 * 3600000, 3600000]) { const s = world(); s.retrievedAt = new Date(Date.now() + delta).toISOString(); assert.equal(compose(s).ready.length, 0); }
  assert.equal(compose(world(), ['birds', 'nature-photo'], { ...context, availableMinutes: 15 }).ready.length, 0);
  const s = world(); s.coordinates.latitude = NaN; assert.equal(compose(s).ready.length, 0);
});

test('explicit preference changes ranking, but never overrides blocked IDs or time budget', () => {
  const bird = opportunityToExperience(compose().ready.find((item) => item.kind === 'recent-nature'));
  const neutral = { ...bird, id: 'a-neutral', natureTopics: undefined };
  const learning = { ...defaultPersonalProfile(), directionTerms: [] };
  assert.equal(rankForMoment(context, '', [], [neutral, bird], learning).selected.experience.id, neutral.id);
  const preferred = { ...learning, natureInterests: ['birds'] };
  const decision = rankForMoment(context, '', [], [neutral, bird], preferred);
  assert.equal(decision.selected.experience.id, bird.id);
  assert.match(decision.selected.reasons[0].text, /Vogels kijken/);
  assert.equal(rankForMoment(context, '', [], [bird], { ...preferred, blockedExperienceIds: [bird.id] }).selected, undefined);
  assert.equal(rankForMoment({ ...context, availableMinutes: bird.duration - 1 }, '', [], [bird], preferred).selected, undefined);
});

test('route budget appears as an estimate, not verified travel; buffer is not counted twice', () => {
  const s = world(); const experience = opportunityToExperience(compose(s, ['nature-photo']).ready.find((item) => item.kind === 'open-place'));
  const route = experience.routePlan;
  assert.equal(experience.duration, route.outboundMinutes + route.experienceMinutes + route.returnMinutes + route.bufferMinutes);
  assert.ok(experience.duration <= context.availableMinutes);
  assert.ok(rankForMoment(context, '', [], [experience]).selected);
  const view = nowInvitation(experience, [], true, s, new Date(), ['nature-photo']);
  assert.match(view.tiles[1].sub, /Schatting, geen routecheck.*terug.*buffer/);
  assert.equal(view.tiles[2].title, 'Natuurfotografie');
});

test('Unix source instants survive timezone offsets and DST without rewriting cache age', () => {
  const iso = '2026-10-25T01:30:00.000Z';
  assert.equal(unixSecondsToIso(Date.parse(iso) / 1000), iso);
  assert.equal(Date.parse(iso), Date.parse('2026-10-25T02:30:00+01:00'));
  for (const bad of [null, undefined, '2026-10-01T12:00', NaN, Infinity, -1]) assert.equal(unixSecondsToIso(bad), '');
  const now = Date.parse('2026-10-25T02:00:00Z');
  assert.equal(isCurrentInstant(iso, now), true);
  assert.equal(isCurrentInstant(iso, now + 3 * 3600000), false);
  assert.equal(isCurrentInstant('2026-10-25T01:30', now), false);
  assert.equal(recentBirdDate('2026-02-30 12:00', now), undefined);
});
