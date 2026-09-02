// Living World briefing contract (ADR-068): a separate, deliberately small
// contract next to experience-draft-v1. The draft contract stays untouched;
// this route answers one question only — "which real, sourced facts make this
// outside experience meaningful right now" — with 2–4 sentences that each
// cite the facts they use. APIs deliver facts; the model only adds meaning.

export const BRIEFING_CONTRACT_VERSION = 'living-world-briefing-v1';

export const MAX_BRIEFING_FACTS = 8;
export const MAX_BRIEFING_SENTENCES = 4;
export const MIN_BRIEFING_SENTENCES = 2;

const blockedClaims = /geneest|behandelt|voorkomt ziekte|gegarandeerd|zeker weten|altijd veilig|medisch advies/i;
const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';

// Request shape: the experience (outside only, id/title/promise/duration) and
// the verbatim fact list the client already holds from liveWorld receipts.
// No profile fields, no history, no free text — the payload stays as bounded
// as the draft payloads (ADR-056), only narrower.
export function validateBriefingRequest(value) {
  if (!value || typeof value !== 'object' || value.contractVersion !== BRIEFING_CONTRACT_VERSION) return { ok: false, error: 'Ongeldig contract.' };
  if (value.requestMode !== 'living-world-briefing') return { ok: false, error: 'Ongeldige aanvraagvorm.' };
  const experience = value.experience && typeof value.experience === 'object' ? value.experience : {};
  const id = clean(experience.id, 120);
  const title = clean(experience.title, 90);
  const promise = clean(experience.promise, 220);
  const duration = Number.isFinite(experience.duration) ? Math.round(experience.duration) : 0;
  // Scope ADR-068: the briefing exists for outside experiences only.
  if (experience.kind !== 'outside' || !id || !title || !promise || duration < 3 || duration > 240) return { ok: false, error: 'De ervaring is niet bruikbaar voor een levende-wereld-briefing.' };
  const facts = (Array.isArray(value.facts) ? value.facts : []).flatMap((fact) => {
    if (!fact || typeof fact !== 'object') return [];
    const factId = clean(fact.id, 40);
    const text = clean(fact.text, 160);
    const source = clean(fact.source, 60);
    // A fact without a source name never enters the payload: unsourced facts
    // may not be cited, so they must not reach the model at all.
    if (!factId || !text || !source || blockedClaims.test(text)) return [];
    return [{ id: factId, text, source }];
  }).slice(0, MAX_BRIEFING_FACTS);
  if (facts.length < MIN_BRIEFING_SENTENCES) return { ok: false, error: 'Te weinig echte feiten voor een eerlijke briefing.' };
  const dayPart = typeof value.context?.dayPart === 'string' ? clean(value.context.dayPart, 20) : '';
  return {
    ok: true,
    value: {
      contractVersion: BRIEFING_CONTRACT_VERSION,
      requestMode: 'living-world-briefing',
      experience: { id, kind: 'outside', title, promise, duration, distance: clean(experience.distance, 60) || undefined },
      facts,
      context: { dayPart },
    },
  };
}

// Response gate: 2–4 sentences, each ≤220 chars, each citing at least one
// fact id that actually exists in the request. A sentence without a valid
// citation is dropped; drop too many and the briefing fails honestly (the
// caller falls back to the existing content).
export function validateBriefingSentences(value, request) {
  const source = value && typeof value === 'object' && Array.isArray(value.sentences) ? value.sentences : [];
  const knownIds = new Set(request.facts.map((fact) => fact.id));
  const accepted = source.slice(0, MAX_BRIEFING_SENTENCES).flatMap((sentence) => {
    if (!sentence || typeof sentence !== 'object') return [];
    const text = clean(sentence.text, 220);
    const factIds = (Array.isArray(sentence.factIds) ? sentence.factIds : []).map((id) => clean(id, 40)).filter((id) => knownIds.has(id));
    if (text.length < 12 || !factIds.length || blockedClaims.test(text)) return [];
    return [{ text, factIds: [...new Set(factIds)].slice(0, 3) }];
  });
  return accepted.length >= MIN_BRIEFING_SENTENCES ? accepted.slice(0, MAX_BRIEFING_SENTENCES) : [];
}
