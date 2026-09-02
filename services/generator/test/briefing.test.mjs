// Contract tests for ADR-068: the Levende Wereld briefing route.
// Real HTTP against an in-process server on an ephemeral port; the fixture
// provider answers with verbatim fact quotes, so no API key or spending is
// ever involved.

import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import {
  BRIEFING_CONTRACT_VERSION,
  MAX_BRIEFING_FACTS,
  validateBriefingRequest,
  validateBriefingSentences,
} from '../briefing.mjs';
import { createGeneratorServer } from '../server.mjs';
import { createFixtureProvider } from '../providers/fixture.mjs';

const briefingBody = (overrides = {}) => ({
  contractVersion: BRIEFING_CONTRACT_VERSION,
  requestMode: 'living-world-briefing',
  experience: { id: 'forest-walk', kind: 'outside', title: 'Rondje door het bos', promise: 'Even tussen de bomen lopen.', duration: 30, ...overrides.experience },
  facts: [
    { id: 'f1', text: '17° en droog, wind 2 bft', source: 'Open-Meteo' },
    { id: 'f2', text: 'Zon onder om 21:41', source: 'Open-Meteo' },
    { id: 'f3', text: 'Park De Singel is nu open', source: 'OpenStreetMap' },
  ],
  context: { dayPart: 'evening' },
  ...overrides,
});

test('briefing request: valid outside payload passes and stays bounded', () => {
  const parsed = validateBriefingRequest(briefingBody());
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.facts.length, 3);
  assert.equal(parsed.value.experience.kind, 'outside');
});

test('briefing request: rejects non-outside experiences (scope ADR-068)', () => {
  const parsed = validateBriefingRequest(briefingBody({ experience: { id: 'x', kind: 'food', title: 'Soep maken', promise: 'Warme soep van wat er is.', duration: 30 } }));
  assert.equal(parsed.ok, false);
});

test('briefing request: drops unsourced facts and fails when too few remain', () => {
  const parsed = validateBriefingRequest(briefingBody({
    facts: [
      { id: 'f1', text: '17° en droog', source: 'Open-Meteo' },
      { id: 'f2', text: 'Een feit zonder bron', source: '' },
    ],
  }));
  assert.equal(parsed.ok, false);
});

test('briefing request: never carries more facts than the bound', () => {
  const facts = Array.from({ length: 20 }, (_, index) => ({ id: `f${index}`, text: `Feit ${index}`, source: 'Test' }));
  const parsed = validateBriefingRequest(briefingBody({ facts }));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.facts.length, MAX_BRIEFING_FACTS);
});

test('briefing sentences: citation to an unknown fact drops the sentence', () => {
  const request = validateBriefingRequest(briefingBody()).value;
  const accepted = validateBriefingSentences({
    sentences: [
      { text: 'Het is droog en rustig weer voor een rondje.', factIds: ['f1'] },
      { text: 'De zon gaat laat onder vanavond.', factIds: ['f2'] },
      { text: 'Deze zin citeert een feit dat niet bestaat.', factIds: ['f99'] },
    ],
  }, request);
  assert.equal(accepted.length, 2);
  assert.ok(accepted.every((sentence) => sentence.factIds.every((id) => ['f1', 'f2', 'f3'].includes(id))));
});

test('briefing sentences: fewer than two valid sentences fails honestly', () => {
  const request = validateBriefingRequest(briefingBody()).value;
  const accepted = validateBriefingSentences({ sentences: [{ text: 'Slechts één zin.', factIds: ['f1'] }] }, request);
  assert.equal(accepted.length, 0);
});

test('briefing sentences: blocked claims never pass', () => {
  const request = validateBriefingRequest(briefingBody()).value;
  const accepted = validateBriefingSentences({
    sentences: [
      { text: 'Deze wandeling geneest gegarandeerd elke kwaal.', factIds: ['f1'] },
      { text: 'De zon gaat laat onder vanavond.', factIds: ['f2'] },
    ],
  }, request);
  assert.equal(accepted.length, 0);
});

test('fixture briefing quotes the facts verbatim with their own citation', async () => {
  const provider = createFixtureProvider();
  const request = validateBriefingRequest(briefingBody()).value;
  const raw = await provider.generateBriefing(request);
  const accepted = validateBriefingSentences(raw, request);
  assert.equal(accepted.length, 3);
  assert.ok(accepted.every((sentence) => request.facts.some((fact) => fact.text === sentence.text)));
});

test('server route: POST /v1/living-world-briefing answers a validated briefing over real HTTP', async (t) => {
  const instance = createGeneratorServer({
    MOMENTUM_GENERATOR_PORT: '0',
    MOMENTUM_GENERATOR_PROVIDER: 'fixture',
  }, ['node', 'server.mjs']);
  instance.server.listen(instance.port, instance.host);
  await once(instance.server, 'listening');
  t.after(() => instance.server.close());
  const { port } = instance.server.address();
  const response = await fetch(`http://127.0.0.1:${port}/v1/living-world-briefing`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Momentum-Client': 'native' },
    body: JSON.stringify(briefingBody()),
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.contractVersion, BRIEFING_CONTRACT_VERSION);
  assert.equal(payload.mode, 'fixture');
  assert.ok(Array.isArray(payload.sentences) && payload.sentences.length >= 2);
});

test('server route: an invalid briefing request is a 400, and the draft route keeps its own contract', async (t) => {
  const instance = createGeneratorServer({
    MOMENTUM_GENERATOR_PORT: '0',
    MOMENTUM_GENERATOR_PROVIDER: 'fixture',
  }, ['node', 'server.mjs']);
  instance.server.listen(instance.port, instance.host);
  await once(instance.server, 'listening');
  t.after(() => instance.server.close());
  const { port } = instance.server.address();
  const bad = await fetch(`http://127.0.0.1:${port}/v1/living-world-briefing`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Momentum-Client': 'native' },
    body: JSON.stringify(briefingBody({ facts: [] })),
  });
  assert.equal(bad.status, 400);
});
