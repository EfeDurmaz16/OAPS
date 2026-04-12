import Stripe from 'stripe';
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

const INTERACTION_ID = generateId('ixn');

function createActor(name: string, type: 'human' | 'agent'): ActorRef {
  return {
    actor_id: generateId(type === 'human' ? 'usr' : 'agt'),
    display_name: name,
  };
}

function createMandate(
  principal: ActorRef,
  delegatee: ActorRef,
  action: Action,
  expiresInMinutes: number,
): Mandate {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInMinutes * 60_000);
  return {
    mandate_id: generateId('mdt'),
    principal,
    delegatee,
    action,
    expires_at: expiresAt.toISOString(),
    delegation_ref: generateId('dlg'),
    metadata: { created_at: now.toISOString() },
  };
}

async function createStripePaymentIntent(
  amountCents: number,
  currency: string,
  metadata: Record<string, string>,
): Promise<{ id: string; status: string; client_secret: string | null }> {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    console.log('\n⚠  STRIPE_SECRET_KEY not set — simulating PaymentIntent creation');
    return {
      id: `pi_simulated_${Date.now()}`,
      status: 'requires_payment_method',
      client_secret: null,
    };
  }

  const stripe = new Stripe(apiKey);
  try {
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });
    return {
      id: intent.id,
      status: intent.status,
      client_secret: intent.client_secret,
    };
  } catch (err) {
    console.error('Stripe API error:', (err as Error).message);
    throw err;
  }
}

async function main() {
  console.log('=== AICP + Stripe Payment Governance Demo ===\n');

  // 1. Create actors
  const owner = createActor('Alice (Account Owner)', 'human');
  const agent = createActor('PurchaseBot-7', 'agent');
  console.log(`Principal : ${owner.display_name} (${owner.actor_id})`);
  console.log(`Agent     : ${agent.display_name} (${agent.actor_id})`);

  // 2. Define the action the agent wants to perform
  const purchaseAction: Action = {
    verb: 'pay',
    target: 'stripe:payment_intent',
    amount: { value: '49.99', currency: 'USD' },
    arguments: { description: 'Cloud API credits — monthly quota' },
  };
  console.log(`\nAction: ${purchaseAction.verb} ${purchaseAction.amount!.value} ${purchaseAction.amount!.currency} → ${purchaseAction.target}`);

  // 3. Create a mandate authorizing the agent to spend up to $100
  const mandate = createMandate(owner, agent, purchaseAction, 60);
  console.log(`\nMandate ${mandate.mandate_id}`);
  console.log(`  scope  : ${mandate.action.verb} on ${mandate.action.target}`);
  console.log(`  expires: ${mandate.expires_at}`);

  // 4. Start evidence chain
  const chain = createEvidenceChain();

  // Evidence: mandate created
  appendEvidenceEvent(chain, {
    interaction_id: INTERACTION_ID,
    event_type: 'mandate.created',
    actor: owner.actor_id,
    input_hash: hashEvidenceValue(mandate),
  });

  // 5. Validate the mandate
  console.log('\n--- Mandate Verification ---');
  try {
    assertMandateAuthorizes(mandate, purchaseAction);
    console.log('✓ Mandate covers the requested action and is not expired');
  } catch (err) {
    if (err instanceof OapsError) {
      console.error(`✗ Mandate verification failed: ${err.error.code}`);
      return;
    }
    throw err;
  }

  appendEvidenceEvent(chain, {
    interaction_id: INTERACTION_ID,
    event_type: 'mandate.verified',
    actor: agent.actor_id,
    metadata: { mandate_id: mandate.mandate_id, status: 'valid' },
  });

  // 6. Create Stripe PaymentIntent
  console.log('\n--- Stripe Payment Authorization ---');
  const amountCents = Math.round(parseFloat(purchaseAction.amount!.value) * 100);
  const paymentIntent = await createStripePaymentIntent(amountCents, 'usd', {
    oaps_interaction_id: INTERACTION_ID,
    oaps_mandate_id: mandate.mandate_id,
    oaps_agent_id: agent.actor_id,
  });
  console.log(`PaymentIntent: ${paymentIntent.id} (${paymentIntent.status})`);

  appendEvidenceEvent(chain, {
    interaction_id: INTERACTION_ID,
    event_type: 'payment.authorized',
    actor: agent.actor_id,
    output_hash: hashEvidenceValue(paymentIntent),
    metadata: {
      stripe_payment_intent_id: paymentIntent.id,
      amount_cents: amountCents,
      currency: 'usd',
    },
  });

  // 7. Record confirmation
  appendEvidenceEvent(chain, {
    interaction_id: INTERACTION_ID,
    event_type: 'payment.confirmed',
    actor: agent.actor_id,
    metadata: {
      stripe_payment_intent_id: paymentIntent.id,
      mandate_id: mandate.mandate_id,
      interaction_id: INTERACTION_ID,
    },
  });

  // 8. Verify evidence chain integrity
  console.log('\n--- Evidence Chain ---');
  const verification = verifyEvidenceChain(chain);
  console.log(`Chain length : ${chain.events.length} events`);
  console.log(`Integrity    : ${verification.ok ? '✓ verified' : '✗ BROKEN'}`);

  console.log('\nEvents:');
  for (const event of chain.events) {
    console.log(`  [${event.event_type}] ${event.event_id}`);
    console.log(`    hash     : ${event.event_hash}`);
    console.log(`    prev_hash: ${event.prev_event_hash}`);
  }

  console.log('\n=== Demo complete ===');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
