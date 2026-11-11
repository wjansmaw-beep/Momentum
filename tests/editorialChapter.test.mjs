import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { referenceExperiences } from '../src/product/referenceExperiences.ts';
import { chapterIds, restoreAdaptiveGuide } from '../src/guidance/adaptiveGuide.ts';
import { renderableBlocks } from '../src/guidance/experienceRenderer.ts';
import { parseSaved, serializeSaved } from '../src/product/savedExperiences.ts';

test('M3 augments one existing chapter without invalidating the unchanged task', () => {
 const experience = referenceExperiences[0], step = experience.steps[0];
 assert.equal(step.editorial.composition, 'editorial-place');
 assert.equal(step.editorial.introduction.title, 'Het leven achter de dijk');
 assert.equal(experience.steps.filter(s=>s.editorial.composition).length, 1);
 assert.equal(chapterIds(experience)[0], 'reference-moddergat-v1:wonen:v1');
 const state = restoreAdaptiveGuide(experience, {version:1,chapterId:chapterIds(experience)[0],mode:'immerse',completedTaskIds:[chapterIds(experience)[0]]});
 assert.equal(state.mode,'immerse'); assert.equal(state.completedTaskIds.length,1);
});
test('quiet preferences remain respected by the same renderer', () => {
 const step = referenceExperiences[0].steps[0];
 assert.deepEqual(renderableBlocks(step,false).map(b=>b.kind),['observation']);
 assert.ok(renderableBlocks(step,true).some(b=>b.kind==='evidence' && b.url.startsWith('https://www.museummoddergat.nl/')));
});
test('old snapshots are retained rather than upgraded in place', () => {
 const old = structuredClone(referenceExperiences[0]);
 delete old.steps[0].editorial.composition;
 delete old.steps[0].editorial.introduction;
 const saved = [{id:old.id,savedAt:'2026-11-08T12:00:00Z',experience:old}];
 const restored = parseSaved(serializeSaved(saved));
 assert.deepEqual(restored,saved);
 assert.equal(restored[0].experience.steps[0].editorial.composition,undefined);
});
test('museum image is bundled as original JPEG with attribution', () => {
 const bytes=fs.readFileSync(new URL('../assets/images/moddergat-fiskershuske-bouwe-brouwer-2007.jpg',import.meta.url));
 assert.equal(bytes.readUInt16BE(0),0xffd8); assert.ok(bytes.length>100000);
 const credit=fs.readFileSync(new URL('../assets/images/ATTRIBUTION.md',import.meta.url),'utf8');
 assert.match(credit,/Bouwe Brouwer/); assert.match(credit,/by-sa\/3.0/);
});
