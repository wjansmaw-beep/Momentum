import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chapterIds, restoreAdaptiveGuide, supportsAdaptiveGuide, toggleGuideTask } from '../src/guidance/adaptiveGuide.ts';

const experience = { id: 'test-place', kind: 'outside', steps: [
  { title: 'Kijken', instruction: 'Zoek één detail.' },
  { title: 'Luisteren', instruction: 'Luister naar de omgeving.' },
] };

test('old sessions resume their step without inventing completed tasks', () => {
  const state = restoreAdaptiveGuide(experience, undefined, 1);
  assert.equal(state.chapterId, chapterIds(experience)[1]);
  assert.equal(state.mode, 'discover');
  assert.deepEqual(state.completedTaskIds, []);
});

test('mode and voluntary task state survive a serialized session round trip', () => {
  const state = restoreAdaptiveGuide(experience, undefined);
  const completed = { ...toggleGuideTask(state, state.chapterId), mode: 'immerse' };
  assert.deepEqual(restoreAdaptiveGuide(experience, JSON.parse(JSON.stringify(completed))), completed);
  assert.deepEqual(toggleGuideTask(completed, state.chapterId).completedTaskIds, []);
});

test('reordering preserves chapter identity and never marks a different instruction', () => {
  const original = restoreAdaptiveGuide(experience, undefined, 1);
  const done = toggleGuideTask(original, original.chapterId);
  const reordered = { ...experience, steps: [...experience.steps].reverse() };
  assert.equal(restoreAdaptiveGuide(reordered, done).chapterId, chapterIds(reordered)[0]);
  assert.deepEqual(restoreAdaptiveGuide(reordered, done).completedTaskIds, [original.chapterId]);
  const edited = { ...experience, steps: [experience.steps[0], { ...experience.steps[1], instruction: 'Een nieuwe opdracht.' }] };
  assert.deepEqual(restoreAdaptiveGuide(edited, done).completedTaskIds, []);
});

test('malformed and future state safely fall back, without leaking another experience tasks', () => {
  for (const value of [null, [], 'broken', { version: 9, mode: 'immerse' }, { version: 1, mode: 'invalid', completedTaskIds: 'all' }]) {
    const state = restoreAdaptiveGuide(experience, value, NaN);
    assert.equal(state.mode, 'discover');
    assert.equal(state.chapterId, chapterIds(experience)[0]);
    assert.deepEqual(state.completedTaskIds, []);
  }
  const id = chapterIds(experience)[0];
  assert.deepEqual(restoreAdaptiveGuide(experience, { version: 1, completedTaskIds: [id, id, null, 'other:1'] }).completedTaskIds, [id]);
  assert.deepEqual(restoreAdaptiveGuide({ ...experience, id: 'other' }, { version: 1, completedTaskIds: [id] }).completedTaskIds, []);
});

test('identical instructions still have distinct identities, and non-current tasks cannot be toggled', () => {
  const repeated = { ...experience, steps: [experience.steps[0], experience.steps[0]] };
  assert.equal(new Set(chapterIds(repeated)).size, 2);
  const state = restoreAdaptiveGuide(experience, undefined);
  assert.equal(toggleGuideTask(state, chapterIds(experience)[1]), state);
});

test('food, movement, quiet execution and empty experiences keep their existing runner', () => {
  for (const kind of ['food', 'movement', 'restore', 'connect']) assert.equal(supportsAdaptiveGuide({ ...experience, kind }), false);
  assert.equal(supportsAdaptiveGuide({ ...experience, steps: [] }), false);
  assert.equal(supportsAdaptiveGuide(experience), true);
});
