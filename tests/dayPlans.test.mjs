import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changePlans, parsePlans, serializePlans, createPlanStorage, dayPlansKey } from '../src/product/dayPlans.ts';
import { experiences } from '../src/product/experienceModel.ts';
import { toggleSaved } from '../src/product/savedExperiences.ts';
const now = '2026-11-11T10:00:00Z';
const create = () => changePlans([], { type: 'create', id: 'a' }, now);
const add = (p, e, id = e.id) => changePlans(p, { type: 'add', id: 'a', itemId: id, experience: e }, now);

test('multiple plans, ordering, naming and deletion survive restart', () => {
  let plans = add(add(create(), experiences[0]), experiences[1]);
  plans = changePlans(plans, { type: 'create', id: 'b' }, now);
  plans = changePlans(plans, { type: 'rename', id: 'a', title: '  Vrije dag  ' }, now);
  plans = changePlans(plans, { type: 'move', id: 'a', itemId: experiences[1].id, direction: -1 }, now);
  const restored = parsePlans(serializePlans(plans));
  assert.equal(restored[0].title, 'Vrije dag');
  assert.deepEqual(restored[0].items.map(i => i.experience.id), [experiences[1].id, experiences[0].id]);
  assert.equal('date' in restored[0], false);
  assert.equal(changePlans(restored, { type: 'delete', id: 'a' })[0].id, 'b');
});
test('boundary moves, duplicates and unknown items cannot corrupt order', () => {
  const plans = add(create(), experiences[0]);
  assert.deepEqual(add(plans, experiences[0], 'other'), plans);
  for (const itemId of [experiences[0].id, 'missing']) for (const direction of [-1, 1]) {
    assert.deepEqual(changePlans(plans, { type: 'move', id: 'a', itemId, direction }), plans);
  }
});
test('snapshots are independent of saved ideas and retain source expiry', () => {
  const experience = { ...experiences[0], liveEvidence: [{ sourceName: 'test', expiresAt: '2020-01-02' }] };
  const plans = add(create(), experience);
  const saved = toggleSaved([], experience);
  assert.deepEqual(toggleSaved(saved, experience), []);
  experience.liveEvidence[0].expiresAt = '2099-01-01';
  assert.equal(plans[0].items[0].experience.liveEvidence[0].expiresAt, '2020-01-02');
  assert.equal(changePlans(plans, { type: 'remove', id: 'a', itemId: experience.id })[0].items.length, 0);
  assert.equal(saved.length, 1);
  assert.equal(plans[0].items.length, 1);
});
test('malformed and future storage fail closed', () => {
  assert.deepEqual(parsePlans(null), []);
  const valid = add(create(), experiences[0]);
  for (const raw of ['', '{}', 'null', '{"version":2,"plans":[]}', serializePlans([...valid, ...valid]),
    serializePlans([{ ...valid[0], items: [...valid[0].items, ...valid[0].items] }]),
    serializePlans([{ ...valid[0], title: '' }])]) assert.throws(() => parsePlans(raw));
});
test('storage refuses pre-hydration writes and preserves invalid data', async () => {
  let writes = 0;
  const c = createPlanStorage({ getItem: async () => 'invalid', setItem: async () => { writes++; } }, () => {});
  c.dispatch({ type: 'create', id: 'a' });
  await c.load(); c.dispatch({ type: 'create', id: 'a' }); await c.retry();
  assert.equal(writes, 0); assert.equal(c.getSnapshot().writable, false); assert.ok(c.getSnapshot().error);
});
test('offline local edits serialize rapid writes and restore exact final state', async () => {
  let raw = null;
  const storage = { getItem: async key => { assert.equal(key, dayPlansKey); return raw; }, setItem: async (key, value) => { assert.equal(key, dayPlansKey); raw = value; } };
  const c = createPlanStorage(storage, () => {}); await c.load();
  c.dispatch({ type: 'create', id: 'a' });
  c.dispatch({ type: 'add', id: 'a', itemId: 'one', experience: experiences[0] });
  c.dispatch({ type: 'rename', id: 'a', title: 'Laatste naam' });
  await c.settled();
  const restored = createPlanStorage(storage, () => {}); await restored.load();
  assert.deepEqual(restored.getSnapshot().plans, c.getSnapshot().plans);
});
test('failed writes are visible, retryable and cannot hide a newer failure', async () => {
  let fail = true, raw = null;
  const c = createPlanStorage({ getItem: async () => raw, setItem: async (_, value) => { if (fail) throw Error('disk'); raw = value; } }, () => {});
  await c.load(); c.dispatch({ type: 'create', id: 'a' });
  c.dispatch({ type: 'rename', id: 'a', title: 'Bewaar mij' }); await c.settled();
  assert.ok(c.getSnapshot().error); assert.equal(c.getSnapshot().plans[0].title, 'Bewaar mij');
  fail = false; await c.retry(); assert.equal(c.getSnapshot().error, '');
  assert.equal(parsePlans(raw)[0].title, 'Bewaar mij');
});
