import { Experience } from '../product/experienceModel';
import { evidenceFreshness } from './experienceGuide';

export type CompositionReport = {
  experienceId: string;
  status: 'ready' | 'degraded' | 'rejected';
  reasons: string[];
  guideMomentCount: number;
  currentEvidenceCount: number;
  expiredEvidenceCount: number;
  automaticallyComposed: boolean;
};

export type CompositionSummary = {
  checked: number;
  ready: number;
  degraded: number;
  rejected: number;
  automaticallyComposed: number;
  guideMoments: number;
  liveGrounded: number;
};

export function auditExperienceComposition(experience: Experience, now = Date.now()): CompositionReport {
  const reasons: string[] = [];
  const guideMomentCount = experience.steps.filter((step) => step.insight).length;
  const evidence = (experience.liveEvidence ?? []).map((item) => evidenceFreshness(item, now));
  const currentEvidenceCount = evidence.filter((item) => item.freshness === 'current').length;
  const expiredEvidenceCount = evidence.filter((item) => item.freshness === 'expired').length;

  if (!experience.title.trim() || !experience.promise.trim() || !experience.wonder.trim()) reasons.push('De belofte of verwachting is onvolledig.');
  if (!Number.isFinite(experience.duration) || experience.duration <= 0) reasons.push('De tijdsduur is ongeldig.');
  if (!experience.steps.length || experience.steps.some((step) => !step.title.trim() || !step.instruction.trim())) reasons.push('De Capsule heeft geen complete uitvoeringsstappen.');
  if (!experience.company.length) reasons.push('Geschikt gezelschap is niet vastgelegd.');
  if (experience.routePlan && !experience.routePlan.destinationName.trim()) reasons.push('Het routeplan mist een bestemming.');

  const fatal = reasons.length > 0;
  if (!fatal && expiredEvidenceCount > 0 && currentEvidenceCount === 0) reasons.push('Live broninformatie is verlopen; de kaart gebruikt alleen fallbackinhoud.');
  if (!fatal && guideMomentCount === 0) reasons.push('Er zijn geen optionele gidsmomenten; de uitvoeringsstappen blijven wel compleet.');

  return {
    experienceId: experience.id,
    status: fatal ? 'rejected' : reasons.length ? 'degraded' : 'ready',
    reasons,
    guideMomentCount,
    currentEvidenceCount,
    expiredEvidenceCount,
    automaticallyComposed: experience.guideOrigin?.mode === 'composed',
  };
}

export function auditCandidatePool(experiences: Experience[], now = Date.now()) {
  const reports = experiences.map((experience) => auditExperienceComposition(experience, now));
  const accepted = experiences.filter((_, index) => reports[index].status !== 'rejected');
  const summary: CompositionSummary = {
    checked: reports.length,
    ready: reports.filter((item) => item.status === 'ready').length,
    degraded: reports.filter((item) => item.status === 'degraded').length,
    rejected: reports.filter((item) => item.status === 'rejected').length,
    automaticallyComposed: reports.filter((item) => item.automaticallyComposed).length,
    guideMoments: reports.reduce((sum, item) => sum + item.guideMomentCount, 0),
    liveGrounded: reports.filter((item) => item.currentEvidenceCount > 0).length,
  };
  return { accepted, reports, summary };
}
