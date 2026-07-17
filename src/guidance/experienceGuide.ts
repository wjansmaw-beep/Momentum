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
    return { ...evidence, freshness: 'expired', freshnessLabel: `Verlopen sinds ${new Date(expiresAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} · niet gebruikt` };
  }
  return { ...evidence, freshness: 'current', freshnessLabel: `Actueel tot ${new Date(expiresAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}` };
}

export function currentEvidence(experience: Experience, now = Date.now()) {
  return (experience.liveEvidence ?? []).map((item) => evidenceFreshness(item, now)).filter((item) => item.freshness === 'current');
}

export function evidenceSummary(experience: Experience, now = Date.now()) {
  const evidence = (experience.liveEvidence ?? []).map((item) => evidenceFreshness(item, now));
  const current = evidence.filter((item) => item.freshness === 'current');
  const expiry = current.map((item) => Date.parse(item.expiresAt)).filter(Number.isFinite).sort((a, b) => a - b)[0];
  return {
    currentCount: current.length,
    expiredCount: evidence.filter((item) => item.freshness === 'expired').length,
    label: current.length ? `${current.length} actuele ${current.length === 1 ? 'bron' : 'bronnen'}${expiry ? ` · tot ${new Date(expiry).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}` : ''}` : evidence.length ? 'Bronvenster verlopen' : 'Wereldwijd bruikbaar',
  };
}

export function buildExperienceGuide(experience: Experience, stepIndex: number, now = Date.now()): ExperienceGuide {
  const currentStep = experience.steps[Math.min(Math.max(stepIndex, 0), Math.max(0, experience.steps.length - 1))] ?? {
    title: experience.presenceTitle,
    instruction: experience.presenceCue,
  };
  const evidence = (experience.liveEvidence ?? []).map((item) => evidenceFreshness(item, now));
  const hasCurrentEvidence = evidence.some((item) => item.freshness === 'current');
  const placeKnowledgeInsight: GuidedInsight | undefined = experience.placeKnowledge ? {
    title: experience.placeKnowledge.title,
    body: experience.placeKnowledge.summary,
    topic: experience.kind === 'culture' ? 'culture' : 'place',
    sourceKind: 'curator',
    sourceLabel: experience.placeKnowledge.sourceLabel,
    sourceUrl: experience.placeKnowledge.sourceUrl,
  } : undefined;
  const stepInsights = experience.steps.flatMap((step) => step.insight ? [step.insight] : []);
  const insights = [
    ...stepInsights,
    ...(placeKnowledgeInsight && !stepInsights.some((item) => item.sourceUrl === placeKnowledgeInsight.sourceUrl || item.title === placeKnowledgeInsight.title) ? [placeKnowledgeInsight] : []),
  ];
  const hasEditorial = insights.some((item) => item.sourceKind !== 'live');
  const coverage = hasCurrentEvidence && hasEditorial ? 'hybrid' : hasCurrentEvidence ? 'live' : hasEditorial ? 'editorial' : 'evergreen';
  const coverageLabel = coverage === 'hybrid'
    ? 'Actuele bronnen en redactionele gids'
    : coverage === 'live'
      ? 'Actuele bronnen beschikbaar'
      : coverage === 'editorial'
        ? 'Redactionele gids · geen actuele bron nodig'
        : 'Wereldwijd bruikbaar · geen actuele bron beschikbaar';
  const knowledgeMomentIndex = Math.min(1, Math.max(0, experience.steps.length - 1));
  const currentInsight = currentStep.insight ?? (stepIndex === knowledgeMomentIndex ? placeKnowledgeInsight : undefined);

  return {
    title: experience.title,
    promise: experience.promise,
    currentStep,
    currentInsight,
    furtherInsights: insights.filter((item) => item !== currentInsight),
    practical: experience.prepare,
    evidence,
    coverage,
    coverageLabel,
    compositionLabel: experience.guideOrigin?.label,
  };
}
