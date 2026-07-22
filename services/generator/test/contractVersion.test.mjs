import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CONTRACT_VERSION } from '../contract.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// The server (.mjs) and client (.ts) cannot share one module, so both keep
// their own contract-version constant. This test pins parity between them.
test('server contract version is the documented value', () => {
  assert.equal(CONTRACT_VERSION, 'experience-draft-v1');
});

test('client constant matches the server contract version', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const clientSource = readFileSync(join(here, '../../../src/product/generativeExperience.ts'), 'utf8');
  assert.match(clientSource, /GENERATOR_CONTRACT_VERSION = 'experience-draft-v1'/);
});
