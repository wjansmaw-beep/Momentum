import assert from 'node:assert/strict';
import { test } from 'node:test';
import { providerNames, selectProvider } from '../providers/provider.mjs';

test('missing provider env selects the fixture provider', () => {
  const provider = selectProvider({}, []);
  assert.equal(provider.name, 'momentum-fixture');
  assert.equal(provider.kind, 'fixture');
});

test('unknown provider env falls back to fixture, never guesses from keys', () => {
  const provider = selectProvider({ MOMENTUM_GENERATOR_PROVIDER: 'bogus', OPENAI_API_KEY: 'present' }, []);
  assert.equal(provider.name, 'momentum-fixture');
});

test('a present API key alone never selects a model provider', () => {
  const provider = selectProvider({ OPENAI_API_KEY: 'present' }, []);
  assert.equal(provider.name, 'momentum-fixture');
});

test('explicit provider values select their adapter', () => {
  assert.equal(selectProvider({ MOMENTUM_GENERATOR_PROVIDER: 'openai' }, []).name, 'openai-responses');
  assert.equal(selectProvider({ MOMENTUM_GENERATOR_PROVIDER: 'anthropic' }, []).name, 'anthropic-messages');
  assert.equal(selectProvider({ MOMENTUM_GENERATOR_PROVIDER: 'moonshot' }, []).name, 'moonshot-kimi');
});

test('--fixture CLI flag stays a shortcut to the fixture provider', () => {
  const provider = selectProvider({ MOMENTUM_GENERATOR_PROVIDER: 'openai' }, ['node', 'server.mjs', '--fixture']);
  assert.equal(provider.name, 'momentum-fixture');
});

test('model providers report configuration only from their own key', () => {
  const openai = selectProvider({ MOMENTUM_GENERATOR_PROVIDER: 'openai' }, []);
  assert.equal(openai.isConfigured({}), false);
  assert.equal(openai.isConfigured({ OPENAI_API_KEY: 'k' }), true);
});

test('registry exposes exactly the approved provider names', () => {
  assert.deepEqual([...providerNames].sort(), ['anthropic', 'fixture', 'moonshot', 'openai']);
});
