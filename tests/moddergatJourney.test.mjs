import {test} from 'node:test';
import assert from 'node:assert/strict';
import {moddergatJourney} from '../src/product/moddergatJourney.ts';
import {referenceExperiences} from '../src/product/referenceExperiences.ts';
import {chapterIds,restoreAdaptiveGuide} from '../src/guidance/adaptiveGuide.ts';
import {currentDestination} from '../src/guidance/placeInformation.ts';
import {renderableBlocks} from '../src/guidance/experienceRenderer.ts';
test('the five-place narrative has a separate identity and leaves old saved content intact',()=>{
 assert.notEqual(moddergatJourney.id,referenceExperiences[0].id);
 assert.equal(referenceExperiences[0].steps.length,3);
 assert.equal(moddergatJourney.steps.length,5);
 assert.equal(new Set(chapterIds(moddergatJourney)).size,5);
});
test('each place has an independent destination, story, observation and source',()=>{
 for(const step of moddergatJourney.steps){
  assert.ok(currentDestination(moddergatJourney,step));
  const blocks=renderableBlocks(step,true);
  assert.ok(blocks.find(b=>b.kind==='story')?.text);
  assert.ok(blocks.find(b=>b.kind==='observation')?.text);
  assert.match(blocks.find(b=>b.kind==='evidence').url,/^https:/);
 }
});
test('resuming the new journey preserves chapter and mode without marking visits complete',()=>{
 const ids=chapterIds(moddergatJourney);
 const restored=restoreAdaptiveGuide(moddergatJourney,{version:1,chapterId:ids[3],mode:'immerse',completedTaskIds:[]});
 assert.equal(restored.chapterId,ids[3]);assert.equal(restored.mode,'immerse');
 assert.deepEqual(restored.completedTaskIds,[]);
 assert.equal(moddergatJourney.routePlan,undefined);
 assert.match(moddergatJourney.prepare[0],/zonder wandel/);
});

test('each journey chapter has distinct reviewed photography with credit', async()=>{
 const {resolveChapterPhoto}=await import('../src/product/chapterPhotos.ts');
 const photos=moddergatJourney.steps.map(step=>resolveChapterPhoto(moddergatJourney.id,step));
 assert.ok(photos.every(photo=>photo?.alt && photo?.credit.source && photo?.credit.license));
 assert.equal(new Set(photos.map(photo=>photo.key)).size,5);
});
test('saving the five-place journey preserves media keys and chapter destinations', async()=>{
 const {parseSaved,serializeSaved}=await import('../src/product/savedExperiences.ts');
 const saved=[{id:moddergatJourney.id,savedAt:'2026-11-12T12:00:00Z',experience:moddergatJourney}];
 assert.deepEqual(parseSaved(serializeSaved(saved)),saved);
});

test('walking directions identify their origin and do not invent routing for old snapshots',()=>{
 assert.equal(moddergatJourney.steps[0].visitPlace.approach,undefined);
 for(const step of moddergatJourney.steps.slice(1)) {
  const approach=step.visitPlace.approach;
  assert.ok(approach.from && approach.instructions.length && approach.note);
  assert.ok(approach.sources.every(source=>new URL(source.url).protocol==='https:'));
 }
 assert.ok(referenceExperiences[0].steps.every(step=>!step.visitPlace?.approach));
 assert.equal(moddergatJourney.routePlan,undefined);
});
