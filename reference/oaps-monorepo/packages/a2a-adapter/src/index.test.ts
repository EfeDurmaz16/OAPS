import test from 'node:test';
import assert from 'node:assert/strict';

import { createEvidenceChain, verifyEvidenceChain } from '@oaps/evidence';

import {
  OapsA2AAdapter,
  mapAgentCardToActorRef,
  mapA2AStatusToInteractionState,
  mapA2AStatusToTaskState,
} from './index.js';
import type { A2ATask, A2AAgentCard, A2AAdapterContext } from './index.js';
import type { ActorRef } from '@oaps/core';

function makeCtx(overrides?: Partial<A2AAdapterContext>): A2AAdapterContext {
  return {
    actor: { actor_id: 'urn:oaps:actor:agent:requester', display_name: 'Requester' },
    interactionId: 'ix_test',
    chain: createEvidenceChain(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Agent card mapping
// ---------------------------------------------------------------------------

test('mapAgentCardToActorRef maps an A2A agent card to an OAPS ActorRef', () => {
  const card: A2AAgentCard = {
    name: 'Travel Planner',
    description: 'Plans trips',
    url: 'https://agents.example.com/travel',
    capabilities: ['flights', 'hotels'],
  };

  const ref = mapAgentCardToActorRef(card);
  assert.equal(ref.actor_id, 'urn:oaps:actor:agent:travel-planner');
  assert.equal(ref.display_name, 'Travel Planner');
  assert.equal(ref.endpoint_hint, 'https://agents.example.com/travel');
});

// ---------------------------------------------------------------------------
// Status mapping
// ---------------------------------------------------------------------------

test('mapA2AStatusToInteractionState maps all A2A statuses correctly', () => {
  assert.equal(mapA2AStatusToInteractionState('submitted'), 'intent_received');
  assert.equal(mapA2AStatusToInteractionState('working'), 'executing');
  assert.equal(mapA2AStatusToInteractionState('input-required'), 'pending_approval');
  assert.equal(mapA2AStatusToInteractionState('completed'), 'completed');
  assert.equal(mapA2AStatusToInteractionState('failed'), 'failed');
  assert.equal(mapA2AStatusToInteractionState('canceled'), 'revoked');
});

test('mapA2AStatusToTaskState maps all A2A statuses correctly', () => {
  assert.equal(mapA2AStatusToTaskState('submitted'), 'created');
  assert.equal(mapA2AStatusToTaskState('working'), 'running');
  assert.equal(mapA2AStatusToTaskState('input-required'), 'pending_approval');
  assert.equal(mapA2AStatusToTaskState('completed'), 'completed');
  assert.equal(mapA2AStatusToTaskState('failed'), 'failed');
  assert.equal(mapA2AStatusToTaskState('canceled'), 'revoked');
});

// ---------------------------------------------------------------------------
// Task creation → AICP intent_received interaction
// ---------------------------------------------------------------------------

test('A2A task creation maps to AICP intent_received interaction with evidence', () => {
  const adapter = new OapsA2AAdapter();
  const ctx = makeCtx();

  const a2aTask: A2ATask = {
    id: 'task-001',
    status: 'submitted',
    messages: [{ role: 'user', parts: [{ type: 'text', text: 'Book a flight' }] }],
    metadata: { priority: 'high' },
  };

  const result = adapter.mapTaskCreation(a2aTask, ctx);

  assert.equal(result.interaction.state, 'intent_received');
  assert.equal(result.interaction.interaction_id, 'ix_test');
  assert.equal(result.task.state, 'created');
  assert.ok(result.task.task_id.startsWith('task_'));
  assert.equal(result.task.metadata?.a2a_task_id, 'task-001');
  assert.equal(result.intent.object, 'a2a:task:task-001');
  assert.equal(ctx.chain.events.length, 1);
  assert.equal(ctx.chain.events[0]?.event_type, 'a2a.task.created');
});

// ---------------------------------------------------------------------------
// A2A task in_progress → AICP executing state
// ---------------------------------------------------------------------------

test('A2A working status maps to AICP executing state', () => {
  const adapter = new OapsA2AAdapter();
  const ctx = makeCtx();

  const a2aTask: A2ATask = { id: 'task-002', status: 'submitted' };
  const creation = adapter.mapTaskCreation(a2aTask, ctx);

  const updatedA2ATask: A2ATask = { id: 'task-002', status: 'working' };
  const transition = adapter.mapTaskTransition(updatedA2ATask, 'intent_received', creation.task, ctx);

  assert.equal(transition.interaction.state, 'executing');
  assert.equal(transition.task.state, 'running');
  assert.ok(!transition.execution);
  assert.ok(!transition.approvalRequest);

  const transitionEvent = ctx.chain.events.find((e) => e.event_type === 'a2a.task.working');
  assert.ok(transitionEvent);
  assert.equal(transitionEvent.metadata?.from_interaction_state, 'intent_received');
  assert.equal(transitionEvent.metadata?.to_interaction_state, 'executing');
});

// ---------------------------------------------------------------------------
// A2A task waiting on review → AICP pending_approval
// ---------------------------------------------------------------------------

test('A2A input-required status maps to AICP pending_approval with approval request', () => {
  const adapter = new OapsA2AAdapter();
  const ctx = makeCtx();

  const a2aTask: A2ATask = { id: 'task-003', status: 'submitted' };
  const creation = adapter.mapTaskCreation(a2aTask, ctx);

  const waitingTask: A2ATask = { id: 'task-003', status: 'input-required' };
  const transition = adapter.mapTaskTransition(waitingTask, 'intent_received', creation.task, ctx);

  assert.equal(transition.interaction.state, 'pending_approval');
  assert.equal(transition.task.state, 'pending_approval');
  assert.ok(transition.approvalRequest);
  assert.ok(transition.approvalRequest!.approval_request_id.startsWith('apr_'));
  assert.equal(transition.approvalRequest!.interaction_id, 'ix_test');

  const approvalEvt = ctx.chain.events.find((e) => e.event_type === 'a2a.approval.requested');
  assert.ok(approvalEvt);
});

// ---------------------------------------------------------------------------
// A2A task completed → AICP completed + ExecutionResult
// ---------------------------------------------------------------------------

test('A2A completed status maps to AICP completed with ExecutionResult', () => {
  const adapter = new OapsA2AAdapter();
  const ctx = makeCtx();

  const a2aTask: A2ATask = { id: 'task-004', status: 'submitted' };
  const creation = adapter.mapTaskCreation(a2aTask, ctx);

  const completedTask: A2ATask = {
    id: 'task-004',
    status: 'completed',
    result: [{ type: 'text', text: 'Flight booked: AA123' }],
  };
  const transition = adapter.mapTaskTransition(completedTask, 'executing', creation.task, ctx);

  assert.equal(transition.interaction.state, 'completed');
  assert.equal(transition.task.state, 'completed');
  assert.ok(transition.execution);
  assert.equal(transition.execution!.status, 'success');
  assert.ok(transition.execution!.execution_id.startsWith('exe_'));

  const completionEvt = ctx.chain.events.find((e) => e.event_type === 'a2a.task.execution.completed');
  assert.ok(completionEvt);
  assert.ok(completionEvt.output_hash?.startsWith('sha256:'));
});

// ---------------------------------------------------------------------------
// A2A task failed → AICP failed
// ---------------------------------------------------------------------------

test('A2A failed status maps to AICP failed with evidence', () => {
  const adapter = new OapsA2AAdapter();
  const ctx = makeCtx();

  const a2aTask: A2ATask = { id: 'task-005', status: 'submitted' };
  const creation = adapter.mapTaskCreation(a2aTask, ctx);

  const failedTask: A2ATask = {
    id: 'task-005',
    status: 'failed',
    metadata: { error: 'No seats available' },
  };
  const transition = adapter.mapTaskTransition(failedTask, 'executing', creation.task, ctx);

  assert.equal(transition.interaction.state, 'failed');
  assert.equal(transition.task.state, 'failed');
  assert.ok(!transition.execution);

  const failEvt = ctx.chain.events.find((e) => e.event_type === 'a2a.task.execution.failed');
  assert.ok(failEvt);
  assert.equal(failEvt.metadata?.failure_detail, 'No seats available');
});

// ---------------------------------------------------------------------------
// A2A task canceled → AICP revoked
// ---------------------------------------------------------------------------

test('A2A canceled status maps to AICP revoked', () => {
  const adapter = new OapsA2AAdapter();
  const ctx = makeCtx();

  const a2aTask: A2ATask = { id: 'task-006', status: 'submitted' };
  const creation = adapter.mapTaskCreation(a2aTask, ctx);

  const canceledTask: A2ATask = { id: 'task-006', status: 'canceled' };
  const transition = adapter.mapTaskTransition(canceledTask, 'executing', creation.task, ctx);

  assert.equal(transition.interaction.state, 'revoked');
  assert.equal(transition.task.state, 'revoked');
});

// ---------------------------------------------------------------------------
// A2A task handoff → AICP delegation carryover
// ---------------------------------------------------------------------------

test('A2A task handoff creates delegation with parent-child task linkage', () => {
  const adapter = new OapsA2AAdapter();
  const ctx = makeCtx();

  const parentA2A: A2ATask = { id: 'task-parent', status: 'working' };
  const childA2A: A2ATask = { id: 'task-child', status: 'submitted' };

  const parentCreation = adapter.mapTaskCreation(parentA2A, ctx);

  const delegator: ActorRef = { actor_id: 'urn:oaps:actor:agent:primary', display_name: 'Primary Agent' };
  const delegatee: ActorRef = { actor_id: 'urn:oaps:actor:agent:specialist', display_name: 'Specialist Agent' };

  const result = adapter.mapDelegation(parentA2A, childA2A, delegator, delegatee, parentCreation.task, ctx);

  assert.ok(result.delegation.delegation_id.startsWith('del_'));
  assert.equal(result.delegation.delegator.actor_id, delegator.actor_id);
  assert.equal(result.delegation.delegatee.actor_id, delegatee.actor_id);
  assert.deepEqual(result.delegation.scope, ['a2a:task:task-parent']);
  assert.equal(result.childTask.parent_task_id, parentCreation.task.task_id);
  assert.equal(result.childTask.assignee?.actor_id, delegatee.actor_id);
  assert.equal(result.childTask.metadata?.delegation_id, result.delegation.delegation_id);

  const delegationEvt = ctx.chain.events.find((e) => e.event_type === 'a2a.delegation.created');
  assert.ok(delegationEvt);
  assert.equal(delegationEvt.metadata?.parent_a2a_task_id, 'task-parent');
  assert.equal(delegationEvt.metadata?.child_a2a_task_id, 'task-child');
});

// ---------------------------------------------------------------------------
// Evidence emission for every state transition
// ---------------------------------------------------------------------------

test('evidence is emitted for every A2A task state transition', () => {
  const adapter = new OapsA2AAdapter();
  const ctx = makeCtx();

  const a2aTask: A2ATask = { id: 'task-full', status: 'submitted' };
  const creation = adapter.mapTaskCreation(a2aTask, ctx);
  assert.equal(ctx.chain.events.length, 1);

  const working: A2ATask = { id: 'task-full', status: 'working' };
  const t1 = adapter.mapTaskTransition(working, 'intent_received', creation.task, ctx);
  assert.ok(ctx.chain.events.length >= 2);

  const inputRequired: A2ATask = { id: 'task-full', status: 'input-required' };
  const t2 = adapter.mapTaskTransition(inputRequired, 'executing', t1.task, ctx);
  const approvalEvents = ctx.chain.events.filter((e) => e.event_type === 'a2a.approval.requested');
  assert.equal(approvalEvents.length, 1);

  const resumed: A2ATask = { id: 'task-full', status: 'working' };
  const t3 = adapter.mapTaskTransition(resumed, 'pending_approval', t2.task, ctx);

  const completed: A2ATask = {
    id: 'task-full',
    status: 'completed',
    result: [{ type: 'text', text: 'Done' }],
  };
  adapter.mapTaskTransition(completed, 'executing', t3.task, ctx);

  const eventTypes = ctx.chain.events.map((e) => e.event_type);
  assert.ok(eventTypes.includes('a2a.task.created'));
  assert.ok(eventTypes.includes('a2a.task.working'));
  assert.ok(eventTypes.includes('a2a.task.input-required'));
  assert.ok(eventTypes.includes('a2a.approval.requested'));
  assert.ok(eventTypes.includes('a2a.task.completed'));
  assert.ok(eventTypes.includes('a2a.task.execution.completed'));
});

// ---------------------------------------------------------------------------
// Evidence chain integrity
// ---------------------------------------------------------------------------

test('evidence chain is cryptographically verifiable after full lifecycle', () => {
  const adapter = new OapsA2AAdapter();
  const ctx = makeCtx();

  const a2aTask: A2ATask = { id: 'task-verify', status: 'submitted' };
  const creation = adapter.mapTaskCreation(a2aTask, ctx);

  const working: A2ATask = { id: 'task-verify', status: 'working' };
  const t1 = adapter.mapTaskTransition(working, 'intent_received', creation.task, ctx);

  const completed: A2ATask = {
    id: 'task-verify',
    status: 'completed',
    result: [{ type: 'text', text: 'Done' }],
  };
  adapter.mapTaskTransition(completed, 'executing', t1.task, ctx);

  const verification = verifyEvidenceChain(ctx.chain);
  assert.ok(verification.ok);
});
