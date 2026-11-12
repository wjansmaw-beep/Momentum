import type { ChapterPhotoKey } from '../../product/chapterPhotos';
declare function require(path: string): number;
export const localChapterImages: Record<ChapterPhotoKey, number> = {
  "paesens-wadden-2023": require("../../../assets/images/paesens-wadden-bergsma-2023.jpg"),
  "moddergat-monument-2023": require("../../../assets/images/moddergat-monument-monkelbaan-2023.jpg"),
  "moddergat-fisherwoman-2010": require("../../../assets/images/moddergat-vissersvrouw-gouwenaar-2010.jpg"),
  'moddergat-museum-2007': require('../../../assets/images/moddergat-fiskershuske-bouwe-brouwer-2007.jpg'),
  'moddergat-factory-2023': require('../../../assets/images/moddergat-garnalenfabriek-monkelbaan-2023.jpg'),
};
