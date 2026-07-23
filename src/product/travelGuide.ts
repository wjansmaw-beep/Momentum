import { Experience } from './experienceModel';
import { LiveWorldSnapshot } from '../liveworld/liveWorld';

// Reisgids-compositie voor Ontdekken (ADR-060, punt 1).
//
// Ontdekken wordt een redactioneel overzicht van de omgeving — een rustig
// magazine in plaats van een kandidatenlijst. Deze module stelt de secties en
// kaarten deterministisch samen uit wat er écht is: de bestaande kandidatenpool
// (catalogus + contextuele blueprints + live kansen), het Live World-snapshot
// (place knowledge, nabije plekken, bronversheid) en de koppelstatus van de
// globale omgeving (ADR-023). Zonder gekoppelde locatie blijven de wereldwijde,
// evergreen secties volledig bruikbaar; live afgeleide kaarten verschijnen
// alleen wanneer de bron er echt is.
//
// Eerlijkheidsregels (ongewijzigd, ADR-021/043/046):
// - plaatskennis en kaartdata zijn aanknopingspunten, geen garanties;
// - geen verzonnen feiten: elke kaart draagt een bestaande ervaring;
// - bronversheid blijft zichtbaar waar live data wordt gebruikt;
// - eindig altijd: per sectie een bescheiden, vast aantal kaarten.

export type GuideCard = {
  id: string;
  experience: Experience;
  /** Korte kicker boven de kaarttitel, bijv. 'LIVE · OPEN-METEO'. */
  kicker: string;
  /** Eerlijke contextregel onder de kaart (bron, versheid of aard van de lead). */
  note?: string;
};

export type GuideSection = {
  id: string;
  /** Eyebrow boven de sectietitel, bijv. 'DICHTBIJ'. */
  kicker: string;
  /** Redactionele sectietitel met karakter (serif in de UI). */
  title: string;
  /** Rustige sectie-intro in de redactionele stem. */
  intro: string;
  cards: GuideCard[];
  /** Eerlijkheidsnoot onder de sectie (leads-not-guarantees, bronvermelding). */
  footnote?: string;
};

export type TravelGuide = {
  /** Regiolabel zoals de live wereld die kent, of een wereldwijde benaming. */
  regionLabel: string;
  /** Of de omgeving expliciet gekoppeld is (globale locatie aan). */
  locationLinked: boolean;
  sections: GuideSection[];
  /** Eerlijke regel wanneer live context ontbreekt (nooit een leeg scherm). */
  liveNote?: string;
};

const MAX_PER_SECTION = 3;
const MAX_NEARBY = 4;

const minutesAgo = (iso: string) => Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));

const liveNoteFor = (experience: Experience, snapshot?: LiveWorldSnapshot): string | undefined => {
  const evidence = experience.liveEvidence?.[0];
  if (!evidence) return undefined;
  const age = snapshot ? minutesAgo(snapshot.retrievedAt) : undefined;
  return `${evidence.sourceName} · ${age !== undefined && age <= 1 ? 'zojuist opgehaald' : age !== undefined ? `${age} min geleden opgehaald` : 'actuele bron'}`;
};

const calmEffort = (experience: Experience) => /licht|rustig|eenvoudig/i.test(experience.effort);

export function composeTravelGuide(input: {
  candidatePool: Experience[];
  liveWorld?: LiveWorldSnapshot | null;
  locationLinked: boolean;
}): TravelGuide {
  const { candidatePool, liveWorld, locationLinked } = input;
  const snapshot = liveWorld ?? undefined;
  const used = new Set<string>();
  const take = (filter: (experience: Experience) => boolean, limit: number): Experience[] => {
    const picked: Experience[] = [];
    for (const experience of candidatePool) {
      if (picked.length >= limit) break;
      if (used.has(experience.id) || !filter(experience)) continue;
      used.add(experience.id);
      picked.push(experience);
    }
    return picked;
  };

  const sections: GuideSection[] = [];

  // 1. Bijzonder nu — alleen wat live bronnen écht onderscheidend maken.
  const special = take((experience) => Boolean(experience.liveEvidence?.length), MAX_PER_SECTION);
  if (special.length) {
    sections.push({
      id: 'bijzonder-nu',
      kicker: 'NU IN JE OMGEVING',
      title: 'Bijzonder nu',
      intro: 'Wat actuele bronnen vandaag onderscheidend maken — kansen, geen beloften.',
      cards: special.map((experience) => ({
        id: experience.id,
        experience,
        kicker: 'LIVE VERRIJKT',
        note: liveNoteFor(experience, snapshot),
      })),
      footnote: 'Live kansen zijn aanknopingspunten uit actuele bronnen. Wat je werkelijk aantreft en lokale aanwijzingen blijven leidend.',
    });
  }

  // 2. In de buurt — plekken met een plaatsverhaal (place knowledge, ADR-043).
  const nearby = take((experience) => Boolean(experience.placeKnowledge), MAX_NEARBY);
  if (nearby.length) {
    sections.push({
      id: 'in-de-buurt',
      kicker: 'DICHTBIJ',
      title: 'In de buurt',
      intro: 'Plekken om de hoek met een verhaal dat het lopen de moeite waard maakt.',
      cards: nearby.map((experience) => ({
        id: experience.id,
        experience,
        kicker: experience.placeKnowledge ? 'PLAATSVERHAAL' : 'DICHTBIJ',
        note: experience.placeKnowledge
          ? `${experience.placeKnowledge.sourceLabel} · ${experience.placeKnowledge.distanceMeters < 1000 ? `${experience.placeKnowledge.distanceMeters} m` : `${(experience.placeKnowledge.distanceMeters / 1000).toFixed(1)} km`} van hier`
          : undefined,
      })),
      footnote: 'Plaatsverhalen komen van Wikipedia en zijn redactionele context, geen bewijs van toegang of opening.',
    });
  }

  // 3. Eten & drinken.
  const food = take((experience) => experience.kind === 'food', MAX_PER_SECTION);
  if (food.length) {
    sections.push({
      id: 'eten-drinken',
      kicker: 'PROEVEN',
      title: 'Eten & drinken',
      intro: 'Kleine keukens en nabije tafels — één smaak is genoeg voor een goede onderbreking.',
      cards: food.map((experience) => ({
        id: experience.id,
        experience,
        kicker: experience.liveEvidence?.length ? 'NU MOGELIJK' : 'OVERAL TE MAKEN',
        note: liveNoteFor(experience, snapshot),
      })),
    });
  }

  // 4. Natuur & wandelen.
  const nature = take((experience) => experience.kind === 'outside', MAX_PER_SECTION);
  if (nature.length) {
    sections.push({
      id: 'natuur-wandelen',
      kicker: 'BUITENLUCHT',
      title: 'Natuur & wandelen',
      intro: 'Routes die dichtbij beginnen en ver genoeg voelen om de dag te veranderen.',
      cards: nature.map((experience) => ({
        id: experience.id,
        experience,
        kicker: experience.liveEvidence?.length ? 'LIVE VERRIJKT' : 'ELK SEIZOEN',
        note: liveNoteFor(experience, snapshot),
      })),
      footnote: locationLinked
        ? 'Buitenankers uit OpenStreetMap zijn publieke aanknopingspunten — blijf op openbare routes en volg lokale borden.'
        : undefined,
    });
  }

  // 5. Rust — stille vormen die overal werken.
  const calm = take((experience) => ['restore', 'learn', 'culture'].includes(experience.kind) && calmEffort(experience), MAX_PER_SECTION);
  if (calm.length) {
    sections.push({
      id: 'rust',
      kicker: 'VERSTILLEN',
      title: 'Rust',
      intro: 'Voor de uren waarop de wereld even zacht moet zijn. Geen bestemming nodig.',
      cards: calm.map((experience) => ({
        id: experience.id,
        experience,
        kicker: 'OVERAL',
      })),
    });
  }

  const regionLabel = snapshot?.regionLabel ?? 'jouw omgeving';
  const liveNote = !locationLinked
    ? 'Koppel je globale omgeving om plekken, verhalen en live kansen dichtbij te zien. Deze gids blijft ook zonder locatie volledig bruikbaar.'
    : !special.length && !nearby.length
      ? 'Op dit moment geen actuele kansen of plaatsverhalen binnen bereik. De ervaringen hieronder werken overal, ook zonder live bronnen.'
      : undefined;

  return { regionLabel, locationLinked, sections, liveNote };
}
