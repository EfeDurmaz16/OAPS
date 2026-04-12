import {
  type ActorRef,
  type DelegationToken,
  type Task,
  type TaskState,
  OapsError,
  generateId,
  assertTaskTransition,
  promoteIntentToTask,
  sha256Prefixed,
} from '@oaps/core';
import {
  createEvidenceChain,
  appendEvidenceEvent,
  verifyEvidenceChain,
  type EvidenceChain,
} from '@oaps/evidence';

// ---------------------------------------------------------------------------
// Agent definitions
// ---------------------------------------------------------------------------

function createAgent(name: string): ActorRef {
  return { actor_id: generateId('agt'), display_name: name };
}

// ---------------------------------------------------------------------------
// Delegation with scope narrowing
// ---------------------------------------------------------------------------

export function createDelegation(
  delegator: ActorRef,
  delegatee: ActorRef,
  scope: string[],
  expiresInMinutes: number,
): DelegationToken {
  return {
    delegation_id: generateId('dlg'),
    delegator,
    delegatee,
    scope,
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + expiresInMinutes * 60_000).toISOString(),
  };
}

export function narrowScope(parentScope: string[], childScope: string[]): string[] {
  const allowed = childScope.filter((s) => parentScope.includes(s));
  if (allowed.length === 0) {
    throw new OapsError({
      code: 'POLICY_DENIED',
      category: 'authorization',
      message: 'Child scope has no overlap with parent scope — delegation denied',
      retryable: false,
      details: { parent_scope: parentScope, requested_scope: childScope },
    });
  }
  return allowed;
}

export function isDelegationExpired(delegation: DelegationToken, now: Date = new Date()): boolean {
  return now >= new Date(delegation.expires_at);
}

// ---------------------------------------------------------------------------
// Task lifecycle helpers
// ---------------------------------------------------------------------------

export function transitionTask(task: Task, to: TaskState, chain: EvidenceChain, actor: ActorRef): Task {
  assertTaskTransition(task.state, to);

  const now = new Date().toISOString();
  const updated: Task = { ...task, state: to, updated_at: now };

  appendEvidenceEvent(chain, {
    interaction_id: task.task_id,
    event_type: `task.${to}`,
    actor: actor.actor_id,
    metadata: {
      task_id: task.task_id,
      from_state: task.state,
      to_state: to,
    },
  });

  return updated;
}

// ---------------------------------------------------------------------------
// Multi-agent delegation chain demo
// ---------------------------------------------------------------------------

export interface DelegationChainResult {
  agentA: ActorRef;
  agentB: ActorRef;
  agentC: ActorRef;
  delegationAB: DelegationToken;
  delegationBC: DelegationToken;
  taskA: Task;
  taskB: Task;
  taskC: Task;
  chain: EvidenceChain;
  verified: boolean;
}

export function runDemo(opts?: { expireDelegationBC?: boolean }): DelegationChainResult {
  const chain = createEvidenceChain();

  // 1. Create agents
  const agentA = createAgent('Planner-A');
  const agentB = createAgent('Executor-B');
  const agentC = createAgent('Specialist-C');

  // 2. Agent A creates a task from an intent
  const intent = {
    intent_id: generateId('int'),
    verb: 'analyze',
    object: 'security-audit',
    constraints: { target: 'production', depth: 'full' },
  };

  let taskA = promoteIntentToTask(intent, {
    requester: agentA,
    assignee: agentA,
  });

  appendEvidenceEvent(chain, {
    interaction_id: taskA.task_id,
    event_type: 'task.created',
    actor: agentA.actor_id,
    input_hash: sha256Prefixed(intent),
    metadata: { task_id: taskA.task_id, intent_id: intent.intent_id },
  });

  // 3. Agent A delegates to Agent B with scoped delegation
  const scopeAB = ['security-audit:scan', 'security-audit:report', 'security-audit:remediate'];
  const delegationAB = createDelegation(agentA, agentB, scopeAB, 60);

  appendEvidenceEvent(chain, {
    interaction_id: taskA.task_id,
    event_type: 'delegation.created',
    actor: agentA.actor_id,
    metadata: {
      delegation_id: delegationAB.delegation_id,
      delegator: agentA.actor_id,
      delegatee: agentB.actor_id,
      scope: delegationAB.scope,
    },
  });

  // Transition task A to running
  taskA = transitionTask(taskA, 'running', chain, agentA);

  // 4. Agent B starts execution
  let taskB = promoteIntentToTask(
    { intent_id: generateId('int'), verb: 'execute', object: 'security-scan' },
    { parent_task_id: taskA.task_id, requester: agentA, assignee: agentB },
  );

  appendEvidenceEvent(chain, {
    interaction_id: taskB.task_id,
    event_type: 'task.created',
    actor: agentB.actor_id,
    metadata: { task_id: taskB.task_id, parent_task_id: taskA.task_id, delegation_id: delegationAB.delegation_id },
  });

  taskB = transitionTask(taskB, 'running', chain, agentB);

  // 5. Agent B needs Agent C for a sub-task — delegates with narrower scope
  const narrowedScope = narrowScope(scopeAB, ['security-audit:scan']);
  const delegationBCExpiry = opts?.expireDelegationBC ? -1 : 30;
  const delegationBC = createDelegation(agentB, agentC, narrowedScope, delegationBCExpiry);

  appendEvidenceEvent(chain, {
    interaction_id: taskB.task_id,
    event_type: 'delegation.created',
    actor: agentB.actor_id,
    metadata: {
      delegation_id: delegationBC.delegation_id,
      delegator: agentB.actor_id,
      delegatee: agentC.actor_id,
      scope: delegationBC.scope,
      parent_delegation_id: delegationAB.delegation_id,
    },
  });

  // 6. Check if delegation BC is expired (for the expiry test scenario)
  if (isDelegationExpired(delegationBC)) {
    appendEvidenceEvent(chain, {
      interaction_id: taskB.task_id,
      event_type: 'delegation.expired',
      actor: agentC.actor_id,
      metadata: {
        delegation_id: delegationBC.delegation_id,
        expires_at: delegationBC.expires_at,
      },
    });

    // Fail the whole chain
    taskB = transitionTask(taskB, 'failed', chain, agentB);
    taskA = transitionTask(taskA, 'failed', chain, agentA);

    const verification = verifyEvidenceChain(chain);
    return {
      agentA, agentB, agentC,
      delegationAB, delegationBC,
      taskA, taskB,
      taskC: promoteIntentToTask(
        { intent_id: generateId('int'), verb: 'scan', object: 'vulnerability-scan' },
        { parent_task_id: taskB.task_id, requester: agentB, assignee: agentC, state: 'failed' as TaskState },
      ),
      chain,
      verified: verification.ok,
    };
  }

  // 7. Agent C starts and completes its sub-task
  let taskC = promoteIntentToTask(
    { intent_id: generateId('int'), verb: 'scan', object: 'vulnerability-scan' },
    { parent_task_id: taskB.task_id, requester: agentB, assignee: agentC },
  );

  appendEvidenceEvent(chain, {
    interaction_id: taskC.task_id,
    event_type: 'task.created',
    actor: agentC.actor_id,
    metadata: { task_id: taskC.task_id, parent_task_id: taskB.task_id, delegation_id: delegationBC.delegation_id },
  });

  taskC = transitionTask(taskC, 'running', chain, agentC);

  // Agent C completes — evidence flows back up
  const scanResult = { vulnerabilities_found: 3, severity: 'medium', scan_duration_ms: 4200 };

  appendEvidenceEvent(chain, {
    interaction_id: taskC.task_id,
    event_type: 'execution.completed',
    actor: agentC.actor_id,
    output_hash: sha256Prefixed(scanResult),
    metadata: { task_id: taskC.task_id, ...scanResult },
  });

  taskC = transitionTask(taskC, 'completed', chain, agentC);

  // 8. Agent B receives results and completes
  const reportResult = { report_id: generateId('rpt'), vulnerabilities: 3, remediations_suggested: 2 };

  appendEvidenceEvent(chain, {
    interaction_id: taskB.task_id,
    event_type: 'execution.completed',
    actor: agentB.actor_id,
    output_hash: sha256Prefixed(reportResult),
    metadata: { task_id: taskB.task_id, child_task_id: taskC.task_id, ...reportResult },
  });

  taskB = transitionTask(taskB, 'completed', chain, agentB);

  // 9. Agent A receives final results
  appendEvidenceEvent(chain, {
    interaction_id: taskA.task_id,
    event_type: 'execution.completed',
    actor: agentA.actor_id,
    output_hash: sha256Prefixed({ taskB: reportResult, taskC: scanResult }),
    metadata: { task_id: taskA.task_id, child_task_id: taskB.task_id },
  });

  taskA = transitionTask(taskA, 'completed', chain, agentA);

  const verification = verifyEvidenceChain(chain);

  return {
    agentA, agentB, agentC,
    delegationAB, delegationBC,
    taskA, taskB, taskC,
    chain,
    verified: verification.ok,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('=== Multi-Agent Delegation Chain Demo ===\n');

  const demo = runDemo();

  console.log('Agents:');
  console.log(`  A (planner)    : ${demo.agentA.display_name} (${demo.agentA.actor_id})`);
  console.log(`  B (executor)   : ${demo.agentB.display_name} (${demo.agentB.actor_id})`);
  console.log(`  C (specialist) : ${demo.agentC.display_name} (${demo.agentC.actor_id})`);

  console.log('\nDelegation Chain:');
  console.log(`  A → B : ${demo.delegationAB.delegation_id}`);
  console.log(`    scope: [${demo.delegationAB.scope.join(', ')}]`);
  console.log(`  B → C : ${demo.delegationBC.delegation_id}`);
  console.log(`    scope: [${demo.delegationBC.scope.join(', ')}] (narrowed)`);

  console.log('\nTask States:');
  console.log(`  Task A : ${demo.taskA.state}`);
  console.log(`  Task B : ${demo.taskB.state} (parent: ${demo.taskB.parent_task_id})`);
  console.log(`  Task C : ${demo.taskC.state} (parent: ${demo.taskC.parent_task_id})`);

  console.log('\n--- Evidence Chain ---');
  console.log(`Events    : ${demo.chain.events.length}`);
  console.log(`Integrity : ${demo.verified ? 'verified' : 'BROKEN'}\n`);

  for (const event of demo.chain.events) {
    console.log(`  [${event.event_type}] ${event.event_id}`);
    console.log(`    actor    : ${event.actor}`);
    console.log(`    hash     : ${event.event_hash}`);
    console.log(`    prev_hash: ${event.prev_event_hash}`);
  }

  console.log('\n=== Demo complete ===');
}

main();
