import test from 'node:test';
import assert from 'node:assert/strict';

import { createEvidenceChain, verifyEvidenceChain } from '@oaps/evidence';

import { OapsAuthWebAdapter } from './index.js';
import type { AuthWebAdapterContext, SessionCredential, BearerCredential } from './index.js';
import type { ActorRef, DelegationToken } from '@oaps/core';

function makeCtx(overrides?: Partial<AuthWebAdapterContext>): AuthWebAdapterContext {
  return {
    interactionId: 'ix_test',
    chain: createEvidenceChain(),
    ...overrides,
  };
}

const actorAlice: ActorRef = { actor_id: 'urn:oaps:actor:human:alice', display_name: 'Alice' };
const actorBob: ActorRef = { actor_id: 'urn:oaps:actor:agent:bob', display_name: 'Bob' };

function validDelegation(overrides?: Partial<DelegationToken>): DelegationToken {
  return {
    delegation_id: 'del_test_001',
    delegator: actorAlice,
    delegatee: actorBob,
    scope: ['interactions:*'],
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

function expiredDelegation(): DelegationToken {
  return validDelegation({
    delegation_id: 'del_expired_001',
    expires_at: new Date(Date.now() - 60 * 1000).toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Session-based auth maps to Actor subject binding
// ---------------------------------------------------------------------------

test('session-based auth maps to Actor subject binding', () => {
  const adapter = new OapsAuthWebAdapter();
  const ctx = makeCtx();

  const credential: SessionCredential = {
    method: 'session',
    session_id: 'sess_abc123',
    actor_id: actorAlice.actor_id,
  };

  const { binding } = adapter.authenticate(credential, ctx);

  assert.equal(binding.authenticated_actor_id, actorAlice.actor_id);
  assert.equal(binding.method, 'session');
  assert.ok(binding.bound_at);

  assert.equal(ctx.chain.events.length, 1);
  assert.equal(ctx.chain.events[0]?.event_type, 'auth-web.authenticated');
  assert.equal(ctx.chain.events[0]?.metadata?.method, 'session');
  assert.equal(ctx.chain.events[0]?.metadata?.session_id, 'sess_abc123');
});

// ---------------------------------------------------------------------------
// Token-based auth maps to Actor subject binding
// ---------------------------------------------------------------------------

test('token-based auth maps to Actor subject binding', () => {
  const adapter = new OapsAuthWebAdapter();
  const ctx = makeCtx();

  const credential: BearerCredential = {
    method: 'bearer',
    token: 'eyJhbGciOiJSUzI1NiJ9.test',
    actor_id: actorAlice.actor_id,
  };

  const { binding } = adapter.authenticate(credential, ctx);

  assert.equal(binding.authenticated_actor_id, actorAlice.actor_id);
  assert.equal(binding.method, 'bearer');

  assert.equal(ctx.chain.events.length, 1);
  assert.equal(ctx.chain.events[0]?.event_type, 'auth-web.authenticated');
  assert.equal(ctx.chain.events[0]?.metadata?.method, 'bearer');
});

// ---------------------------------------------------------------------------
// Subject mismatch emits AUTHENTICATED_SUBJECT_MISMATCH
// ---------------------------------------------------------------------------

test('subject mismatch emits AUTHENTICATED_SUBJECT_MISMATCH', () => {
  const adapter = new OapsAuthWebAdapter();
  const ctx = makeCtx();

  const credential: SessionCredential = {
    method: 'session',
    session_id: 'sess_mismatch',
    actor_id: 'urn:oaps:actor:human:mallory',
  };

  const { binding } = adapter.authenticate(credential, ctx);

  assert.throws(
    () => adapter.bindSubject(binding, actorAlice, ctx),
    (error: unknown) =>
      error instanceof Error &&
      (error as { error?: { code?: string } }).error?.code === 'AUTHENTICATED_SUBJECT_MISMATCH',
  );

  const failEvent = ctx.chain.events.find((e) => e.event_type === 'auth-web.subject-binding.failed');
  assert.ok(failEvent);
  assert.equal(failEvent.metadata?.error_code, 'AUTHENTICATED_SUBJECT_MISMATCH');
  assert.equal(failEvent.metadata?.authenticated_actor_id, 'urn:oaps:actor:human:mallory');
  assert.equal(failEvent.metadata?.envelope_actor_id, actorAlice.actor_id);
});

// ---------------------------------------------------------------------------
// Valid delegation allows acting on behalf of another actor
// ---------------------------------------------------------------------------

test('valid delegation allows acting on behalf of another actor', () => {
  const adapter = new OapsAuthWebAdapter();
  const ctx = makeCtx();

  const credential: BearerCredential = {
    method: 'bearer',
    token: 'delegation-token',
    actor_id: actorAlice.actor_id,
  };

  const { binding } = adapter.authenticate(credential, ctx);
  const delegation = validDelegation();

  const result = adapter.verifyDelegation(binding, actorBob, delegation, ctx);

  assert.equal(result.delegation.delegation_id, 'del_test_001');
  assert.equal(result.delegator.actor_id, actorAlice.actor_id);
  assert.equal(result.delegatee.actor_id, actorBob.actor_id);

  const delegationEvt = ctx.chain.events.find((e) => e.event_type === 'auth-web.delegation.verified');
  assert.ok(delegationEvt);
  assert.equal(delegationEvt.metadata?.delegation_id, 'del_test_001');
});

// ---------------------------------------------------------------------------
// Expired delegation fails closed with DELEGATION_EXPIRED
// ---------------------------------------------------------------------------

test('expired delegation fails closed with DELEGATION_EXPIRED', () => {
  const adapter = new OapsAuthWebAdapter();
  const ctx = makeCtx();

  const credential: BearerCredential = {
    method: 'bearer',
    token: 'expired-delegation-token',
    actor_id: actorAlice.actor_id,
  };

  const { binding } = adapter.authenticate(credential, ctx);
  const delegation = expiredDelegation();

  assert.throws(
    () => adapter.verifyDelegation(binding, actorBob, delegation, ctx),
    (error: unknown) =>
      error instanceof Error &&
      (error as { error?: { code?: string } }).error?.code === 'DELEGATION_EXPIRED',
  );

  const failEvent = ctx.chain.events.find((e) => e.event_type === 'auth-web.subject-binding.failed');
  assert.ok(failEvent);
  assert.equal(failEvent.metadata?.error_code, 'DELEGATION_EXPIRED');
});

// ---------------------------------------------------------------------------
// Evidence emitted for successful authentication
// ---------------------------------------------------------------------------

test('evidence emitted for successful authentication', () => {
  const adapter = new OapsAuthWebAdapter();
  const ctx = makeCtx();

  const credential: SessionCredential = {
    method: 'session',
    session_id: 'sess_evidence',
    actor_id: actorAlice.actor_id,
  };

  adapter.authenticate(credential, ctx);

  assert.equal(ctx.chain.events.length, 1);
  const evt = ctx.chain.events[0]!;
  assert.equal(evt.event_type, 'auth-web.authenticated');
  assert.equal(evt.actor, actorAlice.actor_id);
  assert.equal(evt.interaction_id, 'ix_test');
  assert.ok(evt.event_id.startsWith('evt_'));
  assert.ok(evt.event_hash?.startsWith('sha256:'));
});

// ---------------------------------------------------------------------------
// Evidence emitted for delegation verification
// ---------------------------------------------------------------------------

test('evidence emitted for delegation verification', () => {
  const adapter = new OapsAuthWebAdapter();
  const ctx = makeCtx();

  const credential: BearerCredential = {
    method: 'bearer',
    token: 'delegation-evidence-token',
    actor_id: actorAlice.actor_id,
  };

  const { binding } = adapter.authenticate(credential, ctx);
  const delegation = validDelegation();

  adapter.verifyDelegation(binding, actorBob, delegation, ctx);

  const eventTypes = ctx.chain.events.map((e) => e.event_type);
  assert.ok(eventTypes.includes('auth-web.authenticated'));
  assert.ok(eventTypes.includes('auth-web.subject-binding.success'));
  assert.ok(eventTypes.includes('auth-web.delegation.verified'));

  const delegationEvt = ctx.chain.events.find((e) => e.event_type === 'auth-web.delegation.verified')!;
  assert.equal(delegationEvt.metadata?.delegator_id, actorAlice.actor_id);
  assert.equal(delegationEvt.metadata?.delegatee_id, actorBob.actor_id);
  assert.deepEqual(delegationEvt.metadata?.scope, ['interactions:*']);
});

// ---------------------------------------------------------------------------
// Full flow: authenticate -> bind -> delegate -> verify -> evidence chain
// ---------------------------------------------------------------------------

test('full flow: authenticate -> bind -> delegate -> verify -> evidence chain', () => {
  const adapter = new OapsAuthWebAdapter();
  const ctx = makeCtx();

  const credential: BearerCredential = {
    method: 'bearer',
    token: 'full-flow-token',
    actor_id: actorAlice.actor_id,
  };
  const delegation = validDelegation();

  const result = adapter.executeFlow(credential, actorBob, ctx, delegation);

  assert.equal(result.binding.authenticated_actor_id, actorAlice.actor_id);
  assert.equal(result.binding.method, 'bearer');
  assert.ok(result.delegation);
  assert.equal(result.delegation!.delegation.delegation_id, 'del_test_001');
  assert.equal(result.delegation!.delegator.actor_id, actorAlice.actor_id);
  assert.equal(result.delegation!.delegatee.actor_id, actorBob.actor_id);
  assert.ok(result.evidenceEventIds.length >= 4);

  const eventTypes = ctx.chain.events.map((e) => e.event_type);
  assert.ok(eventTypes.includes('auth-web.authenticated'));
  assert.ok(eventTypes.includes('auth-web.subject-binding.success'));
  assert.ok(eventTypes.includes('auth-web.delegation.verified'));

  const verification = verifyEvidenceChain(ctx.chain);
  assert.ok(verification.ok);
});

// ---------------------------------------------------------------------------
// authenticateFromHeader with valid bearer token
// ---------------------------------------------------------------------------

test('authenticateFromHeader extracts bearer token and authenticates', () => {
  const adapter = new OapsAuthWebAdapter();
  const ctx = makeCtx();

  const { binding } = adapter.authenticateFromHeader(
    'Bearer tok_abc123',
    () => actorAlice.actor_id,
    ctx,
  );

  assert.equal(binding.authenticated_actor_id, actorAlice.actor_id);
  assert.equal(binding.method, 'bearer');
  assert.equal(ctx.chain.events.length, 1);
});

// ---------------------------------------------------------------------------
// authenticateFromHeader rejects missing header
// ---------------------------------------------------------------------------

test('authenticateFromHeader rejects missing Authorization header', () => {
  const adapter = new OapsAuthWebAdapter();
  const ctx = makeCtx();

  assert.throws(
    () => adapter.authenticateFromHeader(undefined, () => 'irrelevant', ctx),
    (error: unknown) =>
      error instanceof Error &&
      (error as { error?: { code?: string } }).error?.code === 'AUTHENTICATION_FAILED',
  );
});
