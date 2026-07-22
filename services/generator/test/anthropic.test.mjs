import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateDrafts } from '../contract.mjs';
import { createAnthropicProvider, defaultAnthropicModel } from '../providers/anthropic.mjs';
import { blockedDraft, fastEnv, hangingFetch, jsonResponse, offDomainDraft, sequenceFetch, validDraft, validRequest } from './helpers.mjs';

const env = { ANTHROPIC_API_KEY: 'test-key', ...fastEnv };
const messagesPayload = (drafts) => ({
  content: [{ type: 'tool_use', name: 'submit_experience_drafts', input: { drafts } }],
  usage: { input_tokens: 300, output_tokens: 600 },
});

test('valid payload passes the contract gate and reports usage', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([jsonResponse(messagesPayload([validDraft(request)]))]);
  const provider = createAnthropicProvider({ fetch });
  const raw = await provider.generate(request, env);
  assert.equal(raw.usage.inputTokens, 300);
  assert.equal(raw.usage.outputTokens, 600);
  assert.equal(validateDrafts(raw, request).length, 1);
});

test('payload uses forced tool_choice with the draft schema and a system prompt', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([jsonResponse(messagesPayload([validDraft(request)]))]);
  const provider = createAnthropicProvider({ fetch });
  await provider.generate(request, env);
  const call = fetch.calls[0];
  const body = JSON.parse(call.options.body);
  assert.equal(call.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(call.options.headers['x-api-key'], 'test-key');
  assert.equal(call.options.headers['anthropic-version'], '2023-06-01');
  assert.equal(body.model, defaultAnthropicModel);
  assert.equal(body.model, 'claude-haiku-4-5-20251001');
  assert.equal(body.max_tokens, 3200);
  assert.equal(typeof body.system, 'string');
  assert.equal(body.tools.length, 1);
  assert.deepEqual(body.tool_choice, { type: 'tool', name: 'submit_experience_drafts' });
  assert.equal(body.tools[0].input_schema.type, 'object');
});

test('ANTHROPIC_MODEL overrides the default model', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([jsonResponse(messagesPayload([validDraft(request)]))]);
  const provider = createAnthropicProvider({ fetch });
  await provider.generate(request, { ...env, ANTHROPIC_MODEL: 'claude-sonnet-4-6' });
  assert.equal(JSON.parse(fetch.calls[0].options.body).model, 'claude-sonnet-4-6');
});

test('a response without the forced tool_use block rejects', async () => {
  const fetch = sequenceFetch([jsonResponse({ content: [{ type: 'text', text: '{"drafts":[]}' }], usage: {} })]);
  const provider = createAnthropicProvider({ fetch });
  await assert.rejects(provider.generate(validRequest(), env), /anthropic_no_tool_use/);
});

test('blocked-claims output is rejected by the contract gate', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([jsonResponse(messagesPayload([blockedDraft(request)]))]);
  const provider = createAnthropicProvider({ fetch });
  const raw = await provider.generate(request, env);
  assert.equal(validateDrafts(raw, request).length, 0);
});

test('domain-violating output is rejected by the contract gate', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([jsonResponse(messagesPayload([offDomainDraft(request)]))]);
  const provider = createAnthropicProvider({ fetch });
  const raw = await provider.generate(request, env);
  assert.equal(validateDrafts(raw, request).length, 0);
});

test('timeout path aborts the outbound call and rejects', async () => {
  const provider = createAnthropicProvider({ fetch: hangingFetch });
  await assert.rejects(provider.generate(validRequest(), env), /aborted/i);
});

test('5xx is retried with backoff and then succeeds', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([
    { ok: false, status: 503, json: async () => ({}), text: async () => 'overloaded' },
    jsonResponse(messagesPayload([validDraft(request)])),
  ]);
  const provider = createAnthropicProvider({ fetch });
  const raw = await provider.generate(request, env);
  assert.equal(fetch.calls.length, 2);
  assert.equal(validateDrafts(raw, request).length, 1);
});
