// Anthropic provider (ADR-056): Claude through the Messages API with
// structured output via tool use. The draft schema from contract.mjs is the
// tool input_schema, tool_choice forces that tool, and the Momentum prompt is
// sent as the system message. Raw tool input remains untrusted output;
// contract.mjs validateDrafts stays the only acceptance gate.
//
// Default model `claude-haiku-4-5-20251001`: the current cost/latency tier
// ($1/$5 per 1M tokens), consistent with the Founder EUR 10 budget ceiling;
// supports tool use and strict tool schemas. Sources checked 2026-07:
// Anthropic Messages API documentation (endpoint, headers, tool_use /
// tool_choice semantics; forced tool use is used without extended thinking,
// with which it is incompatible) and Anthropic pricing summaries.
// `claude-sonnet-4-6` ($3/$15, documented structured-output support) is the
// quality upgrade path. ANTHROPIC_MODEL remains the override.

import { draftSchema } from '../contract.mjs';
import { buildPrompt } from '../prompt.mjs';
import { fetchWithRetry, maxOutputTokens, requestTimeoutMs } from './provider.mjs';

export const defaultAnthropicModel = 'claude-haiku-4-5-20251001';

const toolName = 'submit_experience_drafts';

export function createAnthropicProvider(deps = {}) {
  const fetchImpl = deps.fetch ?? globalThis.fetch;
  return {
    name: 'anthropic-messages',
    kind: 'model',
    isConfigured: (env) => Boolean(env.ANTHROPIC_API_KEY),
    modelName: (env) => env.ANTHROPIC_MODEL || defaultAnthropicModel,
    healthLabel: () => 'Anthropic Messages API (tool-use structured output)',
    async generate(request, env, options = {}) {
      const model = env.ANTHROPIC_MODEL || defaultAnthropicModel;
      const response = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxOutputTokens(env),
          system: buildPrompt(request),
          messages: [{ role: 'user', content: 'Ontwerp de ervaring voor dit moment en lever haar uitsluitend aan via het beschikbare gereedschap.' }],
          tools: [{
            name: toolName,
            description: 'Lever precies één complete Momentum-ervaringscapsule aan volgens het experience-draft contract.',
            input_schema: draftSchema,
          }],
          tool_choice: { type: 'tool', name: toolName },
        }),
      }, { timeoutMs: options.timeoutMs ?? requestTimeoutMs(env), fetchImpl });
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 500);
        throw new Error(`anthropic_${response.status}:${detail}`);
      }
      const payload = await response.json();
      const block = Array.isArray(payload?.content) ? payload.content.find((item) => item?.type === 'tool_use' && item?.name === toolName) : undefined;
      if (!block || typeof block.input !== 'object' || block.input === null) throw new Error('anthropic_no_tool_use');
      const usage = payload?.usage ?? {};
      return {
        drafts: Array.isArray(block.input.drafts) ? block.input.drafts : [],
        usage: {
          inputTokens: Number.isFinite(usage.input_tokens) ? usage.input_tokens : 0,
          outputTokens: Number.isFinite(usage.output_tokens) ? usage.output_tokens : 0,
        },
      };
    },
  };
}
