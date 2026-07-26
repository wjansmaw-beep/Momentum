// Scenariotests voor de vers-samengestelde kaarten op Nu (ADR-056/059).
// Zelfde patroon als de affirmation-tests: node --test importeert de
// TypeScript-modellen direct via type stripping, zonder build-stap.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { freshCard, freshExcludingSuggestions } from '../src/ui/now-v2/nowModel.ts';

const base = {
  id: 'generated-outside-abc',
  kind: 'outside',
  title: 'Rondje langs de singel',
  promise: 'Even eruit, zonder ver te gaan.',
  wonder: 'De buitenlucht doet de rest.',
  image: 'https://example.invalid/beeld.jpg',
  accent: '#4E9B6A',
  duration: 45,
  effort: 'Rustig tempo',
  cta: 'Begin deze ervaring',
  why: ['Past in de tijd die je hebt'],
  prepareTitle: 'Maak het eenvoudig om te beginnen',
  prepare: ['Schoenen aan'],
  presenceMode: 'guided',
  presenceTitle: 'Rondje langs de singel',
  presenceCue: 'Alleen de volgende stap is nu nodig.',
  steps: [
    { title: 'Vertrek', instruction: 'Loop de deur uit.' },
    { title: 'Rondje', instruction: 'Volg de singel.' },
  ],
  memoryPrompt: 'Wat maakte dit moment de moeite waard?',
  keywords: ['buiten'],
  company: ['solo'],
};

test('freshCard toont capsule-feiten en generation-disclosure', () => {
  const card = freshCard({
    ...base,
    generation: { mode: 'remote', provider: 'kimi', createdAt: '2026-07-25T20:00:00.000Z', disclosure: 'Nieuw samengesteld uit één richting die jij eerder koos.' },
  });
  assert.equal(card.eyebrow, 'Vers samengesteld');
  assert.equal(card.facts, '45 min · rustig tempo · dichtbij');
  assert.equal(card.disclosure, 'Nieuw samengesteld uit één richting die jij eerder koos.');
});

test('freshCard valt eerlijk terug zonder generation-metadata', () => {
  const card = freshCard({ ...base, distance: '5 min lopen' });
  assert.equal(card.facts, '45 min · rustig tempo · 5 min lopen');
  assert.match(card.disclosure, /capsulegrenzen/);
});

test('freshExcludingSuggestions filtert dubbele kaarten en begrenst op drie', () => {
  const fresh = [
    { ...base, id: 'a' },
    { ...base, id: 'b' },
    { ...base, id: 'c' },
    { ...base, id: 'd' },
  ];
  const suggestions = [{ ...base, id: 'b' }];
  const result = freshExcludingSuggestions(fresh, suggestions).map((item) => item.id);
  assert.deepEqual(result, ['a', 'c', 'd']);
  assert.equal(freshExcludingSuggestions(fresh, fresh).length, 0);
});
