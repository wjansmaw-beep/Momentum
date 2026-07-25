import type { Memory } from '../../app/store';
import type { ExperienceKind } from '../../product/experienceModel';
import type { PersonalProfile } from '../../profile/personalModel';
import { experienceKindLabels } from '../../profile/personalModel';

// Domeinmodel voor het Jij-scherm volgens concept v2 (ADR-067, fase R5b).
// Pure functies zonder React Native — deterministisch en los testbaar.
//
// Eerlijkheidsgrenzen van deze fase (bewust, gedocumenteerd):
// - Er is geen lidmaatschapsdatum in het profiel; de identiteitsregel gebruikt
//   de regio en het echte aantal bewaarde momenten.
// - Elke inzichtkaart draagt een meetbaar feit uit reflecties, leer-
//   gebeurtenissen of bewaarde momenten. Bij te weinig data valt de kaart
//   weg — het scherm verzint nooit een patroon.
// - Het weekritme telt reflecties en leergebeurtenissen per weekdag over de
//   afgelopen 28 dagen; dat zegt iets over wanneer je momenten afrondde,
//   niet over hoe vaak je iets deed (geen prestatie, geen streak).

export type IdentityLine = { name: string; initial: string; sub: string };

/** Identiteit: naam uit het profiel; de regel eronder is eerlijk — regio plus
 *  het aantal bewaarde momenten, geen verzonnen "lid sinds". */
export function identityLine(personal: PersonalProfile, region: string | undefined, memories: Memory[]): IdentityLine {
  const name = personal.firstName.trim() || 'Jij';
  const parts: string[] = [];
  if (region) parts.push(region);
  parts.push(memories.length ? `${memories.length} ${memories.length === 1 ? 'bewaard moment' : 'bewaarde momenten'}` : 'nog geen bewaarde momenten');
  return { name, initial: name.charAt(0).toUpperCase(), sub: parts.join(' · ') };
}

export type YouInsight = { icon: 'moon' | 'sun' | 'sunrise' | 'map-pin' | 'users' | 'user' | 'heart'; title: string; sub: string };

const dayPartOf = (iso: string): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const hour = new Date(iso).getHours();
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

const POSITIVE = ['worth-it', 'repeat'];

/**
 * Inzichtkaarten ("Wat Momentum van je weet"): maximaal drie, elk met een
 * meetbaar feit in de subregel. Te weinig data → kaart weg.
 * 1. Tijdstip: het dominante dagdeel van je afgeronde momenten (uit de
 *    aanmaaktijden van reflecties en leergebeurtenissen).
 * 2. Soort: de ervaringssoort met de meeste positieve signalen.
 * 3. Gezelschap: het aandeel samen vs. alleen in je bewaarde momenten.
 */
export function youInsights(personal: PersonalProfile, memories: Memory[]): YouInsight[] {
  const insights: YouInsight[] = [];
  const stamps = [...personal.reflectionMemories.map((item) => item.createdAt), ...personal.learningEvents.map((item) => item.createdAt)]
    .filter((iso) => Number.isFinite(new Date(iso).getTime()));
  if (stamps.length >= 4) {
    const counts: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    stamps.forEach((iso) => { counts[dayPartOf(iso)] += 1; });
    const top = (Object.keys(counts) as Array<keyof typeof counts>).sort((a, b) => counts[b] - counts[a])[0];
    const share = counts[top] / stamps.length;
    if (share >= 0.5) {
      const words: Record<keyof typeof counts, { title: string; icon: YouInsight['icon']; window: string }> = {
        evening: { title: 'Jij bent een avondmens', icon: 'moon', window: 'na 18:00' },
        morning: { title: 'De ochtend is jouw moment', icon: 'sunrise', window: 'voor 12:00' },
        afternoon: { title: 'De middag werkt voor jou', icon: 'sun', window: 'tussen 12:00 en 18:00' },
        night: { title: 'De late uren spreken je aan', icon: 'moon', window: 'voor 6:00' },
      };
      const word = words[top];
      insights.push({
        icon: word.icon,
        title: word.title,
        sub: `${counts[top]} van je ${stamps.length} momenten rondde je af ${word.window}`,
      });
    }
  }
  const positiveByKind = new Map<ExperienceKind, number>();
  personal.learningEvents
    .filter((event) => POSITIVE.includes(event.outcome))
    .forEach((event) => positiveByKind.set(event.kind, (positiveByKind.get(event.kind) ?? 0) + 1));
  personal.reflectionMemories
    .filter((memory) => POSITIVE.includes(memory.outcome))
    .forEach((memory) => positiveByKind.set(memory.kind, (positiveByKind.get(memory.kind) ?? 0) + 1));
  const topKind = [...positiveByKind.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topKind && topKind[1] >= 2) {
    insights.push({
      icon: 'heart',
      title: `${experienceKindLabels[topKind[0]]} trekt je`,
      sub: `${topKind[1]} positieve signalen · je meest bevestigde soort moment`,
    });
  }
  if (memories.length >= 3) {
    const together = memories.filter((memory) => (memory.sharedWith?.length ?? 0) > 0).length;
    const solo = memories.length - together;
    if (solo >= together + 1) {
      insights.push({
        icon: 'user',
        title: 'Alleen is ook goed gezelschap',
        sub: `${solo} van je ${memories.length} bewaarde momenten deed je alleen`,
      });
    } else if (together >= solo + 1) {
      insights.push({
        icon: 'users',
        title: 'Samen beleven werkt voor je',
        sub: `${together} van je ${memories.length} bewaarde momenten deed je samen`,
      });
    }
  }
  return insights.slice(0, 3);
}

export type WeekRhythm = {
  /** Zeven tellingen, maandag t/m zondag. */
  counts: number[];
  /** Index van de piek (0 = maandag), of -1 bij alles gelijk. */
  peakIndex: number;
  total: number;
};

const DAY_MS = 86400000;

/** Weekritme: tellingen per weekdag over de afgelopen 28 dagen uit echte
 *  reflectie- en leertijdstippen. */
export function weekRhythm(personal: PersonalProfile, now: Date): WeekRhythm {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  const since = now.getTime() - 28 * DAY_MS;
  const stamps = [...personal.reflectionMemories.map((item) => item.createdAt), ...personal.learningEvents.map((item) => item.createdAt)];
  stamps.forEach((iso) => {
    const time = new Date(iso).getTime();
    if (!Number.isFinite(time) || time < since || time > now.getTime()) return;
    // getDay(): 0 = zondag → herschik naar maandag = 0.
    counts[(new Date(iso).getDay() + 6) % 7] += 1;
  });
  const total = counts.reduce((sum, value) => sum + value, 0);
  const max = Math.max(...counts);
  const peakIndex = max > 0 && counts.filter((value) => value === max).length === 1 ? counts.indexOf(max) : -1;
  return { counts, peakIndex, total };
}

export type PreferenceChips = string[];

/** "Wat jij mooi vindt": alleen chips die direct uit profielvelden komen —
 *  gekozen soorten, eigen richtingwoorden, uitrusting en gezelschapskeuze. */
export function preferenceChips(personal: PersonalProfile): PreferenceChips {
  const chips: string[] = [];
  personal.preferredKinds.slice(0, 4).forEach((kind) => chips.push(experienceKindLabels[kind].toLowerCase()));
  const directionWords = [...personal.directions.near, ...personal.directions.growth, ...personal.directions.meaning]
    .filter((word) => !personal.pausedDirections.includes(word));
  directionWords.slice(0, 3).forEach((word) => chips.push(word.toLowerCase()));
  const equipment = [personal.equipment.bike ? 'fiets' : '', personal.equipment.kettlebell ? 'kettlebell' : '', personal.equipment.car ? 'auto' : ''].filter(Boolean);
  if (equipment.length) chips.push(equipment.join(' & '));
  if (personal.defaultCompany !== 'solo') chips.push(personal.defaultCompany === 'family' ? 'met gezin' : 'graag samen');
  return chips.slice(0, 8);
}
