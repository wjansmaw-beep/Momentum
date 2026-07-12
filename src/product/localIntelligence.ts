import { Experience, ExperienceKind, experiences } from './experienceModel';

export type DayPart = 'morning' | 'midday' | 'afternoon' | 'evening';
export type PrototypeProfile = 'balanced' | 'explorer' | 'mover' | 'family';
export type Company = 'solo' | 'together' | 'family';

export type PrototypeContext = {
  dayPart: DayPart;
  profile: PrototypeProfile;
  company: Company;
  availableMinutes: number;
  hasKettlebell: boolean;
};

export type DecisionReason = { certainty: 'chosen' | 'calculated' | 'unknown'; text: string };
export type RankedExperience = { experience: Experience; score: number; reasons: DecisionReason[] };
export type LocalDecision = {
  selected?: RankedExperience;
  alternative?: RankedExperience;
  confidence: 'high' | 'medium' | 'low';
  considered: number;
  rejected: number;
};

export type PersonalLearningContext = {
  kindAffinity: Partial<Record<ExperienceKind, number>>;
  blockedExperienceIds: string[];
  favoriteExperienceIds: string[];
  recentExperienceIds: string[];
};

export const dayPartLabels: Record<DayPart, string> = {
  morning: 'Ochtend', midday: 'Middag', afternoon: 'Namiddag', evening: 'Avond',
};

export const profileLabels: Record<PrototypeProfile, { title: string; body: string }> = {
  balanced: { title: 'Open', body: 'laat verschillende ervaringen toe' },
  explorer: { title: 'Ontdekker', body: 'merkt graag natuur en nieuwe details op' },
  mover: { title: 'Beweger', body: 'krijgt vaak energie van actie' },
  family: { title: 'Samen', body: 'maakt graag ruimte voor gedeelde momenten' },
};

const profileAffinity: Record<PrototypeProfile, Partial<Record<ExperienceKind, number>>> = {
  balanced: { outside: 5, food: 5, movement: 5, restore: 5, connect: 5, learn: 5, culture: 5 },
  explorer: { outside: 18, culture: 12, learn: 9, movement: 6 },
  mover: { movement: 20, outside: 10, restore: 5 },
  family: { connect: 20, food: 11, outside: 10 },
};

const dayFit: Record<DayPart, Record<string, number>> = {
  morning: { 'morning-shake': 30, 'free-cycle': 10, 'small-reading': 8, 'work-reset': 5 },
  midday: { 'work-reset': 30, 'small-reading': 12, 'family-mission': 8, 'pantry-dinner': -12 },
  afternoon: { 'kettlebell-focus': 26, 'free-cycle': 22, 'family-mission': 15, 'small-reading': 8 },
  evening: { 'wadden-light': 28, 'pantry-dinner': 24, 'family-mission': 13, 'work-reset': 8 },
};

const containsIntent = (experience: Experience, intent: string) =>
  experience.keywords.reduce((score, keyword) => score + (intent.includes(keyword) ? 42 : 0), 0);

const equipmentAllowed = (experience: Experience, context: PrototypeContext) =>
  experience.id !== 'kettlebell-focus' || context.hasKettlebell;

const companyAllowed = (experience: Experience, context: PrototypeContext) =>
  experience.company.includes(context.company);

export function rankForMoment(context: PrototypeContext, intentText = '', excludedIds: string[] = [], candidatePool: Experience[] = experiences, learning?: PersonalLearningContext): LocalDecision {
  const intent = intentText.toLocaleLowerCase('nl-NL').trim();
  const feasible = candidatePool.filter((experience) =>
    !excludedIds.includes(experience.id)
    && !learning?.blockedExperienceIds.includes(experience.id)
    && experience.duration + 5 <= context.availableMinutes
    && equipmentAllowed(experience, context)
    && companyAllowed(experience, context));

  if (!feasible.length) {
    return { confidence: 'low', considered: candidatePool.length, rejected: candidatePool.length };
  }

  const ranked = feasible.map<RankedExperience>((experience) => {
    const reasons: DecisionReason[] = [];
    let score = 0;

    const explicitScore = intent ? containsIntent(experience, intent) : 0;
    if (explicitScore) {
      score += explicitScore;
      reasons.push({ certainty: 'chosen', text: 'past bij je eigen woorden voor dit moment' });
    }

    const temporal = dayFit[context.dayPart][experience.id] ?? 0;
    score += temporal;
    if (temporal >= 15) reasons.push({ certainty: 'chosen', text: `past bij de gekozen ${dayPartLabels[context.dayPart].toLowerCase()}` });

    const affinity = profileAffinity[context.profile][experience.kind] ?? 0;
    score += affinity;
    if (affinity >= 10) reasons.push({ certainty: 'chosen', text: `sluit aan bij proefprofiel ${profileLabels[context.profile].title}` });

    const target = context.availableMinutes * 0.65;
    const timeScore = Math.max(0, 18 - Math.abs(target - experience.duration) * 0.45);
    score += timeScore;
    reasons.push({ certainty: 'calculated', text: `past met buffer binnen ${context.availableMinutes} minuten` });

    if (context.company !== 'solo') reasons.push({ certainty: 'chosen', text: `geschikt voor ${context.company === 'family' ? 'gezin' : 'samen'}` });
    if (experience.liveEvidence?.length) {
      score += 24;
      reasons.unshift({ certainty: 'calculated', text: 'actuele brongegevens maken dit moment onderscheidend' });
    }
    if (experience.prepare.length <= 4) score += 5;

    const learnedAffinity = learning?.kindAffinity[experience.kind] ?? 0;
    score += learnedAffinity * 45;
    if (learnedAffinity >= 0.15) reasons.push({ certainty: 'chosen', text: 'sluit aan bij voorkeuren die jij zelf bevestigde' });
    if (learning?.favoriteExperienceIds.includes(experience.id)) {
      score += 8;
      reasons.push({ certainty: 'chosen', text: 'je koos eerder bewust voor nog eens doen' });
    }
    const recentIndex = learning?.recentExperienceIds.indexOf(experience.id) ?? -1;
    if (recentIndex >= 0) score -= Math.max(5, 18 - recentIndex * 3);

    return { experience, score: Math.round(score), reasons: reasons.slice(0, 3) };
  }).sort((a, b) => b.score - a.score || a.experience.id.localeCompare(b.experience.id));

  const alternative = ranked.find((item) => item.experience.kind !== ranked[0].experience.kind) ?? ranked[1];
  const margin = alternative ? ranked[0].score - alternative.score : ranked[0].score;
  return {
    selected: ranked[0], alternative,
    confidence: margin >= 18 ? 'high' : margin >= 7 ? 'medium' : 'low',
    considered: candidatePool.length,
    rejected: candidatePool.length - feasible.length,
  };
}

export type TodayDecision = { dayPart: DayPart; label: string; time: string; result: RankedExperience };
export type AvailabilityWindow = { start: string; end: string; minutes: number };

const dayPartForHour = (hour: number): DayPart => hour < 10 ? 'morning' : hour < 14 ? 'midday' : hour < 18 ? 'afternoon' : 'evening';
const clock = (date: Date) => date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

export function buildToday(context: PrototypeContext, liveExperiences: Experience[] = [], learning?: PersonalLearningContext, availability?: AvailabilityWindow[]): TodayDecision[] {
  const fallbackWindows: Array<{ dayPart: DayPart; label: string; time: string; minutes: number }> = [
    { dayPart: 'morning', label: 'OCHTEND', time: '07:30 – 09:00', minutes: 45 },
    { dayPart: 'midday', label: 'MIDDAG', time: '12:20 – 13:30', minutes: 30 },
    { dayPart: 'afternoon', label: 'EIND VAN DE MIDDAG', time: '16:00 – 18:00', minutes: 60 },
    { dayPart: 'evening', label: 'AVOND', time: '19:30 – 21:00', minutes: 75 },
  ];
  const today = new Date().toDateString();
  const calendarWindows = (availability ?? []).filter((window) => new Date(window.start).toDateString() === today).slice(0, 4).map((window) => {
    const start = new Date(window.start); const end = new Date(window.end);
    return { dayPart: dayPartForHour(start.getHours()), label: `${dayPartLabels[dayPartForHour(start.getHours())].toUpperCase()} · AGENDA`, time: `${clock(start)} – ${clock(end)}`, minutes: Math.min(120, window.minutes) };
  });
  const windows = calendarWindows.length ? calendarWindows : fallbackWindows;
  const used: string[] = [];
  const candidatePool = [...liveExperiences, ...experiences];
  return windows.flatMap((window) => {
    const decision = rankForMoment({ ...context, dayPart: window.dayPart, availableMinutes: window.minutes }, '', used, candidatePool, learning);
    if (!decision.selected) return [];
    used.push(decision.selected.experience.id);
    return [{ ...window, result: decision.selected }];
  });
}

export function defaultPrototypeContext(): PrototypeContext {
  const hour = new Date().getHours();
  const dayPart: DayPart = hour < 10 ? 'morning' : hour < 14 ? 'midday' : hour < 18 ? 'afternoon' : 'evening';
  return { dayPart, profile: 'explorer', company: 'solo', availableMinutes: 60, hasKettlebell: true };
}
