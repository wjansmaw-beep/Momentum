import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateDrafts } from '../contract.mjs';
import { createOpenAIProvider, defaultOpenAIModel } from '../providers/openai.mjs';
import { blockedDraft, fastEnv, hangingFetch, jsonResponse, offDomainDraft, sequenceFetch, validDraft, validRequest } from './helpers.mjs';

const env = { OPENAI_API_KEY: 'test-key', ...fastEnv };
const responsesPayload = (drafts) => ({
  output_text: JSON.stringify({ drafts }),
  usage: { input_tokens: 320, output_tokens: 640 },
});

test('valid payload passes the contract gate and reports usage', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([jsonResponse(responsesPayload([validDraft(request)]))]);
  const provider = createOpenAIProvider({ fetch });
  const raw = await provider.generate(request, env);
  assert.equal(raw.usage.inputTokens, 320);
  assert.equal(raw.usage.outputTokens, 640);
  assert.equal(validateDrafts(raw, request).length, 1);
});

test('payload uses the repaired default model, developer role, and low reasoning effort', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([jsonResponse(responsesPayload([validDraft(request)]))]);
  const provider = createOpenAIProvider({ fetch });
  await provider.generate(request, env);
  const body = JSON.parse(fetch.calls[0].options.body);
  assert.equal(body.model, defaultOpenAIModel);
  assert.equal(body.model, 'gpt-5.4-mini');
  assert.equal(body.input[0].role, 'developer');
  assert.equal(body.reasoning.effort, 'low');
  assert.equal(body.text.format.type, 'json_schema');
  assert.equal(body.text.format.strict, true);
  assert.equal(body.store, false);
  assert.equal(body.max_output_tokens, 3200);
});

test('OPENAI_MODEL overrides the default model', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([jsonResponse(responsesPayload([validDraft(request)]))]);
  const provider = createOpenAIProvider({ fetch });
  await provider.generate(request, { ...env, OPENAI_MODEL: 'gpt-5.4-nano' });
  assert.equal(JSON.parse(fetch.calls[0].options.body).model, 'gpt-5.4-nano');
});

test('malformed JSON output rejects instead of serving drafts', async () => {
  const fetch = sequenceFetch([jsonResponse({ output_text: 'this is not json' })]);
  const provider = createOpenAIProvider({ fetch });
  await assert.rejects(provider.generate(validRequest(), env), SyntaxError);
});

test('blocked-claims output is rejected by the contract gate', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([jsonResponse(responsesPayload([blockedDraft(request)]))]);
  const provider = createOpenAIProvider({ fetch });
  const raw = await provider.generate(request, env);
  assert.equal(validateDrafts(raw, request).length, 0);
});

test('domain-violating output is rejected by the contract gate', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([jsonResponse(responsesPayload([offDomainDraft(request)]))]);
  const provider = createOpenAIProvider({ fetch });
  const raw = await provider.generate(request, env);
  assert.equal(validateDrafts(raw, request).length, 0);
});

test('timeout path aborts the outbound call and rejects', async () => {
  const provider = createOpenAIProvider({ fetch: hangingFetch });
  await assert.rejects(provider.generate(validRequest(), env), /aborted/i);
});

test('429 is retried with backoff and then succeeds', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([
    { ok: false, status: 429, json: async () => ({}), text: async () => 'rate limited' },
    jsonResponse(responsesPayload([validDraft(request)])),
  ]);
  const provider = createOpenAIProvider({ fetch });
  const raw = await provider.generate(request, env);
  assert.equal(fetch.calls.length, 2);
  assert.equal(validateDrafts(raw, request).length, 1);
});

test('non-retryable provider error rejects with status detail', async () => {
  const fetch = sequenceFetch([{ ok: false, status: 400, json: async () => ({}), text: async () => 'bad request' }]);
  const provider = createOpenAIProvider({ fetch });
  await assert.rejects(provider.generate(validRequest(), env), /openai_400/);
  assert.equal(fetch.calls.length, 1);
});
