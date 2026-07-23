// Toon-scenariotests voor de dagelijkse affirmatieregel (ADR-059, punt 1).
// Draait met node --test (zelfde patroon als de generator-testsuite). De
// composer is TypeScript; node (>=22.18) importeert .ts direct via type
// stripping — er is geen extra dependency of build-stap nodig.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { composeDailyAffirmation, neutralAffirmationLine } from '../src/product/affirmation.ts';

const dayParts = ['morning', 'midday', 'afternoon', 'evening'];
const weatherCodes = [0, 1, 2, 3, 45, 48, 51, 55, 61, 65, 71, 75, 80, 82, 85, 95, 99];
const directionSets = [
  [],
  ['meer tijd in de natuur'],
  ['rustiger leven', 'samen eten met het gezin'],
  ['betekenisvol werk', 'bewegen in de buitenlucht', 'aandacht voor vrienden'],
];
const names = ['', 'Wido', 'Anna'];
const dates = [new Date('2026-07-23T08:00:00'), new Date('2026-07-24T19:00:00'), new Date('2026-12-31T12:00:00')];

// Woorden en vormen die nooit in een affirmatie mogen voorkomen: schuld,
// druk, verplichting, te-laat-gevoel, streaks en kwantificering van de persoon.
const forbidden = [
  /nog niet/i,
  /\bmoet\b/i,
  /\bmoeten\b/i,
  /te laat/i,
  /verplicht/i,
  /schuld/i,
  /streak/i,
  /je hebt/i,
  /je bent te/i,
  /op tijd/i,
  /\d/,
];

const scenarioInputs = [];
for (const dayPart of dayParts) {
  for (const weatherCode of weatherCodes) {
    for (const directions of directionSets) {
      for (const firstName of names) {
        for (const date of dates) {
          scenarioInputs.push({
            dayPart,
            firstName,
            directions,
            date,
            weather: { weatherCode, temperature: 12, windSpeed: 14 },
          });
        }
      }
    }
  }
}
// Ook scenario's zónder weer (geen live context gekoppeld).
for (const dayPart of dayParts) {
  for (const directions of directionSets) {
    for (const firstName of names) {
      scenarioInputs.push({ dayPart, firstName, directions, date: dates[0], weather: null });
    }
  }
}

test('elke samengestelde affirmatieregel is toonveilig', () => {
  assert.ok(scenarioInputs.length > 1000, 'de scenariomatrix moet breed genoeg zijn');
  for (const input of scenarioInputs) {
    const { line } = composeDailyAffirmation(input);
    assert.ok(line.length > 0 && line.length <= 220, `regel binnen redelijke lengte: “${line}”`);
    assert.ok(line.endsWith('.'), `regel eindigt rustig: “${line}”`);
    for (const pattern of forbidden) {
      assert.ok(!pattern.test(line), `verboden patroon ${pattern} in regel “${line}” (input ${JSON.stringify(input)})`);
    }
  }
});

test('de composer is deterministisch per dag en context', () => {
  const input = scenarioInputs[0];
  const first = composeDailyAffirmation(input);
  const second = composeDailyAffirmation({ ...input });
  assert.equal(first.line, second.line);
});

test('zonder profiel of live context valt de regel terug op de neutrale variant', () => {
  for (const dayPart of dayParts) {
    const result = composeDailyAffirmation({ dayPart, firstName: '', directions: [], weather: null, date: dates[0] });
    assert.equal(result.line, neutralAffirmationLine);
    assert.equal(result.personalized, false);
  }
});

test('met naam, richting of weer wordt de regel persoonlijk maar nooit metend', () => {
  const result = composeDailyAffirmation({
    dayPart: 'evening', firstName: 'Wido', directions: ['meer tijd in de natuur'], date: dates[0],
    weather: { weatherCode: 0, temperature: 18, windSpeed: 9 },
  });
  assert.equal(result.personalized, true);
  assert.match(result.line, /Wido/);
  for (const pattern of forbidden) assert.ok(!pattern.test(result.line));
});

test('een richting met druk- of prestatieverwoording wordt nooit letterlijk overgenomen', () => {
  const risky = ['ik moet meer sporten', 'nog niet genoeg gelezen', '30 minuten per dag', 'te laat beginnen met rust'];
  for (const direction of risky) {
    const { line } = composeDailyAffirmation({ dayPart: 'morning', firstName: 'Anna', directions: [direction], date: dates[1], weather: null });
    assert.ok(!line.includes(direction), `ruwe richtingstekst niet overgenomen: “${line}”`);
    for (const pattern of forbidden) assert.ok(!pattern.test(line), `verboden patroon via richting: “${line}”`);
  }
});
