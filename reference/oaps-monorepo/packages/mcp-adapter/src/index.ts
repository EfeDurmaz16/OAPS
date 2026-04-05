import {
  ActorRef,
  ApprovalDecision,
  ApprovalRequest,
  CapabilityCard,
  DelegationToken,
  ErrorObject,
  ExecutionResult,
  Intent,
  OapsError,
  RiskClass,
  assertAuthenticatedActor,
  assertInvokeIntent,
  capabilityIdFromName,
  compareRiskClass,
  generateId,
  riskClassRequiresApproval,
  sha256Prefixed,
  toObjectResult,
} from '@oaps/core';
import { EvidenceChain, appendEvidenceEvent } from '@oaps/evidence';
import { PolicyBundle, PolicyContext, PolicyResult, PolicyRule, evaluatePolicy, hashPolicyContext } from '@oaps/policy';

export interface McpTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface McpClient {
  listTools(): Promise<McpTool[]>;
  callTool(name: string, args: Record<string, unknown>): Promise<unknown>;
}

export interface AdapterPolicyContext {
  delegation: Record<string, unknown>;
  approval: Record<string, unknown>;
  environment: Record<string, unknown>;
  intent?: Record<string, unknown>;
  actor?: Record<string, unknown>;
  capability?: Record<string, unknown>;
  economic?: Record<string, unknown>;
  merchant?: Record<string, unknown>;
  risk?: Record<string, unknown>;
  evidence?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AdapterCallInput {
  intent: Intent;
  policy: PolicyBundle | PolicyRule[];
  context: AdapterPolicyContext;
  actor: ActorRef;
  authenticated_subject?: string;
  interactionId: string;
  chain: EvidenceChain;
  capability?: CapabilityCard;
  delegation?: DelegationToken;
  approvalDecision?: ApprovalDecision;
  approvalHandler?: (request: ApprovalRequest) => Promise<ApprovalDecision>;
  riskClassResolver?: (tool: McpTool) => RiskClass;
  approvalRiskThreshold?: RiskClass;
}

export interface AdapterInvokeResult {
  capability: CapabilityCard;
  policy: PolicyResult;
  approvalRequest?: ApprovalRequest;
  approvalDecision?: ApprovalDecision;
  execution: ExecutionResult;
  result: unknown;
}

export class ApprovalRequiredError extends OapsError {
  constructor(
    public readonly approvalRequest: ApprovalRequest,
    details?: Record<string, unknown>,
  ) {
    super({
      code: 'APPROVAL_REQUIRED',
      category: 'authorization',
      message: 'Approval is required before this tool call can proceed',
      retryable: false,
      details: {
        approval_request_id: approvalRequest.approval_request_id,
        interaction_id: approvalRequest.interaction_id,
        ...details,
      },
    });
    this.name = 'ApprovalRequiredError';
  }
}

function defaultRiskClassResolver(tool: McpTool): RiskClass {
  const normalized = tool.name.toLowerCase();
  if (/^(get|list|read|fetch|search|query)/.test(normalized)) return 'R1';
  if (/(delete|remove|revoke|pay|charge|transfer|deploy)/.test(normalized)) return 'R4';
  if (/(create|update|write|send|execute|run|publish)/.test(normalized)) return 'R3';
  return 'R2';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalidToolMetadataError(message: string, details?: Record<string, unknown>): ErrorObject {
  return {
    code: 'VALIDATION_FAILED',
    category: 'validation',
    message,
    retryable: false,
    details,
  };
}

function assertValidToolMetadata(tool: McpTool, index: number): void {
  if (typeof tool.name !== 'string' || tool.name.trim().length === 0) {
    throw new OapsError(invalidToolMetadataError('MCP tool metadata must include a non-empty name', {
      tool_index: index,
      field: 'name',
    }));
  }
  if (!isRecord(tool.inputSchema)) {
    throw new OapsError(invalidToolMetadataError('MCP tool metadata must include an object inputSchema', {
      tool_index: index,
      tool_name: tool.name,
      field: 'inputSchema',
    }));
  }
  if (tool.description !== undefined && typeof tool.description !== 'string') {
    throw new OapsError(invalidToolMetadataError('MCP tool description must be a string when present', {
      tool_index: index,
      tool_name: tool.name,
      field: 'description',
    }));
  }
  if (tool.outputSchema !== undefined && !isRecord(tool.outputSchema)) {
    throw new OapsError(invalidToolMetadataError('MCP tool outputSchema must be an object when present', {
      tool_index: index,
      tool_name: tool.name,
      field: 'outputSchema',
    }));
  }
}

function mapToolToCapability(tool: McpTool, riskClassResolver: (tool: McpTool) => RiskClass): CapabilityCard {
  return {
    capability_id: capabilityIdFromName(tool.name),
    kind: 'tool',
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema,
    output_schema: tool.outputSchema,
    risk_class: riskClassResolver(tool),
  };
}

function resolveToolName(intent: Intent): string {
  return intent.object.replace(/^tool:/, '');
}

function policyDeniedError(policy: PolicyResult): ErrorObject {
  return {
    code: 'POLICY_DENIED',
    category: 'authorization',
    message: 'Policy denied MCP tool invocation',
    retryable: false,
    details: {
      matched_rule_id: policy.matched_rule_id,
      policy_id: policy.policy_id,
      error: policy.error,
    },
  };
}

function capabilityNotFoundError(intent: Intent): ErrorObject {
  return {
    code: 'CAPABILITY_NOT_FOUND',
    category: 'capability',
    message: `No MCP tool matched ${intent.object}`,
    retryable: false,
  };
}

function approvalRequestForCall(input: AdapterCallInput, capability: CapabilityCard): ApprovalRequest {
  const args = ((input.intent.constraints ?? {}) as Record<string, unknown>).arguments as Record<string, unknown> | undefined;
  return {
    approval_request_id: generateId('apr'),
    interaction_id: input.interactionId,
    requested_by: input.actor,
    requested_from: {
      actor_id: 'urn:oaps:actor:human:approver',
      display_name: 'Default Approver',
    },
    reason: `Capability ${capability.name} requires approval at risk ${capability.risk_class}`,
    risk_class: capability.risk_class,
    proposed_action: {
      verb: 'invoke',
      target: `tool:${capability.name}`,
      arguments: args,
      metadata: {
        capability_id: capability.capability_id,
      },
    },
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}

function isApprovalCompatible(decision: ApprovalDecision, capability: CapabilityCard): void {
  if (decision.decision !== 'modify' || !decision.modified_action) return;
  const target = decision.modified_action.target.replace(/^tool:/, '');
  if (target !== capability.name) {
    throw new OapsError({
      code: 'APPROVAL_MODIFICATION_TARGET_MISMATCH',
      category: 'validation',
      message: 'Modified approval action targets a different capability',
      retryable: false,
      details: {
        expected_target: capability.name,
        received_target: decision.modified_action.target,
      },
    });
  }
}

function translateMcpError(error: unknown): ErrorObject {
  const message = error instanceof Error ? error.message : 'Unknown MCP failure';
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('not found')) {
    return { code: 'CAPABILITY_NOT_FOUND', category: 'capability', message, retryable: false };
  }
  if (lowerMessage.includes('timeout')) {
    return { code: 'EXECUTION_TIMEOUT', category: 'timeout', message, retryable: true };
  }
  if (lowerMessage.includes('auth')) {
    return { code: 'UPSTREAM_AUTH_FAILED', category: 'authentication', message, retryable: false };
  }
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return { code: 'VALIDATION_FAILED', category: 'validation', message, retryable: false };
  }
  return { code: 'UPSTREAM_UNAVAILABLE', category: 'transport', message, retryable: true };
}

function buildPolicyContext(input: AdapterCallInput, capability: CapabilityCard): PolicyContext {
  return {
    delegation: input.context.delegation,
    approval: input.context.approval,
    environment: input.context.environment,
    economic: input.context.economic,
    merchant: input.context.merchant,
    risk: input.context.risk,
    evidence: input.context.evidence,
    actor: {
      ...(input.context.actor ?? {}),
      actor_id: input.actor.actor_id,
      display_name: input.actor.display_name,
    },
    capability: {
      ...(input.context.capability ?? {}),
      capability_id: capability.capability_id,
      name: capability.name,
      kind: capability.kind,
      risk_class: capability.risk_class,
    },
    intent: {
      ...(input.context.intent ?? {}),
      intent_id: input.intent.intent_id,
      verb: input.intent.verb,
      object: input.intent.object,
      constraints: input.intent.constraints,
      requested_outcome: input.intent.requested_outcome,
    },
  };
}

export class OapsMcpAdapter {
  constructor(private readonly client: McpClient) {}

  async listCapabilities(riskClassResolver: (tool: McpTool) => RiskClass = defaultRiskClassResolver): Promise<CapabilityCard[]> {
    const tools = await this.client.listTools();
    tools.forEach((tool, index) => {
      assertValidToolMetadata(tool, index);
    });
    return tools.map((tool) => mapToolToCapability(tool, riskClassResolver));
  }

  async invoke(input: AdapterCallInput): Promise<AdapterInvokeResult> {
    assertInvokeIntent(input.intent);
    if (input.authenticated_subject) {
      assertAuthenticatedActor(input.authenticated_subject, input.actor, input.delegation);
    }

    const riskResolver = input.riskClassResolver ?? defaultRiskClassResolver;
    const toolName = resolveToolName(input.intent);
    const capability = input.capability
      ?? (await this.listCapabilities(riskResolver)).find((candidate) => candidate.name === toolName);

    if (!capability) {
      const error = capabilityNotFoundError(input.intent);
      appendEvidenceEvent(input.chain, {
        interaction_id: input.interactionId,
        event_type: 'mcp.tool_call.denied',
        actor: input.actor.actor_id,
        metadata: { ...error },
      });
      throw new OapsError(error);
    }

    const context = buildPolicyContext(input, capability);
    const policy = evaluatePolicy(input.policy, context);
    const contextHash = compareRiskClass(capability.risk_class, 'R4') >= 0 ? hashPolicyContext(context) : undefined;

    if (!policy.allowed) {
      const error = policyDeniedError(policy);
      appendEvidenceEvent(input.chain, {
        interaction_id: input.interactionId,
        event_type: 'mcp.tool_call.denied',
        actor: input.actor.actor_id,
        metadata: {
          ...error,
          evaluated_context_hash: contextHash,
        },
      });
      throw new OapsError(error);
    }

    let approvalRequest: ApprovalRequest | undefined;
    let approvalDecision = input.approvalDecision;
    if (riskClassRequiresApproval(capability.risk_class, input.approvalRiskThreshold ?? 'R4')) {
      approvalRequest = approvalRequestForCall(input, capability);
      if (!approvalDecision && input.approvalHandler) {
        approvalDecision = await input.approvalHandler(approvalRequest);
      }
      if (!approvalDecision) {
        appendEvidenceEvent(input.chain, {
          interaction_id: input.interactionId,
          event_type: 'approval.requested',
          actor: input.actor.actor_id,
          metadata: {
            approval_request_id: approvalRequest.approval_request_id,
            capability_id: capability.capability_id,
            evaluated_context_hash: contextHash,
          },
        });
        throw new ApprovalRequiredError(approvalRequest, {
          capability_id: capability.capability_id,
        });
      }

      isApprovalCompatible(approvalDecision, capability);
      if (approvalDecision.decision === 'reject') {
        appendEvidenceEvent(input.chain, {
          interaction_id: input.interactionId,
          event_type: 'approval.rejected',
          actor: approvalDecision.decided_by.actor_id,
          metadata: {
            approval_request_id: approvalDecision.approval_request_id,
            capability_id: capability.capability_id,
            evaluated_context_hash: contextHash,
          },
        });
        throw new OapsError({
          code: 'APPROVAL_REJECTED',
          category: 'authorization',
          message: 'Approval request was rejected',
          retryable: false,
          details: {
            approval_request_id: approvalDecision.approval_request_id,
            capability_id: capability.capability_id,
          },
        });
      }
    }

    const args = (input.intent.constraints as Record<string, unknown>).arguments as Record<string, unknown>;
    const effectiveArgs = approvalDecision?.decision === 'modify' && approvalDecision.modified_action?.arguments
      ? approvalDecision.modified_action.arguments
      : args;

    appendEvidenceEvent(input.chain, {
      interaction_id: input.interactionId,
      event_type: 'mcp.tool_call.started',
      actor: input.actor.actor_id,
      input_hash: sha256Prefixed(effectiveArgs),
      metadata: {
        capability_id: capability.capability_id,
        tool_name: capability.name,
        policy_id: policy.policy_id,
        matched_rule_id: policy.matched_rule_id,
        delegation_id: input.delegation?.delegation_id,
        approval_request_id: approvalDecision?.approval_request_id,
        authenticated_subject: input.authenticated_subject,
        evaluated_context_hash: contextHash,
      },
    });

    try {
      const result = await this.client.callTool(capability.name, effectiveArgs);
      const execution: ExecutionResult = {
        execution_id: generateId('exe'),
        status: 'success',
        result: toObjectResult(result),
        timestamp: new Date().toISOString(),
        metadata: {
          capability_id: capability.capability_id,
          policy_id: policy.policy_id,
          approval_request_id: approvalDecision?.approval_request_id,
        },
      };

      appendEvidenceEvent(input.chain, {
        interaction_id: input.interactionId,
        event_type: 'mcp.tool_call.completed',
        actor: input.actor.actor_id,
        output_hash: sha256Prefixed(result),
        metadata: {
          execution_id: execution.execution_id,
          capability_id: capability.capability_id,
        },
      });

      return {
        capability,
        policy: {
          ...policy,
          evaluated_context_hash: contextHash,
        },
        approvalRequest,
        approvalDecision,
        execution,
        result,
      };
    } catch (error) {
      const translated = translateMcpError(error);
      appendEvidenceEvent(input.chain, {
        interaction_id: input.interactionId,
        event_type: 'mcp.tool_call.failed',
        actor: input.actor.actor_id,
        metadata: {
          ...translated,
          capability_id: capability.capability_id,
        },
      });
      throw new OapsError(translated);
    }
  }
}
