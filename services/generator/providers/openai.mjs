// OpenAI provider (ADR-056): the generateWithOpenAI path from Generator
// Service v1 (ADR-037) moved behind the shared provider interface, against
// the Responses API with Structured Outputs (json_schema, strict).
//
// Repaired default model: v1 defaulted to `gpt-5.6-terra`, which does not
// exist in the OpenAI model catalog (ADR-056). The new default `gpt-5.4-mini`
// is the current affordable tier that supports the Responses API, developer
// messages, and strict JSON Schema structured outputs; `reasoning.effort`
// 'low' is valid on this generation ('minimal' is not supported on gpt-5.1+).
// Sources checked 2026-07: Microsoft Azure OpenAI reasoning-model feature
// matrix (developer messages, structured outputs, reasoning effort options),
// the OpenAI pricing table as summarized in June 2026 ($0.75/$4.50 per 1M
// tokens), and the Structured Outputs guide (`text.format`, not
// `response_format`). OPENAI_MODEL remains the override.

import { draftSchema } from '../contract.mjs';
import { buildPrompt } from '../prompt.mjs';
import { fetchWithRetry, maxOutputTokens, requestTimeoutMs } from './provider.mjs';

export const defaultOpenAIModel = 'gpt-5.4-mini';

const outputText = (payload) => {
  if (typeof payload?.output_text === 'string') return payload.output_text;
  for (const item of payload?.output ?? []) for (const content of item?.content ?? []) if (content?.type === 'output_text' && typeof content.text === 'string') return content.text;
  return '';
};

export function createOpenAIProvider(deps = {}) {
  const fetchImpl = deps.fetch ?? globalThis.fetch;
  return {
    name: 'openai-responses',
    kind: 'model',
    isConfigured: (env) => Boolean(env.OPENAI_API_KEY),
    modelName: (env) => env.OPENAI_MODEL || defaultOpenAIModel,
    healthLabel: () => 'OpenAI Responses API (strict structured outputs)',
    async generate(request, env, options = {}) {
      const model = env.OPENAI_MODEL || defaultOpenAIModel;
      const response = await fetchWithRetry('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model,
          store: false,
          reasoning: { effort: 'low' },
          input: [{ role: 'developer', content: [{ type: 'input_text', text: buildPrompt(request) }] }],
          text: { format: { type: 'json_schema', name: 'momentum_experience_drafts', strict: true, schema: draftSchema } },
          max_output_tokens: maxOutputTokens(env),
        }),
      }, { timeoutMs: options.timeoutMs ?? requestTimeoutMs(env), fetchImpl });
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 500);
        throw new Error(`openai_${response.status}:${detail}`);
      }
      const payload = await response.json();
      const text = outputText(payload);
      if (!text) throw new Error('openai_empty_output');
      const parsed = JSON.parse(text);
      const usage = payload?.usage ?? {};
      return {
        drafts: Array.isArray(parsed?.drafts) ? parsed.drafts : [],
        usage: {
          inputTokens: Number.isFinite(usage.input_tokens) ? usage.input_tokens : 0,
          outputTokens: Number.isFinite(usage.output_tokens) ? usage.output_tokens : 0,
        },
      };
    },
  };
}
