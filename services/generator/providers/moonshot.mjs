// Moonshot provider (ADR-056): Kimi through Moonshot's OpenAI-compatible
// chat-completions API. Default base URL is the international platform
// (https://api.moonshot.ai/v1); China-hosted keys use
// https://api.moonshot.cn/v1 via MOONSHOT_BASE_URL.
//
// Structured output uses JSON mode (`response_format: { type: 'json_object' }`)
// rather than strict json_schema: Moonshot's strict mode (MFJS) rejects the
// minLength/maxLength/minimum/maximum/anyOf keywords that the draft schema in
// contract.mjs uses, and answers HTTP 400 on them. The contract validators
// remain the real acceptance gate, and malformed JSON gets exactly one
// validation retry with a stricter follow-up message. Temperature is omitted:
// some Kimi models reject any value other than 1.
//
// Default model `kimi-k2.6`: the current stable production model
// (~$0.95/$4.00 per 1M tokens direct; `kimi-k2.5` is the cheaper alternative).
// Sources checked 2026-07: Moonshot platform docs (platform.kimi.ai chat
// completions, base URL, OpenAI compatibility), Moonshot structured-output
// notes (MFJS keyword limits), and July 2026 pricing aggregators.
// MOONSHOT_MODEL remains the override.
//
// Reasoning behavior (platform.kimi.ai "Thinking Mode" / "Model Parameter
// Reference", checked 2026-07-24): kimi-k2.6 is a thinking model with
// `thinking: { type: 'enabled' }` as the default. Its reasoning tokens share
// the max_tokens budget with visible content ("the sum of tokens in
// reasoning_content and content must be less than or equal to max_tokens"), so
// a tight cap can leave message.content empty. A per-call effort knob does not
// exist for k2.6 (`reasoning_effort` is kimi-k3-only); the only control is
// `thinking.type` enabled/disabled. For this structured JSON-extraction task
// thinking adds cost and latency without improving the output, so the adapter
// disables it by default — the "zuinig" setting. Set MOONSHOT_THINKING=enabled
// to restore model-default thinking. With thinking disabled Moonshot pins
// temperature at 0.6 internally; we already omit temperature.
//
// Two consequences of thinking being on by default elsewhere:
// - max_tokens fallback is raised to 8000 for this provider (still
//   overridable via MOMENTUM_GENERATOR_MAX_OUTPUT_TOKENS), so a future
//   MOONSHOT_THINKING=enabled run keeps room for reasoning plus JSON.
// - The validation retry below never sends an empty assistant message:
//   Moonshot answers HTTP 400 "assistant message must not be empty" when
//   message.content came back empty.

import { buildPrompt } from '../prompt.mjs';
import { fetchWithRetry, maxOutputTokens, requestTimeoutMs } from './provider.mjs';

export const defaultMoonshotModel = 'kimi-k2.6';
export const defaultMoonshotMaxOutputTokens = 8000;
// k2.6 antwoordt in de praktijk in 15-90s op volledige JSON-drafts (gemeten
// live 2026-07-24); de gedeelde 20s-default zou vrijwel elke echte call
// afbreken. MOMENTUM_GENERATOR_TIMEOUT_MS blijft de override.
export const defaultMoonshotTimeoutMs = 120_000;
const defaultBaseUrl = 'https://api.moonshot.ai/v1';

// The draft field shape is spelled out explicitly: with JSON mode (not strict
// schema) the model otherwise guesses the contract and returns incomplete
// drafts that the contract gate then rightfully rejects (observed live
// 2026-07-24: only a title came back). The allowed kind values are named
// literally per request: a free "one of the domains" phrasing let the model
// drift to a kind outside the requested domain (also observed live).
const jsonInstruction = (request) => `Antwoord uitsluitend met één geldig JSON-object met een veld "drafts": een array met het gevraagde aantal drafts volgens het contract. Geen toelichting, geen codeblokken.
Elke draft bevat exact deze velden: kind (uitsluitend één van: ${request.domains.join(', ') || 'de mogelijke domeinen'}), title, promise, wonder, duration (gehele minuten, minstens 5 korter dan de beschikbare tijd), effort, cta, why (1-3 korte redenen), prepareTitle, prepare (1-6 concrete voorbereidingen), presenceMode ("quiet", "guided" of "handoff"), presenceTitle, presenceCue, steps (2-8 stappen, elk met title, instruction, meta (string of null), seconds (geheel getal of null) en insight (null of {"title","body","topic"})), memoryPrompt, keywords (2-12 woorden), company (array met het gevraagde gezelschap).`;

export function createMoonshotProvider(deps = {}) {
  const fetchImpl = deps.fetch ?? globalThis.fetch;

  const call = async (env, options, messages) => {
    const baseUrl = (env.MOONSHOT_BASE_URL || defaultBaseUrl).replace(/\/$/, '');
    const thinkingEnabled = (env.MOONSHOT_THINKING || '').trim().toLowerCase() === 'enabled';
    const response = await fetchWithRetry(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.MOONSHOT_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: env.MOONSHOT_MODEL || defaultMoonshotModel,
        messages,
        response_format: { type: 'json_object' },
        max_tokens: maxOutputTokens(env, defaultMoonshotMaxOutputTokens),
        // Only sent when disabling: 'enabled' is the model default and some
        // Kimi models reject redundant fixed parameters.
        ...(thinkingEnabled ? {} : { thinking: { type: 'disabled' } }),
      }),
    }, { timeoutMs: options.timeoutMs ?? requestTimeoutMs(env, defaultMoonshotTimeoutMs), fetchImpl });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      throw new Error(`moonshot_${response.status}:${detail}`);
    }
    return response.json();
  };

  return {
    name: 'moonshot-kimi',
    kind: 'model',
    isConfigured: (env) => Boolean(env.MOONSHOT_API_KEY),
    modelName: (env) => env.MOONSHOT_MODEL || defaultMoonshotModel,
    healthLabel: () => 'Moonshot Kimi chat completions (JSON mode)',
    async generate(request, env, options = {}) {
      const messages = [
        { role: 'system', content: `${buildPrompt(request)}\n\n${jsonInstruction(request)}` },
        { role: 'user', content: 'Maak nu het gevraagde JSON-object voor dit moment.' },
      ];
      let payload = await call(env, options, messages);
      let text = payload?.choices?.[0]?.message?.content ?? '';
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        // Exactly one validation retry for malformed JSON (ADR-056). The
        // previous answer is echoed as an assistant message only when it is
        // non-empty: a reasoning model can return empty message.content (all
        // output tokens went to reasoning_content), and Moonshot rejects an
        // empty assistant message with HTTP 400. With empty content the
        // correction user message goes alone.
        const retryMessages = [...messages];
        if (typeof text === 'string' && text.trim()) {
          retryMessages.push({ role: 'assistant', content: text.slice(0, 4000) });
        }
        retryMessages.push({ role: 'user', content: 'Het vorige antwoord was geen geldige JSON. Geef nu uitsluitend het gevraagde JSON-object, zonder enige toelichting.' });
        payload = await call(env, options, retryMessages);
        text = payload?.choices?.[0]?.message?.content ?? '';
        parsed = JSON.parse(text);
      }
      const usage = payload?.usage ?? {};
      return {
        drafts: Array.isArray(parsed?.drafts) ? parsed.drafts : [],
        usage: {
          inputTokens: Number.isFinite(usage.prompt_tokens) ? usage.prompt_tokens : 0,
          outputTokens: Number.isFinite(usage.completion_tokens) ? usage.completion_tokens : 0,
        },
      };
    },
  };
}
