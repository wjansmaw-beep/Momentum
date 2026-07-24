import type { DayPart, EnergyLevel } from './localIntelligence';
import type { ExperienceKind } from './experienceModel';

// Dagelijkse affirmatieregel op Nu (ADR-059, punt 1; uitgebreid in ADR-060,
// punt 3; aangescherpt in ADR-061, punt 2).
// Deterministische composer: geen model, geen netwerk, geen inferentie over
// stemming of gezondheid. De regel wordt samengesteld uit dagdeel, actuele
// wereldcontext (weer én plaats, alleen wanneer expliciet gekoppeld en vers),
// richtingen die de persoon zelf koos, en twee zachte extra ingangen uit
// ADR-060: live feedback (alleen positief doorweven) en zelfgerapporteerde
// energie (voert alleen de toon zachtjes mee).
//
// Anker-eis (ADR-061, punt 2 — hard, afgedekt door tests/affirmation.test.mjs):
// elke persoonlijke regel bevat minstens één concreet anker:
//   - TIJD: een benoemd tijdsvenster uit het dagdeel (ochtend/middag/avond);
//   - PLEK: de gekoppelde live omgeving (plaats uit de Live World-context);
//   - ACTIE: een zelf gekozen richting of een positief bevestigde ervaringsvorm
//     als iets dat je kunt dóén.
// De tijdanker-clausule (de opener) is altijd beschikbaar zodra de regel
// persoonlijk is; kan de composer om wat voor reden dan ook geen verankerde
// regel bouwen, dan valt hij terug op de neutrale regel. Zuivere
// sfeerformulering zonder anker is niet toegestaan.
//
// Toonregels (onverminderd van kracht, afgedekt door dezelfde tests):
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
  // Gekoppelde live omgeving als plek-anker (ADR-061): bijv. het regionLabel
  // uit de Live World-context. Alleen overgenomen als het toonveilig is.
  place?: string | null;
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
// Dit is tevens de fallback wanneer er géén concreet anker beschikbaar is
// (ADR-061, punt 2).
export const neutralAffirmationLine = 'Vandaag wacht er iets moois op je.';

// Drukwoorden die nooit in een gegenereerde regel mogen voorkomen. De lijst
// wordt ook gebruikt om vrije richtings- en plaatstekst te toetsen voordat die
// in de regel wordt overgenomen: tekst met druk- of prestatieverwoording wordt
// niet letterlijk overgenomen maar vervangen door een neutrale clausule.
const pressureLanguage = /nog niet|moet|moeten|te laat|verplicht|schuld|streak|\bdag\s?\d+\b/i;

const hash = (value: string) => Array.from(value).reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 17);
const pick = <T>(options: T[], seed: number, salt: number) => options[(seed + salt * 31) % options.length];

// Tijd-anker (ADR-061): elke opener benoemt het concrete tijdsvenster van het
// dagdeel. Dat is het anker dat áltijd aanwezig is in een persoonlijke regel.
const openers: Record<DayPart, string[]> = {
  morning: ['Deze ochtend', 'Een stille start van de ochtend', 'De ochtend is nog helemaal open'],
  midday: ['Het midden van deze middag', 'Een open middag', 'De middag ademt rustig'],
  afternoon: ['Deze namiddag', 'De namiddag loopt zacht door', 'Een kalme namiddag'],
  evening: ['Deze avond', 'De avond valt zacht', 'Een stille avond'],
};

// WMO-weercodes → een rustige, beschrijvende clausule. Alleen waargenomen
// context; nooit een voorspelling als feit en nooit een oordeel over de dag.
// Weer is sfeer, géén anker: het mag een verankerde regel ondersteunen maar
// nooit de enige inhoud zijn.
const weatherClause = (weather: AffirmationWeather): string | undefined => {
  const code = weather.weatherCode;
  if ([0, 1].includes(code)) return 'onder een heldere lucht';
  if ([2, 3].includes(code)) return 'terwijl de lucht langzaam verschuift';
  if ([45, 48].includes(code)) return 'in zachte mist';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'met regen die alles even vertraagt';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'met sneeuw die de wereld stil maakt';
  if ([95, 96, 99].includes(code)) return 'met frisse lucht na bewogen weer';
  return undefined;
};

// Plek-anker (ADR-061): de gekoppelde live omgeving, toonveilig overgenomen.
const placeClause = (place: string, seed: number): string => {
  const templates = [
    (p: string) => `hier, rond ${p}`,
    (p: string) => `in de omgeving van ${p}`,
    (p: string) => `dichtbij, rond ${p}`,
  ];
  return pick(templates, seed, 19)(place);
};

// Actie-anker (ADR-061): een zelf gekozen richting als iets dat je kunt doen —
// klein, concreet en zonder prestatiedruk.
const directionClause = (direction: string, seed: number): string => {
  const templates = [
    (d: string) => `jouw “${d}” mag hier je eerste stap zijn`,
    (d: string) => `met jouw “${d}” als iets om vandaag te doen`,
    (d: string) => `jouw “${d}” past als kleine handeling in deze dag`,
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

// Vaste, toonveilige labels voor ervaringsvormen in feedback-clausules
// (actie-ankers). Bewust een eigen kaart: de composer mag nooit vrije
// profieltekst overnemen.
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

// Neem zelf gekozen vrije tekst (richting of plaats) alleen letterlijk over
// wanneer die veilig is: begrensd in lengte en vrij van druk-, cijfer- of
// kwantificeringstaal. Zo blijft de toonregel gelden óók wanneer de vrije
// tekst van de persoon of de bron zelf scherper is.
const safeFreeText = (value: string): string | undefined => {
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
  const direction = (input.directions ?? []).map(safeFreeText).find(Boolean);
  const place = input.place ? safeFreeText(input.place) : undefined;
  const clause = input.weather ? weatherClause(input.weather) : undefined;
  const feedbackPart = feedback ? feedbackClause(feedback, seed) : undefined;

  // Terugval: geen profielnaam, geen richting, geen plek, geen live context,
  // geen feedback én geen energie-check-in — dan blijft de regel neutraal,
  // precies zoals Nu eerder opende (ADR-055-gedrag). Weer alleen (sfeer zonder
  // anker of persoonlijke ingang) is bewust óók neutraal: een regel met alleen
  // weer en een tijdsvenster zegt niets over de persoon en blijft dus de
  // neutrale variant.
  if (!name && !direction && !place && !feedbackPart && !energy) {
    return { line: neutralAffirmationLine, personalized: false };
  }

  // De opener bevat altijd het concrete tijdsvenster (tijd-anker). Richting en
  // feedback voegen een actie-anker toe, de gekoppelde omgeving een plek-anker.
  const opener = pick(openers[input.dayPart], seed, 1);
  // Maximaal drie korte clausules houden de regel rustig en binnen de
  // lengtegrens: één persoonlijke clausule (feedback of richting,
  // deterministisch gekozen), daarnaast hooguit de plek en het weer.
  const directionPart = direction ? directionClause(direction, seed) : undefined;
  const personalOptions = [feedbackPart, directionPart].filter((part): part is string => Boolean(part));
  const parts: string[] = [];
  if (personalOptions.length) parts.push(pick(personalOptions, seed, 17));
  if (place) parts.push(placeClause(place, seed));
  if (clause) parts.push(clause);

  const closing = pick(energy === 'low' ? lowEnergyClosings : closings, seed, 3);
  const address = name ? `, ${name}` : '';
  // Zonder clausules verbindt een komma de opener rustig met de afsluiter.
  const joined = parts.length ? ` — ${parts.join(' · ')} —` : ',';
  const line = `${opener}${joined} ${closing}${address}.`;
  // Verdediging op de anker-eis: een persoonlijke regel zonder het
  // tijdsvenster mag nooit ontstaan. Kan dat onverhoopt toch, dan is de
  // neutrale regel de enige toegestane uitkomst (ADR-061, punt 2).
  if (!/ochtend|middag|namiddag|avond/i.test(line)) {
    return { line: neutralAffirmationLine, personalized: false };
  }
  return { line, personalized: true };
}
