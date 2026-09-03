import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Experience } from '../product/experienceModel';
import { PersonalProfile } from '../profile/personalModel';
import { LiveWorldSnapshot } from './liveWorld';
import { buildBriefingFacts, briefingCacheKey, sanitizeBriefingResponse } from './briefingFacts';
import type { BriefingFact, BriefingSentence } from './briefingFacts';

// De pure kern (feitenbouw + antwoord-poort) leeft in briefingFacts.ts —
// los testbaar zonder React Native. PrepareScreen importeert de types via
// deze module, daarom hier de her-export.
export type { BriefingFact, BriefingSentence } from './briefingFacts';

declare const process: { env: { EXPO_PUBLIC_MOMENTUM_GENERATOR_URL?: string } };

// ADR-068 · Levende Wereld-briefing op Voorpret. API's leveren feiten, AI
// levert betekenis — nooit andersom. Deze module verzamelt uitsluitend feiten
// die al in het liveWorld-snapshot (met receipts) zitten, vraagt de bestaande
// generator-service om 2–4 redactionele zinnen mét bronverwijzing per zin, en
// valt bij élke vorm van falen stil terug op 'unavailable': de Voorpret toont
// dan gewoon de bestaande content. Cache: 15 minuten per ervaring+feitset.

const CACHE_KEY = 'momentum.living-world-briefing.v1';
const CACHE_TTL_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 45_000;
const BRIEFING_CONTRACT_VERSION = 'living-world-briefing-v1';

export type LivingWorldBriefing = {
  sentences: BriefingSentence[];
  facts: BriefingFact[];
  mode: 'model' | 'fixture';
  provider: string;
};
export type BriefingResult =
  | { status: 'live'; briefing: LivingWorldBriefing }
  | { status: 'unavailable' };

/** De reisgids-invalshoek uit het profiel: de korte richting-woorden die de
 * gebruiker zelf koos in "Mijn richting" (gepauzeerde woorden tellen niet
 * mee), begrensd tot zes termen. Leeg = de gids schrijft neutraal. */
export function briefingInterests(personal: PersonalProfile): string[] {
  const paused = new Set(personal.pausedDirections);
  return [...personal.directions.near, ...personal.directions.growth, ...personal.directions.meaning]
    .filter((word) => !paused.has(word))
    .map((word) => word.trim())
    .filter(Boolean)
    .slice(0, 6);
}

const briefingUrl = (() => {
  const base = process.env.EXPO_PUBLIC_MOMENTUM_GENERATOR_URL
    ?? (Platform.OS === 'web' ? 'http://127.0.0.1:8787/v1/experience-drafts' : undefined);
  return base ? base.replace(/\/v1\/experience-drafts\/?$/, '/v1/living-world-briefing') : undefined;
})();

// ADR-063: identieke toegang als de draft-route — native stuurt de vaste
// client-header, web verloopt via de Origin-allowlist.
const briefingHeaders: Record<string, string> = Platform.OS === 'web'
  ? { 'content-type': 'application/json' }
  : { 'content-type': 'application/json', 'X-Momentum-Client': 'native' };

/** Vraagt de Levende Wereld-briefing voor een outside-ervaring. Elke vorm van
 * falen (geen URL, te weinig feiten, netwerk, ongeldig antwoord) wordt stil
 * 'unavailable' — het scherm valt dan terug op haar bestaande content.
 *
 * Twee geverifieerde triggers (ADR-068 + addendum): Voorpret (step ontbreekt)
 * en de Gids onderweg (step = huidige stap, index+titel). De cachesleutel
 * neemt de stap én de interessewoorden mee, zodat elke combinatie hooguit één
 * verse briefing per kwartier vraagt — geen polling, alleen start en
 * gebruikersactie. `interests` zijn de korte richting-woorden die de gebruiker
 * zelf koos (Jij → Mijn richting); ze kleuren alleen de invalshoek. */
export async function loadLivingWorldBriefing(input: {
  experience: Experience;
  snapshot: LiveWorldSnapshot;
  dayPart: string;
  step?: { index: number; title: string };
  interests?: string[];
}): Promise<BriefingResult> {
  const { experience, snapshot, dayPart, step } = input;
  const interests = (input.interests ?? []).map((word) => word.trim()).filter(Boolean).slice(0, 6);
  if (experience.kind !== 'outside' || !briefingUrl) return { status: 'unavailable' };
  const facts = buildBriefingFacts(snapshot);
  if (facts.length < 2) return { status: 'unavailable' };
  const cacheKey = briefingCacheKey(experience.id, dayPart, step ? step.index : null, facts, interests);
  try {
    const stored = await AsyncStorage.getItem(CACHE_KEY);
    if (stored) {
      const cache = JSON.parse(stored) as { key?: string; at?: number; briefing?: LivingWorldBriefing };
      if (cache.key === cacheKey && cache.at && Date.now() - cache.at < CACHE_TTL_MS && cache.briefing) {
        return { status: 'live', briefing: cache.briefing };
      }
    }
  } catch { /* een kapotte cache staat een verse aanvraag nooit in de weg */ }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(briefingUrl, {
      method: 'POST',
      headers: briefingHeaders,
      signal: controller.signal,
      body: JSON.stringify({
        contractVersion: BRIEFING_CONTRACT_VERSION,
        requestMode: 'living-world-briefing',
        experience: {
          id: experience.id,
          kind: experience.kind,
          title: experience.title,
          promise: experience.promise,
          duration: experience.duration,
          distance: experience.distance,
        },
        facts: facts.map((fact) => ({ id: fact.id, text: fact.text, source: fact.source })),
        context: step ? { dayPart, step: { index: step.index, title: step.title } } : { dayPart },
        ...(interests.length ? { profile: { interests } } : {}),
      }),
    });
    if (!response.ok) return { status: 'unavailable' };
    const payload = await response.json() as { sentences?: unknown; mode?: string; provider?: string };
    const sentences = sanitizeBriefingResponse(payload, facts);
    if (!sentences.length) return { status: 'unavailable' };
    const briefing: LivingWorldBriefing = {
      sentences,
      facts,
      mode: payload.mode === 'model' ? 'model' : 'fixture',
      provider: typeof payload.provider === 'string' ? payload.provider : 'onbekend',
    };
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ key: cacheKey, at: Date.now(), briefing })).catch(() => undefined);
    return { status: 'live', briefing };
  } catch {
    return { status: 'unavailable' };
  } finally {
    clearTimeout(timeout);
  }
}
