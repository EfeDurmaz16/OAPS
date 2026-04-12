import test from 'node:test';
import assert from 'node:assert/strict';

import { createEvidenceChain, verifyEvidenceChain } from '@oaps/evidence';
import type { ActorRef, Mandate } from '@oaps/core';

import {
  OapsX402Adapter,
} from './index.js';
import type {
  X402AdapterContext,
  X402ChallengeResponse,
  X402PaymentAuthorization,
  X402SettlementConfirmation,
  X402RefundRequest,
} from './index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACTOR: ActorRef = {
  actor_id: 'urn:oaps:actor:agent:payer',
  display_name: 'Payer Agent',
};

function makeCtx(overrides?: Partial<X402AdapterContext>): X402AdapterContext {
  return {
    actor: ACTOR,
    interactionId: 'ix_x402_test',
    chain: createEvidenceChain(),
    ...overrides,
  };
}

function makeMandate(overrides?: Partial<Mandate>): Mandate {
  return {
    mandate_id: 'mnd_test_001',
    principal: { actor_id: 'urn:oaps:actor:human:owner' },
    delegatee: ACTOR,
    action: { verb: 'pay', target: 'merchant:shop-42', amount: { value: '25.00', currency: 'USD' } },
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

function makeChallengeResponse(): X402ChallengeResponse {
  return {
    status: 402,
    payment_required: {
      amount: { value: '25.00', currency: 'USD' },
      recipient: 'merchant:shop-42',
      description: 'API access fee',
      accepts: ['x402-usdc', 'x402-lightning'],
    },
  };
}

function makeAuthorization(): X402PaymentAuthorization {
  return {
    authorization_id: 'auth_x402_001',
    payer: ACTOR.actor_id,
    amount: { value: '25.00', currency: 'USD' },
    recipient: 'merchant:shop-42',
    payment_method: 'x402-usdc',
  };
}

function makeSettlement(): X402SettlementConfirmation {
  return {
    settlement_id: 'stl_x402_001',
    authorization_ref: 'auth_x402_001',
    amount: { value: '25.00', currency: 'USD' },
    settled_at: new Date().toISOString(),
    rail: 'usdc-base',
  };
}

// ---------------------------------------------------------------------------
// 1. x402 challenge response maps to AICP Challenge
// ---------------------------------------------------------------------------

test('x402 challenge response maps to AICP Challenge with payment_authorization_required type', () => {
  const adapter = new OapsX402Adapter();
  const ctx = makeCtx();
  const x402 = makeChallengeResponse();

  const result = adapter.mapChallengeResponse(x402, ctx);

  assert.equal(result.challenge.challenge_type, 'payment_authorization_required');
  assert.equal(result.challenge.status, 'open');
  assert.equal(result.challenge.interaction_id, 'ix_x402_test');
  assert.ok(result.challenge.challenge_id.startsWith('chl_'));
  assert.equal(result.challenge.challenged_by.actor_id, ACTOR.actor_id);
  assert.deepEqual(result.challenge.instructions?.amount, { value: '25.00', currency: 'USD' });
  assert.equal(result.challenge.instructions?.recipient, 'merchant:shop-42');
  assert.equal(result.challenge.metadata?.http_status, 402);
  assert.equal(result.challenge.metadata?.source_profile, 'oaps-x402-v1');

  assert.equal(ctx.chain.events.length, 1);
  assert.equal(ctx.chain.events[0]?.event_type, 'x402.challenge.issued');
  assert.ok(ctx.chain.events[0]?.input_hash?.startsWith('sha256:'));
});

// ---------------------------------------------------------------------------
// 2. Mandate chain verification passes for valid mandate
// ---------------------------------------------------------------------------

test('mandate chain verification passes for valid mandate and produces PaymentAuthorization', () => {
  const adapter = new OapsX402Adapter();
  const mandate = makeMandate();
  const ctx = makeCtx({ mandate });
  const auth = makeAuthorization();

  const result = adapter.mapPaymentAuthorization(auth, ctx);

  assert.equal(result.paymentState, 'authorized');
  assert.equal(result.execution.status, 'success');
  assert.ok(result.execution.execution_id.startsWith('exe_'));
  assert.equal(result.execution.metadata?.mandate_id, mandate.mandate_id);
  assert.equal(result.evidence.event_type, 'x402.payment.authorized');
  assert.equal(result.evidence.metadata?.mandate_id, mandate.mandate_id);
  assert.equal(result.evidence.metadata?.authorization_id, 'auth_x402_001');
});

// ---------------------------------------------------------------------------
// 3. Mandate chain verification fails for expired mandate
// ---------------------------------------------------------------------------

test('mandate chain verification fails for expired mandate with MANDATE_EXPIRED', () => {
  const adapter = new OapsX402Adapter();
  const expired = makeMandate({ expires_at: new Date(Date.now() - 1000).toISOString() });
  const ctx = makeCtx({ mandate: expired });
  const auth = makeAuthorization();

  assert.throws(
    () => adapter.mapPaymentAuthorization(auth, ctx),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.equal((err as any).error.code, 'MANDATE_EXPIRED');
      assert.equal((err as any).error.category, 'authorization');
      return true;
    },
  );
});

// ---------------------------------------------------------------------------
// 4. Mandate chain verification fails for scope mismatch
// ---------------------------------------------------------------------------

test('mandate chain verification fails for scope mismatch with MANDATE_SCOPE_MISMATCH', () => {
  const adapter = new OapsX402Adapter();
  const wrongScope = makeMandate({
    action: { verb: 'pay', target: 'merchant:other-shop' },
  });
  const ctx = makeCtx({ mandate: wrongScope });
  const auth = makeAuthorization();

  assert.throws(
    () => adapter.mapPaymentAuthorization(auth, ctx),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.equal((err as any).error.code, 'MANDATE_SCOPE_MISMATCH');
      assert.equal((err as any).error.category, 'authorization');
      return true;
    },
  );
});

// ---------------------------------------------------------------------------
// 5. Payment authorization maps to AICP evidence event
// ---------------------------------------------------------------------------

test('payment authorization maps to AICP evidence event with correct fields', () => {
  const adapter = new OapsX402Adapter();
  const ctx = makeCtx();
  const auth = makeAuthorization();

  const result = adapter.mapPaymentAuthorization(auth, ctx);

  assert.equal(result.evidence.interaction_id, 'ix_x402_test');
  assert.equal(result.evidence.event_type, 'x402.payment.authorized');
  assert.equal(result.evidence.actor, ACTOR.actor_id);
  assert.ok(result.evidence.input_hash?.startsWith('sha256:'));
  assert.equal(result.evidence.metadata?.payment_state, 'authorized');
  assert.equal(result.evidence.metadata?.payer, ACTOR.actor_id);
  assert.equal(result.evidence.metadata?.recipient, 'merchant:shop-42');
});

// ---------------------------------------------------------------------------
// 6. Settlement confirmation emits settlement evidence
// ---------------------------------------------------------------------------

test('settlement confirmation emits settlement evidence', () => {
  const adapter = new OapsX402Adapter();
  const ctx = makeCtx();
  const settlement = makeSettlement();

  const result = adapter.mapSettlementConfirmation(settlement, ctx);

  assert.equal(result.paymentState, 'settled');
  assert.equal(result.execution.status, 'success');
  assert.ok(result.execution.execution_id.startsWith('exe_'));
  assert.equal(result.evidence.event_type, 'x402.payment.settled');
  assert.ok(result.evidence.output_hash?.startsWith('sha256:'));
  assert.equal(result.evidence.metadata?.settlement_id, 'stl_x402_001');
  assert.equal(result.evidence.metadata?.authorization_ref, 'auth_x402_001');
  assert.equal(result.evidence.metadata?.rail, 'usdc-base');
});

// ---------------------------------------------------------------------------
// 7. Refund maps to compensated state with evidence
// ---------------------------------------------------------------------------

test('refund maps to refunded state with evidence', () => {
  const adapter = new OapsX402Adapter();
  const ctx = makeCtx();
  const refund: X402RefundRequest = {
    refund_id: 'ref_001',
    settlement_ref: 'stl_x402_001',
    amount: { value: '25.00', currency: 'USD' },
    reason: 'Service not rendered',
  };

  const result = adapter.mapRefund(refund, ctx);

  assert.equal(result.paymentState, 'refunded');
  assert.equal(result.evidence.event_type, 'x402.payment.refunded');
  assert.equal(result.evidence.metadata?.refund_id, 'ref_001');
  assert.equal(result.evidence.metadata?.settlement_ref, 'stl_x402_001');
  assert.equal(result.evidence.metadata?.reason, 'Service not rendered');
  assert.ok(result.evidence.input_hash?.startsWith('sha256:'));
});

// ---------------------------------------------------------------------------
// 8. Full lifecycle: challenge -> authorize -> settle -> evidence chain
// ---------------------------------------------------------------------------

test('full lifecycle: challenge -> authorize -> settle -> evidence chain verification', () => {
  const adapter = new OapsX402Adapter();
  const mandate = makeMandate();
  const ctx = makeCtx({ mandate });

  const challengeResult = adapter.mapChallengeResponse(makeChallengeResponse(), ctx);
  assert.equal(challengeResult.challenge.challenge_type, 'payment_authorization_required');

  const authResult = adapter.mapPaymentAuthorization(makeAuthorization(), ctx);
  assert.equal(authResult.paymentState, 'authorized');

  const settlementResult = adapter.mapSettlementConfirmation(makeSettlement(), ctx);
  assert.equal(settlementResult.paymentState, 'settled');

  assert.equal(ctx.chain.events.length, 3);

  const eventTypes = ctx.chain.events.map((e) => e.event_type);
  assert.deepEqual(eventTypes, [
    'x402.challenge.issued',
    'x402.payment.authorized',
    'x402.payment.settled',
  ]);

  const verification = verifyEvidenceChain(ctx.chain);
  assert.ok(verification.ok);
});

// ---------------------------------------------------------------------------
// 9. Evidence chain is hash-linked and cryptographically verifiable
// ---------------------------------------------------------------------------

test('evidence chain is hash-linked and cryptographically verifiable', () => {
  const adapter = new OapsX402Adapter();
  const ctx = makeCtx();

  adapter.mapChallengeResponse(makeChallengeResponse(), ctx);
  adapter.mapPaymentAuthorization(makeAuthorization(), ctx);
  adapter.mapSettlementConfirmation(makeSettlement(), ctx);
  adapter.mapRefund({
    refund_id: 'ref_chain',
    settlement_ref: 'stl_x402_001',
    amount: { value: '25.00', currency: 'USD' },
  }, ctx);
  adapter.mapVoid('auth_x402_001', 'duplicate', ctx);

  assert.equal(ctx.chain.events.length, 5);

  for (let i = 1; i < ctx.chain.events.length; i++) {
    assert.equal(ctx.chain.events[i]!.prev_event_hash, ctx.chain.events[i - 1]!.event_hash);
  }

  assert.equal(ctx.chain.events[0]!.prev_event_hash, 'sha256:0');

  const verification = verifyEvidenceChain(ctx.chain);
  assert.ok(verification.ok);
});

// ---------------------------------------------------------------------------
// 10. Payment session binds to interaction_id
// ---------------------------------------------------------------------------

test('payment session binds to interaction_id per FOUNDATION-DRAFT PaymentCoordination MUST', () => {
  const adapter = new OapsX402Adapter();
  const interactionId = 'ix_bound_session_42';
  const ctx = makeCtx({ interactionId });

  adapter.mapChallengeResponse(makeChallengeResponse(), ctx);
  adapter.mapPaymentAuthorization(makeAuthorization(), ctx);
  adapter.mapSettlementConfirmation(makeSettlement(), ctx);

  for (const event of ctx.chain.events) {
    assert.equal(event.interaction_id, interactionId);
  }
});

// ---------------------------------------------------------------------------
// 11. Void emits evidence
// ---------------------------------------------------------------------------

test('void emits evidence with correct payment state', () => {
  const adapter = new OapsX402Adapter();
  const ctx = makeCtx();

  const result = adapter.mapVoid('auth_void_001', 'cancelled by user', ctx);

  assert.equal(result.paymentState, 'voided');
  assert.equal(result.evidence.event_type, 'x402.payment.voided');
  assert.equal(result.evidence.metadata?.authorization_id, 'auth_void_001');
  assert.equal(result.evidence.metadata?.reason, 'cancelled by user');
});

// ---------------------------------------------------------------------------
// 12. Authorization without mandate proceeds without mandate verification
// ---------------------------------------------------------------------------

test('authorization without mandate proceeds without mandate verification', () => {
  const adapter = new OapsX402Adapter();
  const ctx = makeCtx();
  const auth = makeAuthorization();

  const result = adapter.mapPaymentAuthorization(auth, ctx);

  assert.equal(result.paymentState, 'authorized');
  assert.equal(result.execution.status, 'success');
  assert.equal(result.execution.metadata?.mandate_id, undefined);
});
