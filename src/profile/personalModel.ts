import type { Experience, ExperienceKind, InsightTopic } from '../product/experienceModel';
import type { Company } from '../product/localIntelligence';

export type Initiative = 'on-open' | 'day-rhythm' | 'proactive-later';
export type LearningOutcome = 'not-now' | 'neutral' | 'worth-it' | 'repeat' | 'not-for-me';
export type DirectionHorizon = 'near' | 'growth' | 'meaning';
export type ReflectionAspect = 'less-guidance' | 'more-guidance' | 'too-intense' | 'too-light' | 'too-long' | 'too-much-travel' | 'not-relevant' | 'content-not-useful';

export type LearningEvent = {
  id: string;
  experienceId: string;
  kind: ExperienceKind;
  outcome: Exclude<LearningOutcome, 'not-now' | 'neutral'>;
  explanation: string;
  createdAt: string;
};

export type ReflectionMemory = {
  id: string;
  experienceId: string;
  experienceTitle: string;
  kind: ExperienceKind;
  outcome: LearningOutcome;
  learningEventId?: string;
  aspects: ReflectionAspect[];
  mutedInsightTopics: InsightTopic[];
  note?: string;
  explanation: string;
  createdAt: string;
};

export type ReflectionInput = {
  outcome: LearningOutcome;
  aspects: ReflectionAspect[];
  note?: string;
};

export type PersonalProfile = {
  version: 2;
  onboardingComplete: boolean;
  firstName: string;
  aspiration: string;
  directions: Record<DirectionHorizon, string[]>;
  preferredKinds: ExperienceKind[];
  defaultCompany: Company;
  equipment: { kettlebell: boolean; bike: boolean; car: boolean };
  maxTravelMinutes: number;
  initiative: Initiative;
  kindAffinity: Record<ExperienceKind, number>;
  guidanceBalance: number;
  durationBiasMinutes: number;
  intensityBalance: number;
  travelBiasMinutes: number;
  mutedInsightTopics: InsightTopic[];
  blockedExperienceIds: string[];
  favoriteExperienceIds: string[];
  recentExperienceIds: string[];
  learningEvents: LearningEvent[];
  reflectionMemories: ReflectionMemory[];
};

export const experienceKindLabels: Record<ExperienceKind, string> = {
  outside: 'Buiten & natuur', food: 'Koken & voeding', movement: 'Bewegen', restore: 'Rust & herstel',
  connect: 'Samen beleven', learn: 'Leren & maken', culture: 'Cultuur & eropuit',
};

export const initiativeLabels: Record<Initiative, string> = {
  'on-open': 'Alleen wanneer ik open', 'day-rhythm': 'Ook passende momenten vandaag', 'proactive-later': 'Later ook subtiel proactief',
};

export const reflectionAspectLabels: Record<ReflectionAspect, string> = {
  'less-guidance': 'Minder uitleg', 'more-guidance': 'Meer uitleg', 'too-intense': 'Te zwaar', 'too-light': 'Te licht',
  'too-long': 'Te lang', 'too-much-travel': 'Te veel reistijd', 'not-relevant': 'Paste niet bij mij', 'content-not-useful': 'Deze inhoud hoef ik niet',
};

export const directionLabels: Record<DirectionHorizon, { title: string; body: string }> = {
  near: { title: 'Voor de komende tijd', body: 'Concrete ruimte voor de komende dagen of weken.' },
  growth: { title: 'Waarin ik wil groeien', body: 'Richtingen voor de komende maanden, zonder prestatiedruk.' },
  meaning: { title: 'Wat voor mij betekenis heeft', body: 'Rollen en waarden die jij zelf belangrijk noemt.' },
};

const emptyAffinity = (): Record<ExperienceKind, number> => ({ outside: 0, food: 0, movement: 0, restore: 0, connect: 0, learn: 0, culture: 0 });
const emptyDirections = (): Record<DirectionHorizon, string[]> => ({ near: [], growth: [], meaning: [] });
const clamp = (value: number, min = -0.6, max = 0.8) => Math.max(min, Math.min(max, value));

export function defaultPersonalProfile(): PersonalProfile {
  return {
    version: 2, onboardingComplete: false, firstName: '', aspiration: '', directions: emptyDirections(), preferredKinds: [], defaultCompany: 'solo',
    equipment: { kettlebell: false, bike: false, car: false }, maxTravelMinutes: 20, initiative: 'day-rhythm', kindAffinity: emptyAffinity(),
    guidanceBalance: 0, durationBiasMinutes: 0, intensityBalance: 0, travelBiasMinutes: 0, mutedInsightTopics: [], blockedExperienceIds: [], favoriteExperienceIds: [],
    recentExperienceIds: [], learningEvents: [], reflectionMemories: [],
  };
}

export function hydratePersonalProfile(value: unknown): PersonalProfile {
  const base = defaultPersonalProfile();
  if (!value || typeof value !== 'object') return base;
  const stored = value as Partial<PersonalProfile> & { version?: number; directions?: Partial<Record<DirectionHorizon, string[]>> };
  const legacyAspiration = typeof stored.aspiration === 'string' ? stored.aspiration.trim() : '';
  return {
    ...base,
    ...stored,
    version: 2,
    equipment: { ...base.equipment, ...(stored.equipment ?? {}) },
    kindAffinity: { ...base.kindAffinity, ...(stored.kindAffinity ?? {}) },
    directions: {
      near: stored.directions?.near ?? (legacyAspiration ? [legacyAspiration] : []),
      growth: stored.directions?.growth ?? [],
      meaning: stored.directions?.meaning ?? [],
    },
    mutedInsightTopics: stored.mutedInsightTopics ?? [],
    reflectionMemories: stored.reflectionMemories ?? [],
  };
}

export function completeOnboarding(profile: PersonalProfile): PersonalProfile {
  const seeded = emptyAffinity();
  profile.preferredKinds.forEach((kind) => { seeded[kind] = 0.18; });
  const near = profile.directions.near.length ? profile.directions.near : profile.aspiration.trim() ? [profile.aspiration.trim()] : [];
  return { ...profile, version: 2, onboardingComplete: true, directions: { ...profile.directions, near }, kindAffinity: seeded };
}

export function applyLearning(profile: PersonalProfile, experience: Experience, outcome: LearningOutcome): PersonalProfile {
  if (outcome === 'not-now' || outcome === 'neutral') return profile;
  const delta = outcome === 'not-for-me' ? -0.18 : outcome === 'repeat' ? 0.16 : 0.08;
  const explanation = outcome === 'not-for-me' ? `Je gaf expliciet aan dat ${experience.title} niet bij je past.` : outcome === 'repeat'
    ? `Je koos bewust om ${experience.title} nog eens te beleven.` : `Je bewaarde ${experience.title} als de moeite waard.`;
  const event: LearningEvent = { id: `${experience.id}-${Date.now()}`, experienceId: experience.id, kind: experience.kind, outcome, explanation, createdAt: new Date().toISOString() };
  return {
    ...profile,
    kindAffinity: { ...profile.kindAffinity, [experience.kind]: clamp(profile.kindAffinity[experience.kind] + delta) },
    blockedExperienceIds: outcome === 'not-for-me' ? Array.from(new Set([...profile.blockedExperienceIds, experience.id])) : profile.blockedExperienceIds,
    favoriteExperienceIds: outcome === 'repeat' ? Array.from(new Set([experience.id, ...profile.favoriteExperienceIds])).slice(0, 20) : profile.favoriteExperienceIds,
    recentExperienceIds: outcome === 'not-for-me' ? profile.recentExperienceIds : [experience.id, ...profile.recentExperienceIds.filter((id) => id !== experience.id)].slice(0, 8),
    learningEvents: [event, ...profile.learningEvents].slice(0, 30),
  };
}

function rebuildLearning(profile: PersonalProfile, learningEvents: LearningEvent[], reflectionMemories: ReflectionMemory[]): PersonalProfile {
  const affinity = emptyAffinity();
  profile.preferredKinds.forEach((kind) => { affinity[kind] = 0.18; });
  let blockedExperienceIds: string[] = [];
  let favoriteExperienceIds: string[] = [];
  let recentExperienceIds: string[] = [];

  [...learningEvents].reverse().forEach((event) => {
    const delta = event.outcome === 'not-for-me' ? -0.18 : event.outcome === 'repeat' ? 0.16 : 0.08;
    affinity[event.kind] = clamp(affinity[event.kind] + delta);
    if (event.outcome === 'not-for-me') blockedExperienceIds = Array.from(new Set([...blockedExperienceIds, event.experienceId]));
    else recentExperienceIds = [event.experienceId, ...recentExperienceIds.filter((id) => id !== event.experienceId)].slice(0, 8);
    if (event.outcome === 'repeat') favoriteExperienceIds = Array.from(new Set([event.experienceId, ...favoriteExperienceIds])).slice(0, 20);
  });

  let guidanceBalance = 0;
  let durationBiasMinutes = 0;
  let intensityBalance = 0;
  let travelBiasMinutes = 0;
  const mutedInsightTopics: InsightTopic[] = [];
  [...reflectionMemories].reverse().forEach((memory) => {
    if (memory.aspects.includes('not-relevant')) affinity[memory.kind] = clamp(affinity[memory.kind] - 0.08);
    guidanceBalance = clamp(guidanceBalance + (memory.aspects.includes('more-guidance') ? 0.25 : 0) - (memory.aspects.includes('less-guidance') ? 0.25 : 0), -1, 1);
    durationBiasMinutes = clamp(durationBiasMinutes - (memory.aspects.includes('too-long') ? 5 : 0), -30, 15);
    intensityBalance = clamp(intensityBalance + (memory.aspects.includes('too-light') ? 0.25 : 0) - (memory.aspects.includes('too-intense') ? 0.25 : 0), -1, 1);
    travelBiasMinutes = clamp(travelBiasMinutes - (memory.aspects.includes('too-much-travel') ? 5 : 0), -30, 0);
    memory.mutedInsightTopics.forEach((topic) => { if (!mutedInsightTopics.includes(topic)) mutedInsightTopics.push(topic); });
  });

  return { ...profile, kindAffinity: affinity, blockedExperienceIds, favoriteExperienceIds, recentExperienceIds, guidanceBalance, durationBiasMinutes, intensityBalance, travelBiasMinutes, mutedInsightTopics, learningEvents, reflectionMemories };
}

const aspectExplanation = (aspects: ReflectionAspect[]) => aspects.map((aspect) => reflectionAspectLabels[aspect].toLowerCase()).join(', ');

export function applyReflection(profile: PersonalProfile, experience: Experience, input: ReflectionInput): PersonalProfile {
  let next = applyLearning(profile, experience, input.outcome);
  const learningEventId = next.learningEvents[0]?.id !== profile.learningEvents[0]?.id ? next.learningEvents[0]?.id : undefined;
  const topics = Array.from(new Set(experience.steps.flatMap((step) => step.insight?.topic ? [step.insight.topic] : [])));
  const muteTopics = input.aspects.includes('content-not-useful') ? topics : [];
  const kindPenalty = input.aspects.includes('not-relevant') && input.outcome !== 'not-for-me' ? -0.08 : 0;
  const explanation = input.aspects.length
    ? `Bij ${experience.title} wilde je: ${aspectExplanation(input.aspects)}.`
    : input.outcome === 'neutral' ? `Je bewaarde ${experience.title} zonder je profiel te veranderen.` : `Je reflecteerde op ${experience.title}.`;
  const memory: ReflectionMemory = {
    id: `reflection-${experience.id}-${Date.now()}`, experienceId: experience.id, experienceTitle: experience.title, kind: experience.kind,
    outcome: input.outcome, learningEventId, aspects: input.aspects, mutedInsightTopics: muteTopics, note: input.note?.trim() || undefined, explanation, createdAt: new Date().toISOString(),
  };
  next = {
    ...next,
    kindAffinity: { ...next.kindAffinity, [experience.kind]: clamp(next.kindAffinity[experience.kind] + kindPenalty) },
    guidanceBalance: clamp(next.guidanceBalance + (input.aspects.includes('more-guidance') ? 0.25 : 0) - (input.aspects.includes('less-guidance') ? 0.25 : 0), -1, 1),
    durationBiasMinutes: clamp(next.durationBiasMinutes - (input.aspects.includes('too-long') ? 5 : 0), -30, 15),
    intensityBalance: clamp(next.intensityBalance + (input.aspects.includes('too-light') ? 0.25 : 0) - (input.aspects.includes('too-intense') ? 0.25 : 0), -1, 1),
    travelBiasMinutes: clamp(next.travelBiasMinutes - (input.aspects.includes('too-much-travel') ? 5 : 0), -30, 0),
    mutedInsightTopics: Array.from(new Set([...next.mutedInsightTopics, ...muteTopics])),
    reflectionMemories: [memory, ...next.reflectionMemories].slice(0, 40),
  };
  return next;
}

export function forgetReflection(profile: PersonalProfile, reflectionId: string): PersonalProfile {
  const removed = profile.reflectionMemories.find((memory) => memory.id === reflectionId);
  if (!removed) return profile;
  const reflections = profile.reflectionMemories.filter((memory) => memory.id !== reflectionId);
  const events = removed.learningEventId ? profile.learningEvents.filter((event) => event.id !== removed.learningEventId) : profile.learningEvents;
  return rebuildLearning(profile, events, reflections);
}

export function forgetLearningEvent(profile: PersonalProfile, eventId: string): PersonalProfile {
  const events = profile.learningEvents.filter((event) => event.id !== eventId);
  const reflections = profile.reflectionMemories.filter((memory) => memory.learningEventId !== eventId);
  return rebuildLearning(profile, events, reflections);
}

export function directionTerms(profile: PersonalProfile): string[] {
  return Object.values(profile.directions).flat().flatMap((value) => value.toLocaleLowerCase('nl-NL').split(/[^\p{L}\p{N}]+/u)).filter((value) => value.length >= 4);
}

export function resetLearning(profile: PersonalProfile): PersonalProfile {
  const seeded = emptyAffinity();
  profile.preferredKinds.forEach((kind) => { seeded[kind] = 0.18; });
  return { ...profile, kindAffinity: seeded, guidanceBalance: 0, durationBiasMinutes: 0, intensityBalance: 0, travelBiasMinutes: 0, mutedInsightTopics: [], blockedExperienceIds: [], favoriteExperienceIds: [], recentExperienceIds: [], learningEvents: [], reflectionMemories: [] };
}
