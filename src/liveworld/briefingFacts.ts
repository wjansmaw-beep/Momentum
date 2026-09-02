import { LiveWorldSnapshot } from './liveWorld';
import { beaufort, formatClock, isDryCode, precipWord } from '../ui/now-v2/nowModel';

// ADR-068 · pure kern van de Levende Wereld-briefing: feitenbouw uit het
// liveWorld-snapshot en de antwoord-poort. Geen React Native, geen fetch —
// volledig deterministisch en daardoor los testbaar (tests/livingWorldBriefing
// .test.mjs). De asynchrone lader met cache en netwerk leeft in
// livingWorldBriefing.ts.

export type BriefingFact = { id: string; text: string; source: string; sourceDetail: string };
export type BriefingSentence = { text: string; factIds: string[] };

const time = (iso: string) => {
  const stamp = new Date(iso);
  return Number.isFinite(stamp.getTime()) ? formatClock(stamp) : '';
};

/** Verzamelt de feiten voor de briefing — elk feit letterlijk uit het
 * snapshot, elk met de naam en meetdetail van zijn receipt. Een feit zonder
 * live receipt komt nooit in de payload (dan zou de bron onzichtbaar zijn). */
export function buildBriefingFacts(snapshot: LiveWorldSnapshot): BriefingFact[] {
  const receipt = (id: string) => snapshot.sources.find((source) => source.id === id && source.state === 'live');
  const facts: BriefingFact[] = [];
  const weatherReceipt = receipt('open-meteo');
  if (snapshot.weather && weatherReceipt) {
    const weather = snapshot.weather;
    const measured = time(weather.observedAt);
    const sky = isDryCode(weather.weatherCode) ? 'droog' : `${precipWord(weather.weatherCode).toLowerCase()} gemeld`;
    facts.push({
      id: 'weer',
      text: `${Math.round(weather.temperature)}° en ${sky}, wind ${beaufort(weather.windSpeed)} bft`,
      source: weatherReceipt.name,
      sourceDetail: measured ? `om ${measured} gemeten` : weatherReceipt.detail,
    });
    const sunrise = time(weather.sunrise);
    const sunset = time(weather.sunset);
    if (sunrise && sunset) {
      facts.push({
        id: 'zon',
        text: `Zon op om ${sunrise}, zon onder om ${sunset}`,
        source: weatherReceipt.name,
        sourceDetail: 'uit de actuele weermeting',
      });
    }
  }
  const airReceipt = receipt('open-meteo-air');
  if (snapshot.airQuality && airReceipt) {
    const category = { good: 'goed', fair: 'redelijk', moderate: 'matig', poor: 'slecht', 'very-poor': 'zeer slecht' }[snapshot.airQuality.category];
    facts.push({
      id: 'lucht',
      text: `Luchtkwaliteit nu ${category} (index ${Math.round(snapshot.airQuality.europeanAqi)})`,
      source: airReceipt.name,
      sourceDetail: time(snapshot.airQuality.observedAt) ? `om ${time(snapshot.airQuality.observedAt)} gemeten` : airReceipt.detail,
    });
  }
  const marineReceipt = receipt('open-meteo-marine');
  if (snapshot.marine && marineReceipt) {
    const trend = { rising: 'het water stijgt', falling: 'het water daalt', steady: 'de waterstand is stabiel', unknown: 'de waterstand volgt het model' }[snapshot.marine.trend];
    facts.push({
      id: 'water',
      text: `Golven ${String(snapshot.marine.waveHeight).replace('.', ',')} m · ${trend}`,
      source: marineReceipt.name,
      sourceDetail: time(snapshot.marine.observedAt) ? `modelstand ${time(snapshot.marine.observedAt)}` : marineReceipt.detail,
    });
  }
  const birdReceipt = receipt('ebird');
  if (birdReceipt) {
    snapshot.birdObservations.slice(0, 2).forEach((bird, index) => {
      facts.push({
        id: `vogel-${index}`,
        text: `${bird.commonName} recent gezien bij ${bird.locationName}`,
        source: birdReceipt.name,
        sourceDetail: time(bird.observedAt) ? `gemeld om ${time(bird.observedAt)}` : birdReceipt.detail,
      });
    });
  }
  const placeReceipt = receipt('openstreetmap-places');
  if (placeReceipt) {
    const stateLabel = { open: 'nu open', closed: 'nu gesloten', unknown: 'openingstijd onbekend' };
    snapshot.nearbyPlaces.slice(0, 3).forEach((place, index) => {
      facts.push({
        id: `plek-${index}`,
        text: `${place.name} — ${stateLabel[place.openingState]}${place.openingNote ? ` (${place.openingNote})` : ''}`,
        source: placeReceipt.name,
        sourceDetail: 'via OpenStreetMap',
      });
    });
  }
  return facts.slice(0, 8);
}

const unsafeClaims = /geneest|behandelt|voorkomt ziekte|gegarandeerd|zeker weten|altijd veilig|medisch advies/i;

/** Feitensignatuur + cachesleutel. De sleutel bevat ervaring, dagdeel én de
 * gids-stap (null = Voorpret): onderweg geldt één briefing per stap, met
 * dezelfde 15-minuten-frisheid als vooraf. */
export const briefingFactsSignature = (facts: BriefingFact[]) => facts.map((fact) => `${fact.id}:${fact.text}`).join('|');
export const briefingCacheKey = (experienceId: string, dayPart: string, stepIndex: number | null, facts: BriefingFact[]) =>
  `${experienceId}|${dayPart}|${stepIndex === null ? 'voorpret' : `stap-${stepIndex}`}|${briefingFactsSignature(facts)}`;

/** Bron-label per zin: de namen + meetdetails van de geciteerde feiten,
 * ontdubbeld en in feitvolgorde (bijv. "Open-Meteo · om 22:45 gemeten"). */
export const briefingSourceLine = (sentence: BriefingSentence, facts: BriefingFact[]): string => {
  const labels = sentence.factIds
    .map((id) => facts.find((fact) => fact.id === id))
    .filter((fact): fact is BriefingFact => Boolean(fact))
    .map((fact) => `${fact.source}${fact.sourceDetail ? ` · ${fact.sourceDetail}` : ''}`);
  return [...new Set(labels)].join(' + ');
};

/** Client-side poort, identiek aan de server: 2–4 zinnen, elk met minstens
 * één bestaande feit-verwijzing, geen geblokkeerde claims. */
export function sanitizeBriefingResponse(value: unknown, facts: BriefingFact[]): BriefingSentence[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { sentences?: unknown }).sentences)) return [];
  const known = new Set(facts.map((fact) => fact.id));
  const accepted = ((value as { sentences: unknown[] }).sentences).slice(0, 4).flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return [];
    const sentence = raw as { text?: unknown; factIds?: unknown };
    const text = typeof sentence.text === 'string' ? sentence.text.trim().slice(0, 220) : '';
    const factIds = (Array.isArray(sentence.factIds) ? sentence.factIds : []).filter((id): id is string => typeof id === 'string' && known.has(id));
    if (text.length < 12 || !factIds.length || unsafeClaims.test(text)) return [];
    return [{ text, factIds: [...new Set(factIds)].slice(0, 3) }];
  });
  return accepted.length >= 2 ? accepted : [];
}
