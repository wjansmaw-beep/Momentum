import test from 'node:test';
import assert from 'node:assert/strict';
import { experiences, byId } from '../src/product/experienceModel';
import { experiencePresentation, hasUsefulTimer } from '../src/ui/now-v2/experiencePresentation';
import { packingRows } from '../src/ui/now-v2/voorpretModel';
import { guideState } from '../src/ui/now-v2/guideModel';
import { applyReflection, defaultPersonalProfile, forgetReflection, hydratePersonalProfile } from '../src/profile/personalModel';

const outside = experiences.find((item) => item.kind === 'outside');
const workout = { ...outside, kind: 'movement', presenceMode: 'guided', routePlan: undefined, prepare: ['Een mat', 'Water'] };

test('cycling handoff is an outdoor guide, not an indoor workout', () => {
  const cycling = { ...workout, presenceMode: 'handoff' };
  assert.equal(experiencePresentation(cycling).freeGuide, true);
  assert.equal(experiencePresentation(cycling).outdoorContext, true);
  assert.notEqual(experiencePresentation(cycling).preparationLabel, 'Klaar voor je workout');
});

test('outside is consultable; indoor workouts do not receive travel context', () => {
  assert.equal(experiencePresentation(outside).freeGuide, true);
  assert.equal(experiencePresentation(workout).freeGuide, false);
  assert.equal(experiencePresentation(workout).outdoorContext, false);
  assert.equal(experiencePresentation(workout).startLabel, 'Ik ga beginnen');
});

test('only positive timed movement or food steps offer a timer', () => {
  for (const kind of ['outside', 'restore', 'connect', 'learn', 'culture'])
    assert.equal(hasUsefulTimer(kind, { seconds: 60 }), false);
  for (const kind of ['movement', 'food']) {
    assert.equal(hasUsefulTimer(kind, { seconds: 60 }), true);
    for (const seconds of [undefined, 0, -10, NaN, Infinity])
      assert.equal(hasUsefulTimer(kind, { seconds }), false);
  }
});

test('bad outdoor weather does not replace indoor workout preparation', () => {
  const weather = { temperature: 4, windSpeed: 50, weatherCode: 61, visibilityMeters: 1000, observedAt: '', sunrise: '', sunset: '' };
  assert.deepEqual(packingRows(workout, weather).map((row) => row.title), workout.prepare);
  assert.deepEqual(packingRows(workout, undefined).map((row) => row.title), workout.prepare);
});

test('guide never derives an arrival clock from browsing through timed steps', () => {
  const now = new Date('2026-09-25T10:00:00Z');
  const sun = { sunrise: now, sunset: now, source: 'approx' };
  for (const experience of [outside, workout])
    for (let index = 0; index < experience.steps.length; index++)
      assert.equal(guideState(now, sun, undefined, experience, null, index, 'guide').rows.some((row) => row.icon === 'clock'), false);
});

test('note-only saving records no vote and does not change affinity', () => {
  const original = defaultPersonalProfile();
  const saved = applyReflection(original, byId('pantry-dinner'), { aspects: [], note: 'Samen gekookt.' });
  assert.deepEqual(saved.kindAffinity, original.kindAffinity);
  assert.deepEqual(saved.learningEvents, original.learningEvents);
  assert.deepEqual(saved.recentExperienceIds, original.recentExperienceIds);
  assert.equal(saved.reflectionMemories[0].outcome, undefined);
  assert.equal(saved.reflectionMemories[0].note, 'Samen gekookt.');
  const restored = hydratePersonalProfile(JSON.parse(JSON.stringify(saved)));
  assert.equal(restored.reflectionMemories[0].outcome, undefined);
  assert.deepEqual(forgetReflection(restored, restored.reflectionMemories[0].id).kindAffinity, original.kindAffinity);
});

test('explicit votes still learn; an explicit neutral vote stays distinguishable', () => {
  const original = defaultPersonalProfile();
  const experience = byId('pantry-dinner');
  const positive = applyReflection(original, experience, { outcome: 'worth-it', aspects: [] });
  assert.ok(positive.kindAffinity.food > original.kindAffinity.food);
  const neutral = applyReflection(original, experience, { outcome: 'neutral', aspects: [] });
  assert.equal(neutral.reflectionMemories[0].outcome, 'neutral');
  assert.deepEqual(neutral.learningEvents, original.learningEvents);
});
