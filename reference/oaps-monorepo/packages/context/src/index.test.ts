import test from 'node:test';
import assert from 'node:assert/strict';

import { InteractionContext } from './index.js';
import type { ActorRef, DelegationToken } from '@oaps/core';
import { verifyEvidenceChain } from '@oaps/evidence';

const alice: ActorRef = { actor_id: 'urn:oaps:actor:agent:alice' };
const bob: ActorRef = { actor_id: 'urn:oaps:actor:agent:bob' };
const charlie: ActorRef = { actor_id: 'urn:oaps:actor:agent:charlie' };

function makeDelegation(from: ActorRef, to: ActorRef): DelegationToken {
  return {
    delegation_id: 'dlg_test_1',
    delegator: from,
    delegatee: to,
    scope: ['context:transfer'],
    expires_at: '2030-01-01T00:00:00Z',
  };
}

test('create context with 2 participants', () => {
  const ctx = InteractionContext.create(alice, bob, 'ix_1');
  const snap = ctx.snapshot();

  assert.equal(snap.participants.length, 2);
  assert.equal(snap.participants[0]!.actor_id, alice.actor_id);
  assert.equal(snap.participants[1]!.actor_id, bob.actor_id);
  assert.equal(snap.interaction_id, 'ix_1');
  assert.equal(snap.current_state, 'intent_received');
  assert.equal(snap.messages.length, 0);
  assert.equal(snap.transitions.length, 0);
});

test('appendMessage updates context and emits evidence', () => {
  const ctx = InteractionContext.create(alice, bob, 'ix_1');
  const msg = ctx.appendMessage({
    role: 'actor',
    actor_ref: alice,
    content: { text: 'Hello' },
  });

  const snap = ctx.snapshot();
  assert.equal(snap.messages.length, 1);
  assert.equal(snap.messages[0]!.message_id, msg.message_id);
  assert.equal(snap.messages[0]!.interaction_id, 'ix_1');
  assert.equal(snap.evidence_chain.length, 1);
  assert.equal(snap.evidence_chain[0]!.event_type, 'context.message_appended');
  assert.equal(msg.evidence_ref, snap.evidence_chain[0]!.event_id);
});

test('appendTransition changes state and emits evidence', () => {
  const ctx = InteractionContext.create(alice, bob, 'ix_1');
  const tr = ctx.appendTransition('intent_received', 'executing', alice);

  const snap = ctx.snapshot();
  assert.equal(snap.current_state, 'executing');
  assert.equal(snap.transitions.length, 1);
  assert.equal(snap.transitions[0]!.transition_id, tr.transition_id);
  assert.equal(snap.evidence_chain.length, 1);
  assert.equal(snap.evidence_chain[0]!.event_type, 'context.transition_appended');
});

test('snapshot returns complete state', () => {
  const ctx = InteractionContext.create(alice, bob, 'ix_1', {
    context_id: 'ctx_snap',
    state: 'intent_received',
  });
  ctx.appendMessage({ role: 'actor', actor_ref: alice, content: { text: 'Hi' } });
  ctx.appendTransition('intent_received', 'executing', alice);

  const snap = ctx.snapshot();
  assert.equal(snap.context_id, 'ctx_snap');
  assert.equal(snap.interaction_id, 'ix_1');
  assert.equal(snap.participants.length, 2);
  assert.equal(snap.messages.length, 1);
  assert.equal(snap.transitions.length, 1);
  assert.equal(snap.evidence_chain.length, 2);
  assert.equal(snap.current_state, 'executing');
  assert.equal(snap.delegations.length, 0);
  assert.ok(snap.created_at);
  assert.ok(snap.updated_at);
});

test('incremental replay returns only new items', () => {
  const ctx = InteractionContext.create(alice, bob, 'ix_1');
  ctx.appendMessage({ role: 'actor', actor_ref: alice, content: { text: 'First' } });
  ctx.appendMessage({ role: 'peer', actor_ref: bob, content: { text: 'Second' } });
  ctx.appendMessage({ role: 'actor', actor_ref: alice, content: { text: 'Third' } });

  const replay = ctx.replaySince(2);
  assert.equal(replay.messages.length, 1);
  assert.equal(replay.messages[0]!.content.text, 'Third');
  assert.equal(replay.evidence_events.length, 1);
});

test('evidence chain is hash-verifiable', () => {
  const ctx = InteractionContext.create(alice, bob, 'ix_1');
  ctx.appendMessage({ role: 'actor', actor_ref: alice, content: { text: 'Hello' } });
  ctx.appendMessage({ role: 'peer', actor_ref: bob, content: { text: 'World' } });
  ctx.appendTransition('intent_received', 'executing', alice);

  const result = ctx.verifyIntegrity();
  assert.deepEqual(result, { ok: true });
});

test('tampered evidence detected on verifyIntegrity', () => {
  const ctx = InteractionContext.create(alice, bob, 'ix_1');
  ctx.appendMessage({ role: 'actor', actor_ref: alice, content: { text: 'Hello' } });

  const chain = ctx.getEvidenceChain();
  chain.events[0]!.event_type = 'tampered';

  const result = verifyEvidenceChain(chain);
  assert.equal(result.ok, false);
});

test('context transfer preserves evidence chain', () => {
  const ctx = InteractionContext.create(alice, bob, 'ix_1');
  ctx.appendMessage({ role: 'actor', actor_ref: alice, content: { text: 'Hello' } });

  const delegation = makeDelegation(alice, charlie);
  const bundle = ctx.transfer(charlie, delegation);

  assert.equal(bundle.delegation.delegation_id, 'dlg_test_1');
  assert.ok(bundle.context.evidence_chain.length >= 2);

  const chainResult = verifyEvidenceChain({ events: bundle.context.evidence_chain });
  assert.deepEqual(chainResult, { ok: true });
});

test('delegation visible in transferred context', () => {
  const ctx = InteractionContext.create(alice, bob, 'ix_1');
  const delegation = makeDelegation(alice, charlie);
  const bundle = ctx.transfer(charlie, delegation);

  assert.equal(bundle.context.delegations.length, 1);
  assert.equal(bundle.context.delegations[0]!.delegation_id, 'dlg_test_1');
  assert.equal(bundle.context.delegations[0]!.delegatee.actor_id, charlie.actor_id);

  const transferEvents = bundle.context.evidence_chain.filter(
    (e) => e.event_type === 'context.transferred',
  );
  assert.equal(transferEvents.length, 1);
});

test('multi-agent (3 participants) works', () => {
  const ctx = InteractionContext.create(alice, bob, 'ix_1');
  ctx.addParticipant(charlie);

  const snap = ctx.snapshot();
  assert.equal(snap.participants.length, 3);
  assert.equal(snap.participants[2]!.actor_id, charlie.actor_id);

  const participantEvents = snap.evidence_chain.filter(
    (e) => e.event_type === 'context.participant_added',
  );
  assert.equal(participantEvents.length, 1);
});

test('out-of-order evidence fails closed', () => {
  const ctx = InteractionContext.create(alice, bob, 'ix_1');
  ctx.appendMessage({ role: 'actor', actor_ref: alice, content: { text: 'First' } });
  ctx.appendMessage({ role: 'peer', actor_ref: bob, content: { text: 'Second' } });

  const chain = ctx.getEvidenceChain();
  chain.events[1]!.prev_event_hash = 'sha256:deadbeef';

  const result = verifyEvidenceChain(chain);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'prev_event_hash mismatch');
});

test('full lifecycle: create → messages → transition → transfer → verify', () => {
  const ctx = InteractionContext.create(alice, bob, 'ix_lifecycle');

  ctx.appendMessage({ role: 'actor', actor_ref: alice, content: { text: 'Read config.yaml' } });
  ctx.appendMessage({ role: 'peer', actor_ref: bob, content: { text: 'PostgreSQL 15 with pooling.' } });

  ctx.appendTransition('intent_received', 'executing', alice);

  ctx.appendMessage({ role: 'actor', actor_ref: alice, content: { text: 'Delegating to Charlie.' } });

  const delegation = makeDelegation(alice, charlie);
  const bundle = ctx.transfer(charlie, delegation);

  assert.equal(bundle.context.messages.length, 3);
  assert.equal(bundle.context.transitions.length, 1);
  assert.equal(bundle.context.current_state, 'executing');
  assert.equal(bundle.context.participants.length, 3);
  assert.equal(bundle.context.delegations.length, 1);

  const chainResult = verifyEvidenceChain({ events: bundle.context.evidence_chain });
  assert.deepEqual(chainResult, { ok: true });

  assert.ok(bundle.context.evidence_chain.length >= 5);
});

test('addParticipant is idempotent for existing participants', () => {
  const ctx = InteractionContext.create(alice, bob, 'ix_1');
  ctx.addParticipant(alice);

  const snap = ctx.snapshot();
  assert.equal(snap.participants.length, 2);
  assert.equal(snap.evidence_chain.length, 0);
});

test('illegal transition throws OapsError', () => {
  const ctx = InteractionContext.create(alice, bob, 'ix_1');
  assert.throws(
    () => ctx.appendTransition('intent_received', 'archived', alice),
    { name: 'OapsError' },
  );
});
