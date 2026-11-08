import transcripts from '../../../assets/audio/transcripts.json';
import type { CapsuleStep } from '../../product/experienceModel';
declare function require(path: string): number;

const sources: Record<string, number> = {
  'reference-moddergat-v1-wonen': require('../../../assets/audio/reference-moddergat-v1-wonen.wav'),
  'reference-moddergat-v1-werk': require('../../../assets/audio/reference-moddergat-v1-werk.wav'),
  'reference-moddergat-v1-herinneren': require('../../../assets/audio/reference-moddergat-v1-herinneren.wav'),
  'reference-lauwersmeer-v1-landschap': require('../../../assets/audio/reference-lauwersmeer-v1-landschap.wav'),
  'reference-lauwersmeer-v1-waarnemen': require('../../../assets/audio/reference-lauwersmeer-v1-waarnemen.wav'),
};

export function referenceAudio(experienceId: string, step: CapsuleStep) {
  const id = `${experienceId}-${step.editorial?.id}`;
  const track = transcripts.find(t => t.id === id);
  // Changed story content cannot silently keep an outdated spoken version.
  if (!track || !sources[id] || track.text !== `${step.insight?.title}. ${step.insight?.body}`) return null;
  return { source: sources[id], transcript: track.text, id };
}
