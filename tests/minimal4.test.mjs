import assert from 'node:assert/strict';
import { test } from 'node:test';
import { experiences } from '../src/product/experienceModel.ts';
import { referenceExperiences } from '../src/product/referenceExperiences.ts';
import { refinedRecommendation } from '../src/product/momentRefinement.ts';
import { parseSaved, serializeSaved, toggleSaved } from '../src/product/savedExperiences.ts';

const context = { dayPart: 'morning', profile: 'balanced', company: 'solo', availableMinutes: 120, hasKettlebell: false };
const learning = { kindAffinity: {}, blockedExperienceIds: [], favoriteExperienceIds: [], recentExperienceIds: [], directionTerms: [], durationBiasMinutes: 0, intensityBalance: 0, maxTravelMinutes: 40, travelBiasMinutes: 0 };
test('nature refinement reranks the real pool and leaves profile/context untouched', () => {
 const before = JSON.stringify({context,learning,experiences});
 const ordinary = refinedRecommendation(context, experiences, learning, 'open');
 const nature = refinedRecommendation(context, experiences, learning, 'nature');
 assert.ok(nature.selected);
 assert.notEqual(nature.selected.experience.id, ordinary.selected.experience.id);
 assert.ok(nature.selected.experience.kind === 'outside' || nature.selected.experience.keywords.includes('natuur'));
 assert.equal(JSON.stringify({context,learning,experiences}), before);
});
test('family selection respects suitability and unavailable refinements abstain', () => {
 const result = refinedRecommendation(context, experiences, learning, 'family');
 assert.ok(result.selected.experience.company.includes('family'));
 assert.equal(refinedRecommendation(context, experiences.filter(e=>e.kind === 'food'), learning, 'nature').selected, undefined);
});
test('closer uses the route limit, without rewriting stored travel preferences', () => {
 const base = experiences.find(e=>e.kind === 'outside');
 const far = {...base, id:'far', routePlan:{outboundMinutes:25}};
 assert.ok(refinedRecommendation(context,[far],learning,'open').selected);
 assert.equal(refinedRecommendation(context,[far],learning,'closer').selected,undefined);
 assert.equal(learning.maxTravelMinutes,40);
});
test('time and blocking constraints remain enforced during refinement', () => {
 assert.equal(refinedRecommendation({...context,availableMinutes:1},experiences,learning,'family').selected,undefined);
 const blocked = {...learning,blockedExperienceIds:experiences.map(e=>e.id)};
 assert.equal(refinedRecommendation(context,experiences,blocked,'nature').selected,undefined);
});
test('saved experiences survive serialization with exact snapshot and original source expiry', () => {
 const e = {...referenceExperiences[0],liveEvidence:[{label:'Old',sourceName:'Source',sourceUrl:'https://example.org',observedAt:'2020-01-01',retrievedAt:'2020-01-01',expiresAt:'2020-01-02',certainty:'observation'}]};
 const saved = toggleSaved([],e,'2026-11-10T10:00:00Z');
 assert.deepEqual(parseSaved(serializeSaved(saved)),saved);
 assert.equal(parseSaved(serializeSaved(saved))[0].experience.liveEvidence[0].expiresAt,'2020-01-02');
 assert.equal(saved[0].savedAt,'2026-11-10T10:00:00Z');
 assert.equal('date' in saved[0],false);
});
test('unsaving one idea preserves other snapshots and original inputs', () => {
 const first=toggleSaved([],experiences[0]);
 const second=toggleSaved(first,experiences[1]);
 const after=toggleSaved(second,experiences[0]);
 assert.equal(after.length,1); assert.equal(after[0].id,experiences[1].id);
 assert.equal(first.length,1); assert.equal(second.length,2);
});
test('malformed or future storage is rejected, never silently converted to empty', () => {
 assert.deepEqual(parseSaved(null),[]);
 for(const raw of ['broken','{}','{"version":2,"items":[]}',serializeSaved([{id:'broken',savedAt:'today',experience:{}}])]) assert.throws(()=>parseSaved(raw));
 const items=toggleSaved([],experiences[0]); assert.throws(()=>parseSaved(serializeSaved([...items,...items])));
});
test('all existing catalogue and reference snapshots remain readable',()=>{
 for (const e of [...experiences,...referenceExperiences]) assert.equal(parseSaved(serializeSaved(toggleSaved([],e)))[0].id,e.id);
});
