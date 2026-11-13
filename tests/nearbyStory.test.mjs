import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nearbyStory } from '../src/guidance/nearbyStory.ts';
import { moddergatJourney } from '../src/product/moddergatJourney.ts';
import { restoreAdaptiveGuide } from '../src/guidance/adaptiveGuide.ts';
const now=1800000000000;
const at=(index,accuracy=10)=>({...moddergatJourney.steps[index].visitPlace,accuracy,timestamp:now});
test('near a verified place proposes its story without mutating session or experience',()=>{
 const before=JSON.stringify(moddergatJourney);
 const result=nearbyStory(moddergatJourney,0,at(3),now);
 assert.equal(result.kind,'proposal');assert.equal(result.index,3);assert.equal(result.expiresAt,now+30000);
 assert.equal(JSON.stringify(moddergatJourney),before);
});
test('current chapter is acknowledged rather than advanced',()=>assert.deepEqual(nearbyStory(moddergatJourney,3,at(3),now),{kind:'current'}));
test('close statue and monument are ambiguous at their midpoint',()=>{
 const a=at(1),b=at(2);
 const sample={...a,latitude:(a.latitude+b.latitude)/2,longitude:(a.longitude+b.longitude)/2};
 assert.equal(nearbyStory(moddergatJourney,0,sample,now).kind,'uncertain');
});
test('accurate statue position can distinguish its neighbouring monument',()=>{
 const result=nearbyStory(moddergatJourney,0,at(1,5),now);
 assert.equal(result.kind,'proposal');assert.equal(result.index,1);
});
test('poor unknown and invalid accuracy fail closed',()=>{
 for(const accuracy of [null,undefined,36,-1,NaN,Infinity]) assert.equal(nearbyStory(moddergatJourney,0,{...at(3),accuracy},now).kind,'uncertain');
});
test('stale future and invalid coordinates do not select a story',()=>{
 for(const patch of [{timestamp:now-30001},{timestamp:now+1},{timestamp:NaN},{latitude:91},{longitude:181},{latitude:NaN}])
 assert.equal(nearbyStory(moddergatJourney,0,{...at(3),...patch},now).kind,'uncertain');
});
test('distant position does not invent an arrival',()=>assert.equal(nearbyStory(moddergatJourney,0,{...at(3),latitude:52},now).kind,'far'));
test('unsupported experience and absent point provenance are not eligible',()=>{
 assert.equal(nearbyStory({...moddergatJourney,id:'legacy'},0,at(3),now).kind,'uncertain');
 const experience={...moddergatJourney,steps:moddergatJourney.steps.map(s=>({...s,visitPlace:{...s.visitPlace,coordinateSourceUrl:'javascript:bad'}}))};
 assert.equal(nearbyStory(experience,0,at(3),now).kind,'uncertain');
});
test('old sessions remain opt-out and only a versioned boolean opt-in survives restore',()=>{
 assert.equal(restoreAdaptiveGuide(moddergatJourney,undefined).locationStories,false);
 assert.equal(restoreAdaptiveGuide(moddergatJourney,{version:1,locationStories:'true'}).locationStories,false);
 assert.equal(restoreAdaptiveGuide(moddergatJourney,{version:2,locationStories:true}).locationStories,false);
 const saved=restoreAdaptiveGuide(moddergatJourney,{version:1,locationStories:true});
 assert.equal(restoreAdaptiveGuide(moddergatJourney,JSON.parse(JSON.stringify(saved))).locationStories,true);
});
