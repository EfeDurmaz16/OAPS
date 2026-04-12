import {
  Action,
  ActorRef,
  Challenge,
  EvidenceEvent,
  ExecutionResult,
  Mandate,
  Money,
  OapsError,
  assertMandateAuthorizes,
  generateId,
  sha256Prefixed,
} from '@oaps/core';
import { EvidenceChain, appendEvidenceEvent } from '@oaps/evidence';

// ---------------------------------------------------------------------------
// x402 types (defined locally — no SDK dependency)
// ---------------------------------------------------------------------------

export type X402PaymentState =
  | 'challenge_issued'
  | 'authorized'
  | 'captured'
  | 'settled'
  | 'refunded'
  | 'voided';

export interface X402ChallengeResponse {
  status: 402;
  payment_required: {
    amount: Money;
    recipient: string;
    description?: string;
    accepts?: string[];
    expires_at?: string;
    metadata?: Record<string, unknown>;
  };
}

export interface X402PaymentAuthorization {
  authorization_id: string;
  payer: string;
  amount: Money;
  recipient: string;
  payment_method?: string;
  authorization_ref?: string;
  metadata?: Record<string, unknown>;
}

export interface X402SettlementConfirmation {
  settlement_id: string;
  authorization_ref: string;
  amount: Money;
  settled_at: string;
  rail?: string;
  metadata?: Record<string, unknown>;
}

export interface X402RefundRequest {
  refund_id: string;
  settlement_ref: string;
  amount: Money;
  reason?: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Adapter context and result types
// ---------------------------------------------------------------------------

export interface X402AdapterContext {
  actor: ActorRef;
  interactionId: string;
  chain: EvidenceChain;
  mandate?: Mandate;
  now?: Date;
}

export interface X402ChallengeResult {
  challenge: Challenge;
  evidence: EvidenceEvent;
}

export interface X402AuthorizationResult {
  execution: ExecutionResult;
  evidence: EvidenceEvent;
  paymentState: X402PaymentState;
}

export interface X402SettlementResult {
  execution: ExecutionResult;
  evidence: EvidenceEvent;
  paymentState: X402PaymentState;
}

export interface X402RefundResult {
  evidence: EvidenceEvent;
  paymentState: X402PaymentState;
}

export interface X402VoidResult {
  evidence: EvidenceEvent;
  paymentState: X402PaymentState;
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function buildPaymentAction(amount: Money, recipient: string): Action {
  return {
    verb: 'pay',
    target: recipient,
    amount,
  };
}

// ---------------------------------------------------------------------------
// Core adapter
// ---------------------------------------------------------------------------

export class OapsX402Adapter {
  mapChallengeResponse(
    x402Response: X402ChallengeResponse,
    ctx: X402AdapterContext,
  ): X402ChallengeResult {
    const challenge: Challenge = {
      challenge_id: generateId('chl'),
      interaction_id: ctx.interactionId,
      challenge_type: 'payment_authorization_required',
      status: 'open',
      challenged_by: ctx.actor,
      instructions: {
        amount: x402Response.payment_required.amount,
        recipient: x402Response.payment_required.recipient,
        description: x402Response.payment_required.description,
        accepts: x402Response.payment_required.accepts,
      },
      expires_at: x402Response.payment_required.expires_at,
      created_at: new Date().toISOString(),
      metadata: {
        source_profile: 'oaps-x402-v1',
        http_status: 402,
        ...x402Response.payment_required.metadata,
      },
    };

    const evidence = appendEvidenceEvent(ctx.chain, {
      interaction_id: ctx.interactionId,
      event_type: 'x402.challenge.issued',
      actor: ctx.actor.actor_id,
      input_hash: sha256Prefixed(x402Response),
      metadata: {
        challenge_id: challenge.challenge_id,
        amount_value: x402Response.payment_required.amount.value,
        amount_currency: x402Response.payment_required.amount.currency,
        recipient: x402Response.payment_required.recipient,
        payment_state: 'challenge_issued' satisfies X402PaymentState,
      },
    });

    return { challenge, evidence };
  }

  mapPaymentAuthorization(
    authorization: X402PaymentAuthorization,
    ctx: X402AdapterContext,
  ): X402AuthorizationResult {
    const action = buildPaymentAction(authorization.amount, authorization.recipient);
    const now = ctx.now ?? new Date();

    if (ctx.mandate) {
      assertMandateAuthorizes(ctx.mandate, action, now);
    }

    const execution: ExecutionResult = {
      execution_id: generateId('exe'),
      status: 'success',
      result: {
        authorization_id: authorization.authorization_id,
        payer: authorization.payer,
        amount: authorization.amount,
        recipient: authorization.recipient,
        payment_method: authorization.payment_method,
      },
      timestamp: new Date().toISOString(),
      metadata: {
        source_profile: 'oaps-x402-v1',
        payment_state: 'authorized' satisfies X402PaymentState,
        mandate_id: ctx.mandate?.mandate_id,
      },
    };

    const evidence = appendEvidenceEvent(ctx.chain, {
      interaction_id: ctx.interactionId,
      event_type: 'x402.payment.authorized',
      actor: ctx.actor.actor_id,
      input_hash: sha256Prefixed(authorization),
      metadata: {
        execution_id: execution.execution_id,
        authorization_id: authorization.authorization_id,
        payer: authorization.payer,
        amount_value: authorization.amount.value,
        amount_currency: authorization.amount.currency,
        recipient: authorization.recipient,
        mandate_id: ctx.mandate?.mandate_id,
        payment_state: 'authorized' satisfies X402PaymentState,
      },
    });

    return { execution, evidence, paymentState: 'authorized' };
  }

  mapSettlementConfirmation(
    settlement: X402SettlementConfirmation,
    ctx: X402AdapterContext,
  ): X402SettlementResult {
    const execution: ExecutionResult = {
      execution_id: generateId('exe'),
      status: 'success',
      result: {
        settlement_id: settlement.settlement_id,
        authorization_ref: settlement.authorization_ref,
        amount: settlement.amount,
        settled_at: settlement.settled_at,
        rail: settlement.rail,
      },
      timestamp: new Date().toISOString(),
      metadata: {
        source_profile: 'oaps-x402-v1',
        payment_state: 'settled' satisfies X402PaymentState,
      },
    };

    const evidence = appendEvidenceEvent(ctx.chain, {
      interaction_id: ctx.interactionId,
      event_type: 'x402.payment.settled',
      actor: ctx.actor.actor_id,
      output_hash: sha256Prefixed(settlement),
      metadata: {
        execution_id: execution.execution_id,
        settlement_id: settlement.settlement_id,
        authorization_ref: settlement.authorization_ref,
        amount_value: settlement.amount.value,
        amount_currency: settlement.amount.currency,
        settled_at: settlement.settled_at,
        rail: settlement.rail,
        payment_state: 'settled' satisfies X402PaymentState,
      },
    });

    return { execution, evidence, paymentState: 'settled' };
  }

  mapRefund(
    refund: X402RefundRequest,
    ctx: X402AdapterContext,
  ): X402RefundResult {
    const evidence = appendEvidenceEvent(ctx.chain, {
      interaction_id: ctx.interactionId,
      event_type: 'x402.payment.refunded',
      actor: ctx.actor.actor_id,
      input_hash: sha256Prefixed(refund),
      metadata: {
        refund_id: refund.refund_id,
        settlement_ref: refund.settlement_ref,
        amount_value: refund.amount.value,
        amount_currency: refund.amount.currency,
        reason: refund.reason,
        payment_state: 'refunded' satisfies X402PaymentState,
      },
    });

    return { evidence, paymentState: 'refunded' };
  }

  mapVoid(
    authorizationId: string,
    reason: string,
    ctx: X402AdapterContext,
  ): X402VoidResult {
    const evidence = appendEvidenceEvent(ctx.chain, {
      interaction_id: ctx.interactionId,
      event_type: 'x402.payment.voided',
      actor: ctx.actor.actor_id,
      metadata: {
        authorization_id: authorizationId,
        reason,
        payment_state: 'voided' satisfies X402PaymentState,
      },
    });

    return { evidence, paymentState: 'voided' };
  }
}
