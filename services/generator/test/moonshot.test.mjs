import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateDrafts } from '../contract.mjs';
import { createMoonshotProvider, defaultMoonshotModel } from '../providers/moonshot.mjs';
import { blockedDraft, fastEnv, hangingFetch, jsonResponse, offDomainDraft, sequenceFetch, validDraft, validRequest } from './helpers.mjs';

const env = { MOONSHOT_API_KEY: 'test-key', ...fastEnv };
const chatPayload = (text) => ({
  choices: [{ message: { role: 'assistant', content: text } }],
  usage: { prompt_tokens: 280, completion_tokens: 560 },
});

test('valid payload passes the contract gate and reports usage', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([jsonResponse(chatPayload(JSON.stringify({ drafts: [validDraft(request)] })))]);
  const provider = createMoonshotProvider({ fetch });
  const raw = await provider.generate(request, env);
  assert.equal(raw.usage.inputTokens, 280);
  assert.equal(raw.usage.outputTokens, 560);
  assert.equal(validateDrafts(raw, request).length, 1);
});

test('payload uses the OpenAI-compatible endpoint, JSON mode, and the default model', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([jsonResponse(chatPayload(JSON.stringify({ drafts: [validDraft(request)] })))]);
  const provider = createMoonshotProvider({ fetch });
  await provider.generate(request, env);
  const call = fetch.calls[0];
  const body = JSON.parse(call.options.body);
  assert.equal(call.url, 'https://api.moonshot.ai/v1/chat/completions');
  assert.equal(call.options.headers.authorization, 'Bearer test-key');
  assert.equal(body.model, defaultMoonshotModel);
  assert.equal(body.model, 'kimi-k2.6');
  assert.deepEqual(body.response_format, { type: 'json_object' });
  // Reasoning headroom: reasoning models share max_tokens between
  // reasoning_content and visible content, so the fallback is 8000.
  assert.equal(body.max_tokens, 8000);
  assert.equal(body.messages[0].role, 'system');
  assert.equal('temperature' in body, false);
});

test('thinking is disabled by default and enabled via MOONSHOT_THINKING', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([
    jsonResponse(chatPayload(JSON.stringify({ drafts: [validDraft(request)] }))),
    jsonResponse(chatPayload(JSON.stringify({ drafts: [validDraft(request)] }))),
  ]);
  const provider = createMoonshotProvider({ fetch });
  await provider.generate(request, env);
  assert.deepEqual(JSON.parse(fetch.calls[0].options.body).thinking, { type: 'disabled' });
  await provider.generate(request, { ...env, MOONSHOT_THINKING: 'enabled' });
  assert.equal('thinking' in JSON.parse(fetch.calls[1].options.body), false);
});

test('MOMENTUM_GENERATOR_MAX_OUTPUT_TOKENS overrides the moonshot fallback', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([jsonResponse(chatPayload(JSON.stringify({ drafts: [validDraft(request)] })))]);
  const provider = createMoonshotProvider({ fetch });
  await provider.generate(request, { ...env, MOMENTUM_GENERATOR_MAX_OUTPUT_TOKENS: '12000' });
  assert.equal(JSON.parse(fetch.calls[0].options.body).max_tokens, 12000);
});

test('MOONSHOT_BASE_URL and MOONSHOT_MODEL override endpoint and model', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([jsonResponse(chatPayload(JSON.stringify({ drafts: [validDraft(request)] })))]);
  const provider = createMoonshotProvider({ fetch });
  await provider.generate(request, { ...env, MOONSHOT_BASE_URL: 'https://api.moonshot.cn/v1/', MOONSHOT_MODEL: 'kimi-k2.5' });
  const call = fetch.calls[0];
  assert.equal(call.url, 'https://api.moonshot.cn/v1/chat/completions');
  assert.equal(JSON.parse(call.options.body).model, 'kimi-k2.5');
});

test('malformed JSON gets exactly one validation retry and then succeeds', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([
    jsonResponse(chatPayload('niet-JSON {{{')),
    jsonResponse(chatPayload(JSON.stringify({ drafts: [validDraft(request)] }))),
  ]);
  const provider = createMoonshotProvider({ fetch });
  const raw = await provider.generate(request, env);
  assert.equal(fetch.calls.length, 2);
  assert.equal(validateDrafts(raw, request).length, 1);
});

test('malformed JSON twice rejects instead of looping', async () => {
  const fetch = sequenceFetch([
    jsonResponse(chatPayload('niet-JSON {{{')),
    jsonResponse(chatPayload('nog steeds geen JSON')),
  ]);
  const provider = createMoonshotProvider({ fetch });
  await assert.rejects(provider.generate(validRequest(), env), SyntaxError);
  assert.equal(fetch.calls.length, 2);
});

test('non-empty malformed answer is echoed as an assistant message in the retry', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([
    jsonResponse(chatPayload('niet-JSON {{{')),
    jsonResponse(chatPayload(JSON.stringify({ drafts: [validDraft(request)] }))),
  ]);
  const provider = createMoonshotProvider({ fetch });
  await provider.generate(request, env);
  const retryBody = JSON.parse(fetch.calls[1].options.body);
  assert.equal(retryBody.messages.length, 4);
  assert.deepEqual(retryBody.messages[2], { role: 'assistant', content: 'niet-JSON {{{' });
  assert.equal(retryBody.messages[3].role, 'user');
});

test('empty content with reasoning_content retries without an empty assistant message', async () => {
  const request = validRequest();
  const reasoningPayload = {
    choices: [{ message: { role: 'assistant', content: '', reasoning_content: 'Laat me dit moment doordenken…' } }],
    usage: { prompt_tokens: 280, completion_tokens: 900 },
  };
  const fetch = sequenceFetch([
    jsonResponse(reasoningPayload),
    jsonResponse(chatPayload(JSON.stringify({ drafts: [validDraft(request)] }))),
  ]);
  const provider = createMoonshotProvider({ fetch });
  const raw = await provider.generate(request, env);
  assert.equal(fetch.calls.length, 2);
  const retryBody = JSON.parse(fetch.calls[1].options.body);
  // Moonshot rejects an empty assistant message (HTTP 400); the retry must
  // carry only the correction user message after the original pair.
  assert.equal(retryBody.messages.length, 3);
  assert.deepEqual(retryBody.messages.map((message) => message.role), ['system', 'user', 'user']);
  assert.equal(retryBody.messages.some((message) => message.role === 'assistant'), false);
  assert.equal(validateDrafts(raw, request).length, 1);
  // Reasoning tokens count as completion tokens in the usage accounting.
  assert.equal(raw.usage.outputTokens, 560);
});

test('whitespace-only content also retries without an assistant message', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([
    jsonResponse(chatPayload('   \n  ')),
    jsonResponse(chatPayload(JSON.stringify({ drafts: [validDraft(request)] }))),
  ]);
  const provider = createMoonshotProvider({ fetch });
  await provider.generate(request, env);
  const retryBody = JSON.parse(fetch.calls[1].options.body);
  assert.equal(retryBody.messages.length, 3);
  assert.deepEqual(retryBody.messages.map((message) => message.role), ['system', 'user', 'user']);
});

test('blocked-claims output is rejected by the contract gate', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([jsonResponse(chatPayload(JSON.stringify({ drafts: [blockedDraft(request)] })))]);
  const provider = createMoonshotProvider({ fetch });
  const raw = await provider.generate(request, env);
  assert.equal(validateDrafts(raw, request).length, 0);
});

test('domain-violating output is rejected by the contract gate', async () => {
  const request = validRequest();
  const fetch = sequenceFetch([jsonResponse(chatPayload(JSON.stringify({ drafts: [offDomainDraft(request)] })))]);
  const provider = createMoonshotProvider({ fetch });
  const raw = await provider.generate(request, env);
  assert.equal(validateDrafts(raw, request).length, 0);
});

test('timeout path aborts the outbound call and rejects', async () => {
  const provider = createMoonshotProvider({ fetch: hangingFetch });
  await assert.rejects(provider.generate(validRequest(), env), /aborted/i);
});
