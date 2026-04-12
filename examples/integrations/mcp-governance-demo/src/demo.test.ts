import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runDemo, invokeWithGovernance, type InvokeResult } from './demo.js';
import {
  type ActorRef,
  type CapabilityCard,
  type RiskClass,
  generateId,
  capabilityIdFromName,
} from '@oaps/core';
import { createEvidenceChain, verifyEvidenceChain } from '@oaps/evidence';

function makeTool(name: string, riskClass: RiskClass) {
  return {
    name,
    description: `Mock ${name}`,
    inputSchema: { type: 'object' as const },
    riskClass,
  };
}

function makeCapability(name: string, riskClass: RiskClass): CapabilityCard {
  return {
    capability_id: `urn:oaps:cap:mcp:${capabilityIdFromName(name)}`,
    kind: 'tool',
    name,
    input_schema: { type: 'object' },
    risk_class: riskClass,
  };
}

const AGENT: ActorRef = { actor_id: 'agt_test', display_name: 'TestAgent' };

describe('MCP Governance Demo', () => {
  describe('low-risk invocation (R1)', () => {
    it('passes policy without requiring approval', () => {
      const chain = createEvidenceChain();
      const result = invokeWithGovernance({
        tool: makeTool('read_file', 'R1'),
        capability: makeCapability('read_file', 'R1'),
        args: { path: '/tmp/test.txt' },
        actor: AGENT,
        interactionId: generateId('ixn'),
        chain,
        approvalSimulation: 'none',
      });

      assert.equal(result.policyAllowed, true);
      assert.equal(result.approvalRequired, false);
      assert.equal(result.executed, true);
      assert.ok(result.result);
    });
  });

  describe('high-risk invocation (R4)', () => {
    it('requires approval before execution', () => {
      const chain = createEvidenceChain();
      const result = invokeWithGovernance({
        tool: makeTool('execute_command', 'R4'),
        capability: makeCapability('execute_command', 'R4'),
        args: { command: 'echo hello' },
        actor: AGENT,
        interactionId: generateId('ixn'),
        chain,
        approvalSimulation: 'approve',
      });

      assert.equal(result.approvalRequired, true);
      assert.equal(result.approvalDecision, 'approve');
      assert.equal(result.executed, true);
      assert.ok(result.result);
    });

    it('emits approval.requested and approval.approved events', () => {
      const chain = createEvidenceChain();
      invokeWithGovernance({
        tool: makeTool('execute_command', 'R4'),
        capability: makeCapability('execute_command', 'R4'),
        args: { command: 'echo hello' },
        actor: AGENT,
        interactionId: generateId('ixn'),
        chain,
        approvalSimulation: 'approve',
      });

      const types = chain.events.map((e) => e.event_type);
      assert.ok(types.includes('approval.requested'));
      assert.ok(types.includes('approval.approved'));
      assert.ok(types.includes('mcp.tool_call.completed'));
    });
  });

  describe('rejected invocation (R5)', () => {
    it('emits APPROVAL_REJECTED and does not execute', () => {
      const chain = createEvidenceChain();
      const result = invokeWithGovernance({
        tool: makeTool('delete_file', 'R5'),
        capability: makeCapability('delete_file', 'R5'),
        args: { path: '/etc/passwd' },
        actor: AGENT,
        interactionId: generateId('ixn'),
        chain,
        approvalSimulation: 'reject',
      });

      assert.equal(result.approvalRequired, true);
      assert.equal(result.approvalDecision, 'reject');
      assert.equal(result.executed, false);
      assert.equal(result.error, 'APPROVAL_REJECTED');
    });

    it('emits approval.rejected evidence event', () => {
      const chain = createEvidenceChain();
      invokeWithGovernance({
        tool: makeTool('delete_file', 'R5'),
        capability: makeCapability('delete_file', 'R5'),
        args: { path: '/etc/passwd' },
        actor: AGENT,
        interactionId: generateId('ixn'),
        chain,
        approvalSimulation: 'reject',
      });

      const types = chain.events.map((e) => e.event_type);
      assert.ok(types.includes('approval.rejected'));
      assert.ok(!types.includes('mcp.tool_call.completed'));
    });
  });

  describe('full demo evidence chain', () => {
    it('covers all 3 invocations with correct event types', () => {
      const { results, chain } = runDemo();

      assert.equal(results.length, 3);

      const types = chain.events.map((e) => e.event_type);
      // read_file: policy evaluated + tool completed
      assert.ok(types.filter((t) => t === 'mcp.policy.evaluated').length >= 3);
      // execute_command: approval requested + approved + completed
      assert.ok(types.includes('approval.requested'));
      assert.ok(types.includes('approval.approved'));
      // delete_file: approval requested + rejected
      assert.ok(types.includes('approval.rejected'));
    });

    it('has a verifiable hash chain', () => {
      const { chain, verified } = runDemo();

      assert.equal(verified, true);

      // Double-check with the verification function directly
      const result = verifyEvidenceChain(chain);
      assert.equal(result.ok, true);
    });

    it('maintains hash chain continuity across all events', () => {
      const { chain } = runDemo();

      for (let i = 1; i < chain.events.length; i++) {
        assert.equal(
          chain.events[i]!.prev_event_hash,
          chain.events[i - 1]!.event_hash,
          `Event ${i} prev_hash should match event ${i - 1} hash`,
        );
      }

      assert.equal(chain.events[0]!.prev_event_hash, 'sha256:0');
    });
  });
});
