import test from 'node:test';
import assert from 'node:assert/strict';

import { createEvidenceChain } from '@oaps/evidence';
import { PolicyBundle } from '@oaps/policy';

import { ApprovalRequiredError, OapsMcpAdapter } from './index.js';
import type { McpClient } from './index.js';

const policy: PolicyBundle = {
  policy_id: 'policy_allow',
  policy_language: 'oaps-policy-v1' as const,
  rules: [
    {
      rule_id: 'allow-all',
      effect: 'allow' as const,
      when: { eq: [true, true] as [boolean, boolean] },
    },
  ],
};

const denyPolicy: PolicyBundle = {
  policy_id: 'policy_deny',
  policy_language: 'oaps-policy-v1' as const,
  rules: [
    {
      rule_id: 'deny-all',
      effect: 'deny' as const,
      when: { eq: [true, true] as [boolean, boolean] },
    },
  ],
};

const context = {
  delegation: {},
  approval: {},
  environment: {},
};

test('listCapabilities maps MCP tools into OAPS capability cards', async () => {
  const adapter = new OapsMcpAdapter({
    async listTools() {
      return [
        {
          name: 'read_repo',
          description: 'Read repository files',
          inputSchema: { type: 'object' },
        },
      ];
    },
    async callTool() {
      return {};
    },
  });

  const capabilities = await adapter.listCapabilities();
  assert.equal(capabilities[0]?.kind, 'tool');
  assert.equal(capabilities[0]?.name, 'read_repo');
  assert.equal(capabilities[0]?.risk_class, 'R1');
});

test('listCapabilities rejects tools missing an input schema', async () => {
  const adapter = new OapsMcpAdapter({
    async listTools() {
      return [
        {
          name: 'broken_tool',
          description: 'Broken tool metadata',
        } as unknown as Awaited<ReturnType<McpClient['listTools']>>[number],
      ];
    },
    async callTool() {
      return {};
    },
  });

  await assert.rejects(
    adapter.listCapabilities(),
    (error: unknown) =>
      error instanceof Error &&
      (error as { error?: { code?: string; details?: { field?: string } } }).error?.code === 'VALIDATION_FAILED' &&
      (error as { error?: { details?: { field?: string } } }).error?.details?.field === 'inputSchema',
  );
});

test('listCapabilities rejects malformed tool metadata', async () => {
  const adapter = new OapsMcpAdapter({
    async listTools() {
      return [
        {
          name: '',
          description: 42,
          inputSchema: { type: 'object' },
        } as unknown as Awaited<ReturnType<McpClient['listTools']>>[number],
      ];
    },
    async callTool() {
      return {};
    },
  });

  await assert.rejects(
    adapter.listCapabilities(),
    (error: unknown) =>
      error instanceof Error &&
      (error as { error?: { code?: string; details?: { field?: string } } }).error?.code === 'VALIDATION_FAILED' &&
      (error as { error?: { details?: { field?: string } } }).error?.details?.field === 'name',
  );
});

test('invoke succeeds for allowed low-risk tool calls', async () => {
  const adapter = new OapsMcpAdapter({
    async listTools() {
      return [
        {
          name: 'read_repo',
          description: 'Read repository files',
          inputSchema: { type: 'object' },
        },
      ];
    },
    async callTool(name, args) {
      return { name, args, ok: true };
    },
  });

  const chain = createEvidenceChain();
  const result = await adapter.invoke({
    intent: {
      intent_id: 'int_1',
      verb: 'invoke',
      object: 'tool:read_repo',
      constraints: { arguments: { path: 'README.md' } },
    },
    policy,
    context,
    actor: { actor_id: 'urn:oaps:actor:agent:builder' },
    authenticated_subject: 'urn:oaps:actor:agent:builder',
    interactionId: 'ix_1',
    chain,
  });

  assert.equal(result.execution.status, 'success');
  assert.equal(chain.events.length, 2);
});

test('invoke rejects when the capability cannot be found', async () => {
  const adapter = new OapsMcpAdapter({
    async listTools() {
      return [];
    },
    async callTool() {
      return { ok: true };
    },
  });

  const chain = createEvidenceChain();

  await assert.rejects(
    adapter.invoke({
      intent: {
        intent_id: 'int_nf',
        verb: 'invoke',
        object: 'tool:missing_tool',
        constraints: { arguments: { path: 'README.md' } },
      },
      policy,
      context,
      actor: { actor_id: 'urn:oaps:actor:agent:builder' },
      authenticated_subject: 'urn:oaps:actor:agent:builder',
      interactionId: 'ix_nf',
      chain,
    }),
    (error: unknown) => error instanceof Error && (error as { error?: { code?: string } }).error?.code === 'CAPABILITY_NOT_FOUND',
  );

  assert.equal(chain.events.at(-1)?.event_type, 'mcp.tool_call.denied');
});

test('invoke requests approval for high-risk calls', async () => {
  const adapter = new OapsMcpAdapter({
    async listTools() {
      return [
        {
          name: 'pay_invoice',
          description: 'Pay an invoice',
          inputSchema: { type: 'object' },
        },
      ];
    },
    async callTool() {
      return { ok: true };
    },
  });

  await assert.rejects(
    adapter.invoke({
      intent: {
        intent_id: 'int_2',
        verb: 'invoke',
        object: 'tool:pay_invoice',
        constraints: { arguments: { amount: '25.00' } },
      },
      policy,
      context,
      actor: { actor_id: 'urn:oaps:actor:agent:builder' },
      authenticated_subject: 'urn:oaps:actor:agent:builder',
      interactionId: 'ix_2',
      chain: createEvidenceChain(),
      riskClassResolver: () => 'R4',
    }),
    (error: unknown) => error instanceof ApprovalRequiredError,
  );
});

test('invoke emits approval request evidence when approval is required but no decision is provided', async () => {
  const adapter = new OapsMcpAdapter({
    async listTools() {
      return [
        {
          name: 'pay_invoice',
          description: 'Pay an invoice',
          inputSchema: { type: 'object' },
        },
      ];
    },
    async callTool() {
      return { ok: true };
    },
  });

  const chain = createEvidenceChain();

  await assert.rejects(
    adapter.invoke({
      intent: {
        intent_id: 'int_3',
        verb: 'invoke',
        object: 'tool:pay_invoice',
        constraints: { arguments: { amount: '25.00' } },
      },
      policy,
      context,
      actor: { actor_id: 'urn:oaps:actor:agent:builder' },
      authenticated_subject: 'urn:oaps:actor:agent:builder',
      interactionId: 'ix_3',
      chain,
      riskClassResolver: () => 'R4',
    }),
    (error: unknown) => error instanceof ApprovalRequiredError,
  );

  assert.equal(chain.events.length, 1);
  assert.equal(chain.events[0]?.event_type, 'approval.requested');
  assert.equal(typeof chain.events[0]?.metadata?.evaluated_context_hash, 'string');
});

test('invoke denies calls when policy evaluation rejects the invocation and records the context hash for high-risk actions', async () => {
  const adapter = new OapsMcpAdapter({
    async listTools() {
      return [
        {
          name: 'pay_invoice',
          description: 'Pay an invoice',
          inputSchema: { type: 'object' },
        },
      ];
    },
    async callTool() {
      return { ok: true };
    },
  });

  const chain = createEvidenceChain();

  await assert.rejects(
    adapter.invoke({
      intent: {
        intent_id: 'int_policy_deny',
        verb: 'invoke',
        object: 'tool:pay_invoice',
        constraints: { arguments: { amount: '25.00' } },
      },
      policy: denyPolicy,
      context,
      actor: { actor_id: 'urn:oaps:actor:agent:builder' },
      authenticated_subject: 'urn:oaps:actor:agent:builder',
      interactionId: 'ix_policy_deny',
      chain,
      riskClassResolver: () => 'R4',
    }),
    (error: unknown) =>
      error instanceof Error &&
      (error as { error?: { code?: string } }).error?.code === 'POLICY_DENIED',
  );

  assert.equal(chain.events.length, 1);
  assert.equal(chain.events[0]?.event_type, 'mcp.tool_call.denied');
  assert.equal(typeof chain.events[0]?.metadata?.evaluated_context_hash, 'string');
});

test('invoke emits approval rejection evidence when an approver rejects a high-risk call', async () => {
  const adapter = new OapsMcpAdapter({
    async listTools() {
      return [
        {
          name: 'pay_invoice',
          description: 'Pay an invoice',
          inputSchema: { type: 'object' },
        },
      ];
    },
    async callTool() {
      return { ok: true };
    },
  });

  const chain = createEvidenceChain();

  await assert.rejects(
    adapter.invoke({
      intent: {
        intent_id: 'int_reject',
        verb: 'invoke',
        object: 'tool:pay_invoice',
        constraints: { arguments: { amount: '25.00' } },
      },
      policy,
      context,
      actor: { actor_id: 'urn:oaps:actor:agent:builder' },
      authenticated_subject: 'urn:oaps:actor:agent:builder',
      interactionId: 'ix_reject',
      chain,
      approvalDecision: {
        approval_request_id: 'apr_reject',
        interaction_id: 'ix_reject',
        decided_by: { actor_id: 'urn:oaps:actor:human:approver' },
        decision: 'reject',
        reason: 'denied for test',
        timestamp: '2026-04-05T10:02:00Z',
      },
      riskClassResolver: () => 'R4',
    }),
    (error: unknown) =>
      error instanceof Error &&
      (error as { error?: { code?: string } }).error?.code === 'APPROVAL_REJECTED',
  );

  assert.equal(chain.events.length, 1);
  assert.equal(chain.events[0]?.event_type, 'approval.rejected');
  assert.equal(typeof chain.events[0]?.metadata?.evaluated_context_hash, 'string');
});

test('invoke rejects modified approvals that target a different capability', async () => {
  const adapter = new OapsMcpAdapter({
    async listTools() {
      return [
        {
          name: 'pay_invoice',
          description: 'Pay an invoice',
          inputSchema: { type: 'object' },
        },
      ];
    },
    async callTool() {
      return { ok: true };
    },
  });

  const chain = createEvidenceChain();

  await assert.rejects(
    adapter.invoke({
      intent: {
        intent_id: 'int_4',
        verb: 'invoke',
        object: 'tool:pay_invoice',
        constraints: { arguments: { amount: '25.00' } },
      },
      policy,
      context,
      actor: { actor_id: 'urn:oaps:actor:agent:builder' },
      authenticated_subject: 'urn:oaps:actor:agent:builder',
      interactionId: 'ix_4',
      chain,
      approvalDecision: {
        approval_request_id: 'apr_1',
        interaction_id: 'ix_4',
        decided_by: { actor_id: 'urn:oaps:actor:human:approver' },
        decision: 'modify',
        modified_action: {
          verb: 'invoke',
          target: 'tool:send_invoice',
          arguments: { amount: '25.00' },
        },
        timestamp: '2026-04-03T10:02:00Z',
      },
      riskClassResolver: () => 'R4',
    }),
    (error: unknown) =>
      error instanceof Error &&
      (error as { error?: { code?: string } }).error?.code === 'APPROVAL_MODIFICATION_TARGET_MISMATCH',
  );

  assert.equal(chain.events.length, 0);
});

test('invoke rejects authenticated subject mismatches before tool execution', async () => {
  const adapter = new OapsMcpAdapter({
    async listTools() {
      return [
        {
          name: 'read_repo',
          description: 'Read repository files',
          inputSchema: { type: 'object' },
        },
      ];
    },
    async callTool() {
      return { ok: true };
    },
  });

  const chain = createEvidenceChain();

  await assert.rejects(
    adapter.invoke({
      intent: {
        intent_id: 'int_5',
        verb: 'invoke',
        object: 'tool:read_repo',
        constraints: { arguments: { path: 'README.md' } },
      },
      policy,
      context,
      actor: { actor_id: 'urn:oaps:actor:agent:builder' },
      authenticated_subject: 'urn:oaps:actor:agent:other',
      interactionId: 'ix_5',
      chain,
    }),
    (error: unknown) =>
      error instanceof Error &&
      (error as { error?: { code?: string } }).error?.code === 'AUTHENTICATED_SUBJECT_MISMATCH',
  );

  assert.equal(chain.events.length, 0);
});

test('invoke translates upstream MCP failures into stable OAPS errors', async () => {
  const adapter = new OapsMcpAdapter({
    async listTools() {
      return [
        {
          name: 'read_repo',
          description: 'Read repository files',
          inputSchema: { type: 'object' },
        },
      ];
    },
    async callTool(_name, _args) {
      throw new Error('upstream timeout while reading tool response');
    },
  });

  const chain = createEvidenceChain();

  await assert.rejects(
    adapter.invoke({
      intent: {
        intent_id: 'int_6',
        verb: 'invoke',
        object: 'tool:read_repo',
        constraints: { arguments: { path: 'README.md' } },
      },
      policy,
      context,
      actor: { actor_id: 'urn:oaps:actor:agent:builder' },
      authenticated_subject: 'urn:oaps:actor:agent:builder',
      interactionId: 'ix_6',
      chain,
    }),
    (error: unknown) => {
      if (!(error instanceof Error)) return false;
      const oapsError = error as { error?: { code?: string; category?: string } };
      return oapsError.error?.code === 'EXECUTION_TIMEOUT' && oapsError.error?.category === 'timeout';
    },
  );

  assert.equal(chain.events.at(-1)?.event_type, 'mcp.tool_call.failed');
});

test('invoke translates upstream auth and validation failures into stable OAPS errors', async () => {
  const authAdapter = new OapsMcpAdapter({
    async listTools() {
      return [
        {
          name: 'read_repo',
          description: 'Read repository files',
          inputSchema: { type: 'object' },
        },
      ];
    },
    async callTool() {
      throw new Error('auth denied by upstream service');
    },
  });
  const validationAdapter = new OapsMcpAdapter({
    async listTools() {
      return [
        {
          name: 'read_repo',
          description: 'Read repository files',
          inputSchema: { type: 'object' },
        },
      ];
    },
    async callTool() {
      throw new Error('invalid arguments supplied to tool');
    },
  });

  const authChain = createEvidenceChain();
  await assert.rejects(
    authAdapter.invoke({
      intent: {
        intent_id: 'int_7',
        verb: 'invoke',
        object: 'tool:read_repo',
        constraints: { arguments: { path: 'README.md' } },
      },
      policy,
      context,
      actor: { actor_id: 'urn:oaps:actor:agent:builder' },
      authenticated_subject: 'urn:oaps:actor:agent:builder',
      interactionId: 'ix_7',
      chain: authChain,
    }),
    (error: unknown) => error instanceof Error && (error as { error?: { code?: string; category?: string } }).error?.code === 'UPSTREAM_AUTH_FAILED',
  );
  assert.equal(authChain.events.at(-1)?.event_type, 'mcp.tool_call.failed');

  const validationChain = createEvidenceChain();
  await assert.rejects(
    validationAdapter.invoke({
      intent: {
        intent_id: 'int_8',
        verb: 'invoke',
        object: 'tool:read_repo',
        constraints: { arguments: { path: 'README.md' } },
      },
      policy,
      context,
      actor: { actor_id: 'urn:oaps:actor:agent:builder' },
      authenticated_subject: 'urn:oaps:actor:agent:builder',
      interactionId: 'ix_8',
      chain: validationChain,
    }),
    (error: unknown) => error instanceof Error && (error as { error?: { code?: string; category?: string } }).error?.code === 'VALIDATION_FAILED',
  );
  assert.equal(validationChain.events.at(-1)?.event_type, 'mcp.tool_call.failed');
});
