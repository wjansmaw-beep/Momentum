import { test } from 'node:test';
import assert from 'node:assert/strict';
import { referenceExperiences } from '../src/product/referenceExperiences.ts';
import { currentPlace, currentDestination, presentPlaceInformation, safePlaceSource } from '../src/guidance/placeInformation.ts';
const experience = referenceExperiences[0];
const now = Date.parse('2026-11-12T12:00:00Z');
test('chapter destination overrides experience without altering legacy snapshots', () => {
 const step = {...experience.steps[0], visitPlace:{...experience.visitPlace,name:'Another verified place',latitude:53.4,longitude:6.1}};
 assert.equal(currentDestination(experience,step,now).label,'Another verified place');
 assert.equal(currentPlace(experience,experience.steps[0]).name,experience.visitPlace.name);
 assert.equal(experience.steps[0].visitPlace,undefined);
});
test('invalid chapter coordinate does not silently navigate to museum fallback', () => {
 const step={...experience.steps[0],visitPlace:{...experience.visitPlace,latitude:NaN}};
 assert.equal(currentDestination(experience,step,now),null);
});
test('expired published hours remain labelled outdated rather than open now', () => {
 const result=presentPlaceInformation(experience.visitPlace.openingHours,now);
 assert.equal(result.outdated,true); assert.match(result.text,/31 oktober/);
 assert.equal('isOpen' in result,false);
});
test('missing and invalid practical evidence does not imply free or unrestricted', () => {
 for(const value of [undefined,{text:'Free',sourceUrl:'javascript:alert(1)',checkedAt:'2026-11-12'},{text:'Free',sourceUrl:'https://example.com',checkedAt:'2030-01-01'}]){
 const result=presentPlaceInformation(value,now); assert.match(result.text,/Nog niet gecontroleerd/);assert.equal(result.outdated,true);
 }
 assert.equal(safePlaceSource('https://user:pass@example.com'),undefined);
});
test('published prices carry provenance and do not acquire an invented validity period', () => {
 const result=presentPlaceInformation(experience.visitPlace.admission,now);
 assert.match(result.text,/6,50/);assert.match(result.sourceUrl,/museummoddergat/);assert.equal(result.checkedAt,'2026-11-12');
 assert.equal(experience.visitPlace.admission.validUntil,undefined);
});
