import type { DayPart } from './localIntelligence';

// Dagelijkse affirmatieregel op Nu (ADR-059, punt 1).
// Deterministische composer: geen model, geen netwerk, geen inferentie over
// stemming of gezondheid. De regel wordt samengesteld uit dagdeel, actuele
// wereldcontext (weer, alleen wanneer expliciet gekoppeld en vers) en
// richtingen die de persoon zelf koos. Dezelfde dag + context geeft dezelfde
// regel; een nieuwe dag geeft een nieuwe, rustige variatie.
//
// Toonregels (hard, afgedekt door tests/affirmation.test.mjs):
// - bevestigend en uitnodigend; nooit schuld, druk of verplichting;
// - nooit kwantificering, streaks of zelfmeting ("je hebt nog niet…" is verboden);
// - erkent de persoon en de dag zonder die te meten.
// Zonder profiel of live context valt de regel terug op de neutrale variant
// (het vroegere statische gedrag, ADR-055).

export type AffirmationWeather = {
  weatherCode: number;
  temperature: number;
  windSpeed: number;
};

export type AffirmationInput = {
  dayPart: DayPart;
  firstName?: string;
  weather?: AffirmationWeather | null;
  // Richtingen die de persoon zelf koos en niet pauzeerde (near/growth/meaning).
  directions?: string[];
  // Anker voor determinisme; standaard de huidige dag.
  date?: Date;
};

export type DailyAffirmation = {
  line: string;
  personalized: boolean;
};

// De neutrale terugvalregel: identiek aan de vroegere statische opening op Nu.
export const neutralAffirmationLine = 'Vandaag wacht er iets moois op je.';

// Drukwoorden die nooit in een gegenereerde regel mogen voorkomen. De lijst
// wordt ook gebruikt om vrije richtingstekst te toetsen voordat die in de
// regel wordt overgenomen: een richting met druk- of prestatieverwoording
// wordt niet letterlijk overgenomen maar vervangen door een neutrale clausule.
const pressureLanguage = /nog niet|moet|moeten|te laat|verplicht|schuld|streak|\bdag\s?\d+\b/i;

const hash = (value: string) => Array.from(value).reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 17);
const pick = <T>(options: T[], seed: number, salt: number) => options[(seed + salt * 31) % options.length];

const openers: Record<DayPart, string[]> = {
  morning: ['Zachte ochtend', 'Een stille start van de dag', 'De ochtend is nog helemaal open'],
  midday: ['Midden op de dag', 'Een open middag', 'Het midden van de dag ademt'],
  afternoon: ['Een ruime namiddag', 'De middag loopt zacht door', 'Een kalme namiddag'],
  evening: ['Rustige avond', 'De avond valt zacht', 'Een stille avond'],
};

// WMO-weercodes → een rustige, beschrijvende clausule. Alleen waargenomen
// context; nooit een voorspelling als feit en nooit een oordeel over de dag.
const weatherClause = (weather: AffirmationWeather): string | undefined => {
  const code = weather.weatherCode;
  if ([0, 1].includes(code)) return 'heldere lucht';
  if ([2, 3].includes(code)) return 'een lucht die langzaam verschuift';
  if ([45, 48].includes(code)) return 'een wereld in zachte mist';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'regen die alles even vertraagt';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'sneeuw die de wereld stil maakt';
  if ([95, 96, 99].includes(code)) return 'frisse lucht na bewogen weer';
  return undefined;
};

const weatherLead = (clause: string) => clause;

const directionClause = (direction: string, seed: number): string => {
  const templates = [
    (d: string) => `jouw richting “${d}” mag vandaag klein en echt beginnen`,
    (d: string) => `jouw “${d}” heeft hier vanzelf een plek`,
    (d: string) => `“${d}” past moeiteloos in deze dag`,
  ];
  return pick(templates, seed, 7)(direction);
};

const closings = [
  'jij mag dit moment op jouw manier invullen',
  'jouw aandacht is hier genoeg',
  'wat jij vandaag kiest, is precies goed',
  'er hoeft niets bewezen te worden',
  'deze dag hoeft alleen van jou te zijn',
  'jouw tempo is het juiste tempo',
];

// Neem een zelf gekozen richting alleen letterlijk over wanneer die veilig is:
// begrensd in lengte en vrij van druk- of kwantificeringstaal. Zo blijft de
// toonregel gelden óók wanneer de vrije tekst van de persoon zelf scherper is.
const safeDirection = (value: string): string | undefined => {
  const cleaned = value.trim().replace(/\s+/g, ' ').slice(0, 60);
  if (cleaned.length < 3) return undefined;
  if (pressureLanguage.test(cleaned)) return undefined;
  if (/\d/.test(cleaned)) return undefined;
  return cleaned;
};

export function composeDailyAffirmation(input: AffirmationInput): DailyAffirmation {
  const date = input.date ?? new Date();
  const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const seed = hash(`${dayKey}:${input.dayPart}:${input.firstName?.trim() ?? ''}`);

  const name = input.firstName?.trim() ?? '';
  const direction = (input.directions ?? []).map(safeDirection).find(Boolean);
  const clause = input.weather ? weatherClause(input.weather) : undefined;

  // Terugval: geen profielnaam, geen richting én geen live context — dan blijft
  // de regel neutraal, precies zoals Nu eerder opende (ADR-055-gedrag).
  if (!name && !direction && !clause) {
    return { line: neutralAffirmationLine, personalized: false };
  }

  const opener = pick(openers[input.dayPart], seed, 1);
  const parts: string[] = [];
  if (clause) parts.push(weatherLead(clause));
  if (direction) parts.push(directionClause(direction, seed));

  const closing = pick(closings, seed, 3);
  const address = name ? `, ${name}` : '';
  const joined = parts.length ? ` — ${parts.join(' · ')} —` : '';
  return { line: `${opener}${joined} ${closing}${address}.`, personalized: true };
}
