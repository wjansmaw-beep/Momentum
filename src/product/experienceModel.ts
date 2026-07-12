export type Surface = 'now' | 'today' | 'discover' | 'lifebook';
export type ExperienceKind = 'outside' | 'food' | 'movement' | 'restore' | 'connect' | 'learn' | 'culture';
export type PresenceMode = 'quiet' | 'guided' | 'handoff';
export type CapsuleStep = {
  title: string;
  instruction: string;
  meta?: string;
  seconds?: number;
};

export type LiveEvidence = {
  label: string;
  sourceName: string;
  sourceUrl: string;
  observedAt: string;
  retrievedAt: string;
  expiresAt: string;
  certainty: 'forecast' | 'observation';
};

export type RoutePlan = {
  mode: 'walking' | 'cycling';
  destinationName: string;
  destination?: { latitude: number; longitude: number };
  source?: { latitude: number; longitude: number };
  outboundMinutes: number;
  experienceMinutes: number;
  returnMinutes: number;
  bufferMinutes: number;
  natureGuard: string;
};

export type Experience = {
  id: string;
  kind: ExperienceKind;
  title: string;
  promise: string;
  wonder: string;
  image: string;
  accent: string;
  duration: number;
  effort: string;
  distance?: string;
  timeWindow?: string;
  cta: string;
  why: string[];
  prepareTitle: string;
  prepare: string[];
  presenceMode: PresenceMode;
  presenceTitle: string;
  presenceCue: string;
  steps: CapsuleStep[];
  memoryPrompt: string;
  keywords: string[];
  company: Array<'solo' | 'together' | 'family'>;
  liveEvidence?: LiveEvidence[];
  routePlan?: RoutePlan;
};

export const experiences: Experience[] = [
  {
    id: 'wadden-light', kind: 'outside', title: 'Wadden Light Walk',
    promise: 'Vanavond kleurt het wad goudgeel in de ondergaande zon.',
    wonder: 'De wind neemt af en het laatste licht valt precies over het water.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=88',
    accent: '#A9C75D', duration: 45, effort: 'Rustig', distance: '35 min reizen', timeWindow: '19:30 – 20:30', cta: 'Ga dit beleven',
    why: ['Je hebt vanavond ruimte', 'Het weer past bij buiten zijn', 'Natuur sluit aan bij je proefprofiel'],
    prepareTitle: 'Klaar om te gaan?', prepare: ['Lichte jas', 'Water', 'Camera of verrekijker', 'Vertrek zonder haast'],
    presenceMode: 'handoff', presenceTitle: 'Geniet van het licht', presenceCue: 'Open de route en laat Momentum daarna verdwijnen.',
    steps: [
      { title: 'Reis naar het startpunt', instruction: 'Laat Kaarten je brengen. Momentum hoeft onderweg niets toe te voegen.', meta: 'Navigatie via vertrouwde app' },
      { title: 'Begin rustig', instruction: 'Geef jezelf de eerste vijf minuten om aan wind, licht en omgeving te wennen.', meta: 'Telefoon weg' },
      { title: 'Kijk één keer bewust om je heen', instruction: 'Zoek geen perfecte foto. Merk één detail op dat alleen vanavond bestaat.' },
      { title: 'Keer zonder haast terug', instruction: 'Laat voldoende tijd over voor de terugweg en verander de route niet wanneer omstandigheden onveilig voelen.' },
    ],
    memoryPrompt: 'Wat wil je van dit licht onthouden?', keywords: ['wandelen', 'wandeling', 'buiten', 'natuur', 'zee', 'strand', 'vogels', 'licht', 'rust'], company: ['solo', 'together', 'family'],
  },
  {
    id: 'morning-shake', kind: 'food', title: 'Jouw power-ochtendshake',
    promise: 'In zeven minuten staat er iets fris en voedends voor je klaar.',
    wonder: 'Mango, yoghurt en gember maken de ochtend helder zonder gedoe.',
    image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=1200&q=88',
    accent: '#E7A451', duration: 7, effort: 'Heel eenvoudig', timeWindow: '07:30 – 09:00', cta: 'Maak deze shake',
    why: ['Dit past in je ochtend', 'Weinig voorbereiding', 'Een snelle eetkeuze voorkomt zoeken'],
    prepareTitle: 'Zet alles klaar', prepare: ['1 banaan of mango', 'Yoghurt of plantaardige basis', 'Gember', 'Blender en glas'],
    presenceMode: 'guided', presenceTitle: 'Blend tot het glad is', presenceCue: 'Proef eerst. Voeg pas daarna iets toe.',
    steps: [
      { title: 'Doe het fruit in de blender', instruction: 'Gebruik één banaan of ongeveer een hand mango. Bevroren fruit maakt de shake kouder.', meta: '1 portie' },
      { title: 'Voeg de basis toe', instruction: 'Schenk ongeveer 200 ml yoghurt of een plantaardige basis erbij.', meta: 'Controleer wat bij jou past' },
      { title: 'Geef hem karakter', instruction: 'Voeg een klein stukje gember toe. Begin bescheiden; meer kan altijd.' },
      { title: 'Blend tot hij glad is', instruction: 'Blend kort, stop, controleer de dikte en voeg alleen zo nodig een scheut water toe.', seconds: 30 },
      { title: 'Proef vóór je verandert', instruction: 'Schenk in en proef eerst. Bewaar jouw aanpassing alleen als je dat zelf wilt.' },
    ],
    memoryPrompt: 'Wil je deze combinatie bewaren?', keywords: ['shake', 'ontbijt', 'drinken', 'eten', 'voeding', 'snel', 'smoothie'], company: ['solo', 'together', 'family'],
  },
  {
    id: 'work-reset', kind: 'restore', title: 'Tien minuten uit je werkhoofd',
    promise: 'Een korte pauze kan de middag lichter laten beginnen.',
    wonder: 'Geen prestatie: alleen frisse lucht, rustige ademhaling en even afstand.',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=88',
    accent: '#7FA68A', duration: 10, effort: 'Zeer licht', timeWindow: '12:20 – 13:30', cta: 'Neem deze pauze',
    why: ['Past tussen twee werkblokken', 'Geen materiaal nodig', 'Kan direct beginnen'],
    prepareTitle: 'Laat je werk even liggen', prepare: ['Meldingen stil', 'Sta op', 'Laat je scherm achter'],
    presenceMode: 'quiet', presenceTitle: 'Loop zonder doel', presenceCue: 'Je hoeft niets bij te houden. Kom terug wanneer het genoeg is.',
    steps: [
      { title: 'Laat het scherm achter', instruction: 'Sta op en kies de eenvoudigste route naar frisse lucht of een rustigere plek.' },
      { title: 'Loop één tempo lager', instruction: 'Niets meten. Laat je blik verder gaan dan de volgende paar meter.', seconds: 120 },
      { title: 'Blijf nog even stil', instruction: 'Stop kort voordat je teruggaat. Adem normaal en merk op of je tempo veranderde.', seconds: 60 },
    ],
    memoryPrompt: 'Voelde de middag daarna anders?', keywords: ['rust', 'pauze', 'ademen', 'werk', 'ontspannen', 'herstel', 'wandelen'], company: ['solo'],
  },
  {
    id: 'kettlebell-focus', kind: 'movement', title: 'Een sterk halfuur',
    promise: 'Eén kettlebell is genoeg voor een complete sessie zonder gehaast terug te komen.',
    wonder: 'Vijf bewegingen, duidelijke rondes en een helder einde.',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=88',
    accent: '#D58B56', duration: 32, effort: 'Stevig', timeWindow: '16:00 – 18:00', cta: 'Zet de training klaar',
    why: ['Je hebt voldoende tijd inclusief buffer', 'Kettlebell staat als beschikbaar', 'Uitdaging past bij je proefprofiel'],
    prepareTitle: 'Alles wat je nodig hebt', prepare: ['Kettlebell', 'Water', 'Vrije ruimte', 'Stop wanneer techniek vervaagt'],
    presenceMode: 'guided', presenceTitle: 'Goblet squat', presenceCue: 'Rustig omlaag. Sterk omhoog.',
    steps: [
      { title: 'Warm-up', instruction: 'Rustige heupscharnieren, squats zonder gewicht en armcirkels. Begin pas wanneer bewegen goed voelt.', meta: '3 minuten', seconds: 45 },
      { title: 'Goblet squat', instruction: 'Houd de kettlebell dicht bij je borst. Zak beheerst en kom krachtig omhoog.', meta: '3 rondes · 8 herhalingen' },
      { title: 'Kettlebell deadlift', instruction: 'Duw de heupen naar achteren, houd je rug neutraal en kom vanuit je benen omhoog.', meta: '3 rondes · 10 herhalingen' },
      { title: 'Eénarmige row', instruction: 'Steun stevig, trek de elleboog langs je zij en wissel na de herhalingen.', meta: '3 rondes · 8 per kant' },
      { title: 'Halve-kniende press', instruction: 'Span rustig aan en druk alleen binnen een comfortabele bewegingsbaan.', meta: '2 rondes · 6 per kant' },
      { title: 'Suitcase carry', instruction: 'Loop lang en stabiel met het gewicht aan één zijde. Wissel halverwege.', meta: '3 rondes · 30 seconden', seconds: 30 },
      { title: 'Rustig afronden', instruction: 'Leg het gewicht veilig neer, loop even uit en laat je ademhaling vanzelf zakken.', meta: '2 minuten', seconds: 45 },
    ],
    memoryPrompt: 'Was deze intensiteit vandaag passend?', keywords: ['sport', 'trainen', 'workout', 'kracht', 'kettlebell', 'bewegen', 'uitdaging'], company: ['solo', 'together'],
  },
  {
    id: 'family-mission', kind: 'connect', title: 'De kleine vondstenmissie',
    promise: 'Maak van twintig minuten samen een avontuur met vijf dingen om te vinden.',
    wonder: 'Iets ronds, iets zachts, een bijzonder geluid, een kleur en een verrassing.',
    image: 'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=1200&q=88',
    accent: '#D9B85F', duration: 20, effort: 'Speels', cta: 'Start de missie',
    why: ['Ontworpen voor samen doen', 'Werkt binnen en buiten', 'Geen voorbereiding nodig'],
    prepareTitle: 'Kies alleen waar jullie beginnen', prepare: ['Binnen of buiten', 'Geen spullen nodig', 'Laat je kind de eerste vondst kiezen'],
    presenceMode: 'quiet', presenceTitle: 'Vind vijf kleine wonderen', presenceCue: 'Leg de telefoon weg. Jullie bepalen wat telt.',
    steps: [
      { title: 'Laat je kind kiezen', instruction: 'Binnen of buiten? De eerste keuze is meteen het begin van het spel.' },
      { title: 'Vind iets ronds', instruction: 'Alles telt wanneer jullie kunnen uitleggen waarom.' },
      { title: 'Luister naar iets bijzonders', instruction: 'Wees samen tien seconden stil en wijs daarna aan wat je hoorde.', seconds: 10 },
      { title: 'Zoek één kleur op drie plekken', instruction: 'Laat je kind de kleur bepalen en samen de drie plekken vinden.' },
      { title: 'Bedenk de laatste vondst zelf', instruction: 'De laatste opdracht is van jullie. Leg daarna de telefoon weer weg.' },
    ],
    memoryPrompt: 'Welke vondst willen jullie bewaren?', keywords: ['kind', 'kinderen', 'gezin', 'samen', 'spel', 'spelen', 'familie', 'avontuur'], company: ['family', 'together'],
  },
  {
    id: 'free-cycle', kind: 'movement', title: 'Een vrije ronde op de fiets',
    promise: 'Kies één onbekende afslag en laat de route daarna vanzelf ontstaan.',
    wonder: 'Genoeg richting om te beginnen, genoeg vrijheid om iets nieuws te zien.',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=88',
    accent: '#77A9A2', duration: 50, effort: 'Gemiddeld', cta: 'Maak mijn fietsronde',
    why: ['Past binnen een vrij uur', 'Buiten en beweging in één ervaring', 'Route kan dichtbij beginnen'],
    prepareTitle: 'Klaar voor vertrek', prepare: ['Fiets en slot', 'Water', 'Controleer banden en licht', 'Houd terugkeertijd vrij'],
    presenceMode: 'handoff', presenceTitle: 'Volg de eerste richting', presenceCue: 'Gebruik navigatie alleen waar nodig en kijk verder om je heen.',
    steps: [
      { title: 'Gebruik de route naar buiten', instruction: 'Laat Kaarten alleen helpen bij het eerste veilige deel van de rit.', meta: 'Navigatie via vertrouwde app' },
      { title: 'Kies één onbekende afslag', instruction: 'Alleen wanneer de weg veilig en toegankelijk voelt. Je hoeft geen routeprestatie te leveren.' },
      { title: 'Keer op tijd om', instruction: 'Gebruik ongeveer de helft van je beschikbare tijd voor de heenweg en bescherm je terugkeerbuffer.' },
    ],
    memoryPrompt: 'Welke onverwachte plek vond je?', keywords: ['fiets', 'fietsen', 'wielrennen', 'buiten', 'route', 'bewegen'], company: ['solo', 'together', 'family'],
  },
  {
    id: 'pantry-dinner', kind: 'food', title: 'Kook met wat er al is',
    promise: 'Maak van drie gewone ingrediënten een warme maaltijd zonder opnieuw te zoeken.',
    wonder: 'Een eenvoudige basis geeft ruimte om zelf te proeven en te veranderen.',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=88',
    accent: '#C98555', duration: 30, effort: 'Eenvoudig', timeWindow: '17:30 – 19:00', cta: 'Kies mijn basis',
    why: ['Het is een logisch eetmoment', 'Gebruikt wat je al hebt', 'Stap-voor-stap begeleiding voorkomt zoeken'],
    prepareTitle: 'Wat ligt er al?', prepare: ['Kies één groente', 'Kies rijst, pasta of brood', 'Kies een smaakmaker', 'Controleer allergieën zelf'],
    presenceMode: 'guided', presenceTitle: 'Begin met de basis', presenceCue: 'Snijd eerst de groente. Daarna volgt één nieuwe stap.',
    steps: [
      { title: 'Kies je basis', instruction: 'Neem één groente en combineer die met rijst, pasta of brood. Controleer zelf allergieën en houdbaarheid.' },
      { title: 'Snijd eerst alles', instruction: 'Maak de groente in gelijke stukken en zet je smaakmaker alvast klaar.', meta: 'Mise en place' },
      { title: 'Bak de groente', instruction: 'Verhit een beetje olie en bak rustig tot kleur en geur ontstaan. Roer geregeld.', seconds: 180 },
      { title: 'Voeg de basis toe', instruction: 'Meng met je gekookte rijst of pasta, of serveer op brood. Voeg zo nodig een klein beetje kookvocht toe.' },
      { title: 'Breng pas nu op smaak', instruction: 'Proef en voeg één smaakmaker tegelijk toe. Stop zodra het compleet voelt.' },
      { title: 'Serveer zonder nieuwe suggestie', instruction: 'De maaltijd is het eindpunt. Momentum heeft nu niets meer toe te voegen.' },
    ],
    memoryPrompt: 'Wat zou je volgende keer anders doen?', keywords: ['koken', 'recept', 'eten', 'avondeten', 'maaltijd', 'keuken', 'ingrediënten'], company: ['solo', 'together', 'family'],
  },
  {
    id: 'small-reading', kind: 'learn', title: 'Vijftien minuten voor één goed idee',
    promise: 'Lees niet om af te krijgen, maar om één gedachte mee te nemen.',
    wonder: 'Een korte focus maakt van een verloren kwartier iets dat blijft hangen.',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=88',
    accent: '#88A2B2', duration: 15, effort: 'Rustig', cta: 'Open dit leesmoment',
    why: ['Past in een kort tijdvenster', 'Kan vrijwel overal', 'Duidelijk einde voorkomt doorlezen'],
    prepareTitle: 'Kies één tekst', prepare: ['Boek of bewaard artikel', 'Timer op vijftien minuten', 'Noteer maximaal één zin'],
    presenceMode: 'quiet', presenceTitle: 'Lees tot één idee blijft hangen', presenceCue: 'Daarna mag het boek weer dicht.',
    steps: [
      { title: 'Kies één tekst', instruction: 'Neem wat al binnen bereik ligt. Niet eerst zoeken naar het perfecte artikel of hoofdstuk.' },
      { title: 'Lees zonder te verzamelen', instruction: 'Markeer niets tijdens de eerste minuten. Laat één gedachte vanzelf opvallen.', seconds: 300 },
      { title: 'Schrijf maximaal één zin', instruction: 'Noteer alleen wat je morgen nog wilt weten. Daarna mag de tekst dicht.' },
    ],
    memoryPrompt: 'Welke gedachte wil je meenemen?', keywords: ['lezen', 'leren', 'boek', 'kennis', 'groei', 'rust'], company: ['solo'],
  },
];

export const byId = (id: string) => experiences.find((item) => item.id === id) ?? experiences[0];

export type IntentResult = { primary: Experience; alternative?: Experience; interpretedAs: string };

export function selectForIntent(input: string, minutes: number): IntentResult {
  const normalized = input.toLocaleLowerCase('nl-NL').trim();
  const scored = experiences
    .filter((experience) => experience.duration <= Math.max(15, minutes - 5))
    .map((experience) => ({
      experience,
      score: experience.keywords.reduce((sum, keyword) => sum + (normalized.includes(keyword) ? 12 : 0), 0)
        + (Math.abs(minutes * 0.65 - experience.duration) < 15 ? 4 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.experience.duration - b.experience.duration);

  const primary = scored[0]?.experience ?? byId('work-reset');
  const alternative = scored.find((item) => item.experience.kind !== primary.kind)?.experience;
  return {
    primary,
    alternative,
    interpretedAs: normalized ? `Je eigen woorden: “${input.trim()}”` : 'Verras me binnen de beschikbare ruimte',
  };
}

export const todayMoments = [
  { label: 'OCHTEND', time: '07:30 – 09:00', experienceId: 'morning-shake' },
  { label: 'MIDDAG', time: '12:20 – 13:30', experienceId: 'work-reset' },
  { label: 'EIND VAN DE MIDDAG', time: '16:00 – 18:00', experienceId: 'kettlebell-focus' },
  { label: 'AVOND', time: '19:30 – 20:30', experienceId: 'wadden-light' },
];
