import { CapsuleStep, Experience, GuidedInsight } from '../product/experienceModel';
import { evidenceFreshness } from './experienceGuide';

const maxGuideMoments = 3;

const evergreenInsight: Record<Experience['kind'], GuidedInsight> = {
  outside: { title: 'Laat de plek het verhaal afmaken', body: 'Gebruik de gids als beginpunt. Licht, geluid, toegang en wat er werkelijk aanwezig is gaan altijd voor op de verwachting in de kaart.', topic: 'place', sourceKind: 'editorial', sourceLabel: 'Momentum ervaringsredactie' },
  food: { title: 'Proef voordat je corrigeert', body: 'Verander één onderdeel tegelijk. Zo blijft duidelijk wat smaak, structuur of temperatuur werkelijk verbetert.', topic: 'food', sourceKind: 'editorial', sourceLabel: 'Momentum kookredactie' },
  movement: { title: 'Kwaliteit bepaalt het tempo', body: 'De voorgestelde belasting is een vertrekpunt. Vertraag, vereenvoudig of stop zodra de beweging niet meer beheerst voelt.', topic: 'movement', sourceKind: 'editorial', sourceLabel: 'Momentum trainingsredactie' },
  restore: { title: 'Herstel hoeft niets te bewijzen', body: 'Gebruik alleen de aanwijzing die ruimte geeft. Een korter of stiller moment kan volledig genoeg zijn.', topic: 'general', sourceKind: 'editorial', sourceLabel: 'Momentum herstelredactie' },
  connect: { title: 'Samen bepaalt wat telt', body: 'De kaart biedt een begin, geen script. Laat gesprek, spel en het tempo van de ander de ervaring overnemen.', topic: 'general', sourceKind: 'editorial', sourceLabel: 'Momentum gezinsredactie' },
  learn: { title: 'Maak informatie waarneembaar', body: 'Zoek één detail dat je kunt aanwijzen, vergelijken of proberen. Daarna mag de uitleg verdwijnen.', topic: 'general', sourceKind: 'editorial', sourceLabel: 'Momentum leerredactie' },
  culture: { title: 'Kies één detail om echt te ontmoeten', body: 'Je hoeft niet alles te begrijpen of af te maken. Eén beeld, klank, verhaal of vraag kan de volledige ervaring zijn.', topic: 'culture', sourceKind: 'editorial', sourceLabel: 'Momentum cultuurredactie' },
};

const liveInsight = (experience: Experience, now: number): GuidedInsight | undefined => {
  const evidence = (experience.liveEvidence ?? []).map((item) => evidenceFreshness(item, now)).find((item) => item.freshness === 'current');
  if (!evidence) return undefined;
  return {
    title: evidence.certainty === 'observation' ? 'Wat de recente bron werkelijk zegt' : 'Hoe je deze actuele verwachting leest',
    body: `${evidence.sourceName} meldt: “${evidence.label}”. Gebruik dit binnen het genoemde bronvenster als aanwijzing, niet als garantie voor wat je ter plaatse aantreft.`,
    topic: experience.kind === 'culture' ? 'culture' : experience.kind === 'food' ? 'food' : 'nature',
    sourceKind: 'live',
    sourceLabel: evidence.sourceName,
  };
};

const routeInsight = (experience: Experience): GuidedInsight | undefined => experience.routePlan ? {
  title: 'Waarom de route een buffer bewaart',
  body: `De voorbereiding reserveert ${experience.routePlan.bufferMinutes} minuten naast heenweg, ervaring en terugkeer. Kaarten bepaalt de actuele route; toegang en aanwijzingen ter plaatse blijven leidend.`,
  topic: 'place',
  sourceKind: 'editorial',
  sourceLabel: 'Momentum routecompositie',
} : undefined;

const addInsight = (steps: CapsuleStep[], insight: GuidedInsight, preferredIndex: number) => {
  const index = steps.findIndex((step, stepIndex) => stepIndex >= preferredIndex && !step.insight);
  const fallback = steps.findIndex((step) => !step.insight);
  const target = index >= 0 ? index : fallback;
  if (target < 0) return steps;
  return steps.map((step, stepIndex) => stepIndex === target ? { ...step, insight } : step);
};

export function composeGuideMoments(experience: Experience, now = Date.now()): Experience {
  const currentCount = experience.steps.filter((step) => step.insight).length;
  if (currentCount >= maxGuideMoments) return experience;

  const candidates = [liveInsight(experience, now), routeInsight(experience), evergreenInsight[experience.kind]].filter(Boolean) as GuidedInsight[];
  let steps = experience.steps.map((step) => ({ ...step }));
  for (const [index, insight] of candidates.entries()) {
    if (steps.filter((step) => step.insight).length >= maxGuideMoments) break;
    if (steps.some((step) => step.insight?.title === insight.title)) continue;
    steps = addInsight(steps, insight, Math.min(index, Math.max(0, steps.length - 1)));
  }

  if (steps.every((step, index) => step.insight === experience.steps[index]?.insight)) return experience;
  return {
    ...experience,
    steps,
    guideOrigin: {
      mode: 'composed',
      label: experience.liveEvidence?.length ? 'Automatisch samengesteld uit kaart, route en actuele bronnen' : 'Automatisch samengesteld uit kaart en ervaringscontract',
    },
  };
}
