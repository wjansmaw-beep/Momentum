import { Experience, ExperienceKind } from './experienceModel';
import { PrototypeContext } from './localIntelligence';

export type BlueprintDomain = ExperienceKind;

export type BlueprintValidation = {
  ready: boolean;
  issues: string[];
  label: string;
};

export type BlueprintComposition = {
  experiences: Experience[];
  interpretedDomains: BlueprintDomain[];
  interpretation: string;
};

export type IntentClarificationOption = { id: string; label: string; terms: string };
export type IntentClarification = {
  id: 'direction' | 'food-form' | 'movement-form' | 'outside-tone';
  question: string;
  reason: string;
  options: IntentClarificationOption[];
};

export type ActiveIntentUnderstanding = {
  domains: BlueprintDomain[];
  confidence: 'high' | 'medium' | 'low';
  clarification?: IntentClarification;
};

type DomainContract = {
  id: string;
  terms: string[];
  validate: (experience: Experience, context: PrototypeContext) => BlueprintValidation;
};

const baseValidation = (experience: Experience): string[] => {
  const issues: string[] = [];
  if (!experience.promise.trim() || !experience.wonder.trim()) issues.push('De ervaringsbelofte is niet compleet.');
  if (!experience.steps.length || experience.steps.some((step) => !step.title.trim() || !step.instruction.trim())) issues.push('De uitvoering is niet compleet.');
  if (experience.duration <= 0) issues.push('De tijdsduur is niet bruikbaar.');
  return issues;
};

const validated = (label: string, issues: string[]): BlueprintValidation => ({ ready: issues.length === 0, issues, label });

export const domainContracts: Record<BlueprintDomain, DomainContract> = {
  outside: {
    id: 'world-route-v1', terms: ['buiten', 'wandelen', 'wandeling', 'natuur', 'route', 'vogels', 'snorkelen', 'strand', 'zee', 'bos', 'fiets', 'fietsen'],
    validate: (experience, context) => validated('Route, tijd, toegang en bronclaims gecontroleerd', [
      ...baseValidation(experience),
      ...(experience.duration + 5 > context.availableMinutes ? ['De ervaring past niet met buffer in de beschikbare tijd.'] : []),
      ...(experience.liveEvidence?.some((evidence) => !evidence.sourceName || !evidence.expiresAt) ? ['Een live claim mist herkomst of houdbaarheid.'] : []),
    ]),
  },
  food: {
    id: 'food-guidance-v1', terms: ['koken', 'recept', 'eten', 'maaltijd', 'ontbijt', 'lunch', 'diner', 'shake', 'smoothie', 'ingrediënten', 'voorraad'],
    validate: (experience) => validated('Bereiding, ingrediëntenkeuze en allergiegrens gecontroleerd', [
      ...baseValidation(experience),
      ...(![...experience.prepare, ...experience.steps.map((step) => step.instruction)].some((item) => /allerg|controleer|past/i.test(item)) ? ['De gebruiker krijgt geen duidelijke allergie- of geschiktheidsgrens.'] : []),
    ]),
  },
  movement: {
    id: 'movement-session-v1', terms: ['sport', 'workout', 'trainen', 'kracht', 'kettlebell', 'hardlopen', 'rennen', 'bewegen', 'fietsen', 'fiets'],
    validate: (experience, context) => validated('Tijd, materiaal en veilige aanpassing gecontroleerd', [
      ...baseValidation(experience),
      ...(experience.id.includes('kettlebell') && !context.hasKettlebell ? ['De benodigde kettlebell is niet beschikbaar.'] : []),
      ...(!experience.steps.some((step) => /stop|comfort|beheers|veilig/i.test(step.instruction)) ? ['De sessie mist een veilige aanpassings- of stopgrens.'] : []),
    ]),
  },
  restore: {
    id: 'recovery-moment-v1', terms: ['rust', 'herstel', 'ademen', 'ademhaling', 'ontspannen', 'pauze', 'stilte', 'slapen'],
    validate: (experience) => validated('Rustige uitvoering zonder medische claim gecontroleerd', baseValidation(experience)),
  },
  connect: {
    id: 'shared-moment-v1', terms: ['kind', 'kinderen', 'gezin', 'partner', 'vriend', 'vrienden', 'samen', 'spel', 'spelen'],
    validate: (experience, context) => validated('Gezelschap en gezamenlijke uitvoering gecontroleerd', [
      ...baseValidation(experience),
      ...(context.company === 'solo' && !experience.company.includes('solo') ? ['Deze ervaring vraagt gezelschap dat nog niet is gekozen.'] : []),
    ]),
  },
  learn: {
    id: 'situated-learning-v1', terms: ['leren', 'uitleg', 'informatie', 'begrijpen', 'maken', 'ontdekken', 'geschiedenis', 'wetenschap'],
    validate: (experience) => validated('Informatie, bronsoort en toepassing gecontroleerd', [
      ...baseValidation(experience),
      ...(!experience.steps.some((step) => step.insight?.sourceLabel) ? ['De leerlaag mist een herkenbare bronsoort.'] : []),
    ]),
  },
  culture: {
    id: 'culture-place-v1', terms: ['cultuur', 'museum', 'muziek', 'concert', 'stad', 'architectuur', 'kunst', 'markt', 'evenement'],
    validate: (experience) => validated('Culturele belofte en praktische uitvoering gecontroleerd', baseValidation(experience)),
  },
};

const normalize = (value: string) => value.toLocaleLowerCase('nl-NL').trim();

export function detectBlueprintDomains(input: string): BlueprintDomain[] {
  const normalized = normalize(input);
  if (!normalized) return [];
  return (Object.keys(domainContracts) as BlueprintDomain[])
    .map((domain) => ({ domain, matches: domainContracts[domain].terms.filter((term) => normalized.includes(term)).length }))
    .filter((item) => item.matches > 0)
    .sort((a, b) => b.matches - a.matches)
    .map((item) => item.domain);
}

const hasAny = (input: string, terms: string[]) => terms.some((term) => input.includes(term));

export function understandActiveIntent(input: string): ActiveIntentUnderstanding {
  const normalized = normalize(input);
  const domains = detectBlueprintDomains(normalized);
  if (!normalized) return { domains, confidence: 'medium' };

  if (!domains.length) return {
    domains,
    confidence: 'low',
    clarification: {
      id: 'direction',
      question: 'Wat zou dit moment de moeite waard maken?',
      reason: 'Je woorden geven nog geen betrouwbare richting. Eén keuze is genoeg.',
      options: [
        { id: 'calm', label: 'Rust en ruimte', terms: 'rust herstel buiten rustig' },
        { id: 'energy', label: 'Energie en beweging', terms: 'bewegen workout buiten actief' },
        { id: 'connection', label: 'Iets samen beleven', terms: 'samen gezin spel verbinding' },
        { id: 'curiosity', label: 'Iets nieuws ontdekken', terms: 'leren cultuur natuur ontdekken' },
      ],
    },
  };

  const primary = domains[0];
  if (primary === 'food' && !hasAny(normalized, ['shake', 'smoothie', 'voorraad', 'ingrediënt', 'warm', 'snel', 'ontbijt', 'diner'])) return {
    domains, confidence: 'medium', clarification: {
      id: 'food-form', question: 'Wat maakt eten nu passend?', reason: 'Dit bepaalt ingrediënten, voorbereiding en het soort begeleiding.', options: [
        { id: 'pantry', label: 'Warm met wat ik al heb', terms: 'koken warme maaltijd voorraad ingrediënten' },
        { id: 'shake', label: 'Snel en fris', terms: 'shake smoothie ontbijt snel fris' },
        { id: 'together', label: 'Samen iets maken', terms: 'koken samen gezin verbinding' },
      ],
    },
  };
  if (primary === 'movement' && !hasAny(normalized, ['kettlebell', 'fiets', 'fietsen', 'hardlopen', 'rennen', 'zonder materiaal', 'bodyweight', 'buiten'])) return {
    domains, confidence: 'medium', clarification: {
      id: 'movement-form', question: 'Hoe wil je bewegen?', reason: 'Materiaal en omgeving veranderen de volledige sessie.', options: [
        { id: 'bodyweight', label: 'Zonder materiaal', terms: 'workout bewegen bodyweight zonder materiaal' },
        { id: 'strength', label: 'Kracht met kettlebell', terms: 'kracht workout kettlebell uitdaging' },
        { id: 'outside', label: 'Buiten in beweging', terms: 'buiten fietsen wandelen actief' },
      ],
    },
  };
  if (primary === 'outside' && !hasAny(normalized, ['wandelen', 'wandeling', 'fiets', 'fietsen', 'vogels', 'snorkelen', 'route', 'zee', 'bos', 'strand'])) return {
    domains, confidence: 'medium', clarification: {
      id: 'outside-tone', question: 'Waar trekt buiten je nu het meest naartoe?', reason: 'Eén nuance voorkomt dat Momentum zomaar een activiteit kiest.', options: [
        { id: 'quiet', label: 'Rustig kijken', terms: 'natuur wandelen rust vogels kijken' },
        { id: 'active', label: 'Actief op pad', terms: 'buiten fietsen route bewegen actief' },
        { id: 'learn', label: 'De plek beter begrijpen', terms: 'buiten cultuur leren geschiedenis natuur informatie' },
      ],
    },
  };
  return { domains, confidence: domains.length === 1 ? 'high' : 'medium' };
}

export function composeExperienceBlueprints(input: string, context: PrototypeContext, candidates: Experience[], clarificationTerms = ''): BlueprintComposition {
  const combinedInput = `${input} ${clarificationTerms}`.trim();
  const domains = detectBlueprintDomains(combinedInput);
  if (!domains.length) return { experiences: [], interpretedDomains: [], interpretation: input.trim() ? 'Je woorden vragen nog om één richting.' : 'Verras me met wat nu uitvoerbaar is.' };

  const composed = domains.flatMap((domain) => candidates
    .filter((experience) => experience.kind === domain || (domain === 'outside' && experience.keywords.some((keyword) => ['wandelen', 'fiets', 'fietsen', 'natuur'].includes(keyword))))
    .map((experience) => ({ experience, validation: domainContracts[domain].validate(experience, context) }))
    .filter(({ validation }) => validation.ready)
    .map(({ experience, validation }) => ({
      ...experience,
      id: experience.id,
      why: [`Samengesteld vanuit je eigen woorden`, ...experience.why].slice(0, 3),
      blueprint: { id: domainContracts[domain].id, domain, origin: 'deterministic' as const, validationLabel: validation.label },
    })));

  const unique = composed.filter((experience, index, all) => all.findIndex((item) => item.id === experience.id) === index);
  return {
    experiences: unique,
    interpretedDomains: domains,
    interpretation: `Je zoekt ruimte voor ${domains.map((domain) => domain === 'outside' ? 'de wereld om je heen' : domain === 'food' ? 'eten en maken' : domain === 'movement' ? 'bewegen' : domain === 'restore' ? 'herstel' : domain === 'connect' ? 'samen beleven' : domain === 'learn' ? 'leren in de ervaring' : 'cultuur').join(' en ')}.`,
  };
}

export function composeContextualBlueprints(context: PrototypeContext, candidates: Experience[], preferredDomains: BlueprintDomain[] = []): Experience[] {
  return candidates.flatMap((experience) => {
    const contract = domainContracts[experience.kind];
    const validation = contract.validate(experience, context);
    if (!validation.ready) return [];
    const preferenceReason = preferredDomains.includes(experience.kind) ? 'Sluit aan bij een richting die jij zelf koos' : 'Past als complete ervaring binnen dit moment';
    return [{
      ...experience,
      why: [preferenceReason, ...experience.why].slice(0, 3),
      blueprint: { id: contract.id, domain: experience.kind, origin: 'deterministic' as const, validationLabel: validation.label },
    }];
  });
}

export type GenerativeExperienceDraftProvider = {
  id: string;
  createDrafts: (input: string, context: PrototypeContext) => Promise<Experience[]>;
};

export function validateGeneratedDrafts(drafts: Experience[], context: PrototypeContext): Experience[] {
  return drafts.filter((draft) => domainContracts[draft.kind].validate(draft, context).ready).map((draft) => ({
    ...draft,
    blueprint: { id: domainContracts[draft.kind].id, domain: draft.kind, origin: 'generated-draft', validationLabel: domainContracts[draft.kind].validate(draft, context).label },
  }));
}
