import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runDemo, createDelegation, narrowScope, isDelegationExpired, transitionTask } from './demo.js';
import { generateId } from '@oaps/core';
import { createEvidenceChain, verifyEvidenceChain } from '@oaps/evidence';

describe('Multi-Agent Delegation Demo', () => {
  describe('delegation chain preserves scope narrowing', () => {
    it('B→C scope is a subset of A→B scope', () => {
      const demo = runDemo();

      for (const s of demo.delegationBC.scope) {
        assert.ok(
          demo.delegationAB.scope.includes(s),
          `B→C scope "${s}" must be present in A→B scope`,
        );
      }

      assert.ok(demo.delegationBC.scope.length <= demo.delegationAB.scope.length);
    });

    it('rejects scope that has no overlap with parent', () => {
      const agentA = { actor_id: 'a', display_name: 'A' };
      const agentB = { actor_id: 'b', display_name: 'B' };
      const parentScope = ['read', 'write'];

      assert.throws(
        () => narrowScope(parentScope, ['delete', 'admin']),
        (err: Error) => err.message.includes('no overlap'),
      );
    });

    it('filters child scope to only include parent-allowed items', () => {
      const result = narrowScope(
        ['security-audit:scan', 'security-audit:report'],
        ['security-audit:scan', 'security-audit:remediate'],
      );

      assert.deepEqual(result, ['security-audit:scan']);
    });
  });

  describe('expired delegation fails the whole chain', () => {
    it('cascades failure from C to B to A', () => {
      const demo = runDemo({ expireDelegationBC: true });

      assert.equal(demo.taskA.state, 'failed');
      assert.equal(demo.taskB.state, 'failed');
    });

    it('emits delegation.expired evidence event', () => {
      const demo = runDemo({ expireDelegationBC: true });

      const types = demo.chain.events.map((e) => e.event_type);
      assert.ok(types.includes('delegation.expired'));
    });

    it('still produces a verifiable evidence chain', () => {
      const demo = runDemo({ expireDelegationBC: true });
      assert.equal(demo.verified, true);
    });
  });

  describe('evidence chain covers all 3 agents', () => {
    it('includes events from agents A, B, and C', () => {
      const demo = runDemo();

      const actors = new Set(demo.chain.events.map((e) => e.actor));
      assert.ok(actors.has(demo.agentA.actor_id), 'Evidence must include Agent A events');
      assert.ok(actors.has(demo.agentB.actor_id), 'Evidence must include Agent B events');
      assert.ok(actors.has(demo.agentC.actor_id), 'Evidence must include Agent C events');
    });

    it('includes delegation, task, and execution events', () => {
      const demo = runDemo();

      const types = demo.chain.events.map((e) => e.event_type);
      assert.ok(types.some((t) => t.startsWith('delegation.')));
      assert.ok(types.some((t) => t.startsWith('task.')));
      assert.ok(types.some((t) => t.startsWith('execution.')));
    });
  });

  describe('task state transitions are legal', () => {
    it('all tasks reach completed in the happy path', () => {
      const demo = runDemo();

      assert.equal(demo.taskA.state, 'completed');
      assert.equal(demo.taskB.state, 'completed');
      assert.equal(demo.taskC.state, 'completed');
    });

    it('tasks follow created → running → completed sequence', () => {
      const demo = runDemo();

      // Check task C's evidence trail as an example
      const taskCEvents = demo.chain.events.filter(
        (e) => e.interaction_id === demo.taskC.task_id && e.event_type.startsWith('task.'),
      );
      const states = taskCEvents.map((e) => e.event_type.replace('task.', ''));

      assert.ok(states.indexOf('running') < states.indexOf('completed'));
    });

    it('parent tasks contain child task references in evidence', () => {
      const demo = runDemo();

      const taskBCompletionEvt = demo.chain.events.find(
        (e) => e.interaction_id === demo.taskB.task_id && e.event_type === 'execution.completed',
      );
      assert.ok(taskBCompletionEvt);
      assert.equal((taskBCompletionEvt!.metadata as any).child_task_id, demo.taskC.task_id);
    });
  });

  describe('hash chain integrity', () => {
    it('full happy-path chain is verifiable', () => {
      const demo = runDemo();
      assert.equal(demo.verified, true);

      const result = verifyEvidenceChain(demo.chain);
      assert.equal(result.ok, true);
    });

    it('hash chain links are continuous', () => {
      const demo = runDemo();

      assert.equal(demo.chain.events[0]!.prev_event_hash, 'sha256:0');
      for (let i = 1; i < demo.chain.events.length; i++) {
        assert.equal(
          demo.chain.events[i]!.prev_event_hash,
          demo.chain.events[i - 1]!.event_hash,
        );
      }
    });
  });
});
