export type Surface = 'now' | 'today' | 'discover' | 'lifebook';
export type ExperienceKind = 'outside' | 'food' | 'movement' | 'restore' | 'connect' | 'learn' | 'culture';
export type PresenceMode = 'quiet' | 'guided' | 'handoff';

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
  memoryPrompt: string;
  keywords: string[];
  company: Array<'solo' | 'together' | 'family'>;
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
