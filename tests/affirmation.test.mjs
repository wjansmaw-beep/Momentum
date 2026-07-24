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
// ADR-060: energie- en feedback-varianten horen bij de scenariomatrix.
const energyLevels = [null, 'low', 'steady', 'full'];
const feedbackVariants = [
  null,
  { recentValued: 0 },
  { recentValued: 2 },
  { recentValued: 5, valuedKind: 'outside' },
  { recentValued: 3, valuedKind: 'food' },
  { recentValued: 7, valuedKind: 'restore' },
];
const names = ['', 'Wido', 'Anna'];
const dates = [new Date('2026-07-23T08:00:00'), new Date('2026-07-24T19:00:00'), new Date('2026-12-31T12:00:00')];
// ADR-061, punt 2: plek-ankers uit de gekoppelde live omgeving.
const placeVariants = [null, 'de Waddenkust', 'Ameland', 'het centrum van Groningen'];

// Anker-patronen (ADR-061, punt 2): een persoonlijke regel moet minstens één
// concreet anker bevatten — een benoemd tijdsvenster, een plek of een actie.
const timeAnchor = /ochtend|middag|namiddag|middaguur|avond/i;
const placeAnchor = /buiten|binnen|thuis|natuur|water|\bwad\b|bos|park|stad|buurt|omgeving|rond|dichtbij|waddenkust|ameland|groningen/i;
const actionAnchor = /wandelen|koken|bewegen|leren|lezen|luisteren|ademen|pauze|beginnen|stap|handeling|te doen|samen zijn|cultuur|rust/i;

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
// ADR-061: plek-ankers uit de gekoppelde live omgeving, over alle dagdelen,
// namen en datums — met en zonder weer, met en zonder richting.
for (const dayPart of dayParts) {
  for (const place of placeVariants) {
    for (const firstName of names) {
      for (const date of dates) {
        scenarioInputs.push({ dayPart, firstName, place, directions: ['meer tijd in de natuur'], date, weather: { weatherCode: 0, temperature: 16, windSpeed: 10 } });
        scenarioInputs.push({ dayPart, firstName, place, directions: [], date, weather: null });
      }
    }
  }
}
// ADR-060: energie × feedback over alle dagdelen, namen en datums. Deze matrix
// dekt de toonregels ook voor energiebewuste en feedbackgedragen formuleringen.
for (const dayPart of dayParts) {
  for (const energy of energyLevels) {
    for (const feedback of feedbackVariants) {
      for (const firstName of names) {
        for (const date of dates) {
          scenarioInputs.push({ dayPart, firstName, directions: ['meer tijd in de natuur'], date, weather: null, energy, feedback });
          scenarioInputs.push({ dayPart, firstName, directions: [], date, weather: { weatherCode: 61, temperature: 9, windSpeed: 18 }, energy, feedback });
        }
      }
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

// --- ADR-060: energie en live feedback -------------------------------------

test('lage energie geeft een stillere regel zonder duwtaal', () => {
  for (const dayPart of dayParts) {
    for (const firstName of names) {
      const { line, personalized } = composeDailyAffirmation({
        dayPart, firstName, directions: [], date: dates[0], weather: null, energy: 'low',
      });
      assert.equal(personalized, true);
      // De stille reeks afsluiters voor lage energie.
      const gentle = /rust hoeft niets te verdienen|klein is vandaag meer dan genoeg|zacht kiezen is ook een volwaardige keuze|deze dag draagt jou|niets aan jou te meten/;
      assert.ok(gentle.test(line), `lage energie kiest een stille afsluiter: “${line}”`);
      for (const pattern of forbidden) assert.ok(!pattern.test(line), `verboden patroon bij lage energie: “${line}”`);
    }
  }
});

test('lage energie wordt nooit beoordeeld of als tekort benoemd', () => {
  const blaming = [/weinig energie/i, /geen energie/i, /moe\b/i, /uitgeput/i, /te zwak/i, /kom op/i, /toch maar/i, /gewoon even/i];
  for (const energy of energyLevels) {
    for (const dayPart of dayParts) {
      const { line } = composeDailyAffirmation({ dayPart, firstName: 'Wido', directions: ['meer tijd in de natuur'], date: dates[1], weather: null, energy });
      for (const pattern of blaming) assert.ok(!pattern.test(line), `beoordelend patroon ${pattern} in regel “${line}” (energie ${energy})`);
    }
  }
});

test('zonder energie-check-in blijft de regel exact zoals voorheen', () => {
  const base = { dayPart: 'afternoon', firstName: 'Anna', directions: ['rustiger leven'], date: dates[2], weather: { weatherCode: 0, temperature: 15, windSpeed: 8 } };
  const neutral = composeDailyAffirmation({ ...base, energy: null });
  const steady = composeDailyAffirmation({ ...base, energy: 'steady' });
  assert.equal(neutral.line, steady.line, 'rustig (steady) verandert de regel niet');
});

test('positieve feedback wordt zacht doorweven, nooit verwijtend', () => {
  const blaming = [/je hebt/i, /je deed/i, /gisteren/i, /niet gedaan/i, /gemist/i, /verzuimd/i, /weer eens/i];
  for (const feedback of feedbackVariants) {
    if (!feedback) continue;
    for (const dayPart of dayParts) {
      const { line, personalized } = composeDailyAffirmation({
        dayPart, firstName: '', directions: [], date: dates[0], weather: null, feedback,
      });
      assert.equal(personalized, feedback.recentValued > 0, `feedback zonder positieve bevestiging blijft neutraal (regel: “${line}”)`);
      for (const pattern of blaming) assert.ok(!pattern.test(line), `verwijtend patroon ${pattern} in regel “${line}”`);
      for (const pattern of forbidden) assert.ok(!pattern.test(line), `verboden patroon bij feedback: “${line}”`);
      if (feedback.recentValued > 0 && feedback.valuedKind === 'outside') {
        assert.ok(/buiten zijn/.test(line), `waardevolle vorm herkenbaar in regel: “${line}”`);
      }
    }
  }
});

test('energie en feedback samen blijven binnen de toonregels en lengtegrens', () => {
  for (const energy of energyLevels) {
    for (const feedback of feedbackVariants) {
      const { line } = composeDailyAffirmation({
        dayPart: 'evening', firstName: 'Wido', directions: ['meer tijd in de natuur'],
        date: dates[0], weather: { weatherCode: 71, temperature: -1, windSpeed: 11 }, energy, feedback,
      });
      assert.ok(line.length > 0 && line.length <= 220, `regel binnen redelijke lengte: “${line}” (${line.length})`);
      assert.ok(line.endsWith('.'), `regel eindigt rustig: “${line}”`);
    }
  }
});

// --- ADR-061, punt 2: verplicht concreet anker ------------------------------

test('elke persoonlijke affirmatie bevat een concreet anker (tijd, plek of actie)', () => {
  for (const input of scenarioInputs) {
    const result = composeDailyAffirmation(input);
    if (!result.personalized) {
      assert.equal(result.line, neutralAffirmationLine, `niet-persoonlijke regel is de neutrale fallback: “${result.line}”`);
      continue;
    }
    const anchored = timeAnchor.test(result.line) || placeAnchor.test(result.line) || actionAnchor.test(result.line);
    assert.ok(anchored, `persoonlijke regel zonder concreet anker: “${result.line}” (input ${JSON.stringify(input)})`);
  }
});

test('alleen sfeer (weer zonder persoonlijke ingang of plek) is geen anker en blijft neutraal', () => {
  for (const dayPart of dayParts) {
    for (const weatherCode of weatherCodes) {
      const result = composeDailyAffirmation({
        dayPart, firstName: '', directions: [], date: dates[0],
        weather: { weatherCode, temperature: 12, windSpeed: 14 },
      });
      assert.equal(result.personalized, false, `weer alleen personaliseert niet: “${result.line}”`);
      assert.equal(result.line, neutralAffirmationLine);
    }
  }
});

test('de gekoppelde omgeving wordt als plek-anker overgenomen, onveilige plaats niet', () => {
  const anchored = composeDailyAffirmation({
    dayPart: 'morning', firstName: 'Anna', directions: [], place: 'de Waddenkust', date: dates[0], weather: null,
  });
  assert.equal(anchored.personalized, true);
  assert.ok(/Waddenkust/.test(anchored.line), `plek herkenbaar in regel: “${anchored.line}”`);
  assert.ok(placeAnchor.test(anchored.line) || timeAnchor.test(anchored.line));
  // Een plaats met cijfers of drukverwoording wordt nooit letterlijk overgenomen.
  for (const risky of ['het wad om 15:00', 'nog niet bezochte stad', '10 kilometer verderop']) {
    const { line } = composeDailyAffirmation({
      dayPart: 'afternoon', firstName: 'Anna', directions: [], place: risky, date: dates[1], weather: null,
    });
    assert.ok(!line.includes(risky), `ruwe plaatstekst niet overgenomen: “${line}”`);
    for (const pattern of forbidden) assert.ok(!pattern.test(line), `verboden patroon via plaats: “${line}”`);
  }
});
