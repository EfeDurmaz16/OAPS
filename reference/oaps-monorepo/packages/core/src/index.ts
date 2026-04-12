import { createHash, randomUUID } from 'node:crypto';
import {
  ACTOR_TYPES,
  AUTH_SCHEMES,
  CAPABILITY_KINDS,
  CHANNELS,
  ENDPOINT_KINDS,
  EXECUTION_STATUSES,
  IDENTITY_PROFILES,
  INTERACTION_STATES,
  MESSAGE_TYPES,
  MONEY_VALUE_PATTERN,
  ISO_CURRENCY_PATTERN,
  RISK_CLASS_ORDER,
  SCHEMA_VERSION_PATTERN,
  TASK_STATES,
} from './generated-schema-constants.js';

export const OAPS_SPEC_VERSION = '0.4-draft';
export const OAPS_MIN_SUPPORTED_VERSION = '0.4';
export const OAPS_MAX_SUPPORTED_VERSION = '0.4';
export const OAPS_HTTP_CONTENT_TYPE = 'application/oaps+json';

export type RiskClass = (typeof RISK_CLASS_ORDER)[number];
export type CapabilityKind = (typeof CAPABILITY_KINDS)[number];
export type EndpointKind = (typeof ENDPOINT_KINDS)[number];
export type AuthScheme = (typeof AUTH_SCHEMES)[number];
export type Channel = (typeof CHANNELS)[number];
export type ActorType = (typeof ACTOR_TYPES)[number];
export type IdentityProfile = (typeof IDENTITY_PROFILES)[number];
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];
export type MessageType = (typeof MESSAGE_TYPES)[number];
export type InteractionState = (typeof INTERACTION_STATES)[number];
export type TaskState = (typeof TASK_STATES)[number];

export interface ActorRef {
  actor_id: string;
  display_name?: string;
  endpoint_hint?: string;
}

export interface Endpoint {
  kind: EndpointKind;
  profile?: string;
  url: string;
}

export interface Proof {
  type: string;
  value: string;
  alg?: string;
  key_id?: string;
}

export interface Money {
  value: string;
  currency: string;
}

export interface Action {
  verb: string;
  target: string;
  amount?: Money;
  arguments?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ActorCard {
  actor_id: string;
  actor_type: ActorType;
  display_name: string;
  identity_profile?: IdentityProfile;
  auth_schemes?: AuthScheme[];
  endpoints: Endpoint[];
  capabilities: string[];
  supported_profiles?: string[];
  trust_credentials?: string[];
  metadata?: Record<string, unknown>;
}

export interface CapabilityCard {
  capability_id: string;
  kind: CapabilityKind;
  name: string;
  description?: string;
  input_schema: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
  risk_class: RiskClass;
  required_permissions?: string[];
  metadata?: Record<string, unknown>;
}

export interface Intent {
  intent_id: string;
  verb: string;
  object: string;
  constraints?: Record<string, unknown>;
  requested_outcome?: string;
  priority?: string;
  deadline?: string;
  metadata?: Record<string, unknown>;
}

export interface Task {
  task_id: string;
  intent_ref?: string;
  parent_task_id?: string;
  requester?: ActorRef;
  assignee?: ActorRef;
  state: TaskState;
  state_detail?: string;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
}

export interface DelegationToken {
  delegation_id: string;
  delegator: ActorRef;
  delegatee: ActorRef;
  scope: string[];
  limits?: Record<string, unknown>;
  approval_policy_id?: string;
  issued_at?: string;
  expires_at: string;
  revocation_endpoint?: string;
  metadata?: Record<string, unknown>;
}

export interface Mandate {
  mandate_id: string;
  principal: ActorRef;
  delegatee: ActorRef;
  action: Action;
  scope?: string[];
  expires_at: string;
  delegation_ref?: string;
  metadata?: Record<string, unknown>;
}

export interface ApprovalRequest {
  approval_request_id: string;
  interaction_id: string;
  requested_by: ActorRef;
  requested_from: ActorRef;
  reason: string;
  risk_class?: RiskClass;
  proposed_action: Action;
  evidence_refs?: string[];
  expires_at: string;
  metadata?: Record<string, unknown>;
}

export interface ApprovalDecision {
  approval_request_id: string;
  interaction_id: string;
  decided_by: ActorRef;
  decision: 'approve' | 'reject' | 'modify';
  modified_action?: Action;
  reason?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Challenge {
  challenge_id: string;
  task_id?: string;
  interaction_id?: string;
  challenge_type: string;
  status: 'open' | 'satisfied' | 'expired' | 'failed';
  challenged_by: ActorRef;
  instructions?: Record<string, unknown>;
  expires_at?: string;
  resolved_at?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface ExecutionRequest {
  execution_id: string;
  intent_ref: string;
  capability_ref: string;
  arguments?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ExecutionResult {
  execution_id: string;
  status: ExecutionStatus;
  result?: Record<string, unknown>;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface InteractionCreated {
  interaction_id: string;
  state: InteractionState;
  state_detail?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface InteractionUpdated {
  interaction_id: string;
  state: InteractionState;
  state_detail?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface InteractionTransition {
  transition_id: string;
  interaction_id: string;
  from_state: InteractionState;
  to_state: InteractionState;
  triggered_by: ActorRef;
  reason?: string;
  approval_request_id?: string;
  challenge_id?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface TaskTransition {
  transition_id: string;
  task_id: string;
  interaction_id?: string;
  intent_ref?: string;
  from_state: TaskState;
  to_state: TaskState;
  triggered_by: ActorRef;
  reason?: string;
  approval_request_id?: string;
  challenge_id?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type ErrorCategory =
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'capability'
  | 'discovery'
  | 'transport'
  | 'execution'
  | 'economic'
  | 'settlement'
  | 'timeout'
  | 'versioning'
  | 'internal';

export interface ErrorObject {
  code: string;
  category: ErrorCategory;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export interface ExtensionDescriptor {
  extension_id: string;
  kind: 'core' | 'binding' | 'profile' | 'domain' | 'companion';
  title: string;
  summary: string;
  status: 'experimental' | 'draft' | 'stable' | 'deprecated';
  owner?: string;
  uri?: string;
  metadata?: Record<string, unknown>;
}

export interface EvidenceEvent {
  event_id: string;
  interaction_id: string;
  event_type: string;
  actor: string;
  timestamp: string;
  prev_event_hash: string;
  event_hash?: string;
  input_hash?: string;
  output_hash?: string;
  metadata?: Record<string, unknown>;
}

export interface EnvelopeRefs {
  delegation_id?: string;
  policy_id?: string;
  execution_id?: string;
  approval_request_id?: string;
}

export interface Envelope<TPayload = unknown> {
  spec_version: string;
  min_supported_version?: string;
  max_supported_version?: string;
  message_id: string;
  interaction_id: string;
  thread_id?: string;
  parent_message_id?: string;
  from: ActorRef;
  to: ActorRef;
  channel: Channel;
  message_type: MessageType;
  timestamp: string;
  payload: TPayload;
  proofs?: Proof[];
  refs?: EnvelopeRefs;
}

export interface VersionSupport {
  current: string;
  min: string;
  max: string;
}

export interface VersionNegotiationResult {
  ok: boolean;
  selected?: string;
  error?: ErrorObject;
}

const INTERACTION_TRANSITIONS: Record<InteractionState, readonly InteractionState[]> = {
  discovered: ['authenticated'],
  authenticated: ['verified', 'intent_received'],
  verified: ['intent_received'],
  intent_received: ['quoted', 'delegated', 'pending_approval', 'approved', 'executing', 'completed', 'failed'],
  quoted: ['pending_approval', 'approved', 'executing', 'failed'],
  delegated: ['pending_approval', 'approved', 'executing', 'failed'],
  pending_approval: ['approved', 'failed', 'revoked'],
  approved: ['executing', 'completed', 'failed', 'revoked'],
  executing: ['partially_completed', 'challenged', 'failed', 'completed', 'revoked'],
  partially_completed: ['executing', 'challenged', 'compensated', 'completed', 'failed', 'revoked'],
  challenged: ['pending_approval', 'approved', 'executing', 'failed', 'revoked'],
  failed: ['archived'],
  compensated: ['archived'],
  completed: ['settled', 'archived'],
  revoked: ['archived'],
  settled: ['archived'],
  archived: [],
};

const TASK_TRANSITIONS: Record<TaskState, readonly TaskState[]> = {
  created: ['queued', 'pending_approval', 'running', 'revoked'],
  queued: ['running', 'pending_approval', 'cancelled', 'revoked', 'failed'],
  running: ['blocked', 'pending_approval', 'challenged', 'partially_completed', 'completed', 'failed', 'revoked', 'cancelled'],
  pending_approval: ['queued', 'running', 'failed', 'revoked'],
  challenged: ['pending_approval', 'queued', 'running', 'failed', 'revoked'],
  blocked: ['queued', 'running', 'challenged', 'failed', 'revoked', 'cancelled'],
  partially_completed: ['running', 'challenged', 'compensated', 'completed', 'failed', 'revoked'],
  completed: ['compensated'],
  failed: [],
  compensated: [],
  revoked: [],
  cancelled: [],
};

export class OapsError extends Error {
  constructor(public readonly error: ErrorObject) {
    super(error.message);
    this.name = 'OapsError';
  }
}

export function generateId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '')}`;
}

export function canTransitionInteractionState(from: InteractionState, to: InteractionState): boolean {
  return INTERACTION_TRANSITIONS[from].includes(to);
}

export function assertInteractionTransition(from: InteractionState, to: InteractionState): void {
  if (canTransitionInteractionState(from, to)) return;

  throw new OapsError({
    code: 'ILLEGAL_STATE_TRANSITION',
    category: 'validation',
    message: `Illegal interaction transition: ${from} -> ${to}`,
    retryable: false,
    details: {
      state_kind: 'interaction',
      from_state: from,
      to_state: to,
      allowed_to_states: [...INTERACTION_TRANSITIONS[from]],
    },
  });
}

export function canTransitionTaskState(from: TaskState, to: TaskState): boolean {
  return TASK_TRANSITIONS[from].includes(to);
}

export function assertTaskTransition(from: TaskState, to: TaskState): void {
  if (canTransitionTaskState(from, to)) return;

  throw new OapsError({
    code: 'ILLEGAL_STATE_TRANSITION',
    category: 'validation',
    message: `Illegal task transition: ${from} -> ${to}`,
    retryable: false,
    details: {
      state_kind: 'task',
      from_state: from,
      to_state: to,
      allowed_to_states: [...TASK_TRANSITIONS[from]],
    },
  });
}

export function promoteIntentToTask(
  intent: Intent,
  options: {
    task_id?: string;
    parent_task_id?: string;
    requester?: ActorRef;
    assignee?: ActorRef;
    state?: TaskState;
    created_at?: string;
    metadata?: Record<string, unknown>;
  } = {},
): Task {
  const createdAt = options.created_at ?? new Date().toISOString();
  return {
    task_id: options.task_id ?? generateId('task'),
    intent_ref: intent.intent_id,
    parent_task_id: options.parent_task_id,
    requester: options.requester,
    assignee: options.assignee,
    state: options.state ?? 'created',
    created_at: createdAt,
    updated_at: createdAt,
    metadata: options.metadata,
  };
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(entries.map(([key, nested]) => [key, sortValue(nested)]));
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function sha256Prefixed(value: unknown): string {
  return `sha256:${createHash('sha256').update(canonicalJson(value)).digest('hex')}`;
}

export function buildEnvelope<TPayload>(
  input: Omit<Envelope<TPayload>, 'message_id' | 'timestamp'> & { message_id?: string; timestamp?: string },
): Envelope<TPayload> {
  return {
    ...input,
    message_id: input.message_id ?? generateId('msg'),
    timestamp: input.timestamp ?? new Date().toISOString(),
  };
}

export function assertInvokeIntent(intent: Intent): void {
  if (intent.verb !== 'invoke') return;
  const args = intent.constraints && typeof intent.constraints === 'object'
    ? (intent.constraints as Record<string, unknown>).arguments
    : undefined;

  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'Invoke intents require constraints.arguments',
      retryable: false,
    });
  }
}

export function parseBearerToken(headerValue: string | undefined): string | null {
  if (!headerValue) return null;
  const [scheme, token] = headerValue.split(/\s+/, 2);
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return null;
  return token;
}

export function compareRiskClass(left: RiskClass, right: RiskClass): number {
  return RISK_CLASS_ORDER.indexOf(left) - RISK_CLASS_ORDER.indexOf(right);
}

export function riskClassRequiresApproval(riskClass: RiskClass, threshold: RiskClass = 'R4'): boolean {
  return compareRiskClass(riskClass, threshold) >= 0;
}

function parseVersionFamily(version: string): number[] | null {
  const match = version.match(/^(\d+)\.(\d+)(?:\.(\d+))?(?:-draft)?$/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)];
}

function compareVersionNumbers(left: string, right: string): number {
  const leftParts = parseVersionFamily(left);
  const rightParts = parseVersionFamily(right);
  if (!leftParts || !rightParts) return left.localeCompare(right);

  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

export function negotiateVersion(
  envelope: Pick<Envelope, 'spec_version' | 'min_supported_version' | 'max_supported_version'>,
  supported: VersionSupport = {
    current: OAPS_SPEC_VERSION,
    min: OAPS_MIN_SUPPORTED_VERSION,
    max: OAPS_MAX_SUPPORTED_VERSION,
  },
): VersionNegotiationResult {
  const senderFloor = envelope.min_supported_version ?? envelope.spec_version;
  const senderCeiling = envelope.max_supported_version ?? envelope.spec_version;
  const overlapFloor = compareVersionNumbers(senderFloor, supported.min) > 0 ? senderFloor : supported.min;
  const overlapCeiling = compareVersionNumbers(senderCeiling, supported.max) < 0 ? senderCeiling : supported.max;

  if (compareVersionNumbers(overlapFloor, overlapCeiling) > 0) {
    return {
      ok: false,
      error: {
        code: 'VERSION_NEGOTIATION_FAILED',
        category: 'versioning',
        message: 'Unable to negotiate a compatible OAPS version',
        retryable: false,
        details: {
          received: {
            spec_version: envelope.spec_version,
            min_supported_version: envelope.min_supported_version,
            max_supported_version: envelope.max_supported_version,
          },
          supported,
        },
      },
    };
  }

  return { ok: true, selected: supported.current };
}

export function assertAuthenticatedActor(
  authenticatedActorId: string,
  sender: ActorRef,
  delegation?: DelegationToken,
): void {
  if (authenticatedActorId === sender.actor_id) return;
  if (
    delegation
    && delegation.delegatee.actor_id === sender.actor_id
    && delegation.delegator.actor_id === authenticatedActorId
  ) {
    if (new Date(delegation.expires_at).getTime() <= Date.now()) {
      throw new OapsError({
        code: 'DELEGATION_EXPIRED',
        category: 'authorization',
        message: 'Delegation token has expired',
        retryable: false,
        details: {
          delegation_id: delegation.delegation_id,
          expires_at: delegation.expires_at,
        },
      });
    }

    return;
  }

  throw new OapsError({
    code: 'AUTHENTICATED_SUBJECT_MISMATCH',
    category: 'authentication',
    message: 'Authenticated subject does not match the envelope sender',
    retryable: false,
    details: {
      authenticated_actor_id: authenticatedActorId,
      envelope_actor_id: sender.actor_id,
      delegation_id: delegation?.delegation_id,
    },
  });
}

export function ensureRecord(value: unknown, errorMessage: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: errorMessage,
      retryable: false,
    });
  }
  return value as Record<string, unknown>;
}

export function toObjectResult(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return { value };
}

export function capabilityIdFromName(name: string): string {
  return `cap_${name.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase()}`;
}

/**
 * Returns true when the given mandate is expired at the supplied reference time.
 * Implementations MUST fail closed on expired mandates per FOUNDATION-DRAFT Mandate requirements.
 */
export function isMandateExpired(mandate: Mandate, now: Date = new Date()): boolean {
  const expiresAt = new Date(mandate.expires_at);
  if (Number.isNaN(expiresAt.getTime())) {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: `Mandate ${mandate.mandate_id} has an unparseable expires_at`,
      retryable: false,
    });
  }
  return now >= expiresAt;
}

/**
 * Verifies that a mandate's action covers the attempted action. Returns true when the
 * mandate's action verb and target match the attempted action. Implementations MUST
 * emit MANDATE_SCOPE_MISMATCH when this returns false for an otherwise valid mandate.
 */
export function mandateCoversAction(mandate: Mandate, attempted: Action): boolean {
  if (mandate.action.verb !== attempted.verb) return false;
  if (mandate.action.target !== attempted.target) return false;
  return true;
}

/**
 * Asserts that a mandate is usable for the attempted action at the reference time.
 * Throws OapsError with the appropriate code and category on failure.
 * Combines the expiry check (MANDATE_EXPIRED) and the scope check (MANDATE_SCOPE_MISMATCH).
 */
export function assertMandateAuthorizes(
  mandate: Mandate,
  attempted: Action,
  now: Date = new Date(),
): void {
  if (isMandateExpired(mandate, now)) {
    throw new OapsError({
      code: 'MANDATE_EXPIRED',
      category: 'authorization',
      message: `Mandate ${mandate.mandate_id} expired at ${mandate.expires_at}`,
      retryable: false,
    });
  }
  if (!mandateCoversAction(mandate, attempted)) {
    throw new OapsError({
      code: 'MANDATE_SCOPE_MISMATCH',
      category: 'authorization',
      message: `Mandate ${mandate.mandate_id} does not cover action ${attempted.verb} on ${attempted.target}`,
      retryable: false,
    });
  }
}

/**
 * Validates that an approval decision's modification target, if present, matches the
 * target of the original approval request. Emits APPROVAL_MODIFICATION_TARGET_MISMATCH
 * when a modified decision points at a different target than the request.
 */
export function assertApprovalDecisionTargets(
  request: ApprovalRequest,
  decision: ApprovalDecision,
): void {
  if (decision.approval_request_id !== request.approval_request_id) {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: `ApprovalDecision references request ${decision.approval_request_id} but was paired with ${request.approval_request_id}`,
      retryable: false,
    });
  }
  if (decision.decision === 'modify') {
    const modified = decision.modified_action;
    if (!modified) {
      throw new OapsError({
        code: 'VALIDATION_FAILED',
        category: 'validation',
        message: `Modified approval decision ${decision.approval_request_id} must include modified_action`,
        retryable: false,
      });
    }
    // Per FOUNDATION-DRAFT: a modified approval must not silently retarget to a
    // different action than the original request.
    if (modified.target !== request.proposed_action.target) {
      throw new OapsError({
        code: 'APPROVAL_MODIFICATION_TARGET_MISMATCH',
        category: 'validation',
        message: `Approval ${request.approval_request_id} modification retargets from ${request.proposed_action.target} to ${modified.target}`,
        retryable: false,
      });
    }
  }
}

const RFC3339_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

const ERROR_CATEGORIES: readonly ErrorCategory[] = [
  'authentication',
  'authorization',
  'validation',
  'capability',
  'discovery',
  'transport',
  'execution',
  'economic',
  'settlement',
  'timeout',
  'versioning',
  'internal',
];

export function assertActor(actor: unknown): asserts actor is ActorCard {
  const rec = ensureRecord(actor, 'Actor must be a non-null object');
  if (typeof rec.actor_id !== 'string' || rec.actor_id === '') {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'Actor must include a non-empty actor_id',
      retryable: false,
    });
  }
  if (!ACTOR_TYPES.includes(rec.actor_type as ActorType)) {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: `Actor actor_type must be one of ${ACTOR_TYPES.join(', ')}`,
      retryable: false,
    });
  }
}

export function assertCapability(capability: unknown): asserts capability is CapabilityCard {
  const rec = ensureRecord(capability, 'Capability must be a non-null object');
  if (typeof rec.capability_id !== 'string' || rec.capability_id === '') {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'Capability must include a non-empty capability_id',
      retryable: false,
    });
  }
  try {
    new URL(rec.capability_id as string);
  } catch {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'Capability capability_id must be a valid URI',
      retryable: false,
    });
  }
  if (typeof rec.name !== 'string' || rec.name === '') {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'Capability must include a non-empty name (action surface)',
      retryable: false,
    });
  }
}

export function assertTask(task: unknown): asserts task is Task {
  const rec = ensureRecord(task, 'Task must be a non-null object');
  if (typeof rec.task_id !== 'string' || rec.task_id === '') {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'Task must include a non-empty task_id',
      retryable: false,
    });
  }
  if (!TASK_STATES.includes(rec.state as TaskState)) {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: `Task state must be one of ${TASK_STATES.join(', ')}`,
      retryable: false,
    });
  }
  if (typeof rec.created_at !== 'string' || !RFC3339_RE.test(rec.created_at as string)) {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'Task created_at must be a valid RFC 3339 date-time',
      retryable: false,
    });
  }
}

export function assertErrorObject(error: unknown): asserts error is ErrorObject {
  const rec = ensureRecord(error, 'ErrorObject must be a non-null object');
  if (typeof rec.code !== 'string' || rec.code === '') {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'ErrorObject must include a non-empty error_code',
      retryable: false,
    });
  }
  if (!ERROR_CATEGORIES.includes(rec.category as ErrorCategory)) {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: `ErrorObject category must be one of ${ERROR_CATEGORIES.join(', ')}`,
      retryable: false,
    });
  }
  if (typeof rec.retryable !== 'boolean') {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'ErrorObject retryable must be a boolean',
      retryable: false,
    });
  }
}

export function assertExtensionDescriptor(ext: unknown): asserts ext is ExtensionDescriptor {
  const rec = ensureRecord(ext, 'ExtensionDescriptor must be a non-null object');
  if (typeof rec.extension_id !== 'string' || rec.extension_id === '') {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'ExtensionDescriptor must include a non-empty extension_id',
      retryable: false,
    });
  }
  if (typeof rec.kind !== 'string' || rec.kind === '') {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'ExtensionDescriptor must include a non-empty namespace (kind)',
      retryable: false,
    });
  }
  if (rec.status === 'experimental' || rec.status === 'draft') {
    // advisory extensions — unknown ones MAY be safely ignored
  } else if (rec.status === 'stable' || rec.status === 'deprecated') {
    // required extensions — unknown required extensions MUST NOT be silently dropped
  } else if (rec.status !== undefined) {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'ExtensionDescriptor status must be one of experimental, draft, stable, deprecated',
      retryable: false,
    });
  }
}

export function assertChallenge(challenge: unknown): asserts challenge is Challenge {
  const rec = ensureRecord(challenge, 'Challenge must be a non-null object');
  if (typeof rec.challenge_id !== 'string' || rec.challenge_id === '') {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'Challenge must include a non-empty challenge_id',
      retryable: false,
    });
  }
  if (
    (typeof rec.interaction_id !== 'string' || rec.interaction_id === '')
    && (typeof rec.task_id !== 'string' || rec.task_id === '')
  ) {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'Challenge must include an interaction_ref (interaction_id or task_id)',
      retryable: false,
    });
  }
  if (typeof rec.challenge_type !== 'string' || rec.challenge_type === '') {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'Challenge must include a non-empty challenge_type',
      retryable: false,
    });
  }
  if (rec.approval_request_id !== undefined) {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'A Challenge MUST NOT be represented as an ApprovalRequest',
      retryable: false,
    });
  }
}

export { ISO_CURRENCY_PATTERN, MONEY_VALUE_PATTERN, SCHEMA_VERSION_PATTERN };
