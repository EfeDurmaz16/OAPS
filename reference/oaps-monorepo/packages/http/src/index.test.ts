import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { createReferenceApp, FileReferenceStateStore, MemoryReferenceStateStore } from './index.js';

const requestEnvelope = {
  spec_version: '0.4-draft',
  min_supported_version: '0.4',
  max_supported_version: '0.4',
  message_id: 'msg_1',
  interaction_id: 'ix_1',
  from: { actor_id: 'urn:oaps:actor:agent:builder' },
  to: { actor_id: 'urn:oaps:actor:server:reference' },
  channel: 'mcp',
  message_type: 'intent.request',
  timestamp: '2026-04-03T10:00:00Z',
  payload: {
    intent_id: 'int_1',
    verb: 'invoke',
    object: 'tool:read_repo',
    constraints: {
      arguments: {
        path: 'README.md',
      },
    },
  },
};

function createTestApp(overrides?: Parameters<typeof createReferenceApp>[0]) {
  return createReferenceApp({
    stateStore: new MemoryReferenceStateStore(),
    mcpClient: {
      async listTools() {
        return [
          {
            name: 'read_repo',
            description: 'Read repository files',
            inputSchema: { type: 'object' },
          },
          {
            name: 'pay_invoice',
            description: 'Pay an invoice',
            inputSchema: { type: 'object' },
          },
        ];
      },
      async callTool(name, args) {
        return { name, args, ok: true };
      },
    },
    ...overrides,
  });
}

function jsonHeaders(extra?: Record<string, string>) {
  return {
    authorization: 'Bearer dev-token',
    'content-type': 'application/json',
    ...extra,
  };
}

test('POST /interactions completes low-risk invocations', async () => {
  const app = createTestApp();

  const response = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(requestEnvelope),
  });

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.payload.state, 'completed');
});

test('approval flow moves interaction from pending_approval to completed', async () => {
  const app = createTestApp();

  const createResponse = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      ...requestEnvelope,
      interaction_id: 'ix_2',
      payload: {
        ...requestEnvelope.payload,
        intent_id: 'int_2',
        object: 'tool:pay_invoice',
      },
    }),
  });

  assert.equal(createResponse.status, 202);
  const created = await createResponse.json();
  assert.equal(created.payload.state, 'pending_approval');

  const approveResponse = await app.request('/interactions/ix_2/approve', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ reason: 'approved for test' }),
  });

  assert.equal(approveResponse.status, 200);
  const approved = await approveResponse.json();
  assert.equal(approved.payload.state, 'completed');
});

test('idempotency returns the original response for repeated requests', async () => {
  const app = createTestApp();
  const headers = jsonHeaders({ 'idempotency-key': 'idem-1' });

  const first = await app.request('/interactions', {
    method: 'POST',
    headers,
    body: JSON.stringify(requestEnvelope),
  });
  const second = await app.request('/interactions', {
    method: 'POST',
    headers,
    body: JSON.stringify(requestEnvelope),
  });

  const firstBody = await first.json();
  const secondBody = await second.json();

  assert.equal(second.status, first.status);
  assert.equal(secondBody.interaction_id, firstBody.interaction_id);
});

test('POST /interactions requires bearer authentication', async () => {
  const app = createTestApp();

  const response = await app.request('/interactions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestEnvelope),
  });

  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.code, 'AUTHENTICATION_REQUIRED');
  assert.equal(body.category, 'authentication');
});

test('POST /interactions rejects unrecognized bearer tokens', async () => {
  const app = createTestApp();

  const response = await app.request('/interactions', {
    method: 'POST',
    headers: {
      authorization: 'Bearer invalid-token',
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestEnvelope),
  });

  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.code, 'AUTHENTICATION_FAILED');
  assert.equal(body.category, 'authentication');
});

test('POST /interactions rejects incompatible protocol versions', async () => {
  const app = createTestApp();

  const response = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      ...requestEnvelope,
      spec_version: '0.5-draft',
      min_supported_version: '0.5',
      max_supported_version: '0.5',
      interaction_id: 'ix_bad_version',
      message_id: 'msg_bad_version',
    }),
  });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.code, 'VERSION_NEGOTIATION_FAILED');
  assert.equal(body.category, 'versioning');
});

test('POST /interactions rejects idempotency key reuse with a different payload', async () => {
  const app = createTestApp();
  const headers = jsonHeaders({ 'idempotency-key': 'idem-conflict' });

  const first = await app.request('/interactions', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...requestEnvelope,
      interaction_id: 'ix_idem_conflict_1',
      message_id: 'msg_idem_conflict_1',
    }),
  });
  assert.equal(first.status, 201);

  const second = await app.request('/interactions', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...requestEnvelope,
      interaction_id: 'ix_idem_conflict_2',
      message_id: 'msg_idem_conflict_2',
    }),
  });

  assert.equal(second.status, 409);
  const body = await second.json();
  assert.equal(body.code, 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD');
  assert.equal(body.category, 'validation');
});

test('GET /interactions/:id returns 404 for unknown interactions', async () => {
  const app = createTestApp();

  const response = await app.request('/interactions/ix_missing');

  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.code, 'INTERACTION_NOT_FOUND');
  assert.equal(body.category, 'discovery');
});

test('POST /interactions/:id/approve returns 409 when approval is not pending', async () => {
  const app = createTestApp();

  const createResponse = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      ...requestEnvelope,
      interaction_id: 'ix_not_pending',
      message_id: 'msg_not_pending',
    }),
  });
  assert.equal(createResponse.status, 201);

  const approveResponse = await app.request('/interactions/ix_not_pending/approve', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ reason: 'too late' }),
  });

  assert.equal(approveResponse.status, 409);
  const body = await approveResponse.json();
  assert.equal(body.code, 'APPROVAL_NOT_PENDING');
  assert.equal(body.category, 'validation');
});

test('file-backed store persists interactions across app instances', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'oaps-http-store-'));
  const storagePath = path.join(directory, 'state.json');

  try {
    const firstApp = createReferenceApp({
      stateStore: new FileReferenceStateStore(storagePath),
      mcpClient: {
        async listTools() {
          return [
            {
              name: 'read_repo',
              description: 'Read repository files',
              inputSchema: { type: 'object' },
            },
          ];
        },
        async callTool(name, args) {
          return { name, args, ok: true };
        },
      },
    });

    const createResponse = await firstApp.request('/interactions', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({
        ...requestEnvelope,
        interaction_id: 'ix_persisted',
      }),
    });

    assert.equal(createResponse.status, 201);

    const secondApp = createReferenceApp({
      stateStore: new FileReferenceStateStore(storagePath),
      mcpClient: {
        async listTools() {
          return [];
        },
        async callTool() {
          return {};
        },
      },
    });

    const fetchResponse = await secondApp.request('/interactions/ix_persisted');
    assert.equal(fetchResponse.status, 200);
    const body = await fetchResponse.json();
    assert.equal(body.interaction_id, 'ix_persisted');
    assert.equal(body.state, 'completed');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
