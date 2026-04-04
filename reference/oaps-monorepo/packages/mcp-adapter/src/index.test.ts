import test from 'node:test';
import assert from 'node:assert/strict';

import { createEvidenceChain } from '@oaps/evidence';
import { PolicyBundle } from '@oaps/policy';

import { ApprovalRequiredError, OapsMcpAdapter } from './index.js';

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
