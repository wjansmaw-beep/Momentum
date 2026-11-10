import type { Experience } from './experienceModel';
import { rankForMoment, type PersonalLearningContext, type PrototypeContext } from './localIntelligence';

export type MomentRefinement = 'open' | 'nature' | 'family' | 'closer' | 'adventure';
export const refinementLabels: Record<MomentRefinement, string> = {
  open: 'Laat Momentum kiezen', nature: 'Meer natuur', family: 'Met het gezin',
  closer: 'Minder reistijd', adventure: 'Meer avontuur',
};

// Pure, moment-scoped input to the existing ranker. Never mutate profile/context.
export function refinedRecommendation(context: PrototypeContext, pool: Experience[], learning: PersonalLearningContext, choice: MomentRefinement) {
  const intent = choice === 'nature' ? 'natuur buiten' : choice === 'adventure' ? 'ontdekken avontuur' : '';
  const candidates = choice === 'nature' ? pool.filter(e => e.kind === 'outside' || e.keywords.includes('natuur'))
    : choice === 'adventure' ? pool.filter(e => ['outside', 'culture', 'learn'].includes(e.kind)) : pool;
  const scopedContext = choice === 'family' ? { ...context, company: 'family' as const } : context;
  const scopedLearning = choice === 'closer' ? { ...learning, maxTravelMinutes: Math.min(10, learning.maxTravelMinutes), travelBiasMinutes: 0 } : learning;
  return rankForMoment(scopedContext, intent, [], candidates, scopedLearning);
}
