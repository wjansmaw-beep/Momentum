import type { Experience } from '../product/experienceModel';

export type GuideMode = 'navigate' | 'discover' | 'immerse';
export type AdaptiveGuideState = {
  version: 1;
  chapterId: string;
  mode: GuideMode;
  completedTaskIds: string[];
  locationStories?: boolean;
  presence?: 'listen' | 'observe';
};

export function supportsAdaptiveGuide(experience: Experience): boolean {
  return ['outside', 'culture', 'learn'].includes(experience.kind) && experience.steps.length > 0;
}

// Content-derived identities survive reorder but intentionally reset when the
// instruction changes. Editorial steps can supply a permanent id later.
export function chapterIds(experience: Experience): string[] {
  return experience.steps.map((step, index, steps) => {
    if (step.editorial?.id && Number.isInteger(step.editorial.version) && step.editorial.version > 0
      && steps.filter(other => other.editorial?.id === step.editorial?.id).length === 1) {
      return `${experience.id}:${step.editorial.id}:v${step.editorial.version}`;
    }
    const content = JSON.stringify([step.title, step.instruction]);
    let hash = 2166136261;
    for (let i = 0; i < content.length; i++) hash = Math.imul(hash ^ content.charCodeAt(i), 16777619);
    const duplicate = steps.slice(0, index).filter((other) => other.title === step.title && other.instruction === step.instruction).length;
    return `${experience.id}:${(hash >>> 0).toString(36)}:${duplicate}`;
  });
}

export function restoreAdaptiveGuide(experience: Experience, value: unknown, legacyIndex = 0): AdaptiveGuideState {
  const ids = chapterIds(experience);
  const saved = value && typeof value === 'object' ? value as Partial<AdaptiveGuideState> : {};
  const index = Number.isInteger(legacyIndex) ? Math.max(0, Math.min(ids.length - 1, legacyIndex)) : 0;
  const validVersion = saved.version === 1;
  return {
    version: 1,
    locationStories: validVersion && saved.locationStories === true,
    presence: validVersion && saved.presence === 'observe' ? 'observe' : 'listen',
    chapterId: validVersion && typeof saved.chapterId === 'string' && ids.includes(saved.chapterId)
      ? saved.chapterId : ids[index] ?? '',
    mode: validVersion && ['navigate', 'discover', 'immerse'].includes(saved.mode ?? '')
      ? saved.mode! : experience.referenceVisit ? 'navigate' : 'discover',
    completedTaskIds: validVersion && Array.isArray(saved.completedTaskIds)
      ? [...new Set(saved.completedTaskIds.filter((id): id is string => typeof id === 'string' && ids.includes(id)))] : [],
  };
}

export function toggleGuideTask(state: AdaptiveGuideState, taskId: string): AdaptiveGuideState {
  // Only the current chapter can be marked from its displayed task.
  if (!taskId || taskId !== state.chapterId) return state;
  return { ...state, completedTaskIds: state.completedTaskIds.includes(taskId)
    ? state.completedTaskIds.filter((id) => id !== taskId) : [...state.completedTaskIds, taskId] };
}
