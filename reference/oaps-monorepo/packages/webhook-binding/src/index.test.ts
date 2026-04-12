import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WebhookRegistry,
  WebhookSender,
  WebhookReceiver,
  signWebhook,
  verifyWebhookSignature,
  WEBHOOK_EVENT_TYPES,
  DEFAULT_RETRY_POLICY,
  type WebhookRegistration,
  type WebhookEnvelope,
  type FetchFn,
} from './index.js';

const TEST_SECRET = 'whsec_k7m9p2q4r6t8v0w1x3y5z7a9b1c3d5e7';
const TEST_CALLBACK = 'https://agent-b.example.com/webhooks/oaps';
const TEST_INTERACTION = 'int_test123';
const TEST_ACTOR = { actor_id: 'agent-a.example.com' };

function createMockFetch(responses: Array<{ ok: boolean; status: number }>): { fetchFn: FetchFn; calls: Array<{ url: string; init: { method: string; headers: Record<string, string>; body: string } }> } {
  const calls: Array<{ url: string; init: { method: string; headers: Record<string, string>; body: string } }> = [];
  let callIndex = 0;

  const fetchFn: FetchFn = async (url, init) => {
    calls.push({ url, init });
    const response = responses[callIndex] ?? { ok: false, status: 500 };
    callIndex++;
    return response;
  };

  return { fetchFn, calls };
}

function makeReg(overrides?: Partial<WebhookRegistration>): WebhookRegistration {
  return {
    registration_id: 'whreg_test',
    interaction_id: TEST_INTERACTION,
    callback_url: TEST_CALLBACK,
    events: ['task.transition'],
    secret: TEST_SECRET,
    retry_policy: DEFAULT_RETRY_POLICY,
    ...overrides,
  };
}

test('register webhook for interaction', () => {
  const registry = new WebhookRegistry();
  const reg = registry.register({
    interaction_id: TEST_INTERACTION,
    callback_url: TEST_CALLBACK,
    events: ['task.transition', 'interaction.completed'],
    secret: TEST_SECRET,
  });

  assert.ok(reg.registration_id.startsWith('whreg_'));
  assert.equal(reg.interaction_id, TEST_INTERACTION);
  assert.equal(reg.callback_url, TEST_CALLBACK);
  assert.deepEqual(reg.events, ['task.transition', 'interaction.completed']);
  assert.deepEqual(reg.retry_policy, DEFAULT_RETRY_POLICY);
});

test('reject non-HTTPS callback URLs', () => {
  const registry = new WebhookRegistry();
  assert.throws(() => {
    registry.register({
      interaction_id: TEST_INTERACTION,
      callback_url: 'http://insecure.example.com/hook',
      events: ['task.transition'],
      secret: TEST_SECRET,
    });
  }, /HTTPS/);
});

test('deliver webhook with correct HMAC signature', async () => {
  const { fetchFn, calls } = createMockFetch([{ ok: true, status: 200 }]);
  const sender = new WebhookSender(fetchFn);
  const reg = makeReg();

  const envelope = sender.buildEnvelope(reg, 'task.transition', TEST_ACTOR, { from_state: 'running', to_state: 'completed' }, 'sha256:abc123');
  const result = await sender.deliver(reg, envelope);

  assert.equal(result.ok, true);
  assert.equal(result.attempts, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.url, TEST_CALLBACK);
  assert.ok(calls[0]!.init.headers['X-AICP-Signature']);
});

test('receiver verifies valid signature', () => {
  const receiver = new WebhookReceiver();
  const body = '{"test":"data"}';
  const sig = signWebhook(body, TEST_SECRET);
  assert.equal(receiver.verify(sig, body, TEST_SECRET), true);
});

test('receiver rejects invalid signature', () => {
  const receiver = new WebhookReceiver();
  const body = '{"test":"data"}';
  assert.equal(receiver.verify('0'.repeat(64), body, TEST_SECRET), false);
});

test('receiver deduplicates by webhook_id', () => {
  const receiver = new WebhookReceiver();
  assert.equal(receiver.deduplicate('whd_first'), false);
  assert.equal(receiver.deduplicate('whd_first'), true);
  assert.equal(receiver.deduplicate('whd_second'), false);
});

test('retry logic with exponential backoff', async () => {
  const { fetchFn, calls } = createMockFetch([
    { ok: false, status: 500 },
    { ok: false, status: 503 },
    { ok: true, status: 200 },
  ]);

  const sleepCalls: number[] = [];
  const sleepFn = async (ms: number) => { sleepCalls.push(ms); };

  const sender = new WebhookSender(fetchFn);
  const reg = makeReg({ retry_policy: { max_attempts: 3, backoff_seconds: [1, 5, 30] } });
  const envelope = sender.buildEnvelope(reg, 'task.transition', TEST_ACTOR, {}, 'sha256:abc');
  const result = await sender.deliverWithRetry(reg, envelope, sleepFn);

  assert.equal(result.ok, true);
  assert.equal(result.attempts, 3);
  assert.equal(calls.length, 3);
  assert.deepEqual(sleepCalls, [1000, 5000]);
});

test('envelope validates against schema shape', () => {
  const sender = new WebhookSender(async () => ({ ok: true, status: 200 }));
  const reg = makeReg();
  const envelope = sender.buildEnvelope(reg, 'task.transition', TEST_ACTOR, { task_id: 'task_abc' }, 'sha256:abc');

  assert.ok(typeof envelope.webhook_id === 'string');
  assert.ok(typeof envelope.interaction_id === 'string');
  assert.ok(typeof envelope.event_type === 'string');
  assert.ok(typeof envelope.actor_ref === 'object');
  assert.ok(typeof envelope.timestamp === 'string');
  assert.ok(typeof envelope.evidence_hash === 'string');
  assert.ok(typeof envelope.signature === 'string');

  const receiver = new WebhookReceiver();
  const parsed = receiver.parseEnvelope(JSON.stringify(envelope));
  assert.equal(parsed.webhook_id, envelope.webhook_id);
});

test('evidence hash matches the referenced event', () => {
  const sender = new WebhookSender(async () => ({ ok: true, status: 200 }));
  const reg = makeReg({ events: ['evidence.emitted'] });
  const evidenceHash = 'sha256:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
  const envelope = sender.buildEnvelope(reg, 'evidence.emitted', TEST_ACTOR, { event_id: 'evt_test', event_hash: evidenceHash }, evidenceHash);

  assert.equal(envelope.evidence_hash, evidenceHash);
  const payload = envelope.payload as { event_hash: string };
  assert.equal(envelope.evidence_hash, payload.event_hash);
});

test('expired registration stops delivery', async () => {
  const { fetchFn, calls } = createMockFetch([]);
  const sender = new WebhookSender(fetchFn);
  const reg = makeReg({ expiry: '2020-01-01T00:00:00Z' });
  const envelope = sender.buildEnvelope(reg, 'task.transition', TEST_ACTOR, {}, 'sha256:abc');
  const result = await sender.deliver(reg, envelope);

  assert.equal(result.ok, false);
  assert.equal(result.attempts, 0);
  assert.equal(calls.length, 0);
});

test('all event types serialize correctly', () => {
  const sender = new WebhookSender(async () => ({ ok: true, status: 200 }));
  const reg = makeReg({ events: [...WEBHOOK_EVENT_TYPES] });
  const receiver = new WebhookReceiver();

  for (const eventType of WEBHOOK_EVENT_TYPES) {
    const envelope = sender.buildEnvelope(reg, eventType, TEST_ACTOR, { type: eventType }, 'sha256:abc');
    assert.equal(envelope.event_type, eventType);
    assert.ok(envelope.webhook_id.startsWith('whd_'));
    assert.ok(envelope.signature.length > 0);

    const parsed = receiver.parseEnvelope(JSON.stringify(envelope));
    assert.equal(parsed.event_type, eventType);
  }
});

test('full flow: register → state change → deliver → verify → process', async () => {
  const registry = new WebhookRegistry();
  const reg = registry.register({
    interaction_id: TEST_INTERACTION,
    callback_url: TEST_CALLBACK,
    events: ['task.transition', 'interaction.completed'],
    secret: TEST_SECRET,
  });

  let capturedBody = '';
  let capturedHeaders: Record<string, string> = {};
  const fetchFn: FetchFn = async (_url, init) => {
    capturedBody = init.body;
    capturedHeaders = init.headers;
    return { ok: true, status: 200 };
  };

  const sender = new WebhookSender(fetchFn);
  const envelope = sender.buildEnvelope(
    reg,
    'task.transition',
    TEST_ACTOR,
    { task_id: 'task_abc', from_state: 'running', to_state: 'completed' },
    'sha256:evidence_hash_here',
  );

  const deliverResult = await sender.deliver(reg, envelope);
  assert.equal(deliverResult.ok, true);

  const receiver = new WebhookReceiver();
  assert.equal(receiver.deduplicate(envelope.webhook_id), false);

  const sig = capturedHeaders['X-AICP-Signature']!;
  const bodyWithoutSig = JSON.stringify({ ...JSON.parse(capturedBody), signature: undefined });
  const isValid = receiver.verify(sig, bodyWithoutSig, TEST_SECRET);
  assert.equal(isValid, true);

  const parsed = receiver.parseEnvelope(capturedBody);
  assert.equal(parsed.event_type, 'task.transition');
  assert.equal(parsed.interaction_id, TEST_INTERACTION);
  assert.equal(parsed.evidence_hash, 'sha256:evidence_hash_here');

  assert.equal(receiver.deduplicate(envelope.webhook_id), true);
});

test('unregister stops future deliveries', () => {
  const registry = new WebhookRegistry();
  const reg = registry.register({
    interaction_id: TEST_INTERACTION,
    callback_url: TEST_CALLBACK,
    events: ['task.transition'],
    secret: TEST_SECRET,
  });

  assert.equal(registry.getRegistrations(TEST_INTERACTION).length, 1);
  const removed = registry.unregister(TEST_INTERACTION, reg.registration_id);
  assert.equal(removed, true);
  assert.equal(registry.getRegistrations(TEST_INTERACTION).length, 0);
});

test('HMAC signature produces valid hex', () => {
  const body = '{"test":"data"}';
  const sig = signWebhook(body, TEST_SECRET);
  assert.equal(typeof sig, 'string');
  assert.equal(sig.length, 64);
  assert.ok(verifyWebhookSignature(body, sig, TEST_SECRET));
  assert.ok(!verifyWebhookSignature(body, signWebhook('{"other":"data"}', TEST_SECRET), TEST_SECRET));
});
