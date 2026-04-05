import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  ActorCard,
  ActorRef,
  ApprovalDecision,
  ApprovalRequest,
  Envelope,
  ErrorObject,
  ExecutionResult,
  InteractionState,
  OAPS_HTTP_CONTENT_TYPE,
  OAPS_MAX_SUPPORTED_VERSION,
  OAPS_MIN_SUPPORTED_VERSION,
  OAPS_SPEC_VERSION,
  OapsError,
  assertAuthenticatedActor,
  buildEnvelope,
  generateId,
  negotiateVersion,
  parseBearerToken,
  sha256Prefixed,
} from '@oaps/core';
import { EvidenceChain, appendEvidenceEvent, createEvidenceChain } from '@oaps/evidence';
import { AdapterInvokeResult, ApprovalRequiredError, McpClient, OapsMcpAdapter } from '@oaps/mcp-adapter';
import { PolicyBundle } from '@oaps/policy';
import {
  FileReferenceStateStore,
  IdempotencyRecord,
  MemoryReferenceStateStore,
  ReferenceStateStore,
  StoredInteraction,
} from './storage.js';

const DEFAULT_POLICY: PolicyBundle = {
  policy_id: 'policy_default_allow',
  policy_language: 'oaps-policy-v1',
  rules: [
    {
      rule_id: 'allow_all',
      effect: 'allow',
      when: { eq: [true, true] },
    },
  ],
};

export interface ReferenceServerOptions {
  actorCard?: Partial<ActorCard>;
  bearerTokens?: Record<string, string>;
  mcpClient: McpClient;
  policy?: PolicyBundle;
  stateStore?: ReferenceStateStore;
  storagePath?: string;
}

function jsonResponse(c: any, body: unknown, status = 200) {
  return c.newResponse(JSON.stringify(body), status as any, {
    'content-type': OAPS_HTTP_CONTENT_TYPE,
  });
}

function jsonError(c: any, error: ErrorObject, status = 400) {
  return jsonResponse(c, error, status);
}

interface ReplayWindow {
  after?: string;
  limit?: number;
}

interface ReplaySlice {
  interaction_id: string;
  events: EvidenceChain['events'];
  replay: {
    after: string | null;
    returned: number;
    total_events: number;
    has_more: boolean;
    next_after: string | null;
  };
}

function parseReplayWindow(c: any): ReplayWindow | Response {
  const after = c.req.query('after')?.trim() || undefined;
  const limitRaw = c.req.query('limit');
  if (limitRaw === undefined) {
    return { after };
  }

  if (!/^[1-9][0-9]*$/.test(limitRaw)) {
    return jsonResponse(c, {
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'Replay limit must be a positive integer',
      retryable: false,
    } satisfies ErrorObject, 400);
  }

  return {
    after,
    limit: Number.parseInt(limitRaw, 10),
  };
}

function sliceReplayEvents(
  interactionId: string,
  events: EvidenceChain['events'],
  window: ReplayWindow,
): ReplaySlice | ErrorObject {
  let startIndex = 0;

  if (window.after) {
    const afterIndex = events.findIndex((event) => event.event_id === window.after);
    if (afterIndex === -1) {
      return {
        code: 'REPLAY_CURSOR_NOT_FOUND',
        category: 'validation',
        message: 'Replay cursor does not match any event in this interaction',
        retryable: false,
        details: {
          after: window.after,
        },
      };
    }
    startIndex = afterIndex + 1;
  }

  const remainingEvents = events.slice(startIndex);
  const slicedEvents = window.limit === undefined ? remainingEvents : remainingEvents.slice(0, window.limit);

  return {
    interaction_id: interactionId,
    events: slicedEvents,
    replay: {
      after: window.after ?? null,
      returned: slicedEvents.length,
      total_events: events.length,
      has_more: remainingEvents.length > slicedEvents.length,
      next_after: slicedEvents.at(-1)?.event_id ?? window.after ?? null,
    },
  };
}

function buildIdempotencyFingerprint(c: any, actorId: string, key: string): string {
  return `${actorId}:${c.req.method}:${c.req.path}:${key}`;
}

async function replayIdempotentResponse(
  c: any,
  stateStore: ReferenceStateStore,
  actorId: string,
  requestHash: string,
): Promise<Response | null> {
  const idempotencyKey = c.req.header('idempotency-key');
  if (!idempotencyKey) return null;

  const idempotencyFingerprint = buildIdempotencyFingerprint(c, actorId, idempotencyKey);
  const existing = await stateStore.getIdempotency(idempotencyFingerprint);
  if (!existing) return null;

  if (existing.request_hash !== requestHash) {
    return jsonError(c, {
      code: 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD',
      category: 'validation',
      message: 'Idempotency key cannot be reused with a different payload',
      retryable: false,
    }, 409);
  }

  return jsonResponse(c, existing.body, existing.status);
}

async function persistIdempotentResponse(
  c: any,
  stateStore: ReferenceStateStore,
  actorId: string,
  requestHash: string,
  status: number,
  body: unknown,
): Promise<void> {
  const idempotencyKey = c.req.header('idempotency-key');
  if (!idempotencyKey) return;

  const idempotencyFingerprint = buildIdempotencyFingerprint(c, actorId, idempotencyKey);
  await stateStore.putIdempotency(idempotencyFingerprint, {
    request_hash: requestHash,
    status,
    body,
  });
}

function extractAuthenticatedActor(c: any, tokens: Record<string, string>): string | Response {
  const token = parseBearerToken(c.req.header('authorization'));
  if (!token) {
    return jsonResponse(c, {
      code: 'AUTHENTICATION_REQUIRED',
      category: 'authentication',
      message: 'Bearer authentication is required',
      retryable: false,
    } satisfies ErrorObject, 401);
  }

  const actorId = tokens[token];
  if (!actorId) {
    return jsonResponse(c, {
      code: 'AUTHENTICATION_FAILED',
      category: 'authentication',
      message: 'Bearer token is not recognized',
      retryable: false,
    } satisfies ErrorObject, 401);
  }

  return actorId;
}

function interactionSnapshot(record: StoredInteraction) {
  return {
    interaction_id: record.interaction_id,
    state: record.state,
    created_at: record.created_at,
    updated_at: record.updated_at,
    request: record.request,
    messages: record.messages ?? [record.request],
    approval_request: record.approval_request,
    approval_decision: record.approval_decision,
    execution: record.execution,
    error: record.error,
    evidence_events: record.evidence.events,
  };
}

function buildStateEnvelope(
  interactionId: string,
  to: ActorRef,
  state: InteractionState,
  metadata?: Record<string, unknown>,
) {
  return buildEnvelope({
    spec_version: OAPS_SPEC_VERSION,
    min_supported_version: OAPS_MIN_SUPPORTED_VERSION,
    max_supported_version: OAPS_MAX_SUPPORTED_VERSION,
    interaction_id: interactionId,
    from: { actor_id: 'urn:oaps:actor:server:reference', display_name: 'OAPS Reference Server' },
    to,
    channel: 'oaps-http',
    message_type: 'interaction.updated',
    payload: {
      interaction_id: interactionId,
      state,
      timestamp: new Date().toISOString(),
      metadata,
    },
  });
}

function buildCreatedEnvelope(interactionId: string, to: ActorRef, state: InteractionState, metadata?: Record<string, unknown>) {
  return buildEnvelope({
    spec_version: OAPS_SPEC_VERSION,
    min_supported_version: OAPS_MIN_SUPPORTED_VERSION,
    max_supported_version: OAPS_MAX_SUPPORTED_VERSION,
    interaction_id: interactionId,
    from: { actor_id: 'urn:oaps:actor:server:reference', display_name: 'OAPS Reference Server' },
    to,
    channel: 'oaps-http',
    message_type: 'interaction.created',
    payload: {
      interaction_id: interactionId,
      state,
      timestamp: new Date().toISOString(),
      metadata,
    },
  });
}

export function createReferenceApp(options: ReferenceServerOptions) {
  const app = new Hono();
  const adapter = new OapsMcpAdapter(options.mcpClient);
  const bearerTokens = options.bearerTokens ?? { 'dev-token': 'urn:oaps:actor:agent:builder' };
  const policy = options.policy ?? DEFAULT_POLICY;
  const stateStore = options.stateStore ?? new FileReferenceStateStore(
    options.storagePath ?? path.resolve(process.cwd(), '.oaps-reference-state.json'),
  );

  app.get('/.well-known/oaps.json', async (c) => {
    return jsonResponse(c, {
      oaps_version: OAPS_SPEC_VERSION,
      actor_card_url: 'http://localhost:3000/actor-card',
      capabilities_url: 'http://localhost:3000/capabilities',
      interactions_url: 'http://localhost:3000/interactions',
      auth_schemes: ['bearer'],
      media_types: [OAPS_HTTP_CONTENT_TYPE, 'application/json'],
      supported_profiles: ['oaps-mcp-v1'],
    });
  });

  app.get('/actor-card', async (c) => {
    const capabilities = await adapter.listCapabilities();
    const actorCard: ActorCard = {
      actor_id: options.actorCard?.actor_id ?? 'urn:oaps:actor:server:reference',
      actor_type: options.actorCard?.actor_type ?? 'service',
      display_name: options.actorCard?.display_name ?? 'OAPS Reference Server',
      identity_profile: options.actorCard?.identity_profile ?? 'urn',
      auth_schemes: ['bearer'],
      endpoints: [
        { kind: 'discovery', url: 'http://localhost:3000/.well-known/oaps.json' },
        { kind: 'interaction', url: 'http://localhost:3000/interactions' },
        { kind: 'approval', url: 'http://localhost:3000/interactions/{id}/approve' },
        { kind: 'evidence', url: 'http://localhost:3000/interactions/{id}/evidence' },
      ],
      capabilities: capabilities.map((capability) => capability.capability_id),
      supported_profiles: ['oaps-mcp-v1'],
      metadata: options.actorCard?.metadata,
    };
    return jsonResponse(c, actorCard);
  });

  app.get('/capabilities', async (c) => {
    return jsonResponse(c, await adapter.listCapabilities());
  });

  app.post('/interactions', async (c) => {
    const authenticatedActor = extractAuthenticatedActor(c, bearerTokens);
    if (authenticatedActor instanceof Response) return authenticatedActor;

    const requestEnvelope = await c.req.json<Envelope>();
    const version = negotiateVersion(requestEnvelope);
    if (!version.ok) {
      return jsonError(c, version.error!, 400);
    }

    const requestHash = sha256Prefixed(requestEnvelope);
    const replayedResponse = await replayIdempotentResponse(c, stateStore, authenticatedActor, requestHash);
    if (replayedResponse) {
      return replayedResponse;
    }

    if (requestEnvelope.message_type !== 'intent.request') {
      return jsonError(c, {
        code: 'VALIDATION_FAILED',
        category: 'validation',
        message: 'POST /interactions requires an intent.request envelope',
        retryable: false,
      }, 400);
    }

    const interactionId = requestEnvelope.interaction_id || generateId('ix');
    const evidence = createEvidenceChain();
    appendEvidenceEvent(evidence, {
      interaction_id: interactionId,
      event_type: 'interaction.received',
      actor: requestEnvelope.from.actor_id,
      input_hash: requestHash,
      metadata: {
        message_id: requestEnvelope.message_id,
      },
    });

    const record: StoredInteraction = {
      interaction_id: interactionId,
      state: 'intent_received',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      request: requestEnvelope,
      messages: [requestEnvelope],
      actor: requestEnvelope.from,
      evidence,
    };

    await stateStore.putInteraction(record);

    try {
      const invokeResult = await adapter.invoke({
        intent: requestEnvelope.payload as any,
        policy,
        context: {
          delegation: {},
          approval: {},
          environment: {
            channel: requestEnvelope.channel,
          },
        },
        actor: requestEnvelope.from,
        authenticated_subject: authenticatedActor,
        interactionId,
        chain: record.evidence,
      });

      record.state = 'completed';
      record.updated_at = new Date().toISOString();
      record.execution = invokeResult.execution;

      appendEvidenceEvent(record.evidence, {
        interaction_id: interactionId,
        event_type: 'interaction.completed',
        actor: 'urn:oaps:actor:server:reference',
        metadata: {
          execution_id: invokeResult.execution.execution_id,
        },
      });

      const responseBody = buildCreatedEnvelope(interactionId, requestEnvelope.from, 'completed', {
        execution_id: invokeResult.execution.execution_id,
      });
      await persistIdempotentResponse(c, stateStore, authenticatedActor, requestHash, 201, responseBody);
      await stateStore.putInteraction(record);
      return jsonResponse(c, responseBody, 201);
    } catch (error) {
      if (error instanceof ApprovalRequiredError) {
        record.state = 'pending_approval';
        record.updated_at = new Date().toISOString();
        record.approval_request = error.approvalRequest;

        const responseBody = buildCreatedEnvelope(interactionId, requestEnvelope.from, 'pending_approval', {
          approval_request_id: error.approvalRequest.approval_request_id,
        });
        await persistIdempotentResponse(c, stateStore, authenticatedActor, requestHash, 202, responseBody);
        await stateStore.putInteraction(record);
        return jsonResponse(c, responseBody, 202);
      }

      const oapsError = error instanceof OapsError
        ? error.error
        : {
            code: 'INTERNAL_ERROR',
            category: 'internal',
            message: error instanceof Error ? error.message : 'Unknown interaction failure',
            retryable: false,
          } satisfies ErrorObject;

      record.state = 'failed';
      record.updated_at = new Date().toISOString();
      record.error = oapsError;
      appendEvidenceEvent(record.evidence, {
        interaction_id: interactionId,
        event_type: 'interaction.failed',
        actor: 'urn:oaps:actor:server:reference',
        metadata: { ...oapsError },
      });
      await stateStore.putInteraction(record);
      return jsonError(c, oapsError, oapsError.category === 'authentication' ? 401 : 400);
    }
  });

  app.get('/interactions/:id', async (c) => {
    const interaction = await stateStore.getInteraction(c.req.param('id'));
    if (!interaction) {
      return jsonError(c, {
        code: 'INTERACTION_NOT_FOUND',
        category: 'discovery',
        message: 'Interaction not found',
        retryable: false,
      }, 404);
    }
    return jsonResponse(c, interactionSnapshot(interaction));
  });

  app.get('/interactions/:id/evidence', async (c) => {
    const interaction = await stateStore.getInteraction(c.req.param('id'));
    if (!interaction) {
      return jsonError(c, {
        code: 'INTERACTION_NOT_FOUND',
        category: 'discovery',
        message: 'Interaction not found',
        retryable: false,
      }, 404);
    }

    const replayWindow = parseReplayWindow(c);
    if (replayWindow instanceof Response) return replayWindow;

    const replaySlice = sliceReplayEvents(interaction.interaction_id, interaction.evidence.events, replayWindow);
    if ('code' in replaySlice) {
      return jsonError(c, replaySlice, 400);
    }

    return jsonResponse(c, replaySlice);
  });

  app.get('/interactions/:id/events', async (c) => {
    const interaction = await stateStore.getInteraction(c.req.param('id'));
    if (!interaction) {
      return jsonError(c, {
        code: 'INTERACTION_NOT_FOUND',
        category: 'discovery',
        message: 'Interaction not found',
        retryable: false,
      }, 404);
    }

    const replayWindow = parseReplayWindow(c);
    if (replayWindow instanceof Response) return replayWindow;

    const replaySlice = sliceReplayEvents(interaction.interaction_id, interaction.evidence.events, replayWindow);
    if ('code' in replaySlice) {
      return jsonError(c, replaySlice, 400);
    }

    return jsonResponse(c, replaySlice);
  });

  app.post('/interactions/:id/messages', async (c) => {
    const authenticatedActor = extractAuthenticatedActor(c, bearerTokens);
    if (authenticatedActor instanceof Response) return authenticatedActor;

    const messageEnvelope = await c.req.json<Envelope>();
    try {
      assertAuthenticatedActor(authenticatedActor, messageEnvelope.from);
    } catch (error) {
      const oapsError = error instanceof OapsError
        ? error.error
        : {
            code: 'AUTHENTICATED_SUBJECT_MISMATCH',
            category: 'authentication',
            message: error instanceof Error ? error.message : 'Authenticated subject does not match the envelope sender',
            retryable: false,
          } satisfies ErrorObject;
      return jsonError(c, oapsError, 401);
    }

    const requestHash = sha256Prefixed(messageEnvelope);
    const replayedResponse = await replayIdempotentResponse(c, stateStore, authenticatedActor, requestHash);
    if (replayedResponse) {
      return replayedResponse;
    }

    const interaction = await stateStore.getInteraction(c.req.param('id'));
    if (!interaction) {
      return jsonError(c, {
        code: 'INTERACTION_NOT_FOUND',
        category: 'discovery',
        message: 'Interaction not found',
        retryable: false,
      }, 404);
    }
    if (messageEnvelope.interaction_id !== interaction.interaction_id) {
      return jsonError(c, {
        code: 'VALIDATION_FAILED',
        category: 'validation',
        message: 'Message envelope interaction_id must match the path parameter',
        retryable: false,
      }, 400);
    }

    const messages = interaction.messages ?? [interaction.request];
    interaction.messages = messages;
    messages.push(messageEnvelope);
    interaction.updated_at = new Date().toISOString();

    appendEvidenceEvent(interaction.evidence, {
      interaction_id: interaction.interaction_id,
      event_type: 'interaction.message.appended',
      actor: authenticatedActor,
      input_hash: requestHash,
      metadata: {
        message_id: messageEnvelope.message_id,
        message_type: messageEnvelope.message_type,
        thread_id: messageEnvelope.thread_id,
        parent_message_id: messageEnvelope.parent_message_id,
      },
    });
    await stateStore.putInteraction(interaction);

    const responseBody = buildStateEnvelope(interaction.interaction_id, interaction.request.from, interaction.state, {
      message_id: messageEnvelope.message_id,
      message_type: messageEnvelope.message_type,
      message_count: messages.length,
    });
    await persistIdempotentResponse(c, stateStore, authenticatedActor, requestHash, 200, responseBody);

    return jsonResponse(c, responseBody);
  });

  app.post('/interactions/:id/approve', async (c) => {
    const authenticatedActor = extractAuthenticatedActor(c, bearerTokens);
    if (authenticatedActor instanceof Response) return authenticatedActor;

    const interaction = await stateStore.getInteraction(c.req.param('id'));
    if (!interaction) {
      return jsonError(c, {
        code: 'INTERACTION_NOT_FOUND',
        category: 'discovery',
        message: 'Interaction not found',
        retryable: false,
      }, 404);
    }
    const body = (await c.req.json().catch(() => ({}))) as { modified_action?: ApprovalDecision['modified_action']; reason?: string };
    const requestHash = sha256Prefixed(body);
    const replayedResponse = await replayIdempotentResponse(c, stateStore, authenticatedActor, requestHash);
    if (replayedResponse) {
      return replayedResponse;
    }
    if (interaction.state !== 'pending_approval' || !interaction.approval_request) {
      return jsonError(c, {
        code: 'APPROVAL_NOT_PENDING',
        category: 'validation',
        message: 'Interaction is not awaiting approval',
        retryable: false,
      }, 409);
    }

    const approvalDecision: ApprovalDecision = {
      approval_request_id: interaction.approval_request.approval_request_id,
      interaction_id: interaction.interaction_id,
      decided_by: { actor_id: authenticatedActor },
      decision: body.modified_action ? 'modify' : 'approve',
      modified_action: body.modified_action,
      reason: body.reason,
      timestamp: new Date().toISOString(),
    };

    try {
      const invokeResult: AdapterInvokeResult = await adapter.invoke({
        intent: interaction.request.payload as any,
        policy,
        context: {
          delegation: {},
          approval: {
            approval_request_id: interaction.approval_request.approval_request_id,
            decided_by: authenticatedActor,
          },
          environment: {
            channel: interaction.request.channel,
          },
        },
        actor: interaction.request.from,
        authenticated_subject: interaction.request.from.actor_id,
        interactionId: interaction.interaction_id,
        chain: interaction.evidence,
        approvalDecision,
      });

      interaction.state = 'completed';
      interaction.updated_at = new Date().toISOString();
      interaction.approval_decision = approvalDecision;
      interaction.execution = invokeResult.execution;

      appendEvidenceEvent(interaction.evidence, {
        interaction_id: interaction.interaction_id,
        event_type: 'interaction.completed',
        actor: 'urn:oaps:actor:server:reference',
        metadata: {
          execution_id: invokeResult.execution.execution_id,
          approval_request_id: approvalDecision.approval_request_id,
        },
      });
      await stateStore.putInteraction(interaction);

      const responseBody = buildStateEnvelope(interaction.interaction_id, interaction.request.from, 'completed', {
        execution_id: invokeResult.execution.execution_id,
        approval_request_id: approvalDecision.approval_request_id,
      });
      await persistIdempotentResponse(c, stateStore, authenticatedActor, requestHash, 200, responseBody);
      return jsonResponse(c, responseBody);
    } catch (error) {
      const oapsError = error instanceof OapsError
        ? error.error
        : {
            code: 'INTERNAL_ERROR',
            category: 'internal',
            message: error instanceof Error ? error.message : 'Unknown approval failure',
            retryable: false,
          } satisfies ErrorObject;
      interaction.state = 'failed';
      interaction.updated_at = new Date().toISOString();
      interaction.error = oapsError;
      interaction.approval_decision = approvalDecision;
      appendEvidenceEvent(interaction.evidence, {
        interaction_id: interaction.interaction_id,
        event_type: 'interaction.failed',
        actor: 'urn:oaps:actor:server:reference',
        metadata: { ...oapsError },
      });
      await stateStore.putInteraction(interaction);
      return jsonError(c, oapsError, 400);
    }
  });

  app.post('/interactions/:id/reject', async (c) => {
    const authenticatedActor = extractAuthenticatedActor(c, bearerTokens);
    if (authenticatedActor instanceof Response) return authenticatedActor;

    const interaction = await stateStore.getInteraction(c.req.param('id'));
    if (!interaction) {
      return jsonError(c, {
        code: 'INTERACTION_NOT_FOUND',
        category: 'discovery',
        message: 'Interaction not found',
        retryable: false,
      }, 404);
    }
    const body = (await c.req.json().catch(() => ({}))) as { reason?: string };
    const requestHash = sha256Prefixed(body);
    const replayedResponse = await replayIdempotentResponse(c, stateStore, authenticatedActor, requestHash);
    if (replayedResponse) {
      return replayedResponse;
    }
    if (interaction.state !== 'pending_approval' || !interaction.approval_request) {
      return jsonError(c, {
        code: 'APPROVAL_NOT_PENDING',
        category: 'validation',
        message: 'Interaction is not awaiting approval',
        retryable: false,
      }, 409);
    }

    const approvalDecision: ApprovalDecision = {
      approval_request_id: interaction.approval_request.approval_request_id,
      interaction_id: interaction.interaction_id,
      decided_by: { actor_id: authenticatedActor },
      decision: 'reject',
      reason: body.reason,
      timestamp: new Date().toISOString(),
    };

    interaction.state = 'failed';
    interaction.updated_at = new Date().toISOString();
    interaction.approval_decision = approvalDecision;
    interaction.error = {
      code: 'APPROVAL_REJECTED',
      category: 'authorization',
      message: 'Approval request was rejected',
      retryable: false,
      details: {
        approval_request_id: approvalDecision.approval_request_id,
      },
    };

    appendEvidenceEvent(interaction.evidence, {
      interaction_id: interaction.interaction_id,
      event_type: 'approval.rejected',
      actor: authenticatedActor,
      metadata: {
        approval_request_id: approvalDecision.approval_request_id,
        reason: approvalDecision.reason,
      },
    });
    await stateStore.putInteraction(interaction);

    const responseBody = buildStateEnvelope(interaction.interaction_id, interaction.request.from, 'failed', {
      approval_request_id: approvalDecision.approval_request_id,
    });
    await persistIdempotentResponse(c, stateStore, authenticatedActor, requestHash, 200, responseBody);
    return jsonResponse(c, responseBody);
  });

  app.post('/interactions/:id/revoke', async (c) => {
    const authenticatedActor = extractAuthenticatedActor(c, bearerTokens);
    if (authenticatedActor instanceof Response) return authenticatedActor;

    const interaction = await stateStore.getInteraction(c.req.param('id'));
    if (!interaction) {
      return jsonError(c, {
        code: 'INTERACTION_NOT_FOUND',
        category: 'discovery',
        message: 'Interaction not found',
        retryable: false,
      }, 404);
    }

    const requestHash = sha256Prefixed({});
    const replayedResponse = await replayIdempotentResponse(c, stateStore, authenticatedActor, requestHash);
    if (replayedResponse) {
      return replayedResponse;
    }

    interaction.state = 'revoked';
    interaction.updated_at = new Date().toISOString();
    appendEvidenceEvent(interaction.evidence, {
      interaction_id: interaction.interaction_id,
      event_type: 'interaction.revoked',
      actor: authenticatedActor,
    });
    await stateStore.putInteraction(interaction);

    const responseBody = buildStateEnvelope(interaction.interaction_id, interaction.request.from, 'revoked');
    await persistIdempotentResponse(c, stateStore, authenticatedActor, requestHash, 200, responseBody);
    return jsonResponse(c, responseBody);
  });

  return app;
}

export function startReferenceServer(options: ReferenceServerOptions, port = 3000) {
  const app = createReferenceApp(options);
  return serve({ fetch: app.fetch, port });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startReferenceServer({
    mcpClient: {
      async listTools() {
        return [
          {
            name: 'read_repo',
            description: 'Read repository files',
            inputSchema: {
              type: 'object',
              required: ['path'],
              properties: {
                path: { type: 'string' },
              },
            },
          },
        ];
      },
      async callTool(name, args) {
        return {
          tool: name,
          arguments: args,
          ok: true,
        };
      },
    },
    stateStore: new FileReferenceStateStore(path.resolve(process.cwd(), '.oaps-reference-state.json')),
  });
  console.log('OAPS HTTP server listening on http://localhost:3000');
}

export { FileReferenceStateStore, MemoryReferenceStateStore };
