import test from 'node:test';
import assert from 'node:assert/strict';
import { byId } from '../src/product/experienceModel';
import { nowInvitation } from '../src/ui/now-v2/nowInvitation';

const now = new Date('2026-09-25T12:00:00Z');
const workout = byId('kettlebell-focus');
const outside = { ...workout, kind: 'outside', presenceMode: 'quiet', routePlan: undefined };
const snapshot = {
  regionLabel: 'Testomgeving', coordinates: { latitude: 53, longitude: 6 },
  retrievedAt: '2026-09-25T11:45:00Z',
  weather: { temperature: 15, windSpeed: 10, weatherCode: 0, observedAt: '2026-09-25T11:30:00Z' },
  sources: [{ id: 'open-meteo', state: 'live' }],
};
const model = (experience = outside, confirmed = true, world = snapshot) =>
  nowInvitation(experience, [], confirmed, world, now);

test('without confirmed location even an available snapshot cannot claim the user is there', () => {
  const view = model(outside, false);
  assert.equal(view.region, 'Jouw moment');
  assert.equal(view.place, 'Omgeving niet gekozen');
  assert.equal(view.weather, undefined);
  assert.doesNotMatch(JSON.stringify(view), /Testomgeving|Dokkum|dichtbij|km van hier/);
});

test('indoor workout never shows weather, a light countdown or a start clock', () => {
  const view = model(workout);
  assert.equal(view.weather, undefined);
  assert.equal(view.cta, 'Bekijk de workout');
  assert.doesNotMatch(JSON.stringify(view), /Start om|MATCH|gouden uur|wind|zon onder/);
  assert.match(view.tiles[0].title, /Ongeveer/);
});

test('missing environment remains a useful invitation', () => {
  const view = model(outside, true, null);
  assert.equal(view.region, 'Jouw moment');
  assert.equal(view.weather, undefined);
  assert.ok(view.promise);
  assert.ok(view.cta);
});

test('current outside weather needs a matching live receipt', () => {
  assert.match(model().weather.text, /droog gemeld/);
  for (const state of ['stale', 'error', 'loading', 'not-configured'])
    assert.equal(model(outside, true, { ...snapshot, sources: [{ id: 'open-meteo', state }] }).weather, undefined);
  assert.equal(model(outside, true, { ...snapshot, sources: [] }).weather, undefined);
});

test('stale, invalid, future and ambiguous weather clocks fail closed', () => {
  for (const retrievedAt of ['2026-09-25T10:00:00Z', '2026-09-25T12:01:00Z', 'invalid'])
    assert.equal(model(outside, true, { ...snapshot, retrievedAt }).weather, undefined);
  for (const observedAt of ['2026-09-25T10:00:00Z', '2026-09-25T12:01:00Z', 'invalid', '2026-09-25T11:30'])
    assert.equal(model(outside, true, { ...snapshot, weather: { ...snapshot.weather, observedAt } }).weather, undefined);
  assert.equal(model(outside, true, { ...snapshot, weather: { ...snapshot.weather, temperature: NaN } }).weather, undefined);
});

test('only explicitly chosen interests receive a personal preference label', () => {
  const view = nowInvitation(workout, ['movement'], false, null, now);
  assert.ok(view.tiles.some((tile) => tile.sub === 'Een door jou gekozen interesse'));
  assert.ok(!model(workout).tiles.some((tile) => tile.sub.includes('gekozen interesse')));
  assert.doesNotMatch(JSON.stringify(view), /vrije tijd|agenda|buffer|gezond|past binnen/);
});

test('cycling handoff receives a guide invitation instead of workout language', () => {
  const view = model({ ...workout, presenceMode: 'handoff' });
  assert.equal(view.cta, 'Bekijk deze ervaring');
  assert.ok(view.weather);
});

test('invitations have no departure clock at any hour', () => {
  for (const hours of [6, 12, 19, 23]) {
    const time = new Date(now); time.setUTCHours(hours);
    const view = nowInvitation(outside, [], false, null, time);
    assert.equal(view.cta, 'Bekijk deze ervaring');
    assert.doesNotMatch(JSON.stringify(view), /Start om|vertrek over|gouden uur|match/);
  }
});
