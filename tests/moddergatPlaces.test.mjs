import {test} from 'node:test';
import assert from 'node:assert/strict';
import {moddergatPlaces} from '../src/product/moddergatPlaces.ts';
import {currentDestination} from '../src/guidance/placeInformation.ts';
import {referenceExperiences} from '../src/product/referenceExperiences.ts';

test('five independent map anchors resolve without reusing the museum',()=>{
 const experience=referenceExperiences[0];
 const points=Object.values(moddergatPlaces).map(place=>currentDestination(experience,{...experience.steps[0],visitPlace:place}));
 assert.equal(points.length,5);assert.ok(points.every(Boolean));
 assert.equal(new Set(points.map(p=>p.latitude+','+p.longitude)).size,5);
 assert.equal(referenceExperiences[0].steps.length,3);
});
test('nature access preserves seasonal and dog restrictions without claiming a walk',()=>{
 assert.match(moddergatPlaces.nature.openingHours.text,/15 juli tot 15 maart/);
 assert.match(moddergatPlaces.nature.openingHours.text,/honden niet toegestaan/);
 assert.match(moddergatPlaces.nature.note,/geen route het wad op/);
 assert.match(moddergatPlaces.nature.admission.text,/niet bevestigd/);
});
test('factory free entry is conditional on the published public opening',()=>{
 assert.match(moddergatPlaces.factory.openingHours.text,/kunnen dit veranderen/);
 assert.match(moddergatPlaces.factory.admission.text,/publieke zondagopenstelling/);
 assert.equal(moddergatPlaces.factory.address,'It Grenaatfabryk 2, 9142 VH Moddergat');
});
