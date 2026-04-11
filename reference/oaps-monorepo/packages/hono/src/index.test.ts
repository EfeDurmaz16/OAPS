import test from 'node:test';
import assert from 'node:assert/strict';

import { Hono } from './index.js';

test('Hono routes GET to the matching handler', async () => {
  const app = new Hono();
  app.get('/health', (c) => c.json({ ok: true }));

  const response = await app.request('/health');
  assert.equal(response.status, 200);
  assert.deepStrictEqual(await response.json(), { ok: true });
});

test('Hono routes POST to the matching handler', async () => {
  const app = new Hono();
  app.post('/interactions', (c) => c.json({ created: true }, 201));

  const response = await app.request('/interactions', {
    method: 'POST',
    body: JSON.stringify({ hello: 'world' }),
    headers: { 'content-type': 'application/json' },
  });
  assert.equal(response.status, 201);
  const body = (await response.json()) as { created: boolean };
  assert.equal(body.created, true);
});

test('Hono returns 404 with canonical error shape for unknown routes', async () => {
  const app = new Hono();
  app.get('/health', (c) => c.json({ ok: true }));

  const response = await app.request('/missing');
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('content-type'), 'application/json');
  const body = (await response.json()) as { code: string; category: string; retryable: boolean };
  assert.equal(body.code, 'NOT_FOUND');
  assert.equal(body.category, 'discovery');
  assert.equal(body.retryable, false);
});

test('Hono extracts path parameters', async () => {
  const app = new Hono();
  app.get('/interactions/:id', (c) => c.json({ id: c.req.param('id') }));

  const response = await app.request('/interactions/int_abc_123');
  assert.equal(response.status, 200);
  const body = (await response.json()) as { id: string };
  assert.equal(body.id, 'int_abc_123');
});

test('Hono extracts multiple path parameters', async () => {
  const app = new Hono();
  app.get('/interactions/:iid/messages/:mid', (c) =>
    c.json({ iid: c.req.param('iid'), mid: c.req.param('mid') }),
  );

  const response = await app.request('/interactions/int_1/messages/msg_2');
  assert.equal(response.status, 200);
  const body = (await response.json()) as { iid: string; mid: string };
  assert.equal(body.iid, 'int_1');
  assert.equal(body.mid, 'msg_2');
});

test('Hono distinguishes methods on the same path', async () => {
  const app = new Hono();
  app.get('/res', (c) => c.json({ method: 'GET' }));
  app.post('/res', (c) => c.json({ method: 'POST' }));

  const getRes = await app.request('/res');
  const postRes = await app.request('/res', { method: 'POST' });

  const getBody = (await getRes.json()) as { method: string };
  const postBody = (await postRes.json()) as { method: string };
  assert.equal(getBody.method, 'GET');
  assert.equal(postBody.method, 'POST');
});

test('Hono request can receive JSON body', async () => {
  const app = new Hono();
  app.post('/echo', async (c) => {
    const payload = await c.req.json<{ message: string }>();
    return c.json({ echoed: payload.message });
  });

  const response = await app.request('/echo', {
    method: 'POST',
    body: JSON.stringify({ message: 'hi there' }),
    headers: { 'content-type': 'application/json' },
  });
  assert.equal(response.status, 200);
  const body = (await response.json()) as { echoed: string };
  assert.equal(body.echoed, 'hi there');
});

test('Hono exposes request headers to handlers', async () => {
  const app = new Hono();
  app.get('/auth', (c) => {
    const token = c.req.header('authorization');
    return c.json({ token: token ?? null });
  });

  const response = await app.request('/auth', {
    headers: { authorization: 'Bearer test-token' },
  });
  const body = (await response.json()) as { token: string | null };
  assert.equal(body.token, 'Bearer test-token');
});

test('Hono newResponse sets custom headers', async () => {
  const app = new Hono();
  app.get('/custom', (c) =>
    c.newResponse('plain body', 200, { 'x-custom-header': 'value' }),
  );

  const response = await app.request('/custom');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-custom-header'), 'value');
  assert.equal(await response.text(), 'plain body');
});
