import type { CapsuleStep } from './experienceModel';
import { referenceImages } from './referenceImages';

// Reviewed keys only: unknown content never substitutes another place's photo.
export const chapterPhotos = {
  'moddergat-museum-2007': {
    credit: referenceImages.moddergat, aspectRatio: 2032 / 1524,
    alt: 'Museumhuisje ’t Fiskershúske, foto uit 2007',
    caption: 'Museumhuisje ’t Fiskershúske · 2007. Geen actuele opname.',
  },
  'moddergat-factory-2023': {
    credit: referenceImages.garnalenfabriek, aspectRatio: 4450 / 2916,
    alt: 'Het garnalenfabriekje in het landschap achter de dijk, april 2023',
    caption: 'It Grenaatfabrykje, gezien vanaf de dijk · april 2023. Geen actuele opname.',
  },
} as const;
export type ChapterPhotoKey = keyof typeof chapterPhotos;

export function resolveChapterPhoto(experienceId: string | undefined, step: CapsuleStep) {
  const key = step.editorial?.photoKey ??
    (experienceId === 'reference-moddergat-v1' && step.editorial?.id === 'wonen' ? 'moddergat-museum-2007' : undefined);
  if (!key || !Object.prototype.hasOwnProperty.call(chapterPhotos, key)) return undefined;
  const checkedKey = key as ChapterPhotoKey;
  return { key: checkedKey, ...chapterPhotos[checkedKey] };
}
