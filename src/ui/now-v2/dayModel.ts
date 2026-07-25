import { Experience } from '../../product/experienceModel';
import { TodayDecision } from '../../product/localIntelligence';
import { FreeWindow } from '../../context/calendarContext';
import { TravelGuide } from '../../product/travelGuide';
import { PersonalProfile } from '../../profile/personalModel';
import { WeatherSignal } from '../../liveworld/liveWorld';
import {
  SunTimes,
  beaufort,
  fitPercent,
  formatClock,
  goldenWindow,
  isDryCode,
  precipWord,
} from './nowModel';

// Domeinmodel voor het Dag-scherm volgens concept v2 (ADR-067, fase R2).
// Pure functies zonder React Native — volledig deterministisch en daardoor
// los testbaar, zoals nowModel voor het Nu-scherm. De concrete-copy doctrine
// is leidend: elke regel benoemt een feit (tijd, duur, wind, droogte, herkomst)
// — nooit een belofte of een poëtische formulering.
//
// Eerlijkheidsregels (ADR-021/043/046, ongewijzigd):
// - "droog tot HH:MM" bestaat niet in de weerdata (geen uurvoorspelling voor
//   neerslag in WeatherSignal); de chip zegt daarom "droog · meting HH:MM".
// - Een vrije ruimte verschijnt alleen uit de echte agenda-context (live);
//   zonder agenda verzinnen we geen vrije vensters.
// - "Afgerond" zegt het scherm alleen waar een leergebeurtenis of reflectie
//   van vandaag dat bevestigt; anders blijft een voorbij moment feitelijk.

export type StripChip = { icon: 'sun' | 'droplet' | 'sunrise' | 'sunset' | 'cloud-rain'; text: string };

/**
 * De weerstrip: drie chips met live weer (temperatuur+wind · droog/neerslag
 * met meettijd · zon onder). Zonder live weer blijven alleen de
 * deterministische zonschips over (zonverloop via nowModel — live zontijden
 * of de NOAA-benadering). Wind en neerslag zonder bron verzinnen we niet.
 */
export function dayStripChips(now: Date, sun: SunTimes, weather: WeatherSignal | undefined): StripChip[] {
  const sunChip: StripChip = now.getTime() < sun.sunset.getTime()
    ? { icon: 'sunset', text: `zon onder ${formatClock(sun.sunset)}` }
    : { icon: 'sunrise', text: `zon op ${formatClock(sun.sunrise)}` };
  if (!weather) {
    return [
      { icon: 'sunrise', text: `zon op ${formatClock(sun.sunrise)}` },
      sunChip,
    ];
  }
  const dry = isDryCode(weather.weatherCode);
  return [
    { icon: 'sun', text: `${Math.round(weather.temperature)}° · wind ${beaufort(weather.windSpeed)}` },
    // "droog tot HH:MM" is niet eerlijk afleidbaar (geen uurvoorspelling voor
    // neerslag in WeatherSignal): de chip zegt de gemeten huidige toestand.
    // De meettijd blijft zichtbaar op het Nu-scherm (reden-tegel).
    dry
      ? { icon: 'droplet', text: 'droog nu' }
      : { icon: 'cloud-rain', text: `${precipWord(weather.weatherCode).toLowerCase()} nu` },
    sunChip,
  ];
}

export type DayMomentState = 'past' | 'now' | 'later';

export type DayTimelineItem =
  | {
      kind: 'moment';
      id: string;
      when: string;
      title: string;
      sub: string;
      image: string;
      accent: string;
      state: DayMomentState;
      /** Fit-uitleg (ADR-067 §6), geen score — alleen getoond op het NU-moment. */
      percent: number;
      startMinutes: number;
      experience: Experience;
    }
  | {
      kind: 'free';
      id: string;
      when: string;
      title: string;
      sub: string;
      state: 'past' | 'later';
      startMinutes: number;
    }
  | { kind: 'energy' }
  | { kind: 'night' };

const clockRange = /^(\d{1,2}):(\d{2})\s*–\s*(\d{1,2}):(\d{2})$/;

/** "07:30 – 09:00" → { start, end } in minuten; null als het patroon afwijkt. */
export function parseWindowRange(time: string): { start: number; end: number } | null {
  const match = time.match(clockRange);
  if (!match) return null;
  return {
    start: Number(match[1]) * 60 + Number(match[2]),
    end: Number(match[3]) * 60 + Number(match[4]),
  };
}

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/**
 * Welke ervaringen vandaag echt zijn afgerond: een reflectie of een positieve
 * leergebeurtenis van vandaag. 'not-for-me' telt niet — dat is een afwijzing,
 * geen beleefd moment.
 */
export function completedTodayIds(profile: PersonalProfile, now: Date): Set<string> {
  const ids = new Set<string>();
  profile.reflectionMemories.forEach((memory) => {
    if (sameDay(new Date(memory.createdAt), now)) ids.add(memory.experienceId);
  });
  profile.learningEvents.forEach((event) => {
    if (event.outcome !== 'not-for-me' && sameDay(new Date(event.createdAt), now)) ids.add(event.experienceId);
  });
  return ids;
}

/** "2 uur" of "2 uur 15 min" of "45 min" — duur van een vrij venster. */
export function formatFreeMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} uur ${rest} min` : `${hours} uur`;
}

const subForMoment = (
  now: Date,
  sun: SunTimes,
  state: DayMomentState,
  experience: Experience,
  percent: number,
  completed: boolean,
): string => {
  if (state === 'past') {
    return completed
      ? `afgerond vandaag · ${experience.duration} min`
      : `${experience.duration} min · ${experience.effort.toLowerCase()}`;
  }
  if (state === 'now') {
    const golden = goldenWindow(sun);
    const goldenAhead = experience.kind === 'outside' && now.getTime() < sun.sunset.getTime();
    return goldenAhead
      ? `match ${percent} · gouden uur ${formatClock(golden.peak)}`
      : `match ${percent} · ${experience.duration} min`;
  }
  return `${experience.duration} min · ${experience.effort.toLowerCase()}`;
};

/** Vaste slotregel van de daglijn: Momentum plant 's nachts bewust niets. */
export const NIGHT_ITEM = { when: '22:30 · NACHT', title: 'Thuiskomen', sub: 'niets gepland · rust' } as const;

/**
 * De redactionele daglijn: de echte dagmomenten (dayDecisions uit de store),
 * chronologisch verweven met de vrije vensters uit een live agenda. Het
 * lopende of eerstvolgende moment krijgt de NU-markering met fit-uitleg;
 * verleden momenten dimmen; de energie-check-in ligt op de nu-grens; de nacht
 * sluit rustig af. Zonder live agenda verschijnen er geen vrije vensters
 * (eerlijk ontbreken), zonder dagmomenten blijven alleen check-in en nacht.
 */
export function dayTimeline(
  now: Date,
  sun: SunTimes,
  decisions: TodayDecision[],
  freeWindows: FreeWindow[],
  profile: PersonalProfile,
): DayTimelineItem[] {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const completed = completedTodayIds(profile, now);

  type MomentItem = Extract<DayTimelineItem, { kind: 'moment' }>;
  type FreeItem = Extract<DayTimelineItem, { kind: 'free' }>;

  const momentItems: MomentItem[] = decisions.flatMap((moment) => {
    const range = parseWindowRange(moment.time);
    if (!range) return [];
    const experience = moment.result.experience;
    const state: DayMomentState = range.end <= nowMinutes ? 'past' : range.start <= nowMinutes ? 'now' : 'later';
    return [{
      kind: 'moment' as const,
      id: `${experience.id}-${range.start}`,
      when: `${moment.time} · ${moment.label}`,
      title: experience.title,
      // De subregel volgt pas ná de NU-promotie hieronder (de eindstaat
      // bepaalt of er een match-regel of een duurregel staat).
      sub: '',
      image: experience.image,
      accent: experience.accent,
      state,
      percent: fitPercent(moment.result.score),
      startMinutes: range.start,
      experience,
    }];
  });

  // NU-markering: het lopende venster, anders het eerstvolgende. Een dag
  // zonder lopend of toekomstig venster heeft geen NU — dat is eerlijk.
  const firstNow = momentItems.findIndex((item) => item.state === 'now');
  if (firstNow < 0) {
    const firstLater = momentItems.findIndex((item) => item.state === 'later');
    if (firstLater >= 0) momentItems[firstLater] = { ...momentItems[firstLater], state: 'now' };
  }

  // Subregels pas nu, op de definitieve staat.
  momentItems.forEach((item, index) => {
    momentItems[index] = { ...item, sub: subForMoment(now, sun, item.state, item.experience, item.percent, completed.has(item.experience.id)) };
  });

  // Vrije vensters die niet al een dagmoment zijn geworden (buildToday maakt
  // van de eerste vensters momenten met exact dezelfde starttijd).
  const usedStarts = new Set(momentItems.map((item) => item.startMinutes));
  const freeItems: FreeItem[] = freeWindows.flatMap((window) => {
    const start = new Date(window.start);
    const end = new Date(window.end);
    if (!sameDay(start, now)) return [];
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    if (usedStarts.has(startMinutes)) return [];
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    return [{
      kind: 'free' as const,
      id: `free-${startMinutes}`,
      when: `${formatClock(start)} – ${formatClock(end)} · VRIJE RUIMTE`,
      title: 'Vrije ruimte',
      sub: `${formatFreeMinutes(window.minutes)} zonder afspraken · Momentum houdt dit bewust vrij`,
      state: (endMinutes <= nowMinutes ? 'past' : 'later') as 'past' | 'later',
      startMinutes,
    }];
  });

  const timed: Array<MomentItem | FreeItem> = [...momentItems, ...freeItems];
  timed.sort((a, b) => a.startMinutes - b.startMinutes);

  // De energie-check-in hoort bij "nu": direct na het laatste item dat al
  // begonnen is (de nu-grens), of helemaal bovenaan een dag die nog moet
  // beginnen.
  let boundary = -1;
  timed.forEach((item, index) => { if (item.startMinutes <= nowMinutes) boundary = index; });
  const items: DayTimelineItem[] = timed;
  items.splice(boundary + 1, 0, { kind: 'energy' });
  items.push({ kind: 'night' });
  return items;
}

export type DiscoveryCardModel = {
  kicker: string;
  title: string;
  detail: string;
  image: string;
  experience: Experience;
};

/** Weekdag van morgen, eerste letter hoofdletter ("Zaterdag"). */
export function tomorrowWeekday(now: Date): string {
  const tomorrow = new Date(now.getTime() + 24 * 3600000);
  const value = new Intl.DateTimeFormat('nl-NL', { weekday: 'long' }).format(tomorrow);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * De ontdekkaart voor de komende dag: één kaart uit de bestaande
 * reisgids-compositie (eindig en gecureerd, ADR-060), nooit iets dat vandaag
 * al op de lijn staat. De detailregel noemt het natuurlijke moment uit echte
 * data: het eigen tijdsvenster van de ervaring, het gouden uur voor
 * buitenkaarten (zonmodel), of de feitelijke duur en inspanning.
 */
export function discoveryCard(now: Date, sun: SunTimes, guide: TravelGuide, excludeIds: Set<string>): DiscoveryCardModel | null {
  for (const section of guide.sections) {
    for (const card of section.cards) {
      const experience = card.experience;
      if (excludeIds.has(experience.id)) continue;
      const detail = experience.timeWindow && clockRange.test(experience.timeWindow)
        ? `beste tijd ${experience.timeWindow}`
        : experience.kind === 'outside'
          ? `beste half uur rond zonsondergang · ${formatClock(goldenWindow(sun).peak)}`
          : `${experience.duration} min · ${experience.effort.toLowerCase()}`;
      return {
        kicker: `${tomorrowWeekday(now)} · ontdekking`,
        title: experience.title,
        detail,
        image: experience.image,
        experience,
      };
    }
  }
  return null;
}
