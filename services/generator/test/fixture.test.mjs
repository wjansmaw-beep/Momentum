import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateDrafts } from '../contract.mjs';
import { createFixtureProvider } from '../providers/fixture.mjs';
import { validRequest } from './helpers.mjs';

test('fixture provider serves a contract-valid draft with identical v1 behavior', async () => {
  const provider = createFixtureProvider();
  const request = validRequest();
  const raw = await provider.generate(request, {});
  const drafts = validateDrafts(raw, request);
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].kind, 'food');
});

test('fixture provider is always configured and reports fixture kind', () => {
  const provider = createFixtureProvider();
  assert.equal(provider.isConfigured({}), true);
  assert.equal(provider.kind, 'fixture');
  assert.equal(provider.modelName({}), undefined);
});
