export const referenceImages = {
  moddergat: {
    uri: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Moddergat%2C_%27t_Fiskersh%C3%BAske.jpg',
    label: 'Foto: Bouwe Brouwer · 2007 · CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Moddergat,_%27t_Fiskersh%C3%BAske.jpg',
    license: 'https://creativecommons.org/licenses/by-sa/3.0/',
  },
  garnalenfabriek: {
    uri: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Paesens-Moddergat._04-04-2023._%28actm.%29_02.jpg',
    label: 'Foto: Agnes Monkelbaan · 2023 · CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Paesens-Moddergat._04-04-2023._(actm.)_02.jpg',
    license: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  lauwersmeer: {
    uri: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Lauwersmeer.jpg',
    label: 'Foto: Gouwenaar · 2011 · CC0',
    source: 'https://commons.wikimedia.org/wiki/File:Lauwersmeer.jpg',
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
  },
};

export const referenceImageCredit = (uri?: string) => Object.values(referenceImages).find(image => image.uri === uri);
