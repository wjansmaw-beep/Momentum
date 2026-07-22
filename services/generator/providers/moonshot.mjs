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

import { buildPrompt } from '../prompt.mjs';
import { fetchWithRetry, maxOutputTokens, requestTimeoutMs } from './provider.mjs';

export const defaultMoonshotModel = 'kimi-k2.6';
const defaultBaseUrl = 'https://api.moonshot.ai/v1';

const jsonInstruction = 'Antwoord uitsluitend met één geldig JSON-object met een veld "drafts" (een array met precies één draft volgens het contract). Geen toelichting, geen codeblokken.';

export function createMoonshotProvider(deps = {}) {
  const fetchImpl = deps.fetch ?? globalThis.fetch;

  const call = async (env, options, messages) => {
    const baseUrl = (env.MOONSHOT_BASE_URL || defaultBaseUrl).replace(/\/$/, '');
    const response = await fetchWithRetry(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.MOONSHOT_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: env.MOONSHOT_MODEL || defaultMoonshotModel,
        messages,
        response_format: { type: 'json_object' },
        max_tokens: maxOutputTokens(env),
      }),
    }, { timeoutMs: options.timeoutMs ?? requestTimeoutMs(env), fetchImpl });
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
        { role: 'system', content: `${buildPrompt(request)}\n\n${jsonInstruction}` },
        { role: 'user', content: 'Maak nu het gevraagde JSON-object voor dit moment.' },
      ];
      let payload = await call(env, options, messages);
      let text = payload?.choices?.[0]?.message?.content ?? '';
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        // Exactly one validation retry for malformed JSON (ADR-056).
        payload = await call(env, options, [
          ...messages,
          { role: 'assistant', content: typeof text === 'string' ? text.slice(0, 4000) : '' },
          { role: 'user', content: 'Het vorige antwoord was geen geldige JSON. Geef nu uitsluitend het gevraagde JSON-object, zonder enige toelichting.' },
        ]);
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
