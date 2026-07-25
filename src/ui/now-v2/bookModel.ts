import type { Memory } from '../../app/store';
import type { Experience } from '../../product/experienceModel';
import type { PersonalProfile, ReflectionMemory } from '../../profile/personalModel';
import { deriveGentleObservations, doAgainLabels, experienceKindLabels } from '../../profile/personalModel';

// Domeinmodel voor het Boek-scherm volgens concept v2 (ADR-067, fase R5a).
// Pure functies zonder React Native — deterministisch en los testbaar.
//
// Eerlijkheidsgrenzen van deze fase (bewust, gedocumenteerd):
// - Een herinnering kent geen kalenderdatum ("Vandaag" is het bewaarmoment)
//   en geen cijfer — er is dus nooit een "9" of een "24 JUL" tenzij het uit
//   echte velden komt. De datumregel gebruikt de bewaarde datumtekst.
// - De observatiekaart ("Momentum merkt") zegt alleen iets dat uit tellingen
//   over echte herinneringen en reflecties volgt; anders valt hij weg of
//   deelt hij de algemene zachte observatie uit het leermodel.

/** Feitenrij onder de titel: datum · duur · bereik · gezelschap — alleen echte velden. */
export function memoryFacts(memory: Memory, experience: Experience | undefined): string[] {
  const facts: string[] = [memory.date.toLowerCase()];
  const duration = experience?.duration ?? memory.experienceSnapshot?.duration;
  if (duration) facts.push(`${duration} min`);
  const distance = experience?.distance ?? memory.experienceSnapshot?.distance;
  if (distance) facts.push(distance);
  if (memory.sharedWith?.length) facts.push(`samen met ${memory.sharedWith.join(', ')}`);
  else facts.push('alleen');
  return facts;
}

export type BookStat = { value: string; label: string };

/**
 * Statistiekentrio: alleen getallen die ergens vandaan komen.
 * - minuten: duur van de ervaring (capsule of snapshot).
 * - keer bewaard: hoe vaak deze titel in de bewaarde momenten voorkomt.
 * - vervolg: de eerlijkste "zou je dit opnieuw doen?"-uitspraak uit je
 *   reflecties over deze ervaring, anders de uitkomst ("de moeite waard").
 * Ontbreekt alles aan reflectie, dan blijft het bij twee echte getallen.
 */
export function memoryStats(memory: Memory, memories: Memory[], reflections: ReflectionMemory[]): BookStat[] {
  const stats: BookStat[] = [];
  const duration = memory.experienceSnapshot?.duration;
  if (duration) stats.push({ value: `${duration}`, label: 'minuten' });
  const timesKept = memories.filter((item) => item.title === memory.title).length;
  stats.push({ value: `${timesKept}`, label: timesKept === 1 ? 'keer bewaard' : 'keer bewaard' });
  const own = reflections
    .filter((reflection) => reflection.experienceTitle === memory.title || reflection.experienceId === memory.experienceSnapshot?.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const latest = own[0];
  if (latest?.doAgain) stats.push({ value: doAgainLabels[latest.doAgain].toLowerCase(), label: 'opnieuw doen?' });
  else if (latest?.outcome === 'worth-it' || latest?.outcome === 'repeat') stats.push({ value: 'de moeite waard', label: 'jouw oordeel' });
  else if (memory.photos?.length) stats.push({ value: `${memory.photos.length}`, label: memory.photos.length === 1 ? 'foto' : "foto's" });
  return stats.slice(0, 3);
}

export type BookObservation = { text: string; accents: string[] };

/**
 * "Momentum merkt" voor dit moment: het hoeveelste bewaarde moment met deze
 * titel, aangevuld met wat je reflecties erover zeiden (opnieuw doen, oordeel).
 * Alles is een telling over echte data. Zonder herhaling of reflectie: de
 * algemene zachte observatie van het leermodel (ADR-061), en als ook die
 * ontbreekt valt de kaart weg.
 */
export function memoryObservation(memory: Memory, memories: Memory[], reflections: ReflectionMemory[], personal: PersonalProfile): BookObservation | undefined {
  const timesKept = memories.filter((item) => item.title === memory.title).length;
  const own = reflections.filter((reflection) => reflection.experienceTitle === memory.title || reflection.experienceId === memory.experienceSnapshot?.id);
  const kind = memory.experienceSnapshot?.kind;
  const kindLabel = kind ? experienceKindLabels[kind].toLowerCase() : undefined;
  if (timesKept >= 2 || own.length >= 1) {
    const accents: string[] = [`${timesKept}e`];
    let text = `Je ${timesKept}e bewaarde "${memory.title}"`;
    const certain = own.filter((reflection) => reflection.doAgain === 'certain').length;
    const worthIt = own.filter((reflection) => reflection.outcome === 'worth-it' || reflection.outcome === 'repeat').length;
    if (certain >= 1) {
      text += ` — ${certain === 1 ? 'je zei' : `bij ${certain} reflecties zei je`} dit zeker opnieuw te willen doen.`;
      accents.push('zeker');
    } else if (worthIt >= 1) {
      text += ` — ${worthIt === 1 ? 'een keer' : `${worthIt} keer`} de moeite waard bevonden.`;
      accents.push('de moeite waard');
    } else {
      text += '.';
    }
    return { text, accents };
  }
  const gentle = deriveGentleObservations(personal)[0];
  if (gentle) return { text: gentle.replace(/^Momentum merkt: /, ''), accents: kindLabel ? [kindLabel] : [] };
  return undefined;
}

export type MonthThumb = { id: string; title: string; image: string; label: string };

/**
 * De strook met bewaarde momenten. Er is geen kalenderdatum per herinnering,
 * dus de strook heet eerlijk "Bewaarde momenten" met het echte aantal; het
 * label op elke miniatuur is de bewaarde datumtekst ("Vandaag" of ouder).
 */
export function monthStrip(memories: Memory[]): { title: string; count: string; thumbs: MonthThumb[] } {
  return {
    title: 'BEWAARDE MOMENTEN',
    count: `${memories.length} ${memories.length === 1 ? 'moment' : 'momenten'}`,
    thumbs: memories.slice(0, 12).map((memory) => ({
      id: memory.id,
      title: memory.title,
      image: memory.image,
      label: memory.date.toUpperCase(),
    })),
  };
}
