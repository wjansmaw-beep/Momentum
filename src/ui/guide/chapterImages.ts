import type { ChapterPhotoKey } from '../../product/chapterPhotos';
declare function require(path: string): number;
export const localChapterImages: Record<ChapterPhotoKey, number> = {
  'moddergat-museum-2007': require('../../../assets/images/moddergat-fiskershuske-bouwe-brouwer-2007.jpg'),
  'moddergat-factory-2023': require('../../../assets/images/moddergat-garnalenfabriek-monkelbaan-2023.jpg'),
};
