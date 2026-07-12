import type { Experience, ExperienceKind } from '../product/experienceModel';
import type { Company } from '../product/localIntelligence';

export type Initiative = 'on-open' | 'day-rhythm' | 'proactive-later';
export type LearningOutcome = 'not-now' | 'neutral' | 'worth-it' | 'repeat' | 'not-for-me';

export type LearningEvent = {
  id: string;
  experienceId: string;
  kind: ExperienceKind;
  outcome: Exclude<LearningOutcome, 'not-now' | 'neutral'>;
  explanation: string;
  createdAt: string;
};

export type PersonalProfile = {
  version: 1;
  onboardingComplete: boolean;
  firstName: string;
  aspiration: string;
  preferredKinds: ExperienceKind[];
  defaultCompany: Company;
  equipment: { kettlebell: boolean; bike: boolean; car: boolean };
  maxTravelMinutes: number;
  initiative: Initiative;
  kindAffinity: Record<ExperienceKind, number>;
  blockedExperienceIds: string[];
  favoriteExperienceIds: string[];
  recentExperienceIds: string[];
  learningEvents: LearningEvent[];
};

export const experienceKindLabels: Record<ExperienceKind, string> = {
  outside: 'Buiten & natuur',
  food: 'Koken & voeding',
  movement: 'Bewegen',
  restore: 'Rust & herstel',
  connect: 'Samen beleven',
  learn: 'Leren & maken',
  culture: 'Cultuur & eropuit',
};

export const initiativeLabels: Record<Initiative, string> = {
  'on-open': 'Alleen wanneer ik open',
  'day-rhythm': 'Ook passende momenten vandaag',
  'proactive-later': 'Later ook subtiel proactief',
};

const emptyAffinity = (): Record<ExperienceKind, number> => ({
  outside: 0, food: 0, movement: 0, restore: 0, connect: 0, learn: 0, culture: 0,
});

export function defaultPersonalProfile(): PersonalProfile {
  return {
    version: 1,
    onboardingComplete: false,
    firstName: '',
    aspiration: '',
    preferredKinds: [],
    defaultCompany: 'solo',
    equipment: { kettlebell: false, bike: false, car: false },
    maxTravelMinutes: 20,
    initiative: 'day-rhythm',
    kindAffinity: emptyAffinity(),
    blockedExperienceIds: [],
    favoriteExperienceIds: [],
    recentExperienceIds: [],
    learningEvents: [],
  };
}

export function completeOnboarding(profile: PersonalProfile): PersonalProfile {
  const seeded = emptyAffinity();
  profile.preferredKinds.forEach((kind) => { seeded[kind] = 0.18; });
  return { ...profile, onboardingComplete: true, kindAffinity: seeded };
}

const clamp = (value: number) => Math.max(-0.6, Math.min(0.8, value));

export function applyLearning(profile: PersonalProfile, experience: Experience, outcome: LearningOutcome): PersonalProfile {
  // A situational decline is deliberately not a durable learning signal.
  if (outcome === 'not-now' || outcome === 'neutral') return profile;

  const delta = outcome === 'not-for-me' ? -0.18 : outcome === 'repeat' ? 0.16 : 0.08;
  const explanation = outcome === 'not-for-me'
    ? `Je gaf expliciet aan dat ${experience.title} niet bij je past.`
    : outcome === 'repeat'
      ? `Je koos bewust om ${experience.title} nog eens te beleven.`
      : `Je bewaarde ${experience.title} als de moeite waard.`;
  const event: LearningEvent = {
    id: `${experience.id}-${Date.now()}`,
    experienceId: experience.id,
    kind: experience.kind,
    outcome,
    explanation,
    createdAt: new Date().toISOString(),
  };

  return {
    ...profile,
    kindAffinity: { ...profile.kindAffinity, [experience.kind]: clamp(profile.kindAffinity[experience.kind] + delta) },
    blockedExperienceIds: outcome === 'not-for-me'
      ? Array.from(new Set([...profile.blockedExperienceIds, experience.id]))
      : profile.blockedExperienceIds,
    favoriteExperienceIds: outcome === 'repeat'
      ? Array.from(new Set([experience.id, ...profile.favoriteExperienceIds])).slice(0, 20)
      : profile.favoriteExperienceIds,
    recentExperienceIds: outcome === 'not-for-me'
      ? profile.recentExperienceIds
      : [experience.id, ...profile.recentExperienceIds.filter((id) => id !== experience.id)].slice(0, 8),
    learningEvents: [event, ...profile.learningEvents].slice(0, 30),
  };
}

export function resetLearning(profile: PersonalProfile): PersonalProfile {
  const seeded = emptyAffinity();
  profile.preferredKinds.forEach((kind) => { seeded[kind] = 0.18; });
  return {
    ...profile,
    kindAffinity: seeded,
    blockedExperienceIds: [],
    favoriteExperienceIds: [],
    recentExperienceIds: [],
    learningEvents: [],
  };
}
