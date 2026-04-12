import {
  type ActorRef,
  type ApprovalDecision,
  type ApprovalRequest,
  type CapabilityCard,
  type Intent,
  type RiskClass,
  OapsError,
  generateId,
  riskClassRequiresApproval,
  capabilityIdFromName,
  sha256Prefixed,
} from '@oaps/core';
import {
  createEvidenceChain,
  appendEvidenceEvent,
  verifyEvidenceChain,
  type EvidenceChain,
} from '@oaps/evidence';
import { type PolicyBundle, evaluatePolicy, hashPolicyContext, type PolicyContext } from '@oaps/policy';

// ---------------------------------------------------------------------------
// Mock MCP tools
// ---------------------------------------------------------------------------

interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  riskClass: RiskClass;
}

const MCP_TOOLS: McpTool[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file from disk',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
    riskClass: 'R1',
  },
  {
    name: 'execute_command',
    description: 'Execute a shell command on the host',
    inputSchema: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] },
    riskClass: 'R4',
  },
  {
    name: 'delete_file',
    description: 'Permanently delete a file from disk',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
    riskClass: 'R5',
  },
];

// ---------------------------------------------------------------------------
// Map MCP tools to AICP CapabilityCards
// ---------------------------------------------------------------------------

function toolToCapability(tool: McpTool): CapabilityCard {
  return {
    capability_id: `urn:oaps:cap:mcp:${capabilityIdFromName(tool.name)}`,
    kind: 'tool',
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema,
    risk_class: tool.riskClass,
  };
}

// ---------------------------------------------------------------------------
// Mock MCP execution
// ---------------------------------------------------------------------------

function executeMcpTool(name: string, args: Record<string, unknown>): Record<string, unknown> {
  switch (name) {
    case 'read_file':
      return { content: `Contents of ${args.path}`, bytes: 1024 };
    case 'execute_command':
      return { stdout: `Executed: ${args.command}`, exit_code: 0 };
    case 'delete_file':
      return { deleted: true, path: args.path };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ---------------------------------------------------------------------------
// Policy: allow all tools (governance happens via risk-based approval gates)
// ---------------------------------------------------------------------------

const ALLOW_ALL_POLICY: PolicyBundle = {
  policy_id: 'pol_mcp_governance_demo',
  policy_language: 'oaps-policy-v1',
  rules: [
    {
      rule_id: 'allow_all_tools',
      effect: 'allow',
      when: { eq: [{ var: 'capability.kind' }, 'tool'] },
    },
  ],
};

// ---------------------------------------------------------------------------
// Governance-aware invocation
// ---------------------------------------------------------------------------

interface InvokeOptions {
  tool: McpTool;
  capability: CapabilityCard;
  args: Record<string, unknown>;
  actor: ActorRef;
  interactionId: string;
  chain: EvidenceChain;
  approvalSimulation: 'approve' | 'reject' | 'none';
}

export interface InvokeResult {
  toolName: string;
  riskClass: RiskClass;
  policyAllowed: boolean;
  approvalRequired: boolean;
  approvalDecision?: 'approve' | 'reject';
  executed: boolean;
  error?: string;
  result?: Record<string, unknown>;
}

export function invokeWithGovernance(opts: InvokeOptions): InvokeResult {
  const { tool, capability, args, actor, interactionId, chain, approvalSimulation } = opts;

  // 1. Build policy context and evaluate
  const policyCtx: PolicyContext = {
    intent: { intent_id: generateId('int'), verb: 'invoke', object: `tool:${tool.name}` },
    actor: { actor_id: actor.actor_id, display_name: actor.display_name },
    capability: { capability_id: capability.capability_id, name: capability.name, kind: capability.kind, risk_class: capability.risk_class },
    delegation: {},
    approval: {},
    environment: { demo: true },
  };

  const policyResult = evaluatePolicy(ALLOW_ALL_POLICY, policyCtx);
  const contextHash = hashPolicyContext(policyCtx);

  appendEvidenceEvent(chain, {
    interaction_id: interactionId,
    event_type: 'mcp.policy.evaluated',
    actor: actor.actor_id,
    metadata: {
      capability_id: capability.capability_id,
      tool_name: tool.name,
      risk_class: capability.risk_class,
      policy_allowed: policyResult.allowed,
      context_hash: contextHash,
    },
  });

  if (!policyResult.allowed) {
    return { toolName: tool.name, riskClass: capability.risk_class, policyAllowed: false, approvalRequired: false, executed: false, error: 'POLICY_DENIED' };
  }

  // 2. Check if approval is needed (R4+)
  const needsApproval = riskClassRequiresApproval(capability.risk_class, 'R4');

  if (!needsApproval) {
    // Low risk: execute directly
    const result = executeMcpTool(tool.name, args);

    appendEvidenceEvent(chain, {
      interaction_id: interactionId,
      event_type: 'mcp.tool_call.completed',
      actor: actor.actor_id,
      input_hash: sha256Prefixed(args),
      output_hash: sha256Prefixed(result),
      metadata: { capability_id: capability.capability_id, tool_name: tool.name },
    });

    return { toolName: tool.name, riskClass: capability.risk_class, policyAllowed: true, approvalRequired: false, executed: true, result };
  }

  // 3. Approval gate
  const approvalRequest: ApprovalRequest = {
    approval_request_id: generateId('apr'),
    interaction_id: interactionId,
    requested_by: actor,
    requested_from: { actor_id: 'urn:oaps:actor:human:approver', display_name: 'Security Reviewer' },
    reason: `Tool "${tool.name}" has risk class ${capability.risk_class} — requires explicit approval`,
    risk_class: capability.risk_class,
    proposed_action: { verb: 'invoke', target: `tool:${tool.name}`, arguments: args },
    expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
  };

  appendEvidenceEvent(chain, {
    interaction_id: interactionId,
    event_type: 'approval.requested',
    actor: actor.actor_id,
    metadata: {
      approval_request_id: approvalRequest.approval_request_id,
      capability_id: capability.capability_id,
      risk_class: capability.risk_class,
    },
  });

  // Simulate the approval decision
  const decision: ApprovalDecision = {
    approval_request_id: approvalRequest.approval_request_id,
    interaction_id: interactionId,
    decided_by: { actor_id: 'urn:oaps:actor:human:approver', display_name: 'Security Reviewer' },
    decision: approvalSimulation === 'approve' ? 'approve' : 'reject',
    reason: approvalSimulation === 'approve'
      ? `Approved: ${tool.name} execution authorized by reviewer`
      : `Rejected: ${tool.name} execution denied by reviewer`,
    timestamp: new Date().toISOString(),
  };

  appendEvidenceEvent(chain, {
    interaction_id: interactionId,
    event_type: decision.decision === 'approve' ? 'approval.approved' : 'approval.rejected',
    actor: decision.decided_by.actor_id,
    metadata: {
      approval_request_id: decision.approval_request_id,
      capability_id: capability.capability_id,
      decision: decision.decision,
    },
  });

  if (decision.decision === 'reject') {
    return {
      toolName: tool.name,
      riskClass: capability.risk_class,
      policyAllowed: true,
      approvalRequired: true,
      approvalDecision: 'reject',
      executed: false,
      error: 'APPROVAL_REJECTED',
    };
  }

  // 4. Execute after approval
  const result = executeMcpTool(tool.name, args);

  appendEvidenceEvent(chain, {
    interaction_id: interactionId,
    event_type: 'mcp.tool_call.completed',
    actor: actor.actor_id,
    input_hash: sha256Prefixed(args),
    output_hash: sha256Prefixed(result),
    metadata: {
      capability_id: capability.capability_id,
      tool_name: tool.name,
      approval_request_id: approvalRequest.approval_request_id,
    },
  });

  return {
    toolName: tool.name,
    riskClass: capability.risk_class,
    policyAllowed: true,
    approvalRequired: true,
    approvalDecision: 'approve',
    executed: true,
    result,
  };
}

// ---------------------------------------------------------------------------
// Main demo
// ---------------------------------------------------------------------------

export function runDemo(): { results: InvokeResult[]; chain: EvidenceChain; verified: boolean } {
  const interactionId = generateId('ixn');
  const chain = createEvidenceChain();
  const agent: ActorRef = { actor_id: generateId('agt'), display_name: 'CodeAssistant-9' };

  const capabilities = MCP_TOOLS.map(toolToCapability);
  const results: InvokeResult[] = [];

  // Invocation 1: read_file (R1) — passes without approval
  results.push(invokeWithGovernance({
    tool: MCP_TOOLS[0]!,
    capability: capabilities[0]!,
    args: { path: '/etc/hostname' },
    actor: agent,
    interactionId,
    chain,
    approvalSimulation: 'none',
  }));

  // Invocation 2: execute_command (R4) — triggers approval → approved
  results.push(invokeWithGovernance({
    tool: MCP_TOOLS[1]!,
    capability: capabilities[1]!,
    args: { command: 'ls -la /tmp' },
    actor: agent,
    interactionId,
    chain,
    approvalSimulation: 'approve',
  }));

  // Invocation 3: delete_file (R5) — triggers approval → rejected
  results.push(invokeWithGovernance({
    tool: MCP_TOOLS[2]!,
    capability: capabilities[2]!,
    args: { path: '/etc/passwd' },
    actor: agent,
    interactionId,
    chain,
    approvalSimulation: 'reject',
  }));

  const verification = verifyEvidenceChain(chain);

  return { results, chain, verified: verification.ok };
}

function main() {
  console.log('=== MCP + AICP Governance Flow Demo ===\n');

  const { results, chain, verified } = runDemo();

  for (const r of results) {
    console.log(`--- ${r.toolName} (${r.riskClass}) ---`);
    console.log(`  Policy allowed    : ${r.policyAllowed}`);
    console.log(`  Approval required : ${r.approvalRequired}`);
    if (r.approvalDecision) console.log(`  Approval decision : ${r.approvalDecision}`);
    console.log(`  Executed          : ${r.executed}`);
    if (r.error) console.log(`  Error             : ${r.error}`);
    if (r.result) console.log(`  Result            : ${JSON.stringify(r.result)}`);
    console.log();
  }

  console.log('--- Evidence Chain ---');
  console.log(`Events    : ${chain.events.length}`);
  console.log(`Integrity : ${verified ? 'verified' : 'BROKEN'}\n`);

  for (const event of chain.events) {
    console.log(`  [${event.event_type}] ${event.event_id}`);
    console.log(`    hash     : ${event.event_hash}`);
    console.log(`    prev_hash: ${event.prev_event_hash}`);
  }

  console.log('\n=== Demo complete ===');
}

main();
