import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

// Execute the actual Memory storage effect bodies without importing native Expo
// modules. This tests storage ordering, not React rendering or iOS durability.
// AST extraction deliberately fails if the store wiring moves: update this
// harness with that change rather than silently testing a copied implementation.
const source = readFileSync(new URL('../src/app/store.tsx', import.meta.url), 'utf8');
const file = ts.createSourceFile('store.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const effects = [];
const hydrationDeclarations = [];
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(file) === 'useEffect') effects.push(node);
  if (ts.isVariableDeclaration(node) && ts.isArrayBindingPattern(node.name)
    && node.name.elements[0]?.getText(file) === 'memoriesHydrated') hydrationDeclarations.push(node);
  ts.forEachChild(node, visit);
}
visit(file);
const readEffects = effects.filter((effect) => effect.arguments[0].getText(file).includes('AsyncStorage.getItem(memoryKey)'));
const writeEffects = effects.filter((effect) => effect.arguments[0].getText(file).includes('AsyncStorage.setItem(memoryKey,'));
assert.equal(readEffects.length, 1, 'Expected one Memory read effect');
assert.equal(writeEffects.length, 1, 'Expected one Memory write effect');
const readStatement = readEffects[0].arguments[0].body.statements.find((statement) =>
  statement.getText(file).startsWith('AsyncStorage.getItem(memoryKey)'));
assert.ok(readStatement, 'Expected the Memory read promise chain in the mount effect');
const compile = (body, args) => new Function(...args, ts.transpile(body, { target: ts.ScriptTarget.ES2022 }));
const load = compile(readStatement.getText(file), ['AsyncStorage', 'memoryKey', 'setMemories', 'setMemoriesHydrated']);
const persist = compile(writeEffects[0].arguments[0].body.getText(file), ['AsyncStorage', 'memoryKey', 'memories', 'memoriesHydrated']);
const memoryKey = 'momentum.memories.v2';
const oldMemory = { id: 'old', title: 'Test', date: 'Vandaag', image: '', note: 'Fictieve herinnering', photos: ['test://photo'] };
const settle = () => new Promise((resolve) => setImmediate(resolve));

function harness(initial = JSON.stringify([oldMemory])) {
  let resolveRead;
  let rejectRead;
  let disk = initial;
  let memories = [];
  let hydrated = false;
  const writes = [];
  const pending = new Promise((resolve, reject) => { resolveRead = resolve; rejectRead = reject; });
  const storage = {
    getItem: (key) => { assert.equal(key, memoryKey); return pending; },
    setItem: async (key, value) => { assert.equal(key, memoryKey); writes.push(value); disk = value; },
  };
  return {
    start: () => load(storage, memoryKey, (value) => { memories = value; }, (value) => { hydrated = value; }),
    save: () => persist(storage, memoryKey, memories, hydrated),
    resolve: () => resolveRead(disk),
    reject: () => rejectRead(new Error('Fictieve leesfout')),
    edit: (value) => { memories = value; },
    get disk() { return disk; },
    get memories() { return memories; },
    get hydrated() { return hydrated; },
    writes,
  };
}

test('pending read: initial empty state cannot overwrite stored memories', async () => {
  const app = harness();
  app.start();
  app.save();
  assert.equal(app.writes.length, 0);
  app.resolve();
  await settle();
  assert.deepEqual(app.memories, [oldMemory]);
  app.save();
  assert.deepEqual(JSON.parse(app.disk), [oldMemory]);
});

test('read rejection: all writes remain blocked, including subsequent edits', async () => {
  const app = harness();
  app.start();
  app.reject();
  await settle();
  app.save();
  app.edit([{ ...oldMemory, id: 'new' }]);
  app.save();
  assert.equal(app.hydrated, false);
  assert.equal(app.writes.length, 0);
  assert.deepEqual(JSON.parse(app.disk), [oldMemory]);
});

for (const value of ['{broken', 'null', '{}', '"not an array"', '']) {
  test(`unreadable stored value ${JSON.stringify(value)} is preserved, never replaced with []`, async () => {
    const app = harness(value);
    app.start();
    app.resolve();
    await settle();
    app.save();
    assert.equal(app.hydrated, false);
    assert.equal(app.writes.length, 0);
    assert.equal(app.disk, value);
  });
}

for (const value of [null, '[]']) {
  test(`successful empty storage (${value}) permits a first saved memory`, async () => {
    const app = harness(value);
    app.start();
    app.resolve();
    await settle();
    assert.equal(app.hydrated, true);
    app.edit([oldMemory]);
    app.save();
    assert.deepEqual(JSON.parse(app.disk), [oldMemory]);
  });
}

test('successful read permits subsequent saves without altering old fields', async () => {
  const app = harness();
  app.start();
  app.resolve();
  await settle();
  const next = { ...oldMemory, id: 'new', note: 'Tweede test' };
  app.edit([next, ...app.memories]);
  app.save();
  assert.deepEqual(JSON.parse(app.disk), [next, oldMemory]);
});

test('write effect reruns when hydration succeeds as well as when memories change', () => {
  const dependencies = writeEffects[0].arguments[1];
  assert.ok(ts.isArrayLiteralExpression(dependencies));
  assert.deepEqual(new Set(dependencies.elements.map((item) => item.getText(file))), new Set(['memories', 'memoriesHydrated']));
});

test('the real store initializes Memory writes as blocked', () => {
  assert.equal(hydrationDeclarations.length, 1);
  assert.equal(hydrationDeclarations[0].initializer.getText(file), 'useState(false)');
});
