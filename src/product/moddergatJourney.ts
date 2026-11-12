import type { CapsuleStep, Experience } from './experienceModel';
import { moddergatPlaces } from './moddergatPlaces';
import { moddergatApproaches } from './moddergatApproaches';
import { referenceExperiences } from './referenceExperiences';

const museum = referenceExperiences[0];
function stop(id: string, placeKey: string, title: string, promise: string, story: string,
  observation: string, depth: string, sourceLabel: string, sourceUrl: string, photoKey?: string): CapsuleStep {
  return {
    title, visitPlace: { ...moddergatPlaces[placeKey], approach: moddergatApproaches[placeKey] }, instruction: observation,
    editorial: {
      id, version: 1, composition: 'editorial-place', reviewedAt: '2026-11-12', photoKey,
      introduction: { title, promise, outside: 'Je mag deze plek ook alleen bekijken en verdergaan. Er is niets dat je hoeft af te ronden.' },
      observation, depth,
    },
    insight: { title, body: story, topic: placeKey === 'nature' ? 'nature' : 'culture',
      sourceKind: 'curator', sourceLabel, sourceUrl },
  };
}

// New identity: never replace the museum-only reference or its saved snapshots.
// Offered explicitly from Nu; published approaches are not live routing.
export const moddergatJourney: Experience = {
  ...museum,
  id: 'moddergat-five-places-v1',
  title: 'Het dorp dat de zee nooit vergat',
  promise: 'Ontdek hoe de zee het wonen, werken en herinneren in Paesens-Moddergat vormde.',
  wonder: 'Van een klein vissershuis naar de open horizon: vijf plekken vertellen samen over het leven met de zee.',
  duration: 30,
  why: ['Vijf plekken, één doorlopend verhaal', 'Lees, kijk of luister op je eigen tempo'],
  prepareTitle: 'Van het dorp naar de dijk',
  prepare: [
    'De 30 minuten zijn een redactionele indicatie voor lezen en stilstaan, zonder wandel- of reistijd. De gids geeft aanwijzingen tussen de plekken; actuele doorgang en afsluitingen zijn niet live gecontroleerd.',
    'Je kunt ieder hoofdstuk los openen. Een gesloten museum of fabriekje hoeft het lezen buiten niet te verhinderen.',
    'Controleer de openingstijden en toegangsvoorwaarden per plek. Het museum en het garnalenfabriekje hebben verschillende voorwaarden.',
    'Bij de dijk liggen trappen en ongelijke paden. Een drempelvrije route is niet bevestigd.',
    'De laatste plek ligt bij de westelijke toegang van Peazemerlannen. Volg de aanwijzingen van de beheerder; ga niet op eigen gelegenheid het wad op.',
  ],
  visitPlace: moddergatPlaces.museum,
  presenceCue: 'Kies een rustige plek om te kijken. Ga verder wanneer jij daar zin in hebt.',
  memoryPrompt: 'Welke plek of welk detail blijft je bij?',
  keywords: ['Moddergat', 'Paesens', 'visserij', 'geschiedenis', 'Waddenzee'],
  steps: [
    { ...museum.steps[0], title: 'Het leven achter de dijk', visitPlace: moddergatPlaces.museum,
      editorial: { ...museum.steps[0].editorial!, id: 'museum', photoKey: 'moddergat-museum-2007' } },
    stop('fisherwoman', 'fisherwoman', 'De vrouw die bleef wachten',
      'Kijk naar de mensen aan de kant van de zee waar je nu zelf staat.',
      'Op de zeedijk staat De Fiskersfrou: een beeld van een vrouw met een kind, gemaakt door Hans Jouta in 2008. Het beeld nodigt uit om niet alleen aan de vissers op zee te denken, maar ook aan het leven aan wal.',
      'Kijk naar de houding van de vrouw en het kind. Wat valt je op aan hun richting, afstand en gebaren?',
      'De titel van dit hoofdstuk is een redactionele uitnodiging. We vertellen hier geen verzonnen levensverhaal van een individuele vissersvrouw. Wat jij in de houding van het beeld leest, blijft jouw interpretatie.',
      'Standbeelden in Nederland · Hans Jouta, Vissersvrouw', 'https://www.vanderkrogt.net/standbeelden/object.php?record=FR06ak', "moddergat-fisherwoman-2010"),
    stop('monument', 'monument', 'De nacht van 83 levens',
      'Een plaats om stil te staan bij wat de zee ook nam.',
      'In de nacht van 5 op 6 maart 1883 trof een zware storm de vissersvloot. Het monument herdenkt de 83 omgekomen vissers. Het gedenkteken van basaltblokken werd op 6 maart 1958 onthuld en is ontworpen door R. IJbema.',
      'Neem even de tijd voor het monument. Kijk naar de stenen en de tekst, zonder iets te hoeven vastleggen.',
      'Het monument kwam 75 jaar na de ramp tot stand. De herinnering kreeg daarmee een blijvende plek op de dijk. Dit is redactionele duiding; het ontwerp, de onthullingsdatum en de ramp worden door de kunstbron beschreven.',
      'Keunstwurk · Monument voor de omgekomen vissers', 'https://keunstwurk.nl/art/monument-voor-de-omgekomen-vissers/', "moddergat-monument-2023"),
    stop('factory', 'factory', 'Het werk achter de vangst',
      'Ook aan land ging het werk door.',
      'Garnalenvissers richtten het fabriekje in 1924 op. Hier werden garnalen gedroogd om als veevoer te verkopen. Het gebouw is nu een dependance van Museum ’t Fiskershúske.',
      'Bekijk het gebouw en zijn ligging bij de dijk. Welke sporen van een werkplek herken je aan de buitenkant?',
      'Deze plek verbindt de vangst met verwerking en verkoop aan land. Dat verband helpt het verhaal van de visserij te verbreden. De openstelling van het fabriekje staat los van die van het museum.',
      'Museum ’t Fiskershúske · De Garnalenfabriek', 'https://www.museummoddergat.nl/de-garnalenfabriek/', 'moddergat-factory-2023'),
    stop('nature', 'nature', 'Waar de zee het land terugnam',
      'Laat het verhaal van het dorp overgaan in het landschap.',
      'Bij een dijkdoorbraak in 1973 kreeg de zee opnieuw toegang tot een deel van de polder. In de Peazemerlannen liggen nu kwelder en zomerpolder naast elkaar. Het gebied is belangrijk voor rustende en voedselzoekende vogels.',
      'Blijf op een toegestane plek aan de dijk. Kijk naar verschillen tussen water, begroeiing en hoger land. Luister daarna even zonder op je scherm te kijken.',
      'De zee en het land zijn hier voortdurend met elkaar verbonden. Dat betekent niet dat ieder pad altijd toegankelijk is. De beheerder onderscheidt een jaarrondroute, de strekdam en een seizoenspad. De gids eindigt bij de toegang aan de dijk; een tocht verder het gebied in is een eigen keuze.',
      'It Fryske Gea · Peazemerlannen', 'https://www.itfryskegea.nl/natuurroutes/peazemerlannen/', "paesens-wadden-2023"),
  ],
};
