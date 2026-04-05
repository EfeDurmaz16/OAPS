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

const messageEnvelope = {
  spec_version: '0.4-draft',
  min_supported_version: '0.4',
  max_supported_version: '0.4',
  message_id: 'msg_2',
  interaction_id: 'ix_1',
  from: { actor_id: 'urn:oaps:actor:agent:builder' },
  to: { actor_id: 'urn:oaps:actor:server:reference' },
  channel: 'oaps-http',
  message_type: 'intent.response',
  timestamp: '2026-04-03T10:01:00Z',
  payload: {
    intent_id: 'int_1',
    verb: 'invoke',
    object: 'tool:read_repo',
    requested_outcome: 'Report completion',
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

test('GET /.well-known/oaps.json exposes the canonical discovery document', async () => {
  const app = createTestApp();

  const response = await app.request('/.well-known/oaps.json');

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.oaps_version, '0.4-draft');
  assert.equal(body.actor_card_url, 'http://localhost:3000/actor-card');
  assert.equal(body.capabilities_url, 'http://localhost:3000/capabilities');
  assert.equal(body.interactions_url, 'http://localhost:3000/interactions');
  assert.deepEqual(body.auth_schemes, ['bearer']);
  assert.deepEqual(body.media_types, ['application/oaps+json', 'application/json']);
  assert.deepEqual(body.supported_profiles, ['oaps-mcp-v1']);
  assert.match(response.headers.get('content-type') ?? '', /^application\/oaps\+json\b/);
});

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
  assert.match(response.headers.get('content-type') ?? '', /^application\/oaps\+json\b/);
});

test('POST /interactions accepts the canonical OAPS media type', async () => {
  const app = createTestApp();

  const response = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders({
      'content-type': 'application/oaps+json',
    }),
    body: JSON.stringify({
      ...requestEnvelope,
      interaction_id: 'ix_oaps_media_type',
      message_id: 'msg_oaps_media_type',
    }),
  });

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.payload.state, 'completed');
  assert.match(response.headers.get('content-type') ?? '', /^application\/oaps\+json\b/);
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

test('POST /interactions/:id/approve respects idempotency keys', async () => {
  const app = createTestApp();
  const headers = jsonHeaders({ 'idempotency-key': 'idem-approve' });

  const createResponse = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      ...requestEnvelope,
      interaction_id: 'ix_approve_idem',
      message_id: 'msg_approve_idem',
      payload: {
        ...requestEnvelope.payload,
        intent_id: 'int_approve_idem',
        object: 'tool:pay_invoice',
      },
    }),
  });
  assert.equal(createResponse.status, 202);

  const first = await app.request('/interactions/ix_approve_idem/approve', {
    method: 'POST',
    headers,
    body: JSON.stringify({ reason: 'approved for test' }),
  });
  assert.equal(first.status, 200);
  const firstBody = await first.json();
  assert.equal(firstBody.payload.state, 'completed');
  assert.equal(typeof firstBody.payload.metadata.execution_id, 'string');

  const replayed = await app.request('/interactions/ix_approve_idem/approve', {
    method: 'POST',
    headers,
    body: JSON.stringify({ reason: 'approved for test' }),
  });
  assert.equal(replayed.status, 200);
  const replayedBody = await replayed.json();
  assert.equal(replayedBody.payload.metadata.execution_id, firstBody.payload.metadata.execution_id);

  const conflict = await app.request('/interactions/ix_approve_idem/approve', {
    method: 'POST',
    headers,
    body: JSON.stringify({ reason: 'different reason' }),
  });
  assert.equal(conflict.status, 409);
  const conflictBody = await conflict.json();
  assert.equal(conflictBody.code, 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD');
  assert.equal(conflictBody.category, 'validation');
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

test('POST /interactions/:id/messages appends envelopes to interaction history', async () => {
  const app = createTestApp();

  const createResponse = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(requestEnvelope),
  });
  assert.equal(createResponse.status, 201);

  const messageResponse = await app.request('/interactions/ix_1/messages', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(messageEnvelope),
  });

  assert.equal(messageResponse.status, 200);
  const body = await messageResponse.json();
  assert.equal(body.payload.metadata.message_id, 'msg_2');
  assert.equal(body.payload.metadata.message_count, 2);

  const fetchResponse = await app.request('/interactions/ix_1');
  assert.equal(fetchResponse.status, 200);
  const interaction = await fetchResponse.json();
  assert.equal(interaction.messages.length, 2);
  assert.equal(interaction.messages[1].message_id, 'msg_2');
});

test('POST /interactions/:id/messages rejects authenticated subject mismatches', async () => {
  const app = createTestApp();

  const createResponse = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(requestEnvelope),
  });
  assert.equal(createResponse.status, 201);

  const response = await app.request('/interactions/ix_1/messages', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      ...messageEnvelope,
      from: { actor_id: 'urn:oaps:actor:agent:other' },
    }),
  });

  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.code, 'AUTHENTICATED_SUBJECT_MISMATCH');
  assert.equal(body.category, 'authentication');
});

test('POST /interactions/:id/messages replays the original response for idempotent retries', async () => {
  const app = createTestApp();
  const headers = jsonHeaders({ 'idempotency-key': 'idem-message-1' });

  const createResponse = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(requestEnvelope),
  });
  assert.equal(createResponse.status, 201);

  const first = await app.request('/interactions/ix_1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify(messageEnvelope),
  });
  const firstBody = await first.json();

  const second = await app.request('/interactions/ix_1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify(messageEnvelope),
  });

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.deepEqual(await second.json(), firstBody);

  const interactionResponse = await app.request('/interactions/ix_1');
  const interaction = await interactionResponse.json();
  assert.equal(interaction.messages.length, 2);

  const eventsResponse = await app.request('/interactions/ix_1/events');
  const events = await eventsResponse.json();
  assert.equal(events.events.filter((event: { event_type: string }) => event.event_type === 'interaction.message.appended').length, 1);
});

test('POST /interactions/:id/messages rejects idempotency key reuse with a different payload', async () => {
  const app = createTestApp();
  const headers = jsonHeaders({ 'idempotency-key': 'idem-message-conflict' });

  const createResponse = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(requestEnvelope),
  });
  assert.equal(createResponse.status, 201);

  const first = await app.request('/interactions/ix_1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify(messageEnvelope),
  });
  assert.equal(first.status, 200);

  const second = await app.request('/interactions/ix_1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...messageEnvelope,
      message_id: 'msg_2_conflict',
    }),
  });

  assert.equal(second.status, 409);
  const body = await second.json();
  assert.equal(body.code, 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD');
  assert.equal(body.category, 'validation');
});

test('GET /interactions/:id/evidence returns the hash-linked evidence chain', async () => {
  const app = createTestApp();

  const createResponse = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      ...requestEnvelope,
      interaction_id: 'ix_evidence',
      message_id: 'msg_evidence',
    }),
  });
  assert.equal(createResponse.status, 201);

  const response = await app.request('/interactions/ix_evidence/evidence');

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.interaction_id, 'ix_evidence');
  assert.equal(body.events.length, 4);
  assert.equal(body.events[0].event_type, 'interaction.received');
  assert.equal(body.events.at(-1).event_type, 'interaction.completed');
  assert.equal(body.replay.has_more, false);
  assert.equal(body.replay.total_events, 4);
});

test('GET /interactions/:id/events returns the flattened event stream', async () => {
  const app = createTestApp();

  const createResponse = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      ...requestEnvelope,
      interaction_id: 'ix_events',
      message_id: 'msg_events',
    }),
  });
  assert.equal(createResponse.status, 201);

  const response = await app.request('/interactions/ix_events/events');

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.interaction_id, 'ix_events');
  assert.equal(body.events.length, 4);
  assert.equal(body.events[0].event_type, 'interaction.received');
  assert.equal(body.events.at(-1).event_type, 'interaction.completed');
  assert.equal(body.replay.has_more, false);
});

test('GET replay endpoints support after/limit windows for incremental event retrieval', async () => {
  const app = createTestApp();

  const createResponse = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      ...requestEnvelope,
      interaction_id: 'ix_window',
      message_id: 'msg_window_create',
    }),
  });
  assert.equal(createResponse.status, 201);

  const messageResponse = await app.request('/interactions/ix_window/messages', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      ...messageEnvelope,
      interaction_id: 'ix_window',
      message_id: 'msg_window_append',
    }),
  });
  assert.equal(messageResponse.status, 200);

  const firstEventsResponse = await app.request('/interactions/ix_window/events?limit=2');
  assert.equal(firstEventsResponse.status, 200);
  const firstEventsBody = await firstEventsResponse.json();
  assert.equal(firstEventsBody.events.length, 2);
  assert.equal(firstEventsBody.events[0].event_type, 'interaction.received');
  assert.equal(firstEventsBody.replay.has_more, true);

  const nextCursor = firstEventsBody.replay.next_after;
  assert.equal(typeof nextCursor, 'string');

  const secondEventsResponse = await app.request(`/interactions/ix_window/events?after=${nextCursor}&limit=10`);
  assert.equal(secondEventsResponse.status, 200);
  const secondEventsBody = await secondEventsResponse.json();
  assert.equal(secondEventsBody.events.length, 3);
  assert.equal(secondEventsBody.events[0].event_type, 'mcp.tool_call.completed');
  assert.equal(secondEventsBody.events.at(-1).event_type, 'interaction.message.appended');
  assert.equal(secondEventsBody.replay.after, nextCursor);
  assert.equal(secondEventsBody.replay.has_more, false);

  const evidenceResponse = await app.request(`/interactions/ix_window/evidence?after=${nextCursor}&limit=2`);
  assert.equal(evidenceResponse.status, 200);
  const evidenceBody = await evidenceResponse.json();
  assert.equal(evidenceBody.events.length, 2);
  assert.equal(evidenceBody.events[0].event_type, 'mcp.tool_call.completed');
  assert.equal(evidenceBody.replay.after, nextCursor);
  assert.equal(evidenceBody.replay.has_more, true);
});

test('GET replay endpoints reject unknown replay cursors and invalid limits', async () => {
  const app = createTestApp();

  const createResponse = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      ...requestEnvelope,
      interaction_id: 'ix_bad_cursor',
      message_id: 'msg_bad_cursor',
    }),
  });
  assert.equal(createResponse.status, 201);

  const missingCursorResponse = await app.request('/interactions/ix_bad_cursor/events?after=evt_missing');
  assert.equal(missingCursorResponse.status, 400);
  const missingCursorBody = await missingCursorResponse.json();
  assert.equal(missingCursorBody.code, 'REPLAY_CURSOR_NOT_FOUND');
  assert.equal(missingCursorBody.category, 'validation');

  const invalidLimitResponse = await app.request('/interactions/ix_bad_cursor/evidence?limit=zero');
  assert.equal(invalidLimitResponse.status, 400);
  const invalidLimitBody = await invalidLimitResponse.json();
  assert.equal(invalidLimitBody.code, 'VALIDATION_FAILED');
  assert.equal(invalidLimitBody.category, 'validation');
});

test('POST /interactions/:id/messages rejects mismatched interaction ids', async () => {
  const app = createTestApp();

  const createResponse = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(requestEnvelope),
  });
  assert.equal(createResponse.status, 201);

  const response = await app.request('/interactions/ix_1/messages', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      ...messageEnvelope,
      interaction_id: 'ix_other',
      message_id: 'msg_bad_message_id',
    }),
  });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.code, 'VALIDATION_FAILED');
  assert.equal(body.category, 'validation');
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
  assert.match(response.headers.get('content-type') ?? '', /^application\/oaps\+json\b/);
});

test('POST /interactions/:id/messages requires bearer authentication', async () => {
  const app = createTestApp();

  const createResponse = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(requestEnvelope),
  });
  assert.equal(createResponse.status, 201);

  const response = await app.request('/interactions/ix_1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(messageEnvelope),
  });

  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.code, 'AUTHENTICATION_REQUIRED');
  assert.equal(body.category, 'authentication');
  assert.match(response.headers.get('content-type') ?? '', /^application\/oaps\+json\b/);
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

test('POST /interactions/:id/reject records approval rejection and fails the interaction', async () => {
  const app = createTestApp();

  const createResponse = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      ...requestEnvelope,
      interaction_id: 'ix_reject',
      message_id: 'msg_reject',
      payload: {
        ...requestEnvelope.payload,
        intent_id: 'int_reject',
        object: 'tool:pay_invoice',
      },
    }),
  });

  assert.equal(createResponse.status, 202);

  const rejectResponse = await app.request('/interactions/ix_reject/reject', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ reason: 'denied for test' }),
  });

  assert.equal(rejectResponse.status, 200);
  const rejected = await rejectResponse.json();
  assert.equal(rejected.payload.state, 'failed');
  assert.equal(rejected.payload.metadata.approval_request_id.startsWith('apr_'), true);

  const interactionResponse = await app.request('/interactions/ix_reject');
  assert.equal(interactionResponse.status, 200);
  const interaction = await interactionResponse.json();
  assert.equal(interaction.state, 'failed');
  assert.equal(interaction.error.code, 'APPROVAL_REJECTED');
  assert.equal(interaction.approval_decision.decision, 'reject');

  const eventsResponse = await app.request('/interactions/ix_reject/events');
  const events = await eventsResponse.json();
  assert.equal(events.events.at(-1).event_type, 'approval.rejected');
});

test('POST /interactions/:id/approve replays the original response for idempotent retries', async () => {
  const app = createTestApp();
  const headers = jsonHeaders({ 'idempotency-key': 'idem-approve-1' });

  const createResponse = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      ...requestEnvelope,
      interaction_id: 'ix_approve_idem',
      payload: {
        ...requestEnvelope.payload,
        intent_id: 'int_approve_idem',
        object: 'tool:pay_invoice',
      },
    }),
  });
  assert.equal(createResponse.status, 202);

  const first = await app.request('/interactions/ix_approve_idem/approve', {
    method: 'POST',
    headers,
    body: JSON.stringify({ reason: 'approved for idempotency test' }),
  });
  const firstBody = await first.json();

  const second = await app.request('/interactions/ix_approve_idem/approve', {
    method: 'POST',
    headers,
    body: JSON.stringify({ reason: 'approved for idempotency test' }),
  });

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.deepEqual(await second.json(), firstBody);

  const eventsResponse = await app.request('/interactions/ix_approve_idem/events');
  const events = await eventsResponse.json();
  assert.equal(events.events.filter((event: { event_type: string }) => event.event_type === 'interaction.completed').length, 1);
});

test('POST /interactions/:id/reject replays the original response for idempotent retries', async () => {
  const app = createTestApp();
  const headers = jsonHeaders({ 'idempotency-key': 'idem-reject-1' });

  const createResponse = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      ...requestEnvelope,
      interaction_id: 'ix_reject_idem',
      message_id: 'msg_reject_idem',
      payload: {
        ...requestEnvelope.payload,
        intent_id: 'int_reject_idem',
        object: 'tool:pay_invoice',
      },
    }),
  });
  assert.equal(createResponse.status, 202);

  const first = await app.request('/interactions/ix_reject_idem/reject', {
    method: 'POST',
    headers,
    body: JSON.stringify({ reason: 'denied for idempotency test' }),
  });
  const firstBody = await first.json();

  const second = await app.request('/interactions/ix_reject_idem/reject', {
    method: 'POST',
    headers,
    body: JSON.stringify({ reason: 'denied for idempotency test' }),
  });

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.deepEqual(await second.json(), firstBody);

  const eventsResponse = await app.request('/interactions/ix_reject_idem/events');
  const events = await eventsResponse.json();
  assert.equal(events.events.filter((event: { event_type: string }) => event.event_type === 'approval.rejected').length, 1);
});

test('POST /interactions/:id/revoke moves the interaction into revoked state', async () => {
  const app = createTestApp();

  const createResponse = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      ...requestEnvelope,
      interaction_id: 'ix_revoke',
      message_id: 'msg_revoke',
    }),
  });
  assert.equal(createResponse.status, 201);

  const revokeResponse = await app.request('/interactions/ix_revoke/revoke', {
    method: 'POST',
    headers: jsonHeaders(),
  });

  assert.equal(revokeResponse.status, 200);
  const revoked = await revokeResponse.json();
  assert.equal(revoked.payload.state, 'revoked');

  const interactionResponse = await app.request('/interactions/ix_revoke');
  assert.equal(interactionResponse.status, 200);
  const interaction = await interactionResponse.json();
  assert.equal(interaction.state, 'revoked');

  const eventsResponse = await app.request('/interactions/ix_revoke/events');
  const events = await eventsResponse.json();
  assert.equal(events.events.at(-1).event_type, 'interaction.revoked');
});

test('POST /interactions/:id/revoke replays the original response for idempotent retries', async () => {
  const app = createTestApp();
  const headers = jsonHeaders({ 'idempotency-key': 'idem-revoke-1' });

  const createResponse = await app.request('/interactions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      ...requestEnvelope,
      interaction_id: 'ix_revoke_idem',
      message_id: 'msg_revoke_idem',
    }),
  });
  assert.equal(createResponse.status, 201);

  const first = await app.request('/interactions/ix_revoke_idem/revoke', {
    method: 'POST',
    headers,
  });
  const firstBody = await first.json();

  const second = await app.request('/interactions/ix_revoke_idem/revoke', {
    method: 'POST',
    headers,
  });

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.deepEqual(await second.json(), firstBody);

  const eventsResponse = await app.request('/interactions/ix_revoke_idem/events');
  const events = await eventsResponse.json();
  assert.equal(events.events.filter((event: { event_type: string }) => event.event_type === 'interaction.revoked').length, 1);
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
