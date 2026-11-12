import type { WalkingApproach } from './experienceModel';
const village = 'https://waddentour.nl/wp-content/uploads/2022/08/folder-moddergat.pdf';
const nature = 'https://www.itfryskegea.nl/natuurroutes/peazemerlannen/';
const checkedAt = '2026-11-12';

// Published place-to-place directions, not routing from the user's GPS position.
// No geometry is inferred across unmapped access/grass sections.
export const moddergatApproaches: Record<string, WalkingApproach> = {
  fisherwoman: {
    from: 'Museum ’t Fiskershúske',
    instructions: ['Volg het Fiskerspaad naar De Oere.', 'Zoek het beeld bij de dijk. Het kaartpunt toont het beeld; volg de toegestane toegang ter plaatse.'],
    note: 'De laatste meters naar het beeld zijn niet als afzonderlijk pad in de kaartgegevens vastgelegd.',
    sources: [{ title: 'OpenStreetMap · Fiskerspaad', url: 'https://www.openstreetmap.org/way/6533449' },
      { title: 'OpenStreetMap · De Fiskersfrou', url: 'https://www.openstreetmap.org/node/7794731639' }], checkedAt,
  },
  monument: {
    from: 'De Fiskersfrou',
    instructions: ['Ga richting het Fiskerspaad en het monument aan de dijk.', 'Gebruik de toegestane opgang naar het monument.'],
    note: 'Bij het monument ligt een trap. Deze verbinding is niet als drempelvrij bevestigd.',
    sources: [{ title: 'OpenStreetMap · toegang bij het monument', url: 'https://www.openstreetmap.org/way/28310107' }], checkedAt,
  },
  factory: {
    from: 'Vissersmonument',
    instructions: ['Volg de kruin van de dijk westwaarts, richting het garnalenfabriekje.', 'Bij de zitbank beschrijft Waddentour de afdaling naar het hek onderaan de dijk. Volg daar de toegestane toegang naar het fabriekje.'],
    note: 'De gepubliceerde wandeling gaat over de dijk. Volg eventuele afsluitingen of omleidingen; de actuele doorgang is niet live gecontroleerd.',
    sources: [{ title: 'Waddentour · dorpswandeling 2', url: village }], checkedAt,
  },
  nature: {
    from: 'It Grenaatfabrykje',
    instructions: ['Keer via de toegestane dijkopgang terug richting het Vissersmonument.', 'Volg de dijk verder oostwaarts richting Peazens en de toegang bij de strekdam.', 'Blijf voor dit hoofdstuk bij de toegang aan de dijk. Kies alleen een vervolgpad dat ter plaatse is opengesteld.'],
    note: 'Dijkpaden kunnen ongelijk of nat zijn. Verder het wad op lopen maakt geen deel uit van deze gids.',
    sources: [{ title: 'Waddentour · dorpswandeling 2', url: village },
      { title: 'It Fryske Gea · toegang en wandelpaden', url: nature }], checkedAt,
  },
};
