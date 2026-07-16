export const experienceKinds = ['outside', 'food', 'movement', 'restore', 'connect', 'learn', 'culture'];
export const companies = ['solo', 'together', 'family'];
export const dayParts = ['morning', 'midday', 'afternoon', 'evening'];

export const draftSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['drafts'],
  properties: {
    drafts: {
      type: 'array',
      minItems: 1,
      maxItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['kind', 'title', 'promise', 'wonder', 'duration', 'effort', 'cta', 'why', 'prepareTitle', 'prepare', 'presenceMode', 'presenceTitle', 'presenceCue', 'steps', 'memoryPrompt', 'keywords', 'company'],
        properties: {
          kind: { type: 'string', enum: experienceKinds },
          title: { type: 'string', minLength: 3, maxLength: 90 },
          promise: { type: 'string', minLength: 12, maxLength: 220 },
          wonder: { type: 'string', minLength: 12, maxLength: 260 },
          duration: { type: 'integer', minimum: 3, maximum: 180 },
          effort: { type: 'string', minLength: 2, maxLength: 40 },
          cta: { type: 'string', minLength: 2, maxLength: 70 },
          why: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'string', maxLength: 140 } },
          prepareTitle: { type: 'string', minLength: 2, maxLength: 90 },
          prepare: { type: 'array', minItems: 1, maxItems: 6, items: { type: 'string', maxLength: 120 } },
          presenceMode: { type: 'string', enum: ['quiet', 'guided', 'handoff'] },
          presenceTitle: { type: 'string', minLength: 2, maxLength: 90 },
          presenceCue: { type: 'string', minLength: 2, maxLength: 180 },
          steps: {
            type: 'array', minItems: 2, maxItems: 8,
            items: {
              type: 'object', additionalProperties: false,
              required: ['title', 'instruction', 'meta', 'seconds', 'insight'],
              properties: {
                title: { type: 'string', minLength: 2, maxLength: 80 },
                instruction: { type: 'string', minLength: 4, maxLength: 320 },
                meta: {
                  anyOf: [
                    { type: 'string', maxLength: 80 },
                    { type: 'null' },
                  ],
                },
                seconds: {
                  anyOf: [
                    { type: 'integer', minimum: 1, maximum: 3600 },
                    { type: 'null' },
                  ],
                },
                insight: {
                  anyOf: [
                    { type: 'null' },
                    {
                      type: 'object', additionalProperties: false,
                      required: ['title', 'body', 'topic'],
                      properties: {
                        title: { type: 'string', minLength: 2, maxLength: 100 },
                        body: { type: 'string', minLength: 8, maxLength: 420 },
                        topic: { type: 'string', enum: ['place', 'nature', 'movement', 'food', 'culture', 'general'] },
                      },
                    },
                  ],
                },
              },
            },
          },
          memoryPrompt: { type: 'string', minLength: 4, maxLength: 160 },
          keywords: { type: 'array', minItems: 2, maxItems: 12, items: { type: 'string', maxLength: 40 } },
          company: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'string', enum: companies } },
        },
      },
    },
  },
};

const blockedClaims = /geneest|behandelt|voorkomt ziekte|gegarandeerd|zeker weten|altijd veilig|medisch advies/i;
const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const cleanList = (value, limit, max) => Array.isArray(value) ? value.map((item) => clean(item, max)).filter(Boolean).slice(0, limit) : [];

export function validateRequest(value) {
  if (!value || typeof value !== 'object' || value.contractVersion !== 'experience-draft-v1') return { ok: false, error: 'Ongeldig contract.' };
  const requestMode = value.requestMode === 'contextual-suggestion' ? 'contextual-suggestion' : 'active-intent';
  const intent = clean(value.intent, 600);
  const clarificationTerms = clean(value.clarificationTerms, 300);
  const context = value.context && typeof value.context === 'object' ? value.context : {};
  const availableMinutes = Number.isFinite(context.availableMinutes) ? Math.round(context.availableMinutes) : 0;
  if (requestMode === 'active-intent' && !intent && !clarificationTerms) return { ok: false, error: 'Een expliciete richting ontbreekt.' };
  if (!dayParts.includes(context.dayPart) || !companies.includes(context.company) || availableMinutes < 8 || availableMinutes > 240) return { ok: false, error: 'De momentcontext is niet bruikbaar.' };
  const domains = Array.isArray(value.domains) ? value.domains.filter((domain) => experienceKinds.includes(domain)).slice(0, 3) : [];
  if (requestMode === 'contextual-suggestion' && domains.length !== 1) return { ok: false, error: 'Een contextueel voorstel vereist precies één gekozen richting.' };
  return { ok: true, value: { intent, clarificationTerms, domains, requestMode, contractVersion: 'experience-draft-v1', context: { dayPart: context.dayPart, company: context.company, availableMinutes, hasKettlebell: Boolean(context.hasKettlebell) } } };
}

export function validateDrafts(value, request) {
  const source = value && typeof value === 'object' && Array.isArray(value.drafts) ? value.drafts : [];
  const accepted = source.slice(0, 1).flatMap((draft) => {
    if (!draft || typeof draft !== 'object' || !experienceKinds.includes(draft.kind)) return [];
    if (request.domains.length && !request.domains.includes(draft.kind)) return [];
    const steps = Array.isArray(draft.steps) ? draft.steps.slice(0, 8).flatMap((step) => {
      if (!step || typeof step !== 'object') return [];
      const title = clean(step.title, 80); const instruction = clean(step.instruction, 320);
      if (!title || !instruction || blockedClaims.test(`${title} ${instruction}`)) return [];
      const insight = step.insight && typeof step.insight === 'object' ? { title: clean(step.insight.title, 100), body: clean(step.insight.body, 420), topic: ['place', 'nature', 'movement', 'food', 'culture', 'general'].includes(step.insight.topic) ? step.insight.topic : 'general' } : null;
      return [{ title, instruction, meta: clean(step.meta, 80) || null, seconds: Number.isFinite(step.seconds) && step.seconds > 0 && step.seconds <= 3600 ? Math.round(step.seconds) : null, insight: insight?.title && insight?.body ? insight : null }];
    }) : [];
    const prepare = cleanList(draft.prepare, 6, 120);
    const duration = Number.isFinite(draft.duration) ? Math.round(draft.duration) : 0;
    const copy = `${draft.title} ${draft.promise} ${draft.wonder} ${prepare.join(' ')} ${steps.map((step) => `${step.title} ${step.instruction}`).join(' ')}`;
    if (!clean(draft.title, 90) || !clean(draft.promise, 220) || !clean(draft.wonder, 260) || steps.length < 2 || !prepare.length || duration < 3 || duration + 5 > request.context.availableMinutes || blockedClaims.test(copy)) return [];
    if (draft.kind === 'movement' && !steps.some((step) => /stop|comfort|beheers|veilig/i.test(step.instruction))) return [];
    if (draft.kind === 'food' && ![...prepare, ...steps.map((step) => step.instruction)].some((item) => /allerg|controleer|past/i.test(item))) return [];
    if (draft.kind === 'learn' && !steps.some((step) => step.insight)) return [];
    const selectedCompanies = Array.isArray(draft.company) ? draft.company.filter((item) => companies.includes(item)).slice(0, 3) : [];
    return [{
      kind: draft.kind, title: clean(draft.title, 90), promise: clean(draft.promise, 220), wonder: clean(draft.wonder, 260), duration,
      effort: clean(draft.effort, 40) || 'Passend', cta: clean(draft.cta, 70) || 'Begin deze ervaring', why: cleanList(draft.why, 3, 140),
      prepareTitle: clean(draft.prepareTitle, 90) || 'Maak het eenvoudig om te beginnen', prepare,
      presenceMode: ['quiet', 'guided', 'handoff'].includes(draft.presenceMode) ? draft.presenceMode : 'guided',
      presenceTitle: clean(draft.presenceTitle, 90) || clean(draft.title, 90), presenceCue: clean(draft.presenceCue, 180) || 'Alleen de volgende stap is nu nodig.',
      steps, memoryPrompt: clean(draft.memoryPrompt, 160) || 'Wat maakte dit moment de moeite waard?', keywords: cleanList(draft.keywords, 12, 40),
      company: selectedCompanies.includes(request.context.company) ? selectedCompanies : [request.context.company],
    }];
  });
  return accepted;
}
