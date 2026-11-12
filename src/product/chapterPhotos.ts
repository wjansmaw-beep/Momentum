import type { CapsuleStep } from './experienceModel';
import { referenceImages } from './referenceImages';

// Reviewed keys only: unknown content never substitutes another place's photo.
export const chapterPhotos = {
  "paesens-wadden-2023": {credit: referenceImages.peazensWadden, aspectRatio:1.6075117370892018, alt:"Uitzicht vanaf de dijk bij Paesens-Moddergat op de Waddenzee, april 2023", caption:"Uitzicht bij Paesens-Moddergat richting Schiermonnikoog · april 2023. Omgevingsbeeld, geen foto van het toegangshek."},
  "moddergat-monument-2023": {credit: referenceImages.monument, aspectRatio:1.5, alt:"Een namenwand van het Vissersmonument, april 2023", caption:"Een deel van het Vissersmonument · april 2023. Geen actuele opname."},
  "moddergat-fisherwoman-2010": {credit: referenceImages.fisherwoman, aspectRatio:0.75, alt:"De Fiskersfrou: vrouw met kind en manden, gefotografeerd in 2010", caption:"De Fiskersfrou van Hans Jouta · oktober 2010. Geen actuele opname."},
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
