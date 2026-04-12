import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  type ActorRef,
  type Action,
  type Mandate,
  generateId,
  assertMandateAuthorizes,
  OapsError,
} from '@oaps/core';
import {
  createEvidenceChain,
  appendEvidenceEvent,
  verifyEvidenceChain,
  hashEvidenceValue,
} from '@oaps/evidence';

function actor(name: string, prefix = 'agt'): ActorRef {
  return { actor_id: generateId(prefix), display_name: name };
}

function makeMandate(
  principal: ActorRef,
  delegatee: ActorRef,
  action: Action,
  opts: { expiresInMs?: number } = {},
): Mandate {
  const expiresAt = new Date(Date.now() + (opts.expiresInMs ?? 3_600_000));
  return {
    mandate_id: generateId('mdt'),
    principal,
    delegatee,
    action,
    expires_at: expiresAt.toISOString(),
    delegation_ref: generateId('dlg'),
  };
}

const payAction: Action = {
  verb: 'pay',
  target: 'stripe:payment_intent',
  amount: { value: '49.99', currency: 'USD' },
};

describe('Mandate verification', () => {
  const owner = actor('Owner', 'usr');
  const agent = actor('Agent');

  it('accepts a valid, non-expired mandate', () => {
    const mandate = makeMandate(owner, agent, payAction);
    assert.doesNotThrow(() => assertMandateAuthorizes(mandate, payAction));
  });

  it('rejects an expired mandate with MANDATE_EXPIRED', () => {
    const mandate = makeMandate(owner, agent, payAction, { expiresInMs: -1000 });
    try {
      assertMandateAuthorizes(mandate, payAction);
      assert.fail('Expected OapsError');
    } catch (err) {
      assert.ok(err instanceof OapsError);
      assert.equal(err.error.code, 'MANDATE_EXPIRED');
      assert.equal(err.error.category, 'authorization');
    }
  });

  it('rejects a scope mismatch with MANDATE_SCOPE_MISMATCH', () => {
    const mandate = makeMandate(owner, agent, payAction);
    const wrongAction: Action = { verb: 'refund', target: 'stripe:payment_intent' };
    try {
      assertMandateAuthorizes(mandate, wrongAction);
      assert.fail('Expected OapsError');
    } catch (err) {
      assert.ok(err instanceof OapsError);
      assert.equal(err.error.code, 'MANDATE_SCOPE_MISMATCH');
      assert.equal(err.error.category, 'authorization');
    }
  });

  it('rejects a target mismatch with MANDATE_SCOPE_MISMATCH', () => {
    const mandate = makeMandate(owner, agent, payAction);
    const wrongTarget: Action = { verb: 'pay', target: 'other:service' };
    try {
      assertMandateAuthorizes(mandate, wrongTarget);
      assert.fail('Expected OapsError');
    } catch (err) {
      assert.ok(err instanceof OapsError);
      assert.equal(err.error.code, 'MANDATE_SCOPE_MISMATCH');
    }
  });
});

describe('Evidence chain', () => {
  const interactionId = generateId('ixn');
  const agentId = generateId('agt');

  it('builds a hash-linked chain that verifies', () => {
    const chain = createEvidenceChain();

    appendEvidenceEvent(chain, {
      interaction_id: interactionId,
      event_type: 'mandate.created',
      actor: agentId,
      input_hash: hashEvidenceValue({ test: true }),
    });

    appendEvidenceEvent(chain, {
      interaction_id: interactionId,
      event_type: 'mandate.verified',
      actor: agentId,
    });

    appendEvidenceEvent(chain, {
      interaction_id: interactionId,
      event_type: 'payment.authorized',
      actor: agentId,
      output_hash: hashEvidenceValue({ pi_id: 'pi_test_123' }),
    });

    appendEvidenceEvent(chain, {
      interaction_id: interactionId,
      event_type: 'payment.confirmed',
      actor: agentId,
    });

    assert.equal(chain.events.length, 4);
    const result = verifyEvidenceChain(chain);
    assert.deepEqual(result, { ok: true });
  });

  it('each event references the previous event hash', () => {
    const chain = createEvidenceChain();

    const e1 = appendEvidenceEvent(chain, {
      interaction_id: interactionId,
      event_type: 'step.one',
      actor: agentId,
    });

    const e2 = appendEvidenceEvent(chain, {
      interaction_id: interactionId,
      event_type: 'step.two',
      actor: agentId,
    });

    assert.equal(e1.prev_event_hash, 'sha256:0');
    assert.equal(e2.prev_event_hash, e1.event_hash);
  });

  it('detects tampering in the chain', () => {
    const chain = createEvidenceChain();

    appendEvidenceEvent(chain, {
      interaction_id: interactionId,
      event_type: 'first',
      actor: agentId,
    });

    appendEvidenceEvent(chain, {
      interaction_id: interactionId,
      event_type: 'second',
      actor: agentId,
    });

    // Tamper with the first event
    chain.events[0]!.event_hash = 'sha256:tampered';

    const result = verifyEvidenceChain(chain);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.reason.includes('mismatch'));
    }
  });
});

describe('Full governance flow (Stripe mocked)', () => {
  it('completes the full mandate → verify → pay → evidence flow', async () => {
    const owner = actor('Alice', 'usr');
    const agent = actor('PurchaseBot', 'agt');
    const interactionId = generateId('ixn');

    // Create mandate
    const mandate = makeMandate(owner, agent, payAction);

    // Verify mandate
    assertMandateAuthorizes(mandate, payAction);

    // Mock Stripe PaymentIntent (no API key needed)
    const mockPaymentIntent = {
      id: 'pi_mock_test_abc123',
      status: 'requires_payment_method',
      client_secret: 'pi_mock_secret',
    };

    // Build evidence chain
    const chain = createEvidenceChain();

    appendEvidenceEvent(chain, {
      interaction_id: interactionId,
      event_type: 'mandate.created',
      actor: owner.actor_id,
      input_hash: hashEvidenceValue(mandate),
    });

    appendEvidenceEvent(chain, {
      interaction_id: interactionId,
      event_type: 'mandate.verified',
      actor: agent.actor_id,
      metadata: { mandate_id: mandate.mandate_id },
    });

    appendEvidenceEvent(chain, {
      interaction_id: interactionId,
      event_type: 'payment.authorized',
      actor: agent.actor_id,
      output_hash: hashEvidenceValue(mockPaymentIntent),
      metadata: { stripe_pi: mockPaymentIntent.id },
    });

    appendEvidenceEvent(chain, {
      interaction_id: interactionId,
      event_type: 'payment.confirmed',
      actor: agent.actor_id,
    });

    // Verify entire chain
    assert.equal(chain.events.length, 4);
    assert.deepEqual(verifyEvidenceChain(chain), { ok: true });

    // Verify event types are in order
    const types = chain.events.map((e) => e.event_type);
    assert.deepEqual(types, [
      'mandate.created',
      'mandate.verified',
      'payment.authorized',
      'payment.confirmed',
    ]);
  });
});
