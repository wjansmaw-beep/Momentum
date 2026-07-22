// Shared helpers for the generator contract tests. Fetch is fully mocked;
// no real provider call is ever made from these tests.

import { validateRequest } from '../contract.mjs';
import { createFixtureDraft } from '../fixture.mjs';

export const rawRequest = (overrides = {}) => ({
  contractVersion: 'experience-draft-v1',
  requestMode: 'active-intent',
  intent: 'Ik wil iets kleins koken',
  clarificationTerms: '',
  variationSeed: 'test-seed',
  domains: ['food'],
  context: { dayPart: 'evening', company: 'solo', availableMinutes: 30, hasKettlebell: false },
  ...overrides,
});

export const validRequest = (overrides = {}) => {
  const parsed = validateRequest(rawRequest(overrides));
  if (!parsed.ok) throw new Error(`test request invalid: ${parsed.error}`);
  return parsed.value;
};

// A contract-valid draft, reused as mocked model output.
export const validDraft = (request = validRequest()) => createFixtureDraft(request);

// A draft that the blocked-claims rule in contract.mjs must reject.
export const blockedDraft = (request = validRequest()) => ({
  ...createFixtureDraft(request),
  title: 'Dit geneest gegarandeerd elke kwaal',
});

// A draft whose kind violates the requested domains.
export const offDomainDraft = (request = validRequest()) => ({
  ...createFixtureDraft(request),
  kind: 'restore',
});

export const jsonResponse = (payload, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => payload,
  text: async () => JSON.stringify(payload),
});

export const sequenceFetch = (steps) => {
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    const step = steps[Math.min(calls.length - 1, steps.length - 1)];
    if (step instanceof Error) throw step;
    return step;
  };
  fetch.calls = calls;
  return fetch;
};

// Never resolves; rejects when the adapter's AbortController fires.
export const hangingFetch = async (url, options) => new Promise((resolve, reject) => {
  options.signal.addEventListener('abort', () => reject(new Error('The operation was aborted')));
});

export const fastEnv = { MOMENTUM_GENERATOR_TIMEOUT_MS: '60' };
