import type { Experience } from './experienceModel';

export type SavedExperience = { id: string; savedAt: string; experience: Experience };
export const savedExperiencesKey = 'momentum.saved-experiences.v1';
export function toggleSaved(items: SavedExperience[], experience: Experience, now = new Date().toISOString()): SavedExperience[] {
  return items.some(item => item.id === experience.id)
    ? items.filter(item => item.id !== experience.id)
    : [{ id: experience.id, savedAt: now, experience }, ...items];
}

// Reject an invalid envelope rather than silently overwriting unrecognized data.
export function parseSaved(raw: string | null): SavedExperience[] {
  if (!raw) return [];
  const value = JSON.parse(raw);
  if (value.version !== 1 || !Array.isArray(value.items)) throw new Error('Unknown saved format');
  const ids = new Set<string>();
  for (const item of value.items) {
    const e = item?.experience;
    if (!e || typeof item.id !== 'string' || item.id !== e.id || ids.has(item.id)
      || !Number.isFinite(Date.parse(item.savedAt))
      || !['outside','food','movement','restore','connect','learn','culture'].includes(e.kind)
      || !['title','promise','wonder','image','effort','cta','prepareTitle','presenceTitle','presenceCue','memoryPrompt'].every(k => typeof e[k] === 'string')
      || !Number.isFinite(e.duration) || e.duration <= 0
      || !['prepare','why','keywords','company'].every(k => Array.isArray(e[k]) && e[k].every((x: unknown) => typeof x === 'string'))
      || !Array.isArray(e.steps) || !e.steps.length || !e.steps.every((s: any) => typeof s.title === 'string' && typeof s.instruction === 'string')) {
      throw new Error('Invalid saved experience');
    }
    ids.add(item.id);
  }
  return value.items;
}
export const serializeSaved = (items: SavedExperience[]) => JSON.stringify({ version: 1, items });

