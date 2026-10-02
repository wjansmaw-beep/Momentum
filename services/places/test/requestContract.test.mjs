import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRegionRequest, buildPlacesRequest } from '../requestContract.mjs';

test('accepts only a coarse region, including valid boundary and negative coordinates', () => {
  for (const region of [{ latitude: 53.32, longitude: 6 }, { latitude: -90, longitude: 180 }, { latitude: 0, longitude: 0 }]) assert.deepEqual(parseRegionRequest(region), region);
});
test('rejects invalid roots, missing values and numeric strings', () => {
  for (const value of [null, [], 'region', {}, { latitude: 1 }, { latitude: '53.32', longitude: 6 }]) assert.throws(() => parseRegionRequest(value));
});
test('rejects precise coordinates rather than quietly accepting them', () => {
  assert.throws(() => parseRegionRequest({ latitude: 53.321, longitude: 6 }), /region-too-precise/);
});
test('rejects out-of-bounds and nonfinite values', () => {
  for (const latitude of [NaN, Infinity, -Infinity, 91, -91]) assert.throws(() => parseRegionRequest({ latitude, longitude: 6 }));
  assert.throws(() => parseRegionRequest({ latitude: 1, longitude: 181 }));
});
test('rejects extra profile, credential, URL and caller-controlled cost fields', () => {
  for (const field of ['profile', 'interests', 'name', 'calendar', 'health', 'reflection', 'apiKey', 'url', 'limit', 'radius', 'categories']) {
    assert.throws(() => parseRegionRequest({ latitude: 53.32, longitude: 6, [field]: 'untrusted' }), /unexpected-fields/);
  }
});
test('request stays at the fixed host with bounded categories, radius and results', () => {
  const request = buildPlacesRequest({ latitude: 53.32, longitude: 6 }, 'fictional-test-key');
  assert.equal(request.url, 'https://api.geoapify.com/v2/places');
  assert.equal(request.init.redirect, 'error');
  assert.deepEqual(JSON.parse(request.init.body), { categories: ['leisure.park', 'tourism.attraction.viewpoint'], filter: { type: 'circle', lon: 6, lat: 53.32, radius: 4500 }, limit: 20, lang: 'nl' });
});
test('key is a server header, never part of URL or request body', () => {
  const request = buildPlacesRequest({ latitude: 53.32, longitude: 6 }, 'fictional-test-key');
  assert.equal(request.init.headers['x-api-key'], 'fictional-test-key');
  assert.ok(!request.url.includes('fictional-test-key'));
  assert.ok(!request.init.body.includes('fictional-test-key'));
});
test('missing or header-injecting keys fail before network', () => {
  for (const key of [undefined, '', ' ', 'bad\r\nheader']) assert.throws(() => buildPlacesRequest({ latitude: 0, longitude: 0 }, key), /source-not-configured/);
});
