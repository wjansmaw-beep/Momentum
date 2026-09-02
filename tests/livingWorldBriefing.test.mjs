// Scenariotests voor de Levende Wereld-briefing op Voorpret (ADR-068).
// Draait via tsx --test (zelfde patroon als de nowModel-tests): de client-
// modules zijn TypeScript met extensionless imports, tsx dekt dat.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { briefingCacheKey, briefingSourceLine, buildBriefingFacts, sanitizeBriefingResponse } from '../src/liveworld/briefingFacts.ts';

const snapshot = (overrides = {}) => ({
  regionLabel: 'Dokkum',
  coordinates: { latitude: 53.32, longitude: 5.98 },
  retrievedAt: '2026-07-26T20:00:00.000Z',
  weather: {
    temperature: 17.2,
    windSpeed: 8,
    visibilityMeters: 20000,
    weatherCode: 2,
    sunrise: '2026-07-26T05:43:00',
    sunset: '2026-07-26T21:41:00',
    observedAt: '2026-07-26T20:45:00',
  },
  birdObservations: [
    { commonName: 'Fuut', scientificName: 'Podiceps cristatus', observedAt: '2026-07-26T18:10:00', latitude: 53.3, longitude: 5.9, locationName: 'Het Zandmeer', locationId: 'L1', publicLocation: true },
  ],
  nearbyPlaces: [
    { id: 'p1', name: 'Park De Singel', kind: 'park', latitude: 53.32, longitude: 5.99, openingState: 'open', openingNote: 'altijd toegankelijk', accessBasis: 'public-outdoor-lead' },
  ],
  placeKnowledge: [],
  sources: [
    { id: 'open-meteo', name: 'Open-Meteo', state: 'live', detail: 'Weer, zicht en licht opgehaald', url: 'https://open-meteo.com/' },
    { id: 'ebird', name: 'eBird', state: 'live', detail: '12 recente openbare meldingen beoordeeld', url: 'https://ebird.org/' },
    { id: 'openstreetmap-places', name: 'OpenStreetMap', state: 'live', detail: '3 plekken beoordeeld', url: 'https://www.openstreetmap.org/copyright' },
  ],
  ...overrides,
});

test('buildBriefingFacts bouwt feiten met receipt-bron en meetdetail', () => {
  const facts = buildBriefingFacts(snapshot());
  const weer = facts.find((fact) => fact.id === 'weer');
  assert.ok(weer);
  assert.match(weer.text, /17° en droog/);
  assert.equal(weer.source, 'Open-Meteo');
  assert.match(weer.sourceDetail, /20:45/);
  assert.ok(facts.some((fact) => fact.id === 'zon' && /21:41/.test(fact.text)));
  assert.ok(facts.some((fact) => fact.id === 'vogel-0' && /Fuut/.test(fact.text)));
  assert.ok(facts.some((fact) => fact.id === 'plek-0' && /nu open/.test(fact.text)));
});

test('buildBriefingFacts laat feiten zonder live receipt eerlijk weg', () => {
  const facts = buildBriefingFacts(snapshot({
    sources: [{ id: 'open-meteo', name: 'Open-Meteo', state: 'error', detail: 'Bron niet bereikbaar', url: 'https://open-meteo.com/' }],
  }));
  assert.equal(facts.length, 0);
});

test('sanitizeBriefingResponse eist citatie naar bestaande feiten', () => {
  const facts = buildBriefingFacts(snapshot());
  const ok = sanitizeBriefingResponse({
    sentences: [
      { text: 'Droog en rustig — goed weer om er even tussenuit te zijn.', factIds: ['weer'] },
      { text: 'De zon blijft lang: onder pas om 21:41.', factIds: ['zon'] },
      { text: 'Deze zin citeert een verzonnen feit en valt af.', factIds: ['nep'] },
    ],
  }, facts);
  assert.equal(ok.length, 2);
  assert.equal(sanitizeBriefingResponse({ sentences: [{ text: 'Slechts één zin.', factIds: ['weer'] }] }, facts).length, 0);
  assert.equal(sanitizeBriefingResponse('geen object', facts).length, 0);
});

test('briefingCacheKey scheidt Voorpret en elke gids-stap (ADR-068 addendum)', () => {
  const facts = buildBriefingFacts(snapshot());
  const voorpret = briefingCacheKey('wadden-light', 'evening', null, facts);
  const stap0 = briefingCacheKey('wadden-light', 'evening', 0, facts);
  const stap1 = briefingCacheKey('wadden-light', 'evening', 1, facts);
  assert.notEqual(voorpret, stap0);
  assert.notEqual(stap0, stap1);
  assert.equal(stap0, briefingCacheKey('wadden-light', 'evening', 0, facts));
  assert.match(voorpret, /voorpret/);
  assert.match(stap1, /stap-1/);
});

test('briefingSourceLine toont bron en meetdetail van geciteerde feiten, ontdubbeld', () => {
  const facts = buildBriefingFacts(snapshot());
  const line = briefingSourceLine({ text: 'x', factIds: ['weer', 'zon'] }, facts);
  assert.match(line, /Open-Meteo · om 20:45 gemeten/);
  assert.match(line, /uit de actuele weermeting/);
  const dubbel = briefingSourceLine({ text: 'x', factIds: ['weer', 'weer'] }, facts);
  assert.equal((dubbel.match(/Open-Meteo/g) ?? []).length, 1);
});
