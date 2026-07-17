import { BlueprintDomain, detectBlueprintDomains, validateGeneratedDrafts } from './experienceBlueprintComposer';
import { CapsuleStep, Experience, ExperienceKind, InsightTopic } from './experienceModel';
import { PrototypeContext } from './localIntelligence';
import { Platform } from 'react-native';

declare const process: { env: { EXPO_PUBLIC_MOMENTUM_GENERATOR_URL?: string } };
const developmentGeneratorUrl = Platform.OS === 'web' ? 'http://127.0.0.1:8787/v1/experience-drafts' : undefined;
const generatorUrl = process.env.EXPO_PUBLIC_MOMENTUM_GENERATOR_URL || developmentGeneratorUrl;

export type GenerationMode = 'remote' | 'local-synthesis';
export type GeneratorRuntimeStatus = {
  state: 'checking' | 'offline' | 'fixture' | 'model' | 'local';
  label: string;
  detail: string;
  model?: string;
};
export type GenerationOutcome = {
  experiences: Experience[];
  mode: GenerationMode;
  message: string;
  rejected: number;
};

type GenerationRequest = {
  requestMode: 'active-intent' | 'contextual-suggestion';
  intent: string;
  clarificationTerms: string;
  context: Pick<PrototypeContext, 'dayPart' | 'company' | 'availableMinutes' | 'hasKettlebell'>;
  domains: BlueprintDomain[];
  contractVersion: 'experience-draft-v1';
};

const unsafeClaims = /geneest|behandelt|voorkomt ziekte|gegarandeerd|zeker weten|altijd veilig|medisch advies/i;
const kinds: ExperienceKind[] = ['outside', 'food', 'movement', 'restore', 'connect', 'learn', 'culture'];
const companies = ['solo', 'together', 'family'] as const;
const fallbackImage: Record<ExperienceKind, string> = {
  outside: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=88',
  food: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=88',
  movement: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=88',
  restore: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=88',
  connect: 'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=1200&q=88',
  learn: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=88',
  culture: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=88',
};

const text = (value: unknown, max = 240) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const textList = (value: unknown, maxItems = 6, maxLength = 180) => Array.isArray(value) ? value.map((item) => text(item, maxLength)).filter(Boolean).slice(0, maxItems) : [];
const safeImage = (value: unknown, kind: ExperienceKind) => {
  const candidate = text(value, 500);
  return /^https:\/\/images\.unsplash\.com\//i.test(candidate) ? candidate : fallbackImage[kind];
};
const hash = (value: string) => Array.from(value).reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 17);

function sanitizeStep(value: unknown): CapsuleStep | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const title = text(raw.title, 80);
  const instruction = text(raw.instruction, 320);
  if (!title || !instruction || unsafeClaims.test(`${title} ${instruction}`)) return undefined;
  const insightRaw = raw.insight && typeof raw.insight === 'object' ? raw.insight as Record<string, unknown> : undefined;
  const insightTitle = text(insightRaw?.title, 100);
  const insightBody = text(insightRaw?.body, 420);
  return {
    title,
    instruction,
    meta: text(raw.meta, 80) || undefined,
    seconds: typeof raw.seconds === 'number' && raw.seconds > 0 && raw.seconds <= 3600 ? Math.round(raw.seconds) : undefined,
    insight: insightTitle && insightBody && !unsafeClaims.test(`${insightTitle} ${insightBody}`) ? {
      title: insightTitle,
      body: insightBody,
      topic: ['place', 'nature', 'movement', 'food', 'culture', 'general'].includes(text(insightRaw?.topic)) ? text(insightRaw?.topic) as InsightTopic : 'general',
      sourceKind: 'generated',
      sourceLabel: 'Momentum synthese',
    } : undefined,
  };
}

function sanitizeRemoteDraft(value: unknown, index: number, intent: string, requestMode: GenerationRequest['requestMode'], mode: 'model' | 'fixture', provider: string): Experience | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const kind = text(raw.kind) as ExperienceKind;
  if (!kinds.includes(kind)) return undefined;
  const title = text(raw.title, 90);
  const promise = text(raw.promise, 220);
  const wonder = text(raw.wonder, 260);
  const steps = Array.isArray(raw.steps) ? raw.steps.map(sanitizeStep).filter((step): step is CapsuleStep => Boolean(step)).slice(0, 8) : [];
  const prepare = textList(raw.prepare, 6, 120);
  const allCopy = `${title} ${promise} ${wonder} ${prepare.join(' ')} ${steps.map((step) => `${step.title} ${step.instruction}`).join(' ')}`;
  if (!title || !promise || !wonder || steps.length < 2 || prepare.length < 1 || unsafeClaims.test(allCopy)) return undefined;
  const duration = typeof raw.duration === 'number' ? Math.round(raw.duration) : 0;
  if (duration < 3 || duration > 240) return undefined;
  const requestedCompanies = Array.isArray(raw.company) ? raw.company.filter((item): item is typeof companies[number] => companies.includes(item as typeof companies[number])) : [];
  return {
    id: `generated-${kind}-${hash(`${intent}-${title}-${index}`)}`,
    kind,
    title,
    promise,
    wonder,
    image: safeImage(raw.image, kind),
    accent: /^#[0-9a-f]{6}$/i.test(text(raw.accent)) ? text(raw.accent) : '#A4C55D',
    duration,
    effort: text(raw.effort, 40) || 'Passend',
    distance: text(raw.distance, 60) || undefined,
    timeWindow: text(raw.timeWindow, 60) || undefined,
    cta: text(raw.cta, 70) || 'Begin deze ervaring',
    why: textList(raw.why, 3, 140),
    prepareTitle: text(raw.prepareTitle, 90) || 'Maak het eenvoudig om te beginnen',
    prepare,
    presenceMode: ['quiet', 'guided', 'handoff'].includes(text(raw.presenceMode)) ? text(raw.presenceMode) as Experience['presenceMode'] : 'guided',
    presenceTitle: text(raw.presenceTitle, 90) || title,
    presenceCue: text(raw.presenceCue, 180) || 'Alleen de volgende stap is nu nodig.',
    steps,
    memoryPrompt: text(raw.memoryPrompt, 160) || 'Wat maakte dit moment de moeite waard?',
    keywords: textList(raw.keywords, 12, 40),
    company: requestedCompanies.length ? requestedCompanies : ['solo'],
    generation: mode === 'model'
      ? { mode: 'remote', provider, createdAt: new Date().toISOString(), disclosure: requestMode === 'contextual-suggestion' ? 'Nieuw samengesteld uit één richting die jij eerder koos en minimale momentcontext; live feiten komen alleen uit afzonderlijke bronnen.' : 'Nieuw samengesteld uit je huidige vraag; feiten zonder bron zijn niet als live informatie gebruikt.' }
      : { mode: 'local-synthesis', provider, createdAt: new Date().toISOString(), disclosure: requestMode === 'contextual-suggestion' ? 'Door de lokale generatorservice samengesteld uit één gekozen richting en praktische momentcontext; geen externe AI of verzonnen live feiten.' : 'Door de lokale generatorservice samengesteld en door dezelfde capsulegrenzen gecontroleerd; geen externe AI of verzonnen live feiten.' },
  };
}

async function requestRemoteDrafts(request: GenerationRequest): Promise<{ drafts: Experience[]; mode: 'model' | 'fixture' }> {
  const url = generatorUrl;
  if (!url) return { drafts: [], mode: 'fixture' };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Generator antwoordde met ${response.status}`);
    const payload: unknown = await response.json();
    const envelope = payload && typeof payload === 'object' ? payload as { contractVersion?: unknown; drafts?: unknown[]; mode?: unknown; provider?: unknown } : {};
    if (envelope.contractVersion !== 'experience-draft-v1' || !['fixture', 'model'].includes(String(envelope.mode))) throw new Error('Generatorcontract niet herkend');
    const rawDrafts = Array.isArray(envelope.drafts) ? envelope.drafts : [];
    const mode = envelope.mode === 'fixture' ? 'fixture' : 'model';
    const provider = typeof envelope.provider === 'string' ? envelope.provider.slice(0, 80) : 'secure-generator-endpoint';
    return { drafts: rawDrafts.slice(0, 3).map((draft, index) => sanitizeRemoteDraft(draft, index, request.intent || request.domains.join('-'), request.requestMode, mode, provider)).filter((draft): draft is Experience => Boolean(draft)), mode };
  } finally {
    clearTimeout(timeout);
  }
}

const synthesisLanguage: Record<ExperienceKind, Array<{ title: string; promise: string; wonder: string }>> = {
  outside: [
    { title: 'Een open omweg', promise: 'Gebruik je vrije ruimte voor een korte route waarin één onbekend detail genoeg is.', wonder: 'Niet de afstand, maar wat je onderweg voor het eerst opmerkt maakt deze omweg van jou.' },
    { title: 'Kijk waar je normaal voorbijgaat', promise: 'Een kleine buitenronde maakt van je directe omgeving opnieuw een plek om te ontdekken.', wonder: 'Een gevel, boom, geluid of uitzicht kan het begin zijn van een nieuw verhaal over een bekende plek.' },
  ],
  food: [
    { title: 'Maak iets van wat er is', promise: 'Kies één basis en bouw rustig smaak op zonder opnieuw naar het perfecte recept te zoeken.', wonder: 'Door na elke stap te proeven wordt een gewone voorraad een gerecht dat alleen vandaag zo ontstaat.' },
    { title: 'Een frisse kom voor nu', promise: 'Combineer iets romigs, iets fris en iets met structuur tot een eenvoudige maaltijd.', wonder: 'Drie contrasten zijn genoeg om van losse ingrediënten een bewuste eetervaring te maken.' },
  ],
  movement: [
    { title: 'Beweeg binnen je eigen ruimte', promise: 'Een korte complete sessie sluit aan op je tijd zonder materiaal of prestatiedruk.', wonder: 'Vier beheerste bewegingen kunnen samen precies genoeg uitdaging geven voor dit moment.' },
    { title: 'Een ronde die bij vandaag past', promise: 'Gebruik je beschikbare tijd voor kracht, controle en een rustig einde.', wonder: 'Je hoeft niets te bewijzen: de kwaliteit van elke herhaling bepaalt het tempo.' },
  ],
  restore: [
    { title: 'Een stille overgang', promise: 'Maak een heldere pauze tussen wat achter je ligt en wat hierna komt.', wonder: 'Een paar minuten zonder nieuwe input kunnen je omgeving weer voelbaar maken.' },
    { title: 'Laat het tempo even zakken', promise: 'Een klein herstelmoment geeft je aandacht ruimte zonder dat je iets hoeft te verbeteren.', wonder: 'Rust ontstaat niet door leegte te vullen, maar door even niets nieuws te vragen.' },
  ],
  connect: [
    { title: 'Kies samen één kleine missie', promise: 'Maak van de beschikbare tijd een gedeeld spel waarin iedereen één keuze krijgt.', wonder: 'Het onverwachte antwoord van de ander kan belangrijker worden dan de opdracht zelf.' },
    { title: 'Een vraag die samen op pad gaat', promise: 'Begin met één nieuwsgierige vraag en zoek het antwoord niet online maar om je heen.', wonder: 'Een kort moment wordt een herinnering wanneer jullie allebei iets anders ontdekken.' },
  ],
  learn: [
    { title: 'Leer door beter te kijken', promise: 'Neem één klein idee mee en herken het daarna direct in je omgeving.', wonder: 'Kennis blijft niet op het scherm wanneer je haar kunt aanwijzen in de wereld om je heen.' },
    { title: 'Eén vraag, drie waarnemingen', promise: 'Onderzoek een onderwerp door drie concrete details te verzamelen in plaats van lang te lezen.', wonder: 'Je eigen observaties maken een algemene vraag persoonlijk en onthoudbaar.' },
  ],
  culture: [
    { title: 'Lees de plek als een verhaal', promise: 'Kijk naar één straat, gebouw of voorwerp alsof het een spoor uit een andere tijd is.', wonder: 'Materiaal, vorm en gebruik vertellen samen meer dan een naam of jaartal alleen.' },
    { title: 'Geef één werk volledige aandacht', promise: 'Kies één lied, beeld of gebouw en laat de rest van het aanbod even verdwijnen.', wonder: 'Wat vertrouwd lijkt kan nieuw worden wanneer je lang genoeg bij één detail blijft.' },
  ],
};

function localSynthesis(request: GenerationRequest, candidates: Experience[]): Experience[] {
  const requestedDomains = request.domains.length ? request.domains : detectBlueprintDomains(request.intent);
  return requestedDomains.slice(0, 2).flatMap((kind, index) => {
    const source = candidates.find((candidate) => candidate.kind === kind && candidate.duration + 5 <= request.context.availableMinutes && candidate.company.includes(request.context.company));
    if (!source) return [];
    const variants = synthesisLanguage[kind];
    const language = variants[hash(`${request.intent}-${request.clarificationTerms}-${kind}`) % variants.length];
    return [{
      ...source,
      id: `synthesis-${kind}-${hash(`${request.intent}-${kind}-${index}`)}`,
      title: language.title,
      promise: language.promise,
      wonder: language.wonder,
      why: [request.requestMode === 'contextual-suggestion' ? 'Nieuw samengesteld vanuit een richting die jij zelf koos' : 'Nieuw gecombineerd vanuit je eigen woorden', `Past met buffer binnen ${request.context.availableMinutes} minuten`, ...source.why].slice(0, 3),
      liveEvidence: undefined,
      routePlan: undefined,
      generation: { mode: 'local-synthesis' as const, provider: 'device-local-approved-building-blocks', createdAt: new Date().toISOString(), disclosure: request.requestMode === 'contextual-suggestion' ? 'Lokaal samengesteld uit één richting die jij eerder koos en praktische momentcontext; geen externe AI of verzonnen live feiten.' : 'Lokaal samengesteld uit gecontroleerde ervaringsbouwstenen; geen externe AI of verzonnen live feiten.' },
    }];
  });
}

export const isRemoteGenerationConfigured = () => Boolean(generatorUrl);

export async function inspectGeneratorRuntime(): Promise<GeneratorRuntimeStatus> {
  if (!generatorUrl) return { state: 'local', label: 'Lokale synthese', detail: 'Nieuwe combinaties worden op dit apparaat uit gecontroleerde bouwstenen gemaakt.' };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const healthUrl = generatorUrl.replace(/\/v1\/experience-drafts\/?$/, '/health');
    const response = await fetch(healthUrl, { signal: controller.signal });
    if (!response.ok) throw new Error(`Generator antwoordde met ${response.status}`);
    const payload = await response.json() as { mode?: unknown; model?: unknown };
    if (payload.mode === 'fixture') return { state: 'fixture', label: 'Demonstratiesynthese', detail: 'De volledige generatorroute werkt met gecontroleerde voorbeeldinhoud; er wordt geen betaald AI-model gebruikt.' };
    if (payload.mode === 'openai') return { state: 'model', label: 'AI-synthese actief', detail: 'Nieuwe capsules worden door de beveiligde generator gemaakt en daarna lokaal gecontroleerd.', model: typeof payload.model === 'string' ? payload.model : undefined };
    return { state: 'offline', label: 'Generator niet verbonden', detail: 'Momentum gebruikt automatisch de lokale, gecontroleerde synthese.' };
  } catch {
    return { state: 'offline', label: 'Generator niet verbonden', detail: 'Momentum gebruikt automatisch de lokale, gecontroleerde synthese.' };
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateExperienceCandidates(intent: string, clarificationTerms: string, context: PrototypeContext, candidates: Experience[]): Promise<GenerationOutcome> {
  const domains = detectBlueprintDomains(`${intent} ${clarificationTerms}`);
  const request: GenerationRequest = { requestMode: 'active-intent', intent: intent.trim(), clarificationTerms, context: { dayPart: context.dayPart, company: context.company, availableMinutes: context.availableMinutes, hasKettlebell: context.hasKettlebell }, domains, contractVersion: 'experience-draft-v1' };
  if (!request.intent && !clarificationTerms) return { experiences: [], mode: 'local-synthesis', message: 'Geen expliciete richting om nieuwe inhoud voor te maken.', rejected: 0 };

  const endpointConfigured = Boolean(generatorUrl);
  if (endpointConfigured) {
    try {
      const remote = await requestRemoteDrafts(request);
      const directionBoundDrafts = remote.drafts.filter((draft) => !domains.length || domains.includes(draft.kind));
      const validated = validateGeneratedDrafts(directionBoundDrafts, context);
      if (validated.length) return { experiences: validated, mode: remote.mode === 'model' ? 'remote' : 'local-synthesis', message: remote.mode === 'model' ? 'Nieuwe capsule gemaakt en gecontroleerd.' : 'Nieuwe capsule via de lokale generatorservice gemaakt en gecontroleerd.', rejected: remote.drafts.length - validated.length };
    } catch {
      // A failed generator must be silent and recover to the trusted local path.
    }
  }

  const local = localSynthesis(request, candidates);
  const validated = validateGeneratedDrafts(local, context);
  return {
    experiences: validated,
    mode: 'local-synthesis',
    message: endpointConfigured ? 'De generator was niet betrouwbaar bereikbaar; een lokale gecontroleerde combinatie is gebruikt.' : 'Nieuwe combinatie lokaal gemaakt uit gecontroleerde ervaringsbouwstenen.',
    rejected: local.length - validated.length,
  };
}

export async function generateContextualSuggestion(domain: BlueprintDomain, context: PrototypeContext, candidates: Experience[]): Promise<GenerationOutcome> {
  const request: GenerationRequest = {
    requestMode: 'contextual-suggestion', intent: '', clarificationTerms: '', domains: [domain], contractVersion: 'experience-draft-v1',
    context: { dayPart: context.dayPart, company: context.company, availableMinutes: context.availableMinutes, hasKettlebell: context.hasKettlebell },
  };
  if (generatorUrl) {
    try {
      const remote = await requestRemoteDrafts(request);
      const validated = validateGeneratedDrafts(remote.drafts.filter((draft) => draft.kind === domain), context);
      if (validated.length) return { experiences: validated, mode: remote.mode === 'model' ? 'remote' : 'local-synthesis', message: 'Een frisse mogelijkheid voor dit moment is samengesteld en gecontroleerd.', rejected: remote.drafts.length - validated.length };
    } catch {
      // Contextual generation must remain optional and recover locally.
    }
  }
  const local = validateGeneratedDrafts(localSynthesis(request, candidates), context);
  return { experiences: local, mode: 'local-synthesis', message: 'Een frisse mogelijkheid is lokaal samengesteld uit gecontroleerde bouwstenen.', rejected: 0 };
}
