import { CapsuleStep, Experience, GuidedInsight, LiveEvidence } from '../product/experienceModel';

export type GuideDepth = 'quiet' | 'guide' | 'deep';
export type EvidenceFreshness = 'current' | 'expired' | 'unknown';

export type GuideEvidence = LiveEvidence & {
  freshness: EvidenceFreshness;
  freshnessLabel: string;
};

export type GuideMomentStage = 'begin' | 'onderweg' | 'afronding';
export const guideMomentStageLabels: Record<GuideMomentStage, string> = {
  begin: 'BIJ HET BEGIN', onderweg: 'ONDERWEG', afronding: 'BIJ DE AFRONDING',
};
// ADR-031/ADR-059: een gidsmoment als echt moment — met de stap waarbij het
// hoort en het deel van de ervaring waarin het helpt, in plaats van platte tekst.
export type GuideMoment = {
  insight: GuidedInsight;
  stepIndex: number;
  stepTitle: string;
  stage: GuideMomentStage;
};

export type ExperienceGuide = {
  title: string;
  promise: string;
  currentStep: CapsuleStep;
  currentInsight?: GuidedInsight;
  furtherInsights: GuidedInsight[];
  moments: GuideMoment[];
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
  return {
    currentCount: current.length,
    expiredCount: evidence.filter((item) => item.freshness === 'expired').length,
    label: current.length ? 'met de wereld van nu' : evidence.length ? 'zonder actuele bronnen' : 'wereldwijd bruikbaar',
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

  // Gidsmomenten (ADR-031, verrijkt in ADR-059): elk inzicht behoudt de stap
  // en het fasedeel waarin het helpt, zodat de gids ze als echte momenten kan
  // tonen in plaats van als platte lijst. Maximaal drie, zoals het contract.
  const stageFor = (index: number): GuideMomentStage =>
    index >= experience.steps.length - 1 ? 'afronding' : index <= 0 ? 'begin' : 'onderweg';
  const moments: GuideMoment[] = experience.steps.flatMap((step, index) => step.insight
    ? [{ insight: step.insight, stepIndex: index, stepTitle: step.title, stage: stageFor(index) }]
    : []);
  if (placeKnowledgeInsight && insights.includes(placeKnowledgeInsight)) {
    moments.splice(Math.min(knowledgeMomentIndex, moments.length), 0, {
      insight: placeKnowledgeInsight,
      stepIndex: knowledgeMomentIndex,
      stepTitle: experience.steps[knowledgeMomentIndex]?.title ?? experience.presenceTitle,
      stage: stageFor(knowledgeMomentIndex),
    });
  }

  return {
    title: experience.title,
    promise: experience.promise,
    currentStep,
    currentInsight,
    furtherInsights: insights.filter((item) => item !== currentInsight),
    moments: moments.filter((moment) => moment.insight !== currentInsight).slice(0, 3),
    practical: experience.prepare,
    evidence,
    coverage,
    coverageLabel,
    compositionLabel: experience.guideOrigin?.label,
  };
}
