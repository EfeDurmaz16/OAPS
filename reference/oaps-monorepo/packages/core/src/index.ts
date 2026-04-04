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
} from './generated-schema-constants.js';

export const OAPS_SPEC_VERSION = '0.4-draft';
export const OAPS_MIN_SUPPORTED_VERSION = '0.4';
export const OAPS_MAX_SUPPORTED_VERSION = '0.4';

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

export class OapsError extends Error {
  constructor(public readonly error: ErrorObject) {
    super(error.message);
    this.name = 'OapsError';
  }
}

export function generateId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '')}`;
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

export { ISO_CURRENCY_PATTERN, MONEY_VALUE_PATTERN, SCHEMA_VERSION_PATTERN };
