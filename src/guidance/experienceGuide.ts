import { CapsuleStep, Experience, GuidedInsight, LiveEvidence } from '../product/experienceModel';

export type GuideDepth = 'quiet' | 'guide' | 'deep';
export type EvidenceFreshness = 'current' | 'expired' | 'unknown';

export type GuideEvidence = LiveEvidence & {
  freshness: EvidenceFreshness;
  freshnessLabel: string;
};

export type ExperienceGuide = {
  title: string;
  promise: string;
  currentStep: CapsuleStep;
  currentInsight?: GuidedInsight;
  furtherInsights: GuidedInsight[];
  practical: string[];
  evidence: GuideEvidence[];
  coverage: 'live' | 'editorial' | 'hybrid' | 'evergreen';
  coverageLabel: string;
  compositionLabel?: string;
};

export function evidenceFreshness(evidence: LiveEvidence, now = Date.now()): GuideEvidence {
  const expiresAt = Date.parse(evidence.expiresAt);
  if (!Number.isFinite(expiresAt)) {
    return { ...evidence, freshness: 'unknown', freshnessLabel: 'Bronvenster onbekend' };
  }
  if (expiresAt <= now) {
    return { ...evidence, freshness: 'expired', freshnessLabel: 'Verlopen · niet gebruikt als actuele aanwijzing' };
  }
  return { ...evidence, freshness: 'current', freshnessLabel: 'Actueel binnen het bronvenster' };
}

export function currentEvidence(experience: Experience, now = Date.now()) {
  return (experience.liveEvidence ?? []).map((item) => evidenceFreshness(item, now)).filter((item) => item.freshness === 'current');
}

export function buildExperienceGuide(experience: Experience, stepIndex: number, now = Date.now()): ExperienceGuide {
  const currentStep = experience.steps[Math.min(Math.max(stepIndex, 0), Math.max(0, experience.steps.length - 1))] ?? {
    title: experience.presenceTitle,
    instruction: experience.presenceCue,
  };
  const evidence = (experience.liveEvidence ?? []).map((item) => evidenceFreshness(item, now));
  const hasCurrentEvidence = evidence.some((item) => item.freshness === 'current');
  const insights = experience.steps.flatMap((step) => step.insight ? [step.insight] : []);
  const hasEditorial = insights.some((item) => item.sourceKind !== 'live');
  const coverage = hasCurrentEvidence && hasEditorial ? 'hybrid' : hasCurrentEvidence ? 'live' : hasEditorial ? 'editorial' : 'evergreen';
  const coverageLabel = coverage === 'hybrid'
    ? 'Actuele bronnen en redactionele gids'
    : coverage === 'live'
      ? 'Actuele bronnen beschikbaar'
      : coverage === 'editorial'
        ? 'Redactionele gids · geen actuele bron nodig'
        : 'Wereldwijd bruikbaar · geen actuele bron beschikbaar';

  return {
    title: experience.title,
    promise: experience.promise,
    currentStep,
    currentInsight: currentStep.insight,
    furtherInsights: insights.filter((item) => item !== currentStep.insight),
    practical: experience.prepare,
    evidence,
    coverage,
    coverageLabel,
    compositionLabel: experience.guideOrigin?.label,
  };
}
