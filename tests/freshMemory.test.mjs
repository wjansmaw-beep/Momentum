import assert from 'node:assert/strict';
import { test } from 'node:test';
import { freshMemory } from '../src/product/freshMemory.ts';
import { memoryFacts, memoryStats } from '../src/ui/now-v2/bookModel.ts';

test('a reference memory does not imply measured walking time or solo company', () => {
  const memory = { id: 'test', title: 'Tocht', date: 'Vandaag', note: '', image: '', experienceSnapshot: { referenceVisit: true, duration: 30 } };
  assert.deepEqual(memoryFacts(memory, undefined), ['vandaag']);
  assert.ok(memoryStats(memory, [memory], []).every(stat => !stat.label.includes('minuten')));
});
import { restoreAdaptiveGuide } from '../src/guidance/adaptiveGuide.ts';

test('saving an empty memory never invents an emotion or a positive rating', () => {
  const experience = { id: 'museum', title: 'Museum', image: 'photo' };
  const memory = freshMemory(experience, '   ', new Date('2026-11-09T00:00:00Z'));
  assert.equal(memory.note, '');
  assert.equal(memory.date, '2026-11-09T00:00:00.000Z');
  assert.equal(memory.experienceSnapshot, experience);
  assert.equal('outcome' in memory, false);
});
test('a personal note remains personal text, not generated content', () => {
  const memory = freshMemory({ id: 'museum', title: 'Museum', image: 'photo' }, '  Geen bijzondere ervaring.  ');
  assert.equal(memory.note, 'Geen bijzondere ervaring.');
});
test('observing survives session serialization without asking to start playback', () => {
  const experience = { id: 'museum', kind: 'culture', steps: [{ title: 'A', instruction: 'Kijk.' }] };
  const state = { ...restoreAdaptiveGuide(experience), mode: 'immerse', presence: 'observe' };
  assert.equal(restoreAdaptiveGuide(experience, JSON.parse(JSON.stringify(state))).presence, 'observe');
});
