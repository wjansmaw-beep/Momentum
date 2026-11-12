import type { VisitPlace } from './experienceModel';
import { referenceExperiences } from './referenceExperiences';

const checkedAt = '2026-11-12';
const factory = 'https://www.museummoddergat.nl/de-garnalenfabriek/';
const nature = 'https://www.itfryskegea.nl/natuurroutes/peazemerlannen/';

// Checked public map anchors. These are places, not a verified connecting walk.
// OSM data © OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright
export const moddergatPlaces: Record<string, VisitPlace> = {
  museum: {
    ...referenceExperiences[0].visitPlace!,
    note: 'Het kaartpunt duidt het museumhuisje aan, niet de precieze ingang. Controleer de opening en toegang voor je bezoek.',
  },
  fisherwoman: {
    name: 'Vissersvrouw — De Fiskersfrou', address: 'Zeedijk bij De Oere, Moddergat',
    latitude: 53.4054207, longitude: 6.0752461,
    sourceUrl: 'https://www.vanderkrogt.net/standbeelden/object.php?record=FR06ak',
    coordinateSourceUrl: 'https://www.openstreetmap.org/node/7794731639',
    note: 'Het kaartpunt duidt het beeld aan. Gebruik de toegestane toegang tot de dijk; het punt is geen route of toegankelijkheidsgarantie.',
  },
  monument: {
    name: 'Vissersmonument', address: 'Zeedijk bij het Fiskerspaad, Moddergat',
    latitude: 53.4053850, longitude: 6.0761935,
    sourceUrl: 'https://keunstwurk.nl/art/monument-voor-de-omgekomen-vissers/',
    coordinateSourceUrl: 'https://www.openstreetmap.org/node/310870671',
    note: 'Het monument staat op de zeedijk. Let op de toegang en treden ter plaatse; het kaartpunt duidt het monument aan.',
  },
  factory: {
    name: 'It Grenaatfabrykje', address: 'It Grenaatfabryk 2, 9142 VH Moddergat',
    latitude: 53.4064743, longitude: 6.0697796,
    sourceUrl: factory,
    coordinateSourceUrl: 'https://www.openstreetmap.org/node/2785787348',
    note: 'Het kaartpunt duidt het adres van het fabriekje aan. De toegangsweg wordt ook door verkeer gebruikt.',
    openingHours: { text: 'Het museum streeft naar openstelling op zondag van 13.00 tot 17.00. Verhuur of andere omstandigheden kunnen dit veranderen. Controleer vóór vertrek welke zondag het fabriekje open is.', sourceUrl: factory, checkedAt },
    admission: { text: 'Het museum vermeldt gratis toegang tijdens de publieke zondagopenstelling. Dit zegt niets over eventuele betaalde activiteiten of consumpties.', sourceUrl: factory, checkedAt },
  },
  nature: {
    name: 'Peazemerlannen — toegang aan de dijk', address: 'Dijk bij de westelijke toegang, Peazens',
    latitude: 53.4031588, longitude: 6.0843812,
    sourceUrl: nature,
    coordinateSourceUrl: 'https://www.openstreetmap.org/node/9077840639',
    note: 'Kaartpunt bij een hek aan de dijk met voetgangerstoegang in OpenStreetMap. De natuurbeheerder toont hier de westelijke toegang. Kijk vanaf de dijk en volg actuele borden; dit is geen route het wad op.',
    openingHours: { text: 'De beheerder onderscheidt de jaarrondroute en strekdam van een seizoenspad dat alleen van 15 juli tot 15 maart toegankelijk is. In de kwelder zijn honden niet toegestaan; op de strekdam alleen aangelijnd. Volg de plaatselijke aanwijzingen.', sourceUrl: nature, checkedAt },
    admission: { text: 'Eventuele toegangskosten zijn in deze gids niet bevestigd. Raadpleeg de informatie van de beheerder.', sourceUrl: nature, checkedAt },
  },
};
