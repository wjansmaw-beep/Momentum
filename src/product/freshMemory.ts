import type { Experience } from './experienceModel';

// Saving is not a positive rating. Preserve an intentionally empty note.
export function freshMemory(experience: Experience, note: string, now = new Date(), photos: string[] = []) {
  return { id: `${experience.id}-${now.getTime()}`, title: experience.title,
    date: now.toISOString(), image: experience.image, note: note.trim(), experienceSnapshot: experience,
    photos: photos.length ? photos.slice(0, 8) : undefined };
}
