export type CoreFeeling = 'calm' | 'energy' | 'surprise' | 'connection' | 'challenge';

export type MomentContext = {
  availableMinutes: number;
  desiredFeeling?: CoreFeeling;
  setting: 'work';
  equipment: string[];
  profileAffinity: Record<CoreFeeling, number>;
};

export type ExperienceCandidate = {
  id: string;
  feeling: CoreFeeling;
  minimumMinutes: number;
  idealMinutes: number;
  friction: number;
  presencePotential: number;
  requiredEquipment?: string[];
};

export type RankedCandidate = ExperienceCandidate & {
  score: number;
  reasons: string[];
};

export type DecisionResult = {
  selected: RankedCandidate;
  runnerUp?: RankedCandidate;
  considered: number;
  rejected: number;
  confidence: 'high' | 'medium';
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

const hasRequiredEquipment = (candidate: ExperienceCandidate, context: MomentContext) =>
  (candidate.requiredEquipment ?? []).every((item) => context.equipment.includes(item));

export function selectExperience(
  context: MomentContext,
  candidates: ExperienceCandidate[],
): DecisionResult {
  const feasible = candidates.filter(
    (candidate) =>
      candidate.minimumMinutes <= context.availableMinutes &&
      hasRequiredEquipment(candidate, context),
  );

  if (feasible.length === 0) {
    throw new Error('The local prototype requires at least one permission-light fallback.');
  }

  const ranked = feasible
    .map<RankedCandidate>((candidate) => {
      const reasons: string[] = [];
      let score = 0;

      if (context.desiredFeeling) {
        if (candidate.feeling === context.desiredFeeling) {
          score += 60;
          reasons.push('past bij het gevoel dat jij koos');
        } else {
          score -= 35;
        }
      } else {
        const affinity = context.profileAffinity[candidate.feeling];
        score += affinity * 28;
        if (affinity >= 0.75) reasons.push('past bij je lokale proefprofiel');
      }

      const timeFit = 1 - Math.abs(context.availableMinutes * 0.55 - candidate.idealMinutes) / context.availableMinutes;
      score += clamp(timeFit, 0, 1) * 22;
      reasons.push('past binnen de beschikbare tijd');

      score += (1 - candidate.friction) * 10;
      score += candidate.presencePotential * 10;

      if ((candidate.requiredEquipment ?? []).length === 0) {
        reasons.push('kan zonder extra voorbereiding beginnen');
      } else {
        reasons.push('benodigde uitrusting is in deze lokale scène beschikbaar');
      }

      return { ...candidate, score: Math.round(score), reasons: reasons.slice(0, 3) };
    })
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  const runnerUp = ranked.find((candidate) => candidate.feeling !== ranked[0].feeling) ?? ranked[1];
  const margin = runnerUp ? ranked[0].score - runnerUp.score : ranked[0].score;

  return {
    selected: ranked[0],
    runnerUp,
    considered: candidates.length,
    rejected: candidates.length - feasible.length,
    confidence: margin >= 15 ? 'high' : 'medium',
  };
}
