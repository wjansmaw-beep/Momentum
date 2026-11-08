import test from 'node:test';
import assert from 'node:assert/strict';
import { guideDestination } from '../src/guidance/guideDestination.ts';

test('orientation only accepts finite geographical coordinates owned by a route', () => {
  assert.equal(guideDestination(), null);
  assert.equal(guideDestination({ destinationName: 'Place without coordinates' }), null);
  for (const [latitude, longitude] of [[NaN, 0], [0, Infinity], [91, 0], [0, -181]]) {
    assert.equal(guideDestination({ destination: { latitude, longitude } }), null);
  }
  assert.deepEqual(guideDestination({ destinationName: 'Equator', destination: { latitude: 0, longitude: 0 } }),
    { label: 'Equator', latitude: 0, longitude: 0 });
});

test('expired or malformed live opportunity cannot become a map destination', () => {
  const now = Date.parse('2026-11-08T12:00:00Z');
  const plan = { destinationName: 'Point', destination: { latitude: 53, longitude: 6 } };
  for (const expiresAt of ['invalid', '2026-11-08T11:00:00Z', '2026-11-08T12:00:00Z']) {
    assert.equal(guideDestination({ ...plan, expiresAt }, now), null);
  }
  assert.ok(guideDestination({ ...plan, expiresAt: '2026-11-08T13:00:00Z' }, now));
});
