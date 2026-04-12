import {
  type ActorRef,
  type InteractionState,
  type InteractionTransition,
  type EvidenceEvent,
  type DelegationToken,
  generateId,
  assertInteractionTransition,
} from '@oaps/core';
import {
  type EvidenceChain,
  createEvidenceChain,
  appendEvidenceEvent,
  verifyEvidenceChain,
} from '@oaps/evidence';

export interface Message {
  message_id: string;
  interaction_id: string;
  role: string;
  actor_ref: ActorRef;
  content: Record<string, unknown>;
  content_type?: string;
  in_reply_to?: string;
  evidence_ref?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface InteractionContextSnapshot {
  context_id: string;
  interaction_id: string;
  participants: ActorRef[];
  messages: Message[];
  transitions: InteractionTransition[];
  evidence_chain: EvidenceEvent[];
  delegations: DelegationToken[];
  current_state: InteractionState;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface IncrementalReplay {
  messages: Message[];
  transitions: InteractionTransition[];
  evidence_events: EvidenceEvent[];
}

export interface TransferBundle {
  context: InteractionContextSnapshot;
  delegation: DelegationToken;
}

export class InteractionContext {
  private context_id: string;
  private interaction_id: string;
  private participants: ActorRef[];
  private messages: Message[] = [];
  private transitions: InteractionTransition[] = [];
  private evidenceChain: EvidenceChain;
  private delegations: DelegationToken[] = [];
  private current_state: InteractionState;
  private created_at: string;
  private updated_at: string;
  private metadata?: Record<string, unknown>;

  private constructor(
    contextId: string,
    interactionId: string,
    participants: ActorRef[],
    state: InteractionState,
    createdAt: string,
  ) {
    this.context_id = contextId;
    this.interaction_id = interactionId;
    this.participants = [...participants];
    this.evidenceChain = createEvidenceChain();
    this.current_state = state;
    this.created_at = createdAt;
    this.updated_at = createdAt;
  }

  static create(
    initiator: ActorRef,
    responder: ActorRef,
    interactionId: string,
    options?: { context_id?: string; state?: InteractionState; created_at?: string },
  ): InteractionContext {
    const now = options?.created_at ?? new Date().toISOString();
    const contextId = options?.context_id ?? generateId('ctx');
    const state = options?.state ?? 'intent_received';
    return new InteractionContext(contextId, interactionId, [initiator, responder], state, now);
  }

  appendMessage(message: Omit<Message, 'interaction_id' | 'message_id' | 'created_at' | 'evidence_ref'> & Partial<Pick<Message, 'message_id' | 'created_at'>>): Message {
    const now = message.created_at ?? new Date().toISOString();
    const evidence = appendEvidenceEvent(this.evidenceChain, {
      interaction_id: this.interaction_id,
      event_type: 'context.message_appended',
      actor: message.actor_ref.actor_id,
    });

    const fullMessage: Message = {
      ...message,
      message_id: message.message_id ?? generateId('msg'),
      interaction_id: this.interaction_id,
      created_at: now,
      evidence_ref: evidence.event_id,
    };

    this.messages.push(fullMessage);
    this.updated_at = now;
    return fullMessage;
  }

  appendTransition(
    fromState: InteractionState,
    toState: InteractionState,
    triggeredBy: ActorRef,
    options?: { reason?: string; timestamp?: string; transition_id?: string },
  ): InteractionTransition {
    assertInteractionTransition(fromState, toState);

    const now = options?.timestamp ?? new Date().toISOString();
    const transition: InteractionTransition = {
      transition_id: options?.transition_id ?? generateId('tr'),
      interaction_id: this.interaction_id,
      from_state: fromState,
      to_state: toState,
      triggered_by: triggeredBy,
      reason: options?.reason,
      timestamp: now,
    };

    appendEvidenceEvent(this.evidenceChain, {
      interaction_id: this.interaction_id,
      event_type: 'context.transition_appended',
      actor: triggeredBy.actor_id,
    });

    this.transitions.push(transition);
    this.current_state = toState;
    this.updated_at = now;
    return transition;
  }

  addParticipant(actor: ActorRef): void {
    if (this.participants.some((p) => p.actor_id === actor.actor_id)) return;

    appendEvidenceEvent(this.evidenceChain, {
      interaction_id: this.interaction_id,
      event_type: 'context.participant_added',
      actor: actor.actor_id,
    });

    this.participants.push(actor);
    this.updated_at = new Date().toISOString();
  }

  addDelegation(delegation: DelegationToken): void {
    appendEvidenceEvent(this.evidenceChain, {
      interaction_id: this.interaction_id,
      event_type: 'context.delegation_added',
      actor: delegation.delegator.actor_id,
    });

    this.delegations.push(delegation);
    this.updated_at = new Date().toISOString();
  }

  snapshot(): InteractionContextSnapshot {
    return {
      context_id: this.context_id,
      interaction_id: this.interaction_id,
      participants: [...this.participants],
      messages: [...this.messages],
      transitions: [...this.transitions],
      evidence_chain: [...this.evidenceChain.events],
      delegations: [...this.delegations],
      current_state: this.current_state,
      created_at: this.created_at,
      updated_at: this.updated_at,
      metadata: this.metadata,
    };
  }

  replaySince(cursor: number): IncrementalReplay {
    const messages = this.messages.filter((_, i) => i >= cursor);
    const transitions = this.transitions.filter((_, i) => i >= cursor);
    const evidence_events = this.evidenceChain.events.filter((_, i) => i >= cursor);
    return { messages, transitions, evidence_events };
  }

  verifyIntegrity(): { ok: true } | { ok: false; index: number; reason: string } {
    return verifyEvidenceChain(this.evidenceChain);
  }

  transfer(toActor: ActorRef, delegation: DelegationToken): TransferBundle {
    this.addDelegation(delegation);

    appendEvidenceEvent(this.evidenceChain, {
      interaction_id: this.interaction_id,
      event_type: 'context.transferred',
      actor: delegation.delegator.actor_id,
    });

    if (!this.participants.some((p) => p.actor_id === toActor.actor_id)) {
      this.participants.push(toActor);
    }

    this.updated_at = new Date().toISOString();

    return {
      context: this.snapshot(),
      delegation,
    };
  }

  getState(): InteractionState {
    return this.current_state;
  }

  getParticipants(): ActorRef[] {
    return [...this.participants];
  }

  getEvidenceChain(): EvidenceChain {
    return { events: [...this.evidenceChain.events] };
  }
}
