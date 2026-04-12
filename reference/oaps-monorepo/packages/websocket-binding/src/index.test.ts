import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AicpWebSocketClient,
  AicpWebSocketServer,
  WsFrame,
  createMockTransportPair,
  deserializeFrame,
  serializeFrame,
  validateWsFrame,
  createErrorFrame,
  createPingFrame,
  createPongFrame,
} from './index.js';
import { verifyEvidenceChain } from '@oaps/evidence';
import { generateId } from '@oaps/core';

const SERVER_ACTOR = { actor_id: 'urn:oaps:actor:server:ws-test' };
const CLIENT_ACTOR = { actor_id: 'urn:oaps:actor:agent:ws-client' };
const INTERACTION_ID = 'ix_ws_test_001';

test('message serialization round-trips correctly', () => {
  const frame: WsFrame = {
    type: 'message',
    interaction_id: INTERACTION_ID,
    message_id: 'wsmsg_rt_001',
    actor_ref: CLIENT_ACTOR,
    payload: { content: 'hello agent' },
    timestamp: '2026-04-11T10:00:00Z',
  };

  const serialized = serializeFrame(frame);
  const deserialized = deserializeFrame(serialized);

  assert.deepStrictEqual(deserialized, frame);
});

test('invalid messages rejected with ErrorObject', () => {
  assert.throws(
    () => validateWsFrame({ type: 'invalid_type', interaction_id: 'ix_1' }),
    (err: any) => err.error.code === 'INVALID_MESSAGE_TYPE',
  );

  assert.throws(
    () => validateWsFrame({ type: 'message', interaction_id: '' }),
    (err: any) => err.error.code === 'VALIDATION_FAILED',
  );

  assert.throws(
    () => validateWsFrame('not an object'),
    (err: any) => err.error.code === 'INVALID_FRAME',
  );

  assert.throws(
    () => deserializeFrame('not json {{{'),
    (err: any) => err.error.code === 'INVALID_FRAME',
  );

  assert.throws(
    () => validateWsFrame({
      type: 'message',
      interaction_id: INTERACTION_ID,
      message_id: 'msg_1',
      actor_ref: { actor_id: 'a' },
      timestamp: '',
    }),
    (err: any) => err.error.code === 'VALIDATION_FAILED',
  );
});

test('evidence emitted for every message on server', () => {
  const server = new AicpWebSocketServer(SERVER_ACTOR);
  const { client: clientTransport, server: serverTransport } = createMockTransportPair();

  server.acceptConnection('conn_1', serverTransport, INTERACTION_ID, CLIENT_ACTOR.actor_id);

  const clientHandshake: WsFrame = {
    type: 'handshake',
    interaction_id: INTERACTION_ID,
    message_id: generateId('wsmsg'),
    actor_ref: CLIENT_ACTOR,
    payload: {
      spec_version: '0.4-draft',
      min_supported_version: '0.4',
      max_supported_version: '0.4',
      role: 'client',
    },
    timestamp: new Date().toISOString(),
  };
  clientTransport.send(serializeFrame(clientHandshake));

  const messageFrame: WsFrame = {
    type: 'message',
    interaction_id: INTERACTION_ID,
    message_id: 'wsmsg_ev_001',
    actor_ref: CLIENT_ACTOR,
    payload: { content: 'test' },
    timestamp: new Date().toISOString(),
  };
  clientTransport.send(serializeFrame(messageFrame));

  const chain = server.getEvidenceChain(INTERACTION_ID);
  assert.ok(chain, 'Evidence chain should exist');
  assert.ok(chain.events.length >= 3, `Expected at least 3 evidence events (open, handshake, message), got ${chain.events.length}`);

  const eventTypes = chain.events.map((e) => e.event_type);
  assert.ok(eventTypes.includes('ws.connection.opened'));
  assert.ok(eventTypes.includes('ws.handshake'));
  assert.ok(eventTypes.includes('ws.message'));
});

test('interaction binding enforced', () => {
  const server = new AicpWebSocketServer(SERVER_ACTOR);
  const { client: clientTransport, server: serverTransport } = createMockTransportPair();

  server.acceptConnection('conn_bind', serverTransport, INTERACTION_ID, CLIENT_ACTOR.actor_id);

  const received: WsFrame[] = [];
  clientTransport.onMessage((data) => {
    received.push(deserializeFrame(data));
  });

  const mismatchFrame: WsFrame = {
    type: 'message',
    interaction_id: 'ix_wrong',
    message_id: 'wsmsg_mismatch',
    actor_ref: CLIENT_ACTOR,
    payload: {},
    timestamp: new Date().toISOString(),
  };
  clientTransport.send(serializeFrame(mismatchFrame));

  const errorFrame = received.find((f) => f.type === 'error');
  assert.ok(errorFrame, 'Should receive an error frame');
  assert.equal((errorFrame!.payload as any).code, 'INTERACTION_ID_MISMATCH');
});

test('version negotiation on handshake', () => {
  const server = new AicpWebSocketServer(SERVER_ACTOR);
  const { client: clientTransport, server: serverTransport } = createMockTransportPair();

  const received: WsFrame[] = [];
  clientTransport.onMessage((data) => {
    received.push(deserializeFrame(data));
  });

  server.acceptConnection('conn_ver', serverTransport, INTERACTION_ID, CLIENT_ACTOR.actor_id);

  const handshakeFrame = received.find((f) => f.type === 'handshake');
  assert.ok(handshakeFrame, 'Server should send handshake');
  assert.equal((handshakeFrame!.payload as any).role, 'server');
  assert.equal((handshakeFrame!.payload as any).spec_version, '0.4-draft');

  const incompatibleHandshake: WsFrame = {
    type: 'handshake',
    interaction_id: INTERACTION_ID,
    message_id: generateId('wsmsg'),
    actor_ref: CLIENT_ACTOR,
    payload: {
      spec_version: '99.0',
      min_supported_version: '99.0',
      max_supported_version: '99.0',
      role: 'client',
    },
    timestamp: new Date().toISOString(),
  };
  clientTransport.send(serializeFrame(incompatibleHandshake));

  const errorFrame = received.find((f) => f.type === 'error');
  assert.ok(errorFrame, 'Should receive version error');
  assert.equal((errorFrame!.payload as any).code, 'VERSION_NEGOTIATION_FAILED');
});

test('approval request/decision flow over channel', () => {
  const server = new AicpWebSocketServer(SERVER_ACTOR);
  const { client: clientTransport, server: serverTransport } = createMockTransportPair();

  server.acceptConnection('conn_approval', serverTransport, INTERACTION_ID, CLIENT_ACTOR.actor_id);

  const clientReceived: WsFrame[] = [];
  clientTransport.onMessage((data) => {
    clientReceived.push(deserializeFrame(data));
  });

  const approvalRequestFrame: WsFrame = {
    type: 'approval_request',
    interaction_id: INTERACTION_ID,
    message_id: generateId('wsmsg'),
    actor_ref: SERVER_ACTOR,
    payload: {
      approval_request_id: 'ar_ws_001',
      interaction_id: INTERACTION_ID,
      requested_by: SERVER_ACTOR,
      requested_from: CLIENT_ACTOR,
      reason: 'High-risk action',
      risk_class: 'R4',
      proposed_action: { verb: 'invoke', target: 'tool:deploy' },
      expires_at: '2026-04-11T10:10:00Z',
    },
    timestamp: new Date().toISOString(),
  };
  server.send('conn_approval', approvalRequestFrame);

  const approvalDecisionFrame: WsFrame = {
    type: 'approval_decision',
    interaction_id: INTERACTION_ID,
    message_id: generateId('wsmsg'),
    actor_ref: CLIENT_ACTOR,
    payload: {
      approval_request_id: 'ar_ws_001',
      interaction_id: INTERACTION_ID,
      decided_by: CLIENT_ACTOR,
      decision: 'approve',
      reason: 'Approved by human operator',
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  };
  clientTransport.send(serializeFrame(approvalDecisionFrame));

  const chain = server.getEvidenceChain(INTERACTION_ID);
  assert.ok(chain);
  const approvalEvents = chain.events.filter(
    (e) => e.event_type === 'ws.approval_request' || e.event_type === 'ws.approval_decision',
  );
  assert.ok(approvalEvents.length >= 2, 'Should have evidence for both approval request and decision');
});

test('hash chain integrity across multiple messages', () => {
  const server = new AicpWebSocketServer(SERVER_ACTOR);
  const { client: clientTransport, server: serverTransport } = createMockTransportPair();

  server.acceptConnection('conn_chain', serverTransport, INTERACTION_ID, CLIENT_ACTOR.actor_id);

  const clientHandshake: WsFrame = {
    type: 'handshake',
    interaction_id: INTERACTION_ID,
    message_id: generateId('wsmsg'),
    actor_ref: CLIENT_ACTOR,
    payload: {
      spec_version: '0.4-draft',
      min_supported_version: '0.4',
      max_supported_version: '0.4',
      role: 'client',
    },
    timestamp: new Date().toISOString(),
  };
  clientTransport.send(serializeFrame(clientHandshake));

  for (let i = 0; i < 5; i++) {
    const msgFrame: WsFrame = {
      type: 'message',
      interaction_id: INTERACTION_ID,
      message_id: `wsmsg_chain_${i}`,
      actor_ref: CLIENT_ACTOR,
      payload: { seq: i },
      timestamp: new Date().toISOString(),
    };
    clientTransport.send(serializeFrame(msgFrame));
  }

  const chain = server.getEvidenceChain(INTERACTION_ID);
  assert.ok(chain);
  assert.ok(chain.events.length >= 7, `Expected at least 7 events, got ${chain.events.length}`);

  const verification = verifyEvidenceChain(chain);
  assert.deepStrictEqual(verification, { ok: true });
});

test('ping/pong keepalive', () => {
  const server = new AicpWebSocketServer(SERVER_ACTOR);
  const { client: clientTransport, server: serverTransport } = createMockTransportPair();

  server.acceptConnection('conn_ping', serverTransport, INTERACTION_ID, CLIENT_ACTOR.actor_id);

  const clientReceived: WsFrame[] = [];
  clientTransport.onMessage((data) => {
    try {
      clientReceived.push(deserializeFrame(data));
    } catch { /* skip unparseable */ }
  });

  const pingFrame = createPingFrame(INTERACTION_ID, CLIENT_ACTOR, 'tok_42');
  clientTransport.send(serializeFrame(pingFrame));

  const pongFrame = clientReceived.find((f) => f.type === 'pong');
  assert.ok(pongFrame, 'Server should respond with pong');
  assert.equal((pongFrame!.payload as any).token, 'tok_42');
});

test('client sends message and receives evidence', async () => {
  const server = new AicpWebSocketServer(SERVER_ACTOR);
  const { client: clientTransport, server: serverTransport } = createMockTransportPair();

  const client = new AicpWebSocketClient(INTERACTION_ID, CLIENT_ACTOR);
  const connectPromise = client.connect(clientTransport);

  server.acceptConnection('conn_client', serverTransport, INTERACTION_ID, CLIENT_ACTOR.actor_id);

  const version = await connectPromise;
  assert.ok(version, 'Should negotiate a version');

  const frame = client.sendMessage({ content: 'hello from client' });
  assert.equal(frame.type, 'message');
  assert.equal(frame.interaction_id, INTERACTION_ID);

  const clientChain = client.getEvidenceChain();
  assert.ok(clientChain.events.length >= 3, `Expected at least 3 client events, got ${clientChain.events.length}`);

  const clientVerification = verifyEvidenceChain(clientChain);
  assert.deepStrictEqual(clientVerification, { ok: true });
});

test('client rejects mismatched interaction_id', async () => {
  const server = new AicpWebSocketServer(SERVER_ACTOR);
  const { client: clientTransport, server: serverTransport } = createMockTransportPair();

  const client = new AicpWebSocketClient(INTERACTION_ID, CLIENT_ACTOR);
  const connectPromise = client.connect(clientTransport);

  server.acceptConnection('conn_mismatch_client', serverTransport, INTERACTION_ID, CLIENT_ACTOR.actor_id);

  await connectPromise;

  assert.throws(
    () => {
      const badFrame: WsFrame = {
        type: 'message',
        interaction_id: 'ix_wrong',
        message_id: generateId('wsmsg'),
        actor_ref: CLIENT_ACTOR,
        payload: {},
        timestamp: new Date().toISOString(),
      };
      client.send(badFrame);
    },
    (err: any) => err.error.code === 'INTERACTION_ID_MISMATCH',
  );
});

test('server rejects unauthenticated connection', () => {
  const server = new AicpWebSocketServer(SERVER_ACTOR);
  const { client: clientTransport, server: serverTransport } = createMockTransportPair();

  const received: WsFrame[] = [];
  clientTransport.onMessage((data) => {
    received.push(deserializeFrame(data));
  });

  const accepted = server.acceptConnection(
    'conn_unauth',
    serverTransport,
    INTERACTION_ID,
    'urn:oaps:actor:agent:bad',
    () => false,
  );

  assert.equal(accepted, false);
  const errorFrame = received.find((f) => f.type === 'error');
  assert.ok(errorFrame);
  assert.equal((errorFrame!.payload as any).code, 'AUTHENTICATION_REQUIRED');
});

test('server handles invalid JSON gracefully', () => {
  const server = new AicpWebSocketServer(SERVER_ACTOR);
  const { client: clientTransport, server: serverTransport } = createMockTransportPair();

  server.acceptConnection('conn_badjson', serverTransport, INTERACTION_ID, CLIENT_ACTOR.actor_id);

  const received: WsFrame[] = [];
  clientTransport.onMessage((data) => {
    try { received.push(deserializeFrame(data)); } catch { /* skip */ }
  });

  clientTransport.send('not valid json {{{');

  const errorFrame = received.find((f) => f.type === 'error');
  assert.ok(errorFrame, 'Should receive error for invalid JSON');
  assert.equal((errorFrame!.payload as any).code, 'INVALID_FRAME');
});

test('evidence replay via replay message', () => {
  const server = new AicpWebSocketServer(SERVER_ACTOR);
  const { client: clientTransport, server: serverTransport } = createMockTransportPair();

  server.acceptConnection('conn_replay', serverTransport, INTERACTION_ID, CLIENT_ACTOR.actor_id);

  const clientHandshake: WsFrame = {
    type: 'handshake',
    interaction_id: INTERACTION_ID,
    message_id: generateId('wsmsg'),
    actor_ref: CLIENT_ACTOR,
    payload: {
      spec_version: '0.4-draft',
      min_supported_version: '0.4',
      max_supported_version: '0.4',
      role: 'client',
    },
    timestamp: new Date().toISOString(),
  };
  clientTransport.send(serializeFrame(clientHandshake));

  for (let i = 0; i < 3; i++) {
    const msgFrame: WsFrame = {
      type: 'message',
      interaction_id: INTERACTION_ID,
      message_id: `wsmsg_replay_${i}`,
      actor_ref: CLIENT_ACTOR,
      payload: { seq: i },
      timestamp: new Date().toISOString(),
    };
    clientTransport.send(serializeFrame(msgFrame));
  }

  const replayReceived: WsFrame[] = [];
  clientTransport.onMessage((data) => {
    try { replayReceived.push(deserializeFrame(data)); } catch { /* skip */ }
  });

  const replayFrame: WsFrame = {
    type: 'replay',
    interaction_id: INTERACTION_ID,
    message_id: generateId('wsmsg'),
    actor_ref: CLIENT_ACTOR,
    payload: { limit: 2 },
    timestamp: new Date().toISOString(),
  };
  clientTransport.send(serializeFrame(replayFrame));

  const evidenceFrames = replayReceived.filter((f) => f.type === 'evidence');
  assert.ok(evidenceFrames.length >= 2, `Expected at least 2 evidence frames (+ completion), got ${evidenceFrames.length}`);

  const completeFrame = evidenceFrames.find((f) => (f.payload as any).replay_complete === true);
  assert.ok(completeFrame, 'Should have a replay_complete frame');
  assert.equal((completeFrame!.payload as any).returned, 2);
});
