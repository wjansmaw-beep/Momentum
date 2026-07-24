import type { DayPart, EnergyLevel } from './localIntelligence';
import type { ExperienceKind } from './experienceModel';

// Dagelijkse affirmatieregel op Nu (ADR-059, punt 1; uitgebreid in ADR-060, punt 3).
// Deterministische composer: geen model, geen netwerk, geen inferentie over
// stemming of gezondheid. De regel wordt samengesteld uit dagdeel, actuele
// wereldcontext (weer, alleen wanneer expliciet gekoppeld en vers),
// richtingen die de persoon zelf koos, en — nieuw in ADR-060 — twee zachte
// extra ingangen:
//   (a) live feedback: recente reflecties en uitkomsten uit het omkeerbare
//       leermodel, alleen positief doorweven (nooit verwijtend);
//   (b) zelfgerapporteerde energie: een optionele check-in die de toon zachtjes
//       meevoert. Bij lage energie wordt de regel stiller; er staat nooit
//       duwtaal in en lage energie wordt nooit beoordeeld.
// Dezelfde dag + context geeft dezelfde regel; een nieuwe dag geeft een
// nieuwe, rustige variatie.
//
// Toonregels (hard, afgedekt door tests/affirmation.test.mjs):
// - bevestigend en uitnodigend; nooit schuld, druk of verplichting;
// - nooit kwantificering, streaks of zelfmeting ("je hebt nog niet…" is verboden);
// - erkent de persoon en de dag zonder die te meten;
// - energie wordt erkend, nooit gemeten of becommentarieerd als tekort.
// Zonder profiel, live context, feedback of energie valt de regel terug op de
// neutrale variant (het vroegere statische gedrag, ADR-055).

export type { EnergyLevel };

// Live feedback uit het leermodel (ADR-060, 3a). Bewust klein gehouden: de
// composer leest alleen wat de persoon zélf positief bevestigde. Negatieve
// uitkomsten bereiken de regel nooit — feedback is hier geen rapportcijfer.
export type AffirmationFeedback = {
  // Aantal recente uitkomsten dat de persoon als waardevol markeerde.
  recentValued: number;
  // De ervaringsvorm die recent het vaakst waardevol werd gevonden.
  valuedKind?: ExperienceKind;
};

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
  // Optionele zelfgerapporteerde energie van vandaag (ADR-060). Alleen de toon
  // volgt mee; bij geen check-in blijft alles neutraal.
  energy?: EnergyLevel | null;
  // Recente positieve bevestigingen uit het leermodel (ADR-060, 3a).
  feedback?: AffirmationFeedback | null;
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

// ADR-060: bij zelfgerapporteerd lage energie kiest de composer uit een
// stillere reeks afsluiters. Erkent de dag zonder te duwen, zonder de energie
// te benoemen als tekort en zonder ergens naar toe te sturen.
const lowEnergyClosings = [
  'rust hoeft niets te verdienen',
  'klein is vandaag meer dan genoeg',
  'zacht kiezen is ook een volwaardige keuze',
  'deze dag draagt jou, ook als jij even niet draagt',
  'er is niets aan jou te meten vandaag',
];

// Vaste, toonveilige labels voor ervaringsvormen in feedback-clausules.
// Bewust een eigen kaart: de composer mag nooit vrije profieltekst overnemen.
const valuedKindLabels: Record<ExperienceKind, string> = {
  outside: 'buiten zijn', food: 'koken', movement: 'bewegen', restore: 'rust',
  connect: 'samen zijn', learn: 'leren', culture: 'cultuur',
};

// Feedback-clausules (ADR-060, 3a): alleen positief doorweven, nooit een
// terugblik als verwijt ("je deed gisteren niet…" is onmogelijk gemaakt: de
// composer kent geen negatieve uitkomsten en geen tellingen aan de persoon).
const feedbackClause = (feedback: AffirmationFeedback, seed: number): string | undefined => {
  if (feedback.recentValued <= 0) return undefined;
  if (feedback.valuedKind) {
    const label = valuedKindLabels[feedback.valuedKind];
    const templates = [
      `jij vond eerder iets moois in ${label}; dat spoor loopt hier ook`,
      `wat jou eerder raakte in ${label} mag vandaag zacht terugkomen`,
    ];
    return pick(templates, seed, 11);
  }
  const templates = [
    'wat je eerder de moeite waard noemde wacht hier geduldig opnieuw',
    'iets dat jou eerder raakte mag vandaag opnieuw klein beginnen',
  ];
  return pick(templates, seed, 13);
};

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
  // Alleen zelfgerapporteerd lage energie voert de toon zachtjes mee. 'Rustig'
  // en 'vol energie' zijn bewust neutraal: Momentum duwt nooit omhoog en de
  // regel blijft dan exact gelijk aan geen check-in (overslaan = neutraal).
  const energy = input.energy === 'low' ? 'low' : null;
  const feedback = input.feedback ?? null;
  const seed = hash(`${dayKey}:${input.dayPart}:${input.firstName?.trim() ?? ''}:${energy ?? ''}:${feedback?.recentValued ?? 0}:${feedback?.valuedKind ?? ''}`);

  const name = input.firstName?.trim() ?? '';
  const direction = (input.directions ?? []).map(safeDirection).find(Boolean);
  const clause = input.weather ? weatherClause(input.weather) : undefined;
  const feedbackPart = feedback ? feedbackClause(feedback, seed) : undefined;

  // Terugval: geen profielnaam, geen richting, geen live context, geen
  // feedback én geen energie-check-in — dan blijft de regel neutraal, precies
  // zoals Nu eerder opende (ADR-055-gedrag).
  if (!name && !direction && !clause && !feedbackPart && !energy) {
    return { line: neutralAffirmationLine, personalized: false };
  }

  const opener = pick(openers[input.dayPart], seed, 1);
  // Maximaal twee clausules houden de regel rustig en binnen de lengtegrens:
  // één persoonlijke clausule (feedback of richting, deterministisch gekozen)
  // en daarnaast hooguit de weerclausule.
  const directionPart = direction ? directionClause(direction, seed) : undefined;
  const personalOptions = [feedbackPart, directionPart].filter((part): part is string => Boolean(part));
  const parts: string[] = [];
  if (personalOptions.length) parts.push(pick(personalOptions, seed, 17));
  if (clause) parts.push(weatherLead(clause));

  const closing = pick(energy === 'low' ? lowEnergyClosings : closings, seed, 3);
  const address = name ? `, ${name}` : '';
  const joined = parts.length ? ` — ${parts.join(' · ')} —` : '';
  return { line: `${opener}${joined} ${closing}${address}.`, personalized: true };
}
