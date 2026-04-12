import {
  ActorRef,
  DelegationToken,
  OapsError,
  assertAuthenticatedActor,
  generateId,
  parseBearerToken,
} from '@oaps/core';
import { EvidenceChain, appendEvidenceEvent } from '@oaps/evidence';

export type AuthMethod = 'session' | 'bearer';

export interface SessionCredential {
  method: 'session';
  session_id: string;
  actor_id: string;
  metadata?: Record<string, unknown>;
}

export interface BearerCredential {
  method: 'bearer';
  token: string;
  actor_id: string;
  metadata?: Record<string, unknown>;
}

export type WebCredential = SessionCredential | BearerCredential;

export interface SubjectBinding {
  authenticated_actor_id: string;
  method: AuthMethod;
  bound_at: string;
  metadata?: Record<string, unknown>;
}

export interface AuthWebAdapterContext {
  interactionId: string;
  chain: EvidenceChain;
}

export interface AuthenticateResult {
  binding: SubjectBinding;
}

export interface DelegationVerificationResult {
  delegation: DelegationToken;
  delegator: ActorRef;
  delegatee: ActorRef;
}

export interface AuthWebFlowResult {
  binding: SubjectBinding;
  delegation?: DelegationVerificationResult;
  evidenceEventIds: string[];
}

function credentialActorId(credential: WebCredential): string {
  return credential.actor_id;
}

export class OapsAuthWebAdapter {
  authenticate(credential: WebCredential, ctx: AuthWebAdapterContext): AuthenticateResult {
    const actorId = credentialActorId(credential);

    const binding: SubjectBinding = {
      authenticated_actor_id: actorId,
      method: credential.method,
      bound_at: new Date().toISOString(),
      metadata: credential.metadata,
    };

    appendEvidenceEvent(ctx.chain, {
      interaction_id: ctx.interactionId,
      event_type: 'auth-web.authenticated',
      actor: actorId,
      metadata: {
        method: credential.method,
        session_id: credential.method === 'session' ? (credential as SessionCredential).session_id : undefined,
      },
    });

    return { binding };
  }

  authenticateFromHeader(
    authorizationHeader: string | undefined,
    resolveActorId: (token: string) => string,
    ctx: AuthWebAdapterContext,
  ): AuthenticateResult {
    const token = parseBearerToken(authorizationHeader);
    if (!token) {
      throw new OapsError({
        code: 'AUTHENTICATION_FAILED',
        category: 'authentication',
        message: 'Missing or malformed Authorization header',
        retryable: false,
      });
    }

    const actorId = resolveActorId(token);
    return this.authenticate({ method: 'bearer', token, actor_id: actorId }, ctx);
  }

  bindSubject(
    binding: SubjectBinding,
    actor: ActorRef,
    ctx: AuthWebAdapterContext,
    delegation?: DelegationToken,
  ): void {
    try {
      assertAuthenticatedActor(binding.authenticated_actor_id, actor, delegation);
    } catch (error) {
      appendEvidenceEvent(ctx.chain, {
        interaction_id: ctx.interactionId,
        event_type: 'auth-web.subject-binding.failed',
        actor: binding.authenticated_actor_id,
        metadata: {
          authenticated_actor_id: binding.authenticated_actor_id,
          envelope_actor_id: actor.actor_id,
          delegation_id: delegation?.delegation_id,
          error_code: (error as OapsError).error.code,
        },
      });
      throw error;
    }

    appendEvidenceEvent(ctx.chain, {
      interaction_id: ctx.interactionId,
      event_type: 'auth-web.subject-binding.success',
      actor: binding.authenticated_actor_id,
      metadata: {
        authenticated_actor_id: binding.authenticated_actor_id,
        envelope_actor_id: actor.actor_id,
        method: binding.method,
        delegation_id: delegation?.delegation_id,
      },
    });
  }

  verifyDelegation(
    binding: SubjectBinding,
    actor: ActorRef,
    delegation: DelegationToken,
    ctx: AuthWebAdapterContext,
  ): DelegationVerificationResult {
    this.bindSubject(binding, actor, ctx, delegation);

    appendEvidenceEvent(ctx.chain, {
      interaction_id: ctx.interactionId,
      event_type: 'auth-web.delegation.verified',
      actor: binding.authenticated_actor_id,
      metadata: {
        delegation_id: delegation.delegation_id,
        delegator_id: delegation.delegator.actor_id,
        delegatee_id: delegation.delegatee.actor_id,
        expires_at: delegation.expires_at,
        scope: delegation.scope,
      },
    });

    return {
      delegation,
      delegator: delegation.delegator,
      delegatee: delegation.delegatee,
    };
  }

  executeFlow(
    credential: WebCredential,
    actor: ActorRef,
    ctx: AuthWebAdapterContext,
    delegation?: DelegationToken,
  ): AuthWebFlowResult {
    const { binding } = this.authenticate(credential, ctx);
    this.bindSubject(binding, actor, ctx, delegation);

    let delegationResult: DelegationVerificationResult | undefined;
    if (delegation) {
      delegationResult = this.verifyDelegation(binding, actor, delegation, ctx);
    }

    const evidenceEventIds = ctx.chain.events.map((e) => e.event_id);

    return {
      binding,
      delegation: delegationResult,
      evidenceEventIds,
    };
  }
}
