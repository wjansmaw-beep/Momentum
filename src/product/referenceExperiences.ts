import { referenceImages } from './referenceImages';
import type { Experience, CapsuleStep } from './experienceModel';

const museum = 'https://www.museummoddergat.nl/over-ons/';
const nature = 'https://www.staatsbosbeheer.nl/uit-in-de-natuur/locaties/lauwersmeer';
const reviewedAt = '2026-11-08';

function chapter(id: string, title: string, body: string, instruction: string, observation: string, depth: string,
  sourceLabel: string, sourceUrl: string, topic: 'culture' | 'nature'): CapsuleStep {
  return { title, instruction, editorial: { id, version: 1, observation, depth, reviewedAt },
    insight: { title, body, topic, sourceLabel, sourceUrl, sourceKind: 'editorial' } };
}

const base = {
  referenceVisit: true,
  image: '', accent: '#D8C8A8', duration: 20, effort: 'Op je eigen tempo', cta: 'Zet de ontdekking klaar',
  presenceMode: 'guided' as const, presenceTitle: 'Geef de plek aandacht',
  presenceCue: 'Sta stil op een geschikte plek. Je kunt ieder hoofdstuk overslaan.',
  company: ['solo', 'together', 'family'] as Experience['company'],
  guideOrigin: { mode: 'curated', label: 'Brongebonden referentie · redactioneel samengesteld' } as const,
};

// No mockup imagery or guessed coordinates: reviewed location photography and
// individual map anchors remain separate editorial work, not invented data.
export const referenceExperiences: Experience[] = [
  {
    ...base, image: referenceImages.moddergat.uri, id: 'reference-moddergat-v1', kind: 'culture', title: 'Moddergat — leven bij de zee',
    visitPlace: {
      name: 'Museum ’t Fiskershúske', address: 'Fiskerspaad 4–8a, 9142 VN Moddergat',
      latitude: 53.404949, longitude: 6.075724,
      sourceUrl: 'https://www.museummoddergat.nl/bezoekersinfo/',
      coordinateSourceUrl: 'https://commons.wikimedia.org/wiki/Category:Fiskerspaad_4,_Moddergat',
      note: 'Drie hoofdstukken bij dezelfde bezoekplek. Het kaartpunt duidt het gebouw aan, niet de precieze ingang. Controleer opening en toegang bij het museum; deze gids bevestigt niet dat het nu open is.',
    },
    promise: 'Ontdek het dagelijks leven achter de verhalen over de kustvisserij.',
    wonder: 'Een huis, een voorwerp, een herinnering: drie manieren om naar het dorp te kijken.',
    why: ['Drie korte, brongebonden hoofdstukken', 'Jij bepaalt het tempo'],
    prepareTitle: 'Een bezoek met ruimte om te kijken',
    prepare: ['Referentie-ervaring bij Museum ’t Fiskershúske, Fiskerspaad 4–8a, Moddergat.',
      'Controleer zelf de actuele opening en toegangsvoorwaarden bij het museum. Deze gids bevat geen live openingsinformatie.',
      'De 20 minuten zijn tijd voor de ontdekking, zonder reistijd. Je kunt de verhalen ook thuis lezen.',
      'De foto uit 2007 toont het museumhuisje; het is geen actuele opname.'],
    memoryPrompt: 'Welk detail bracht het leven hier voor jou dichterbij?', keywords: ['Moddergat', 'visserij', 'geschiedenis'],
    steps: [
      { ...chapter('wonen', 'Een huis als tijdvenster',
        'Het oudste museumhuisje dateert uit 1794. De inrichting laat zien hoe een vissershuis aan de waddenkust er rond 1850 uitzag.',
        'Kies één zichtbaar detail van een huis of kamer. Wat vertelt de vorm of het materiaal je? Scheid wat je ziet van wat je erbij vermoedt.',
        'Kijk even zonder uitleg. Laat één klein detail je aandacht vasthouden.',
        'Het bouwjaar en de periode van de getoonde inrichting zijn dus verschillend. Een inrichting is een gekozen beeld van een tijd, geen bewijs dat alles altijd precies zo stond.',
        'Museum ’t Fiskershúske · Over ons', museum, 'culture'),
        editorial: { id: 'wonen', version: 1, composition: 'editorial-place', reviewedAt: '2026-11-11',
          introduction: { title: 'Het leven achter de dijk', promise: 'Kijk naar een huis. Ontdek hoe een andere tijd zichtbaar wordt.',
            outside: 'Ben je buiten of thuis? Kijk vanaf een toegankelijke plek naar het huis, of gebruik de foto hierboven. Je hoeft niet naar binnen om aandachtig te kijken.' },
          observation: 'Kijk even zonder uitleg. Laat één klein detail je aandacht vasthouden.',
          depth: 'Een huis kan ouder zijn dan de tijd die zijn inrichting laat zien. Het bouwjaar en de periode van de getoonde inrichting zijn verschillend. Dit is redactionele duiding op basis van de museuminformatie.' } },
      chapter('werk', 'Het werk krijgt een vorm',
        'In museumhuisje De Aek gaat de vaste tentoonstelling over vissers van Wad en Gat. Scheepsmodellen en vissersgereedschap maken deel uit van die presentatie.',
        'Ben je binnen? Kies een voorwerp en zoek het bijschrift. Wat is de beschreven functie? Ben je buiten of thuis, neem deze vraag mee voor een later bezoek.',
        'Stel je geen antwoord voor dat je niet kunt controleren. Kijk rustig naar materiaal, vorm en sporen van gebruik.',
        'De geraadpleegde museuminformatie geeft geen concreet menu van vissersgezinnen. Op de vraag wat zij aten geeft deze gids daarom nog geen historisch antwoord.',
        'Museum ’t Fiskershúske · Over ons', museum, 'culture'),
      chapter('herinneren', 'Een ramp blijft aanwezig',
        'Bij de ramp van Moddergat in 1883 kwamen 83 vissers om. Het museum bewaart ook herinneringen aan deze scheepsramp.',
        'Neem een rustig moment. Welke vraag zou je aan het museum willen stellen over het leven dat na de ramp doorging?',
        'Je hoeft hier niets af te vinken. Geef het verhaal even ruimte en kijk daarna weer om je heen.',
        'Dit hoofdstuk benoemt het verlies zonder een persoonlijke getuigenis te verzinnen. De bron is de algemene museumbeschrijving; individuele levensverhalen vragen aanvullende bronnen.',
        'Museum ’t Fiskershúske · Over ons', museum, 'culture'),
    ],
  },
  {
    ...base, image: referenceImages.lauwersmeer.uri, id: 'reference-lauwersmeer-v1', kind: 'outside', title: 'Lauwersmeer — kijken naar verschillen',
    promise: 'Geef het landschap aandacht door water, begroeiing en beweging te vergelijken.',
    wonder: 'Je hoeft geen vogelnaam te kennen om iets nieuws te zien.',
    why: ['Waarnemen zonder soortenkennis', 'Twee hoofdstukken, zonder prestatiedoel'],
    prepareTitle: 'Kies zelf een toegankelijke kijkplek',
    prepare: ['Controleer toegang en aanwijzingen bij Staatsbosbeheer en ter plaatse; deze gids bepaalt geen route.',
      'Blijf op toegestane paden. Observeer dieren op afstand en laat ze met rust.',
      'De 20 minuten zijn observatietijd, zonder reis. Er wordt geen actuele vogelwaarneming beloofd.',
      'De foto uit 2011 toont Lauwersmeer bij Lauwersoog; het is geen actuele opname.'],
    memoryPrompt: 'Wat zag of hoorde je dat je eerst niet opmerkte?', keywords: ['Lauwersmeer', 'natuur', 'observeren'],
    steps: [
      chapter('landschap', 'Meer dan één landschap',
        'Staatsbosbeheer beschrijft het Lauwersmeergebied als een afwisseling van water, eilandjes, rietvelden, slikranden, grasland en bos op vroegere zeebodem.',
        'Kies twee landschapsdelen die je vanaf je plek kunt zien. Vergelijk kleur, vorm en beweging. Welke tegenstelling valt op?',
        'Sta stil op een geschikte plek. Laat je blik van dichtbij naar de horizon gaan.',
        'Deze beschrijving gaat over het gebied als geheel. Niet ieder genoemd landschap is vanaf jouw plek zichtbaar; wat je zelf ziet blijft leidend.',
        'Staatsbosbeheer · Lauwersmeer', nature, 'nature'),
      chapter('waarnemen', 'Eerst kijken, dan benoemen',
        'Het Lauwersmeer is een vogelrijk gebied. Staatsbosbeheer beschrijft het voor- en najaar als belangrijke perioden voor de vogeltrek.',
        'Zie je een vogel? Kijk naar beweging en richting, zonder hem te volgen of dichterbij te komen. Zie je geen vogel, luister dan naar de omgeving.',
        'Leg de telefoon weg en luister even. Er hoeft niets bijzonders te gebeuren.',
        'Dit is algemene gebiedsinformatie, geen melding van vogels die hier nu aanwezig zijn. Een naam raden is niet nodig voor een waardevolle waarneming.',
        'Staatsbosbeheer · Lauwersmeer', nature, 'nature'),
    ],
  },
];
