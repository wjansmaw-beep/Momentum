import test from 'node:test';
import assert from 'node:assert/strict';
import { referenceExperiences } from '../src/product/referenceExperiences.ts';
import { chapterIds, restoreAdaptiveGuide } from '../src/guidance/adaptiveGuide.ts';
import { renderableBlocks } from '../src/guidance/experienceRenderer.ts';
import { guideDestination } from '../src/guidance/guideDestination.ts';

test('reference visit opens in orientation without invented route budgets', () => {
  const museum = referenceExperiences[0];
  assert.equal(restoreAdaptiveGuide(museum, undefined).mode, 'navigate');
  assert.equal(museum.routePlan, undefined);
  assert.match(museum.visitPlace.address, /Fiskerspaad/);
  const destination = guideDestination({ destination: museum.visitPlace, destinationName: museum.visitPlace.name });
  assert.ok(destination && destination.latitude > 53 && destination.longitude > 6);
  assert.equal(referenceExperiences[1].visitPlace, undefined);
});

test('different reference packs share a finite renderer and per-chapter evidence', () => {
  assert.deepEqual(referenceExperiences.map(e => e.steps.length), [3, 2]);
  for (const experience of referenceExperiences) {
    const ids = chapterIds(experience);
    assert.equal(new Set(ids).size, experience.steps.length);
    for (const step of experience.steps) {
      const blocks = renderableBlocks(step, true);
      assert.deepEqual(blocks.map(b => b.kind), ['story', 'depth', 'evidence', 'observation']);
      assert.match(blocks.find(b => b.kind === 'evidence').url, /^https:\/\//);
      assert.ok(step.instruction.length && step.editorial.observation.length);
      assert.deepEqual(renderableBlocks(step, false).map(b => b.kind), step.editorial?.composition === 'editorial-place' ? ['story', 'evidence', 'observation'] : ['observation']);
    }
  }
});

test('editorial reorder preserves progress, revised content clears old completion', () => {
  const original = referenceExperiences[0];
  const ids = chapterIds(original);
  const state = { version: 1, chapterId: ids[1], mode: 'immerse', completedTaskIds: [ids[1]] };
  const reordered = { ...original, steps: [...original.steps].reverse() };
  assert.equal(restoreAdaptiveGuide(reordered, state).chapterId, ids[1]);
  const revised = { ...original, steps: original.steps.map(s => ({ ...s, editorial: { ...s.editorial, version: 2 } })) };
  assert.deepEqual(restoreAdaptiveGuide(revised, state).completedTaskIds, []);
});

test('legacy steps render without editorial fields and unsafe source URLs are omitted', () => {
  assert.deepEqual(renderableBlocks({ title: 'Old', instruction: 'Look' }, true), [{ kind: 'observation', text: 'Look' }]);
  const step = { title: 'Old', instruction: 'Look', insight: { title: 'Story', body: 'Text', sourceLabel: 'Source', sourceKind: 'editorial', sourceUrl: 'javascript:alert(1)' } };
  assert.equal(renderableBlocks(step, true).find(b => b.kind === 'evidence').url, undefined);
});
