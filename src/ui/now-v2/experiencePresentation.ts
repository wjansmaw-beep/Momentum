import { CapsuleStep, Experience } from '../../product/experienceModel';

/** Presentation only: no new facts, permissions, clocks or provider calls. */
export function experiencePresentation(experience: Pick<Experience, 'kind' | 'routePlan' | 'presenceMode'>) {
  const freeGuide = experience.kind === 'outside' || experience.presenceMode === 'handoff';
  return {
    freeGuide,
    outdoorContext: freeGuide || Boolean(experience.routePlan),
    startLabel: freeGuide ? 'Open mijn gids' : 'Ik ga beginnen',
    preparationLabel: experience.kind === 'movement' && !freeGuide ? 'Klaar voor je workout'
      : experience.kind === 'food' ? 'Klaar om te maken' : 'Dit staat je te wachten',
  };
}

export function hasUsefulTimer(kind: Experience['kind'], step: Pick<CapsuleStep, 'seconds'>) {
  return (kind === 'movement' || kind === 'food')
    && Number.isFinite(step.seconds) && (step.seconds ?? 0) > 0;
}
