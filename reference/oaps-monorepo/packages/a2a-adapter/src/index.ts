import {
  ActorRef,
  ApprovalDecision,
  ApprovalRequest,
  DelegationToken,
  ExecutionResult,
  Intent,
  InteractionState,
  InteractionUpdated,
  OapsError,
  Task,
  TaskState,
  generateId,
  promoteIntentToTask,
  sha256Prefixed,
  toObjectResult,
} from '@oaps/core';
import { EvidenceChain, appendEvidenceEvent } from '@oaps/evidence';

// ---------------------------------------------------------------------------
// A2A types (defined locally per spec — no SDK dependency)
// ---------------------------------------------------------------------------

export type A2ATaskStatus =
  | 'submitted'
  | 'working'
  | 'input-required'
  | 'completed'
  | 'failed'
  | 'canceled';

export interface A2AAgentCard {
  name: string;
  description?: string;
  url: string;
  capabilities?: string[];
  metadata?: Record<string, unknown>;
}

export interface A2AMessage {
  role: 'user' | 'agent';
  parts: A2APart[];
  metadata?: Record<string, unknown>;
}

export type A2APart =
  | { type: 'text'; text: string }
  | { type: 'data'; data: Record<string, unknown> }
  | { type: 'file'; file: { name: string; uri: string } };

export interface A2ATask {
  id: string;
  status: A2ATaskStatus;
  messages?: A2AMessage[];
  result?: A2APart[];
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Mapping tables
// ---------------------------------------------------------------------------

const A2A_STATUS_TO_INTERACTION_STATE: Record<A2ATaskStatus, InteractionState> = {
  submitted: 'intent_received',
  working: 'executing',
  'input-required': 'pending_approval',
  completed: 'completed',
  failed: 'failed',
  canceled: 'revoked',
};

const A2A_STATUS_TO_TASK_STATE: Record<A2ATaskStatus, TaskState> = {
  submitted: 'created',
  working: 'running',
  'input-required': 'pending_approval',
  completed: 'completed',
  failed: 'failed',
  canceled: 'revoked',
};

// ---------------------------------------------------------------------------
// Agent card → ActorRef
// ---------------------------------------------------------------------------

export function mapAgentCardToActorRef(card: A2AAgentCard): ActorRef {
  return {
    actor_id: `urn:oaps:actor:agent:${encodeURIComponent(card.name.toLowerCase().replace(/\s+/g, '-'))}`,
    display_name: card.name,
    endpoint_hint: card.url,
  };
}

// ---------------------------------------------------------------------------
// Status mapping helpers
// ---------------------------------------------------------------------------

export function mapA2AStatusToInteractionState(status: A2ATaskStatus): InteractionState {
  return A2A_STATUS_TO_INTERACTION_STATE[status];
}

export function mapA2AStatusToTaskState(status: A2ATaskStatus): TaskState {
  return A2A_STATUS_TO_TASK_STATE[status];
}

// ---------------------------------------------------------------------------
// Adapter input / output types
// ---------------------------------------------------------------------------

export interface A2AAdapterContext {
  actor: ActorRef;
  interactionId: string;
  chain: EvidenceChain;
  delegation?: DelegationToken;
  approvalHandler?: (request: ApprovalRequest) => Promise<ApprovalDecision>;
}

export interface A2ATaskMappingResult {
  task: Task;
  interaction: InteractionUpdated;
  intent: Intent;
}

export interface A2ATransitionResult {
  interaction: InteractionUpdated;
  task: Task;
  execution?: ExecutionResult;
  approvalRequest?: ApprovalRequest;
}

export interface A2ADelegationResult {
  delegation: DelegationToken;
  parentTask: Task;
  childTask: Task;
}

// ---------------------------------------------------------------------------
// Core adapter
// ---------------------------------------------------------------------------

export class OapsA2AAdapter {
  mapTaskCreation(a2aTask: A2ATask, ctx: A2AAdapterContext): A2ATaskMappingResult {
    const intent: Intent = {
      intent_id: generateId('int'),
      verb: 'execute',
      object: `a2a:task:${a2aTask.id}`,
      constraints: a2aTask.metadata,
      metadata: {
        a2a_task_id: a2aTask.id,
        a2a_status: a2aTask.status,
      },
    };

    const task = promoteIntentToTask(intent, {
      requester: ctx.actor,
      state: mapA2AStatusToTaskState(a2aTask.status),
      metadata: {
        a2a_task_id: a2aTask.id,
        source_profile: 'oaps-a2a-v1',
      },
    });

    const interaction: InteractionUpdated = {
      interaction_id: ctx.interactionId,
      state: mapA2AStatusToInteractionState(a2aTask.status),
      timestamp: new Date().toISOString(),
      metadata: {
        a2a_task_id: a2aTask.id,
        task_id: task.task_id,
      },
    };

    appendEvidenceEvent(ctx.chain, {
      interaction_id: ctx.interactionId,
      event_type: 'a2a.task.created',
      actor: ctx.actor.actor_id,
      input_hash: sha256Prefixed(a2aTask),
      metadata: {
        a2a_task_id: a2aTask.id,
        a2a_status: a2aTask.status,
        oaps_interaction_state: interaction.state,
        oaps_task_state: task.state,
        task_id: task.task_id,
        intent_id: intent.intent_id,
      },
    });

    return { task, interaction, intent };
  }

  mapTaskTransition(
    a2aTask: A2ATask,
    previousState: InteractionState,
    currentTask: Task,
    ctx: A2AAdapterContext,
  ): A2ATransitionResult {
    const newInteractionState = mapA2AStatusToInteractionState(a2aTask.status);
    const newTaskState = mapA2AStatusToTaskState(a2aTask.status);

    const interaction: InteractionUpdated = {
      interaction_id: ctx.interactionId,
      state: newInteractionState,
      state_detail: a2aTask.metadata?.detail as string | undefined,
      timestamp: new Date().toISOString(),
      metadata: {
        a2a_task_id: a2aTask.id,
        a2a_status: a2aTask.status,
        previous_state: previousState,
      },
    };

    const updatedTask: Task = {
      ...currentTask,
      state: newTaskState,
      updated_at: new Date().toISOString(),
      metadata: {
        ...currentTask.metadata,
        a2a_status: a2aTask.status,
      },
    };

    appendEvidenceEvent(ctx.chain, {
      interaction_id: ctx.interactionId,
      event_type: `a2a.task.${a2aTask.status}`,
      actor: ctx.actor.actor_id,
      metadata: {
        a2a_task_id: a2aTask.id,
        a2a_status: a2aTask.status,
        from_interaction_state: previousState,
        to_interaction_state: newInteractionState,
        from_task_state: currentTask.state,
        to_task_state: newTaskState,
        task_id: currentTask.task_id,
      },
    });

    let execution: ExecutionResult | undefined;
    if (a2aTask.status === 'completed') {
      execution = {
        execution_id: generateId('exe'),
        status: 'success',
        result: a2aTask.result ? toObjectResult(a2aTask.result) : undefined,
        timestamp: new Date().toISOString(),
        metadata: {
          a2a_task_id: a2aTask.id,
          task_id: currentTask.task_id,
        },
      };

      appendEvidenceEvent(ctx.chain, {
        interaction_id: ctx.interactionId,
        event_type: 'a2a.task.execution.completed',
        actor: ctx.actor.actor_id,
        output_hash: a2aTask.result ? sha256Prefixed(a2aTask.result) : undefined,
        metadata: {
          execution_id: execution.execution_id,
          a2a_task_id: a2aTask.id,
          task_id: currentTask.task_id,
        },
      });
    }

    if (a2aTask.status === 'failed') {
      appendEvidenceEvent(ctx.chain, {
        interaction_id: ctx.interactionId,
        event_type: 'a2a.task.execution.failed',
        actor: ctx.actor.actor_id,
        metadata: {
          a2a_task_id: a2aTask.id,
          task_id: currentTask.task_id,
          failure_detail: a2aTask.metadata?.error,
        },
      });
    }

    let approvalRequest: ApprovalRequest | undefined;
    if (a2aTask.status === 'input-required') {
      approvalRequest = {
        approval_request_id: generateId('apr'),
        interaction_id: ctx.interactionId,
        requested_by: ctx.actor,
        requested_from: {
          actor_id: 'urn:oaps:actor:human:reviewer',
          display_name: 'Human Reviewer',
        },
        reason: `A2A task ${a2aTask.id} requires input before proceeding`,
        proposed_action: {
          verb: 'review',
          target: `a2a:task:${a2aTask.id}`,
        },
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        metadata: {
          a2a_task_id: a2aTask.id,
          task_id: currentTask.task_id,
        },
      };

      appendEvidenceEvent(ctx.chain, {
        interaction_id: ctx.interactionId,
        event_type: 'a2a.approval.requested',
        actor: ctx.actor.actor_id,
        metadata: {
          approval_request_id: approvalRequest.approval_request_id,
          a2a_task_id: a2aTask.id,
          task_id: currentTask.task_id,
        },
      });
    }

    return { interaction, task: updatedTask, execution, approvalRequest };
  }

  mapDelegation(
    parentA2ATask: A2ATask,
    childA2ATask: A2ATask,
    delegator: ActorRef,
    delegatee: ActorRef,
    parentTask: Task,
    ctx: A2AAdapterContext,
  ): A2ADelegationResult {
    const delegation: DelegationToken = {
      delegation_id: generateId('del'),
      delegator,
      delegatee,
      scope: [`a2a:task:${parentA2ATask.id}`],
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      metadata: {
        parent_a2a_task_id: parentA2ATask.id,
        child_a2a_task_id: childA2ATask.id,
        source_profile: 'oaps-a2a-v1',
      },
    };

    const childIntent: Intent = {
      intent_id: generateId('int'),
      verb: 'execute',
      object: `a2a:task:${childA2ATask.id}`,
      metadata: {
        a2a_task_id: childA2ATask.id,
        parent_a2a_task_id: parentA2ATask.id,
        delegation_id: delegation.delegation_id,
      },
    };

    const childTask = promoteIntentToTask(childIntent, {
      parent_task_id: parentTask.task_id,
      requester: delegator,
      assignee: delegatee,
      state: mapA2AStatusToTaskState(childA2ATask.status),
      metadata: {
        a2a_task_id: childA2ATask.id,
        parent_a2a_task_id: parentA2ATask.id,
        delegation_id: delegation.delegation_id,
        source_profile: 'oaps-a2a-v1',
      },
    });

    appendEvidenceEvent(ctx.chain, {
      interaction_id: ctx.interactionId,
      event_type: 'a2a.delegation.created',
      actor: delegator.actor_id,
      metadata: {
        delegation_id: delegation.delegation_id,
        parent_a2a_task_id: parentA2ATask.id,
        child_a2a_task_id: childA2ATask.id,
        parent_task_id: parentTask.task_id,
        child_task_id: childTask.task_id,
        delegator_id: delegator.actor_id,
        delegatee_id: delegatee.actor_id,
      },
    });

    return { delegation, parentTask, childTask };
  }
}
