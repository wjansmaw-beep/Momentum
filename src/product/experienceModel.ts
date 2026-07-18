export type Surface = 'now' | 'today' | 'discover' | 'lifebook';
export type ExperienceKind = 'outside' | 'food' | 'movement' | 'restore' | 'connect' | 'learn' | 'culture';
export type PresenceMode = 'quiet' | 'guided' | 'handoff';
export type InsightTopic = 'place' | 'nature' | 'movement' | 'food' | 'culture' | 'general';
export type GuidedInsight = {
  title: string;
  body: string;
  topic: InsightTopic;
  sourceKind: 'editorial' | 'live' | 'curator' | 'generated';
  sourceLabel: string;
  sourceUrl?: string;
};
export type CapsuleStep = {
  title: string;
  instruction: string;
  meta?: string;
  seconds?: number;
  insight?: GuidedInsight;
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
  estimateKind?: 'straight-line-conservative';
  sourceLabel?: string;
  expiresAt?: string;
  recheckLabel?: string;
  routeCapability?: {
    state: 'fallback' | 'configured';
    providerLabel: string;
    detail: string;
  };
  arrivalPlan?: {
    kind: 'open-observation' | 'anchored-loop' | 'single-place';
    label: string;
    durationMinutes: number;
    radiusMeters?: number;
    instruction: string;
    returnTrigger: string;
  };
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
  placeKnowledge?: {
    title: string;
    summary: string;
    sourceLabel: string;
    sourceUrl: string;
    distanceMeters: number;
  };
  guideOrigin?: {
    mode: 'curated' | 'composed';
    label: string;
  };
  blueprint?: {
    id: string;
    domain: ExperienceKind;
    origin: 'editorial' | 'deterministic' | 'generated-draft';
    validationLabel: string;
  };
  meaningThread?: {
    horizon: 'near' | 'growth' | 'meaning';
    label: string;
    source: 'user-confirmed';
    reason: string;
  };
  generation?: {
    mode: 'remote' | 'local-synthesis';
    provider: string;
    createdAt: string;
    disclosure: string;
  };
};

export const experienceFactLabels: Record<ExperienceKind, { duration: string; distance: string; effort: string }> = {
  outside: { duration: 'buiten', distance: 'bereik', effort: 'tempo' },
  food: { duration: 'bereiding', distance: 'benodigd', effort: 'moeite' },
  movement: { duration: 'bewegen', distance: 'benodigd', effort: 'intensiteit' },
  restore: { duration: 'herstel', distance: 'plek', effort: 'intensiteit' },
  connect: { duration: 'samen', distance: 'plek', effort: 'sfeer' },
  learn: { duration: 'ontdekken', distance: 'plek', effort: 'aandacht' },
  culture: { duration: 'beleven', distance: 'bereik', effort: 'sfeer' },
};

export const experiences: Experience[] = [
  {
    id: 'wadden-light', kind: 'outside', title: 'Wadden Light Walk',
    promise: 'Vanavond kleurt het wad goudgeel in de ondergaande zon.',
    wonder: 'De wind neemt af en het laatste licht valt precies over het water.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=88',
    accent: '#C18B5B', duration: 45, effort: 'Rustig', distance: '35 min reizen', timeWindow: '19:30 – 20:30', cta: 'Ga dit beleven',
    why: ['Je hebt vanavond ruimte', 'Het weer past bij buiten zijn', 'Natuur sluit aan bij je proefprofiel'],
    prepareTitle: 'Klaar om te gaan?', prepare: ['Lichte jas', 'Water', 'Camera of verrekijker', 'Vertrek zonder haast'],
    presenceMode: 'handoff', presenceTitle: 'Geniet van het licht', presenceCue: 'Open de route en laat Momentum daarna verdwijnen.',
    steps: [
      { title: 'Reis naar het startpunt', instruction: 'Laat Kaarten je brengen. Momentum hoeft onderweg niets toe te voegen.', meta: 'Navigatie via vertrouwde app' },
      { title: 'Begin rustig', instruction: 'Geef jezelf de eerste vijf minuten om aan wind, licht en omgeving te wennen.', meta: 'Telefoon weg', insight: { title: 'Waarom het licht zo laag voelt', body: 'Rond zonsondergang legt het licht een langere weg door de atmosfeer af. Koelere kleuren worden sterker verstrooid, waardoor warme tinten meer opvallen.', topic: 'nature', sourceKind: 'editorial', sourceLabel: 'Momentum natuurredactie' } },
      { title: 'Kijk één keer bewust om je heen', instruction: 'Zoek geen perfecte foto. Merk één detail op dat alleen vanavond bestaat.', insight: { title: 'Lees de rand van water en land', body: 'Let op waar glans, slik, water en begroeiing elkaar raken. Juist aan zo\'n overgang veranderen kleur, beweging en vogelactiviteit vaak het duidelijkst. Kijk zonder een waarneming af te dwingen.', topic: 'nature', sourceKind: 'editorial', sourceLabel: 'Momentum natuurredactie' } },
      { title: 'Keer zonder haast terug', instruction: 'Laat voldoende tijd over voor de terugweg en verander de route niet wanneer omstandigheden onveilig voelen.' },
    ],
    memoryPrompt: 'Wat wil je van dit licht onthouden?', keywords: ['wandelen', 'wandeling', 'buiten', 'natuur', 'zee', 'strand', 'vogels', 'licht', 'rust'], company: ['solo', 'together', 'family'],
  },
  {
    id: 'morning-shake', kind: 'food', title: 'Jouw power-ochtendshake',
    promise: 'In zeven minuten staat er iets fris en voedends voor je klaar.',
    wonder: 'Mango, yoghurt en gember maken de ochtend helder zonder gedoe.',
    image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=1200&q=88',
    accent: '#B97E4E', duration: 7, effort: 'Heel eenvoudig', timeWindow: '07:30 – 09:00', cta: 'Maak deze shake',
    why: ['Dit past in je ochtend', 'Weinig voorbereiding', 'Een snelle eetkeuze voorkomt zoeken'],
    prepareTitle: 'Zet alles klaar', prepare: ['1 banaan of mango', 'Yoghurt of plantaardige basis', 'Gember', 'Blender en glas'],
    presenceMode: 'guided', presenceTitle: 'Blend tot het glad is', presenceCue: 'Proef eerst. Voeg pas daarna iets toe.',
    steps: [
      { title: 'Doe het fruit in de blender', instruction: 'Gebruik één banaan of ongeveer een hand mango. Bevroren fruit maakt de shake kouder.', meta: '1 portie', insight: { title: 'Wat het fruit hier doet', body: 'Banaan maakt de shake voller en zachter; mango geeft een frissere, fruitige basis. Bevroren fruit koelt én maakt de structuur dikker zonder extra ijs.', topic: 'food', sourceKind: 'editorial', sourceLabel: 'Momentum kookredactie' } },
      { title: 'Voeg de basis toe', instruction: 'Schenk ongeveer 200 ml yoghurt of een plantaardige basis erbij.', meta: 'Controleer wat bij jou past', insight: { title: 'De basis bepaalt meer dan smaak', body: 'Een dikkere basis geeft een lepelbare shake; een dunnere basis maakt hem drinkbaarder. Voeg daarom niet alles tegelijk toe: structuur is eenvoudiger bij te sturen dan te herstellen.', topic: 'food', sourceKind: 'editorial', sourceLabel: 'Momentum kookredactie' } },
      { title: 'Geef hem karakter', instruction: 'Voeg een klein stukje gember toe. Begin bescheiden; meer kan altijd.', insight: { title: 'Bouw een sterke smaak langzaam op', body: 'Gember kan andere smaken snel overheersen. Een klein begin laat je na het blenden kiezen of warmte en scherpte nog iets sterker mogen.', topic: 'food', sourceKind: 'editorial', sourceLabel: 'Momentum kookredactie' } },
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
    accent: '#6E9691', duration: 10, effort: 'Zeer licht', timeWindow: '12:20 – 13:30', cta: 'Neem deze pauze',
    why: ['Past tussen twee werkblokken', 'Geen materiaal nodig', 'Kan direct beginnen'],
    prepareTitle: 'Laat je werk even liggen', prepare: ['Meldingen stil', 'Sta op', 'Laat je scherm achter'],
    presenceMode: 'quiet', presenceTitle: 'Loop zonder doel', presenceCue: 'Je hoeft niets bij te houden. Kom terug wanneer het genoeg is.',
    steps: [
      { title: 'Laat het scherm achter', instruction: 'Sta op en kies de eenvoudigste route naar frisse lucht of een rustigere plek.', insight: { title: 'Waarom deze pauze geen prestatie heeft', body: 'Het doel is alleen een duidelijke overgang tussen twee werkblokken. Je hoeft geen afstand, tempo of ademhaling te verbeteren om de pauze te laten tellen.', topic: 'general', sourceKind: 'editorial', sourceLabel: 'Momentum herstelredactie' } },
      { title: 'Loop één tempo lager', instruction: 'Niets meten. Laat je blik verder gaan dan de volgende paar meter.', seconds: 120, insight: { title: 'Laat de omgeving het tempo bepalen', body: 'Kies geen doelpunt en tel geen stappen. Een bocht, boom, raam of stukje lucht kan genoeg zijn om even werkelijk ergens anders te zijn dan in je taak.', topic: 'general', sourceKind: 'editorial', sourceLabel: 'Momentum herstelredactie' } },
      { title: 'Blijf nog even stil', instruction: 'Stop kort voordat je teruggaat. Adem normaal en merk op of je tempo veranderde.', seconds: 60 },
    ],
    memoryPrompt: 'Voelde de middag daarna anders?', keywords: ['rust', 'pauze', 'ademen', 'werk', 'ontspannen', 'herstel', 'wandelen'], company: ['solo'],
  },
  {
    id: 'kettlebell-focus', kind: 'movement', title: 'Een sterk halfuur',
    promise: 'Eén kettlebell is genoeg voor een complete sessie zonder gehaast terug te komen.',
    wonder: 'Vijf bewegingen, duidelijke rondes en een helder einde.',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=88',
    accent: '#B86E4F', duration: 32, effort: 'Stevig', timeWindow: '16:00 – 18:00', cta: 'Zet de training klaar',
    why: ['Je hebt voldoende tijd inclusief buffer', 'Kettlebell staat als beschikbaar', 'Uitdaging past bij je proefprofiel'],
    prepareTitle: 'Alles wat je nodig hebt', prepare: ['Kettlebell', 'Water', 'Vrije ruimte', 'Stop wanneer techniek vervaagt'],
    presenceMode: 'guided', presenceTitle: 'Goblet squat', presenceCue: 'Rustig omlaag. Sterk omhoog.',
    steps: [
      { title: 'Warm-up', instruction: 'Rustige heupscharnieren, squats zonder gewicht en armcirkels. Begin pas wanneer bewegen goed voelt.', meta: '3 minuten', seconds: 180 },
      { title: 'Goblet squat', instruction: 'Houd de kettlebell dicht bij je borst. Zak beheerst en kom krachtig omhoog.', meta: '3 rondes · 8 herhalingen', insight: { title: 'Waarom het gewicht dichtbij blijft', body: 'Een gewicht dicht bij je lichaam is meestal eenvoudiger stabiel te houden. Daardoor kun je aandacht geven aan een rustige beweging en een houding die goed blijft voelen.', topic: 'movement', sourceKind: 'editorial', sourceLabel: 'Momentum trainingsredactie' } },
      { title: 'Kettlebell deadlift', instruction: 'Duw de heupen naar achteren, houd je rug neutraal en kom vanuit je benen omhoog.', meta: '3 rondes · 10 herhalingen', insight: { title: 'Dit is een heupbeweging', body: 'De deadlift oefent vooral het naar achteren brengen en weer strekken van de heupen. Houd het gewicht dicht bij je en stop wanneer je de beweging niet meer beheerst kunt herhalen.', topic: 'movement', sourceKind: 'editorial', sourceLabel: 'Momentum trainingsredactie' } },
      { title: 'Eénarmige row', instruction: 'Steun stevig, trek de elleboog langs je zij en wissel na de herhalingen.', meta: '3 rondes · 8 per kant' },
      { title: 'Halve-kniende press', instruction: 'Span rustig aan en druk alleen binnen een comfortabele bewegingsbaan.', meta: '2 rondes · 6 per kant' },
      { title: 'Suitcase carry', instruction: 'Loop lang en stabiel met het gewicht aan één zijde. Wissel halverwege.', meta: '3 rondes · 30 seconden', seconds: 30, insight: { title: 'Waarom het gewicht aan één kant blijft', body: 'De opdracht is niet sneller lopen, maar rechtop blijven terwijl het gewicht je zijwaarts trekt. Kies een last waarmee je rustig kunt stappen zonder te compenseren.', topic: 'movement', sourceKind: 'editorial', sourceLabel: 'Momentum trainingsredactie' } },
      { title: 'Rustig afronden', instruction: 'Leg het gewicht veilig neer, loop even uit en laat je ademhaling vanzelf zakken.', meta: '2 minuten', seconds: 120 },
    ],
    memoryPrompt: 'Was deze intensiteit vandaag passend?', keywords: ['sport', 'trainen', 'workout', 'kracht', 'kettlebell', 'bewegen', 'uitdaging'], company: ['solo', 'together'],
  },
  {
    id: 'bodyweight-session', kind: 'movement', title: 'Sterk zonder materiaal',
    promise: 'Een complete sessie met alleen je eigen lichaamsgewicht en een helder einde.',
    wonder: 'Vier eenvoudige bewegingen worden samen een stevige training die vrijwel overal kan.',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=88',
    accent: '#8B776A', duration: 22, effort: 'Stevig', cta: 'Zet deze sessie klaar',
    why: ['Geen materiaal nodig', 'Past met buffer in een vrij halfuur', 'Volledig stap voor stap uit te voeren'],
    prepareTitle: 'Maak alleen wat ruimte', prepare: ['Vrije vloer van ongeveer twee passen', 'Water binnen bereik', 'Stevige ondergrond', 'Vereenvoudig of stop wanneer bewegen niet goed voelt'],
    presenceMode: 'guided', presenceTitle: 'Begin beheerst', presenceCue: 'Techniek bepaalt het tempo; niet de klok.',
    steps: [
      { title: 'Rustig opwarmen', instruction: 'Loop op de plaats, maak rustige squats en draai je schouders los. Begin pas wanneer bewegen goed voelt.', meta: '3 minuten', seconds: 180 },
      { title: 'Squat naar een stoel', instruction: 'Zak beheerst richting een stoel of denkbeeldige zitting. Kom rustig omhoog en stop wanneer controle verdwijnt.', meta: '3 rondes · 8 herhalingen', insight: { title: 'Maak de beweging passend', body: 'Een hogere stoel of kleinere beweging maakt de squat lichter. Die aanpassing is geen mislukking maar een manier om controle te bewaren.', topic: 'movement', sourceKind: 'editorial', sourceLabel: 'Momentum trainingsredactie' } },
      { title: 'Schuine push-up', instruction: 'Plaats je handen tegen een stevige tafel of muur. Houd je lichaam lang en beweeg alleen zo diep als comfortabel blijft.', meta: '3 rondes · 6–10 herhalingen' },
      { title: 'Uitstap naar achteren', instruction: 'Stap om en om rustig naar achteren en gebruik steun wanneer dat veiliger voelt.', meta: '3 rondes · 6 per zijde', insight: { title: 'Stabiliteit gaat voor diepte', body: 'Een kleine stap met rustige controle is waardevoller dan een diepe beweging waarbij je balans verliest.', topic: 'movement', sourceKind: 'editorial', sourceLabel: 'Momentum trainingsredactie' } },
      { title: 'Bear hold of tafelplank', instruction: 'Kies de variant die beheerst voelt. Adem normaal en stop voordat je houding vervaagt.', meta: '3 rondes · 20 seconden', seconds: 20 },
      { title: 'Neem je tijd terug', instruction: 'Loop rustig uit, laat je ademhaling zakken en rond af zonder nog een oefening toe te voegen.', meta: '2 minuten', seconds: 120 },
    ],
    memoryPrompt: 'Voelde deze sessie vandaag goed gedoseerd?', keywords: ['sport', 'trainen', 'workout', 'bodyweight', 'zonder materiaal', 'bewegen', 'uitdaging'], company: ['solo', 'together'],
  },
  {
    id: 'family-mission', kind: 'connect', title: 'De kleine vondstenmissie',
    promise: 'Maak van twintig minuten samen een avontuur met vijf dingen om te vinden.',
    wonder: 'Iets ronds, iets zachts, een bijzonder geluid, een kleur en een verrassing.',
    image: 'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=1200&q=88',
    accent: '#B68A50', duration: 20, effort: 'Speels', cta: 'Start de missie',
    why: ['Ontworpen voor samen doen', 'Werkt binnen en buiten', 'Geen voorbereiding nodig'],
    prepareTitle: 'Kies alleen waar jullie beginnen', prepare: ['Binnen of buiten', 'Geen spullen nodig', 'Laat je kind de eerste vondst kiezen'],
    presenceMode: 'quiet', presenceTitle: 'Vind vijf kleine wonderen', presenceCue: 'Leg de telefoon weg. Jullie bepalen wat telt.',
    steps: [
      { title: 'Laat je kind kiezen', instruction: 'Binnen of buiten? De eerste keuze is meteen het begin van het spel.', insight: { title: 'Eén keuze is genoeg', body: 'De activiteit hoeft niet volledig door een volwassene te worden bedacht. Met één echte keuze wordt het een gezamenlijk spel en kan de telefoon daarna weg.', topic: 'general', sourceKind: 'editorial', sourceLabel: 'Momentum gezinsredactie' } },
      { title: 'Vind iets ronds', instruction: 'Alles telt wanneer jullie kunnen uitleggen waarom.' },
      { title: 'Luister naar iets bijzonders', instruction: 'Wees samen tien seconden stil en wijs daarna aan wat je hoorde.', seconds: 10, insight: { title: 'Er is geen goed antwoord', body: 'Het spel werkt juist wanneer iedereen iets anders mag horen of aanwijzen. Een verre auto, vogel, koelkast of voetstap kan allemaal de vondst zijn.', topic: 'general', sourceKind: 'editorial', sourceLabel: 'Momentum gezinsredactie' } },
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
    accent: '#5F898D', duration: 50, effort: 'Gemiddeld', cta: 'Maak mijn fietsronde',
    why: ['Past binnen een vrij uur', 'Buiten en beweging in één ervaring', 'Route kan dichtbij beginnen'],
    prepareTitle: 'Klaar voor vertrek', prepare: ['Fiets en slot', 'Water', 'Controleer banden en licht', 'Houd terugkeertijd vrij'],
    presenceMode: 'handoff', presenceTitle: 'Volg de eerste richting', presenceCue: 'Gebruik navigatie alleen waar nodig en kijk verder om je heen.',
    steps: [
      { title: 'Gebruik de route naar buiten', instruction: 'Laat Kaarten alleen helpen bij het eerste veilige deel van de rit.', meta: 'Navigatie via vertrouwde app', insight: { title: 'Waarom de terugweg al meetelt', body: 'Een vrije route blijft ontspannen wanneer de helft van de beschikbare tijd niet stilletjes voor de heenweg wordt gebruikt. Momentum beschermt daarom vooraf een terugkeerbuffer.', topic: 'movement', sourceKind: 'editorial', sourceLabel: 'Momentum routeredactie' } },
      { title: 'Kies één onbekende afslag', instruction: 'Alleen wanneer de weg veilig en toegankelijk voelt. Je hoeft geen routeprestatie te leveren.', insight: { title: 'Ontdekken zonder de terugweg te verliezen', body: 'Eén afwijking is genoeg om een bekende omgeving anders te zien. Houd de hoofdrichting en resterende tijd in gedachten; onbekend hoeft niet onvoorbereid te betekenen.', topic: 'place', sourceKind: 'editorial', sourceLabel: 'Momentum routeredactie' } },
      { title: 'Keer op tijd om', instruction: 'Gebruik ongeveer de helft van je beschikbare tijd voor de heenweg en bescherm je terugkeerbuffer.' },
    ],
    memoryPrompt: 'Welke onverwachte plek vond je?', keywords: ['fiets', 'fietsen', 'wielrennen', 'buiten', 'route', 'bewegen'], company: ['solo', 'together', 'family'],
  },
  {
    id: 'pantry-dinner', kind: 'food', title: 'Kook met wat er al is',
    promise: 'Maak van drie gewone ingrediënten een warme maaltijd zonder opnieuw te zoeken.',
    wonder: 'Een eenvoudige basis geeft ruimte om zelf te proeven en te veranderen.',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=88',
    accent: '#B57450', duration: 30, effort: 'Eenvoudig', timeWindow: '17:30 – 19:00', cta: 'Kies mijn basis',
    why: ['Het is een logisch eetmoment', 'Gebruikt wat je al hebt', 'Stap-voor-stap begeleiding voorkomt zoeken'],
    prepareTitle: 'Wat ligt er al?', prepare: ['Kies één groente', 'Kies rijst, pasta of brood', 'Kies een smaakmaker', 'Controleer allergieën zelf'],
    presenceMode: 'guided', presenceTitle: 'Begin met de basis', presenceCue: 'Snijd eerst de groente. Daarna volgt één nieuwe stap.',
    steps: [
      { title: 'Kies je basis', instruction: 'Neem één groente en combineer die met rijst, pasta of brood. Controleer zelf allergieën en houdbaarheid.' },
      { title: 'Snijd eerst alles', instruction: 'Maak de groente in gelijke stukken en zet je smaakmaker alvast klaar.', meta: 'Mise en place', insight: { title: 'Gelijke stukken geven rust in de pan', body: 'Stukken van ongeveer dezelfde grootte garen voorspelbaarder. Daardoor hoef je later minder te corrigeren en kun je beter letten op kleur, geur en structuur.', topic: 'food', sourceKind: 'editorial', sourceLabel: 'Momentum kookredactie' } },
      { title: 'Bak de groente', instruction: 'Verhit een beetje olie en bak rustig tot kleur en geur ontstaan. Roer geregeld.', seconds: 180, insight: { title: 'Waarom kleur smaak toevoegt', body: 'Wanneer ingrediënten aan het oppervlak bruinen, ontstaan nieuwe aroma\'s. Geef de pan daarom wat ruimte en roer niet onafgebroken.', topic: 'food', sourceKind: 'editorial', sourceLabel: 'Momentum kookredactie' } },
      { title: 'Voeg de basis toe', instruction: 'Meng met je gekookte rijst of pasta, of serveer op brood. Voeg zo nodig een klein beetje kookvocht toe.' },
      { title: 'Breng pas nu op smaak', instruction: 'Proef en voeg één smaakmaker tegelijk toe. Stop zodra het compleet voelt.', insight: { title: 'Verander maar één ding tegelijk', body: 'Voeg je zout, zuur, pit en kruiden tegelijk toe, dan weet je niet welke keuze hielp. Proef na elke kleine aanpassing en laat het gerecht zelf het eindpunt bepalen.', topic: 'food', sourceKind: 'editorial', sourceLabel: 'Momentum kookredactie' } },
      { title: 'Serveer zonder nieuwe suggestie', instruction: 'De maaltijd is het eindpunt. Momentum heeft nu niets meer toe te voegen.' },
    ],
    memoryPrompt: 'Wat zou je volgende keer anders doen?', keywords: ['koken', 'recept', 'eten', 'avondeten', 'maaltijd', 'keuken', 'ingrediënten'], company: ['solo', 'together', 'family'],
  },
  {
    id: 'small-reading', kind: 'learn', title: 'Eén inzicht, direct toegepast',
    promise: 'Momentum geeft je een klein idee en laat je het meteen in de echte wereld herkennen.',
    wonder: 'Leren blijft beter hangen wanneer het niet bij informatie alleen blijft.',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=88',
    accent: '#75899E', duration: 15, effort: 'Rustig', cta: 'Ontdek dit inzicht',
    why: ['Past in een kort tijdvenster', 'Momentum levert de inhoud', 'Eindigt met kijken en doen'],
    prepareTitle: 'Alleen je aandacht is nodig', prepare: ['Geen boek of artikel nodig', 'Kijk straks bewust om je heen', 'Bewaar hooguit één inzicht'],
    presenceMode: 'guided', presenceTitle: 'Ontdek door te vergelijken', presenceCue: 'Eén idee, daarna de wereld weer in.',
    steps: [
      { title: 'Het idee', instruction: 'Je merkt kenmerken sneller op wanneer je twee dingen bewust vergelijkt in plaats van er maar één te bekijken.', insight: { title: 'Vergelijken maakt verschillen zichtbaar', body: 'Kies twee alledaagse dingen uit dezelfde soort: twee bomen, gevels, kopjes of geluiden. Vraag niet welke mooier is, maar welk klein verschil je eerst niet zag.', topic: 'general', sourceKind: 'editorial', sourceLabel: 'Momentum leerredactie' } },
      { title: 'Probeer het buiten het scherm', instruction: 'Kies twee dingen in je omgeving en noem drie concrete verschillen. Leg daarna je telefoon weg.', seconds: 180, insight: { title: 'Maak elk verschil waarneembaar', body: 'Vervang woorden als mooi of vreemd door iets dat je kunt aanwijzen: rand, kleur, ritme, materiaal, richting of geluid. Zo wordt een indruk een ontdekking.', topic: 'general', sourceKind: 'editorial', sourceLabel: 'Momentum leerredactie' } },
      { title: 'Neem één vraag mee', instruction: 'Wat zou je hierover nog willen begrijpen? Bewaar alleen die vraag wanneer hij echt nieuwsgierigheid oproept.' },
    ],
    memoryPrompt: 'Welk verschil zag je nu pas?', keywords: ['leren', 'kennis', 'groei', 'nieuwsgierigheid', 'ontdekken', 'kijken'], company: ['solo'],
  },
  {
    id: 'one-song-listening', kind: 'culture', title: 'Luister naar één nummer',
    promise: 'Geef één muziekstuk je volledige aandacht, zonder ondertussen iets anders te doen.',
    wonder: 'Een bekend nummer kan anders klinken wanneer je het niet als achtergrond gebruikt.',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=88',
    accent: '#8C7A9C', duration: 8, effort: 'Heel rustig', cta: 'Kies mijn luistermoment',
    why: ['Kan vrijwel overal', 'Geen voorbereiding nodig', 'Heeft een helder en natuurlijk einde'],
    prepareTitle: 'Kies zonder lang te zoeken', prepare: ['Eén nummer dat je al kent', 'Koptelefoon alleen waar dat veilig is', 'Meldingen stil'],
    presenceMode: 'handoff', presenceTitle: 'Luister tot de laatste noot', presenceCue: 'Open je vertrouwde muziekapp en leg daarna je scherm weg.',
    steps: [
      { title: 'Open je muziek', instruction: 'Kies het eerste bekende nummer dat bij je opkomt. Geen afspeellijst en geen zoektocht naar het perfecte lied.', insight: { title: 'Luister naar één laag', body: 'Kies vóór het afspelen één aandachtspunt: ritme, bas, stem, tekst of ruimte tussen klanken. Zo wordt een bekend nummer een kleine ontdekking zonder extra schermtijd.', topic: 'culture', sourceKind: 'editorial', sourceLabel: 'Momentum cultuurredactie' } },
      { title: 'Laat alleen de muziek over', instruction: 'Leg je scherm weg en luister tot het nummer helemaal afgelopen is.', meta: 'Handoff naar je muziekapp' },
      { title: 'Wacht tien seconden', instruction: 'Start niet meteen iets nieuws. Laat het einde nog even bestaan.', seconds: 10, insight: { title: 'Het einde hoort bij het luisteren', body: 'De korte stilte maakt hoorbaar wat het nummer achterlaat: een ritme dat doorgaat, een zin, spanning of juist rust. Je hoeft daar niets van vast te leggen.', topic: 'culture', sourceKind: 'editorial', sourceLabel: 'Momentum cultuurredactie' } },
    ],
    memoryPrompt: 'Welk detail hoorde je nu voor het eerst?', keywords: ['muziek', 'luisteren', 'nummer', 'lied', 'cultuur', 'rust', 'focus'], company: ['solo', 'together'],
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
