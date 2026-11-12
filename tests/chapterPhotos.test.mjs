import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveChapterPhoto} from '../src/product/chapterPhotos.ts';
import {referenceExperiences} from '../src/product/referenceExperiences.ts';
const legacy=referenceExperiences[0].steps[0];
test('old museum snapshots retain their original place photograph',()=>{
 assert.equal(resolveChapterPhoto('reference-moddergat-v1',legacy).key,'moddergat-museum-2007');
});
test('an introduction at another location never inherits the museum photograph',()=>{
 assert.equal(resolveChapterPhoto('another-experience',legacy),undefined);
});
test('explicit unknown keys fail closed even on legacy chapters',()=>{
 for(const key of ['missing','__proto__','constructor','https://example.com/image.jpg']) {
  assert.equal(resolveChapterPhoto('reference-moddergat-v1',{...legacy,editorial:{...legacy.editorial,photoKey:key}}),undefined);
 }
});
test('a curated factory key carries its own caption, author and license',()=>{
 const photo=resolveChapterPhoto('journey',{...legacy,editorial:{...legacy.editorial,photoKey:'moddergat-factory-2023'}});
 assert.match(photo.caption,/Grenaatfabrykje/);assert.match(photo.credit.label,/Monkelbaan/);
 assert.equal(photo.credit.license,'https://creativecommons.org/licenses/by-sa/4.0/');
 assert.notEqual(photo.key,'moddergat-museum-2007');
});
