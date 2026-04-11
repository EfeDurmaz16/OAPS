import test from 'node:test';
import assert from 'node:assert/strict';

import { serve } from './index.js';

async function withServer<T>(
  handler: (request: Request) => Response | Promise<Response>,
  fn: (port: number) => Promise<T>,
): Promise<T> {
  // Pick a high random port to avoid collisions in parallel test runs.
  const port = 30000 + Math.floor(Math.random() * 5000);
  const server = serve({ fetch: handler, port });
  try {
    // Wait briefly for listen() to bind.
    await new Promise((resolve) => setTimeout(resolve, 50));
    return await fn(port);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

test('serve forwards GET requests to the fetch handler', async () => {
  await withServer(
    async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    async (port) => {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      assert.equal(response.status, 200);
      const body = (await response.json()) as { ok: boolean };
      assert.equal(body.ok, true);
    },
  );
});

test('serve forwards POST bodies to the fetch handler', async () => {
  await withServer(
    async (request) => {
      const payload = (await request.json()) as { message: string };
      return new Response(JSON.stringify({ echoed: payload.message }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });
    },
    async (port) => {
      const response = await fetch(`http://127.0.0.1:${port}/echo`, {
        method: 'POST',
        body: JSON.stringify({ message: 'hello server' }),
        headers: { 'content-type': 'application/json' },
      });
      assert.equal(response.status, 201);
      const body = (await response.json()) as { echoed: string };
      assert.equal(body.echoed, 'hello server');
    },
  );
});

test('serve propagates response headers from the fetch handler', async () => {
  await withServer(
    async () =>
      new Response('plain body', {
        status: 200,
        headers: {
          'content-type': 'text/plain',
          'x-aicp-test': 'verified',
        },
      }),
    async (port) => {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('content-type'), 'text/plain');
      assert.equal(response.headers.get('x-aicp-test'), 'verified');
      assert.equal(await response.text(), 'plain body');
    },
  );
});

test('serve returns handler status codes (e.g. 404)', async () => {
  await withServer(
    async () =>
      new Response(JSON.stringify({ code: 'NOT_FOUND' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      }),
    async (port) => {
      const response = await fetch(`http://127.0.0.1:${port}/missing`);
      assert.equal(response.status, 404);
      const body = (await response.json()) as { code: string };
      assert.equal(body.code, 'NOT_FOUND');
    },
  );
});
