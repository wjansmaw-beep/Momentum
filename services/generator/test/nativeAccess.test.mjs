// Contract tests for ADR-063: explicit native-client access.
// Real HTTP against an in-process server on an ephemeral port; the fixture
// provider serves drafts, so no API key or spending is ever involved.

import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { createGeneratorServer, isRequestAllowed, NATIVE_CLIENT_HEADER, NATIVE_CLIENT_VALUE, parseAllowedOrigins } from '../server.mjs';
import { rawRequest } from './helpers.mjs';

const startServer = async (env = {}) => {
  const instance = createGeneratorServer({
    MOMENTUM_GENERATOR_PORT: '0',
    MOMENTUM_GENERATOR_PROVIDER: 'fixture',
    ...env,
  }, ['node', 'server.mjs']);
  instance.server.listen(instance.port, instance.host);
  await once(instance.server, 'listening');
  const { port } = instance.server.address();
  return { ...instance, baseUrl: `http://127.0.0.1:${port}` };
};

const postDrafts = (baseUrl, headers = {}) => fetch(`${baseUrl}/v1/experience-drafts`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...headers },
  body: JSON.stringify(rawRequest()),
});

test('native path: no Origin plus the fixed client header is admitted', async (t) => {
  const { server, baseUrl } = await startServer();
  t.after(() => server.close());
  const response = await postDrafts(baseUrl, { 'X-Momentum-Client': 'native' });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.contractVersion, 'experience-draft-v1');
  assert.equal(payload.mode, 'fixture');
  assert.ok(Array.isArray(payload.drafts) && payload.drafts.length > 0);
});

test('no Origin and no client header stays rejected with 403', async (t) => {
  const { server, baseUrl } = await startServer();
  t.after(() => server.close());
  const response = await postDrafts(baseUrl);
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, 'origin_not_allowed');
});

test('no Origin with a wrong client-header value stays rejected with 403', async (t) => {
  const { server, baseUrl } = await startServer();
  t.after(() => server.close());
  // Note: surrounding whitespace is not a distinct value — HTTP strips
  // optional whitespace around header values before the server ever sees them.
  for (const value of ['web', 'momentum', 'NATIVE', 'native-native']) {
    const response = await postDrafts(baseUrl, { 'X-Momentum-Client': value });
    assert.equal(response.status, 403, `value ${JSON.stringify(value)} must be rejected`);
    assert.equal((await response.json()).error, 'origin_not_allowed');
  }
});

test('browser path unchanged: an allowlisted Origin without the client header is admitted', async (t) => {
  const { server, baseUrl } = await startServer();
  t.after(() => server.close());
  const response = await postDrafts(baseUrl, { Origin: 'http://localhost:8081' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:8081');
});

test('browser path unchanged: a non-allowlisted Origin is rejected even with the client header', async (t) => {
  const { server, baseUrl } = await startServer();
  t.after(() => server.close());
  const response = await postDrafts(baseUrl, { Origin: 'http://evil.example', 'X-Momentum-Client': 'native' });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, 'origin_not_allowed');
});

test('health stays reachable without Origin or client header', async (t) => {
  const { server, baseUrl } = await startServer();
  t.after(() => server.close());
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).mode, 'fixture');
});

test('access decision: origin governs when present, header only when absent', () => {
  const origins = parseAllowedOrigins({});
  assert.equal(isRequestAllowed('http://localhost:8081', undefined, origins), true);
  assert.equal(isRequestAllowed('http://evil.example', NATIVE_CLIENT_VALUE, origins), false);
  assert.equal(isRequestAllowed(undefined, NATIVE_CLIENT_VALUE, origins), true);
  assert.equal(isRequestAllowed(undefined, 'wrong', origins), false);
  assert.equal(isRequestAllowed(undefined, undefined, origins), false);
});

test('LAN binding config: host env is respected and loopback stays the default', () => {
  assert.equal(createGeneratorServer({}, []).host, '127.0.0.1');
  assert.equal(createGeneratorServer({ MOMENTUM_GENERATOR_HOST: '0.0.0.0' }, []).host, '0.0.0.0');
});

test('LAN-bound instance serves the native path on the LAN interface', async (t) => {
  const { server, baseUrl, host } = await startServer({ MOMENTUM_GENERATOR_HOST: '0.0.0.0' });
  t.after(() => server.close());
  assert.equal(host, '0.0.0.0');
  const response = await postDrafts(baseUrl, { 'X-Momentum-Client': 'native' });
  assert.equal(response.status, 200);
});
