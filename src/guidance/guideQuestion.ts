export const museumQuestionContext = {
  contractVersion: 'guide-answer-v1', experienceId: 'moddergat-five-places-v1',
  chapterId: 'moddergat-five-places-v1:museum:v1', packVersion: 'moddergat-museum-2026-11-13',
} as const;
export const museumQuestions = ['Hoe oud is het museumhuisje?', 'Wat kan ik in de huisjes zien?', 'Waarom is 1883 belangrijk voor het museum?'];
export type GuideQuestionRequest = typeof museumQuestionContext & { question: string; requestId: string };
export type GuideAnswer = {
  mode: 'fixture'; status: 'answered' | 'insufficient-evidence';
  segments: { text: string; factId: string; sourceId: string }[];
  sources: { id: string; title: string; url: string; checkedAt: string; scope: string }[];
  limitation?: string;
};
export function guideAnswerUrl(base?: string): string | undefined {
  if (!base) return;
  try {
    const url = new URL(base);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return;
    if (!['', '/', '/v1/experience-drafts', '/v1/experience-drafts/'].includes(url.pathname)) return;
    url.pathname = '/v1/guide-answer'; url.search = ''; url.hash = '';
    return url.toString();
  } catch { return; }
}
export function parseGuideAnswer(value: unknown, request: GuideQuestionRequest): GuideAnswer | undefined {
  if (!value || typeof value !== 'object') return;
  const v = value as Record<string, unknown>;
  for (const key of ['contractVersion', 'requestId', 'experienceId', 'chapterId', 'packVersion'] as const)
    if (v[key] !== request[key]) return;
  if (v.mode !== 'fixture' || !Array.isArray(v.segments) || !Array.isArray(v.sources)) return;
  if (v.status === 'insufficient-evidence') {
    if (v.segments.length || v.sources.length || typeof v.limitation !== 'string' || !v.limitation.length || v.limitation.length > 600) return;
  } else if (v.status === 'answered') {
    if (!v.segments.length || v.segments.length > 6 || v.sources.length !== 1 || v.limitation != null) return;
    const source = v.sources[0];
    if (!source || source.id !== 'museum-over-ons' || source.url !== 'https://www.museummoddergat.nl/over-ons/'
      || source.checkedAt !== '2026-11-13' || typeof source.title !== 'string' || !source.title.length || source.title.length > 180
      || typeof source.scope !== 'string' || source.scope.length > 300) return;
    const ids = new Set<string>();
    for (const segment of v.segments) {
      if (!segment || typeof segment.text !== 'string' || !segment.text.trim() || segment.text.length > 600
        || !['oldest-house', 'interior-period', 'klaske-period', 'collection', 'disaster', 'aek'].includes(segment.factId)
        || ids.has(segment.factId) || segment.sourceId !== source.id) return;
      ids.add(segment.factId);
    }
  } else return;
  // Transport guard only: the server separately verifies exact reviewed facts.
  return v as unknown as GuideAnswer;
}
export async function requestGuideAnswer(input: {
  base?: string; native: boolean; request: GuideQuestionRequest; signal: AbortSignal;
  fetcher?: typeof fetch; timeoutMs?: number;
}): Promise<GuideAnswer> {
  const url = guideAnswerUrl(input.base);
  if (!url) throw new Error('unconfigured');
  const controller = new AbortController();
  const cancel = () => controller.abort();
  input.signal.addEventListener('abort', cancel, { once: true });
  if (input.signal.aborted) cancel();
  const timeout = setTimeout(cancel, input.timeoutMs ?? 20000);
  try {
    if (controller.signal.aborted) throw new Error('aborted');
    const request = { ...museumQuestionContext, question: input.request.question, requestId: input.request.requestId };
    if (input.request.chapterId !== request.chapterId || input.request.experienceId !== request.experienceId
      || input.request.packVersion !== request.packVersion || input.request.contractVersion !== request.contractVersion
      || request.question.trim().length < 3 || request.question.length > 600) throw new Error('invalid');
    const response = await (input.fetcher ?? fetch)(url, {
      method: 'POST', headers: input.native ? { 'content-type': 'application/json', 'X-Momentum-Client': 'native' } : { 'content-type': 'application/json' },
      body: JSON.stringify(request), signal: controller.signal,
    });
    if (!response.ok) throw new Error(response.status === 503 ? 'unsupported' : 'unavailable');
    const raw = await response.text();
    if (controller.signal.aborted || raw.length > 12000) throw new Error('unavailable');
    const answer = parseGuideAnswer(JSON.parse(raw), input.request);
    if (!answer) throw new Error('invalid');
    return answer;
  } finally { clearTimeout(timeout); input.signal.removeEventListener('abort', cancel); }
}
