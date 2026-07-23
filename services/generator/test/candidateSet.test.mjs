// ADR-059 candidate-set contract tests: the additive v1 extension that lets a
// request carry draftCount (1–3) and the response carry up to 3 drafts. The
// per-draft shape and all validation gates are unchanged.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { draftSchema, validateDrafts, validateRequest } from '../contract.mjs';
import { createFixtureProvider } from '../providers/fixture.mjs';
import { createFixtureDrafts } from '../fixture.mjs';
import { buildPrompt } from '../prompt.mjs';
import { rawRequest, validRequest } from './helpers.mjs';

const contextualRaw = (overrides = {}) => rawRequest({
  requestMode: 'contextual-suggestion',
  intent: '',
  clarificationTerms: '',
  domains: ['outside'],
  ...overrides,
});

test('a request without draftCount keeps the v1 default of one draft', () => {
  const parsed = validateRequest(contextualRaw());
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.draftCount, 1);
});

test('draftCount 2–3 is accepted; other values are rejected, never clamped', () => {
  for (const draftCount of [2, 3]) {
    const parsed = validateRequest(contextualRaw({ draftCount }));
    assert.equal(parsed.ok, true);
    assert.equal(parsed.value.draftCount, draftCount);
  }
  for (const draftCount of [0, 4, 1.5, '2', -1]) {
    const parsed = validateRequest(contextualRaw({ draftCount }));
    assert.equal(parsed.ok, false, `draftCount ${draftCount} moet worden afgewezen`);
  }
});

test('the response schema admits up to three drafts with the unchanged per-draft shape', () => {
  assert.equal(draftSchema.properties.drafts.maxItems, 3);
  assert.equal(draftSchema.properties.drafts.minItems, 1);
});

test('validateDrafts bounds the accepted set by the requested draftCount', () => {
  const single = validRequest({ requestMode: 'contextual-suggestion', intent: '', clarificationTerms: '', domains: ['outside'] });
  const setOfThree = { ...single, draftCount: 3 };
  const drafts = createFixtureDrafts(setOfThree);
  assert.ok(drafts.length >= 2, 'de fixture levert echte varianten voor een set');
  const acceptedSingle = validateDrafts({ drafts }, single);
  assert.equal(acceptedSingle.length, 1);
  const acceptedSet = validateDrafts({ drafts }, setOfThree);
  assert.ok(acceptedSet.length >= 2);
  // Elke draft in de set doorstond afzonderlijk dezelfde poort (complete capsule).
  for (const draft of acceptedSet) {
    assert.ok(draft.steps.length >= 2 && draft.prepare.length >= 1 && draft.promise.length >= 12);
  }
});

test('the fixture provider serves distinct variants for a candidate set', async () => {
  const provider = createFixtureProvider();
  const request = validRequest({ requestMode: 'contextual-suggestion', intent: '', clarificationTerms: '', domains: ['outside'] });
  const raw = await provider.generate({ ...request, draftCount: 3 }, {});
  const titles = raw.drafts.map((draft) => draft.title);
  assert.equal(new Set(titles).size, titles.length, 'geen dubbele concepten in de set');
  assert.ok(raw.drafts.length >= 2 && raw.drafts.length <= 3);
  const validated = validateDrafts(raw, { ...request, draftCount: 3 });
  assert.equal(validated.length, raw.drafts.length);
});

test('a set that partly fails the gate keeps only the valid candidates', () => {
  const request = { ...validRequest({ requestMode: 'contextual-suggestion', intent: '', clarificationTerms: '', domains: ['outside'] }), draftCount: 3 };
  const good = createFixtureDrafts(request);
  const blocked = { ...good[0], title: 'Dit geneest gegarandeerd elke kwaal', promise: 'Gegarandeerd herstel voor iedereen.' };
  const accepted = validateDrafts({ drafts: [blocked, ...good] }, request);
  assert.equal(accepted.length, good.length);
  assert.ok(accepted.every((draft) => !/geneest|gegarandeerd/i.test(`${draft.title} ${draft.promise}`)));
});

test('the prompt asks for a competing set only when draftCount exceeds one', () => {
  const single = buildPrompt(validRequest());
  assert.match(single, /precies één complete/);
  const set = buildPrompt({ ...validRequest(), draftCount: 3 });
  assert.match(set, /3 verschillende, complete/);
  assert.match(set, /concurreert afzonderlijk/);
});
