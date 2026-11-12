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
