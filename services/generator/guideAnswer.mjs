import { GUIDE_PACK } from './guideEvidence.mjs';

export const GUIDE_ANSWER_VERSION = 'guide-answer-v1';
export const GUIDE_QUESTIONS = Object.freeze([
  { question: 'Hoe oud is het museumhuisje?', factIds: ['oldest-house', 'interior-period'] },
  { question: 'Wat kan ik in de huisjes zien?', factIds: ['collection', 'interior-period', 'klaske-period', 'aek'] },
  { question: 'Waarom is 1883 belangrijk voor het museum?', factIds: ['disaster'] },
].map(Object.freeze));

// Explicit first-slice envelope. No client evidence, profile, coordinates or URLs.
export function validateGuideQuestion(value, chapterId) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok:false };
  const fields = ['contractVersion','experienceId','chapterId','packVersion','question','requestId'];
  if (Object.keys(value).some(key=>!fields.includes(key))
    || value.contractVersion !== GUIDE_ANSWER_VERSION
    || value.experienceId !== GUIDE_PACK.experienceId
    || value.chapterId !== chapterId
    || value.packVersion !== GUIDE_PACK.version
    || typeof value.requestId !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(value.requestId)
    || typeof value.question !== 'string' || value.question.trim().length < 3 || value.question.length > 600
    || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value.question)) return {ok:false};
  return {ok:true,value:{...value,question:value.question.trim()}};
}

// Deterministic editorial fixture. Exact supported questions only: no keyword
// matching that could ignore negations, false premises or embedded instructions.
export function fixtureGuideAnswer(request) {
  const known = GUIDE_QUESTIONS.find(item=>item.question.toLocaleLowerCase('nl-NL')===request.question.toLocaleLowerCase('nl-NL'));
  return {
    contractVersion: GUIDE_ANSWER_VERSION,
    requestId: request.requestId, experienceId: request.experienceId, chapterId: request.chapterId,
    packVersion: GUIDE_PACK.version, mode:'fixture',
    status: known ? 'answered' : 'insufficient-evidence',
    segments: (known?.factIds ?? []).map(id=>({factId:id,text:GUIDE_PACK.facts.find(fact=>fact.id===id).text,sourceId:GUIDE_PACK.source.id})),
    sources: known ? [{...GUIDE_PACK.source}] : [],
    limitation: known ? undefined : 'Voor deze vraag is in dit gecontroleerde bronnenpakket geen passend antwoord beschikbaar.',
  };
}

// This first increment is deliberately extractive: known IDs alone cannot
// validate arbitrary generated claims. Later model adapters must not bypass it.
export function validateExtractiveGuideAnswer(value, request) {
  if (!value || value.contractVersion!==GUIDE_ANSWER_VERSION || value.mode!=='fixture'
    || value.requestId!==request.requestId || value.experienceId!==request.experienceId
    || value.chapterId!==request.chapterId || value.packVersion!==GUIDE_PACK.version) return false;
  const expected=fixtureGuideAnswer(request);
  return value.status===expected.status
    && JSON.stringify(value.segments)===JSON.stringify(expected.segments)
    && JSON.stringify(value.sources)===JSON.stringify(expected.sources)
    && value.limitation===expected.limitation;
}
