export type ActorKind = "human" | "agent" | "service" | "org";

export type Actor = {
  id: string;
  kind: ActorKind;
  displayName?: string;
  issuer?: string;
  metadata?: Record<string, unknown>;
};

export type ActorRef = {
  actorId: string;
  displayName?: string;
  endpointHint?: string;
};

export type Capability = {
  id: string;
  actorRef: ActorRef;
  name: string;
  inputSchema?: string;
  outputSchema?: string;
  effects?: EffectDescriptor[];
  costHint?: {
    currency?: string;
    amount?: number;
  };
  bindings?: string[];
};

export type Intent = {
  id: string;
  actorRef: ActorRef;
  capabilityRef: string;
  input: unknown;
  contextRefs?: string[];
  createdAt: string;
};

export type InteractionState =
  | "discovered"
  | "authenticated"
  | "verified"
  | "intent_received"
  | "quoted"
  | "delegated"
  | "pending_approval"
  | "approved"
  | "executing"
  | "partially_completed"
  | "challenged"
  | "failed"
  | "compensated"
  | "completed"
  | "revoked"
  | "settled"
  | "archived";

export type Interaction = {
  id: string;
  participants: ActorRef[];
  state: InteractionState;
  currentIntentId?: string;
  evidenceHead?: string;
};

export type TaskState =
  | "created"
  | "queued"
  | "running"
  | "pending_approval"
  | "challenged"
  | "blocked"
  | "partially_completed"
  | "completed"
  | "failed"
  | "compensated"
  | "revoked"
  | "cancelled";

export type Task = {
  id: string;
  interactionId?: string;
  intentRef?: string;
  state: TaskState;
  assignee?: string;
};

export type Delegation = {
  id: string;
  fromActorRef: ActorRef;
  toActorRef: ActorRef;
  scope: string[];
  expiresAt: string;
  issuedAt: string;
  contextRefs?: string[];
  revocationRef?: string;
  evidenceRef?: string;
};

export type Mandate = {
  id: string;
  principalActorRef: ActorRef;
  delegateActorRef: ActorRef;
  scope: string[];
  expiresAt: string;
  issuedAt: string;
  constraints?: {
    maxAmount?: number;
    currency?: string;
    merchantAllowlist?: string[];
    regionAllowlist?: string[];
  };
  chainRefs: string[];
  evidenceRef?: string;
};

export type ApprovalRequest = {
  id: string;
  interactionId: string;
  requesterActorRef: ActorRef;
  approverActorRef: ActorRef;
  reason: string;
  targetRef: string;
  expiresAt?: string;
  createdAt: string;
};

export type ApprovalDecision = {
  id: string;
  requestId: string;
  actorRef: ActorRef;
  decision: "approved" | "rejected" | "modified";
  modifications?: Record<string, unknown>;
  reason?: string;
  decidedAt: string;
};

export type Challenge = {
  id: string;
  interactionId: string;
  kind: "missing_input" | "missing_auth" | "risk_escalation" | "payment_auth";
  message: string;
  requiredAction?: string;
  createdAt: string;
};

export type EvidenceEvent = {
  id: string;
  interactionId: string;
  eventType: string;
  hash: string;
  prevHash?: string;
  payloadHash: string;
  actorRef?: ActorRef;
  createdAt: string;
  artifactRefs?: string[];
  dataRefs?: string[];
};

export type ErrorCategory =
  | "validation"
  | "permission"
  | "policy"
  | "timeout"
  | "network"
  | "execution"
  | "payment"
  | "auth"
  | "evidence";

export type ErrorObject = {
  code: string;
  category: ErrorCategory;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
};

export type ExecutionResult = {
  id: string;
  taskId?: string;
  interactionId?: string;
  outcome: "success" | "partial" | "failed";
  output?: unknown;
  artifactRefs?: string[];
  error?: ErrorObject;
};

export type PaymentCoordinationState =
  | "created"
  | "authorized"
  | "captured"
  | "settled"
  | "failed"
  | "voided"
  | "refunded";

export type PaymentCoordination = {
  id: string;
  interactionId: string;
  mandateId: string;
  amount: number;
  currency: string;
  payeeRef?: string;
  state: PaymentCoordinationState;
};

export type EffectDescriptor =
  | { kind: "fs.read"; paths: string[] }
  | { kind: "fs.write"; paths: string[] }
  | { kind: "search.text"; sources?: string[] }
  | { kind: "process.run"; commands?: string[]; timeoutMs?: number }
  | { kind: "git.read"; repos: string[] }
  | { kind: "git.mutate"; repos: string[]; allowPush?: boolean }
  | { kind: "http.fetch"; hosts: string[]; methods?: string[] }
  | { kind: "artifact.emit"; kinds?: string[] }
  | { kind: "approval.request"; allow: boolean }
  | { kind: "approval.decide"; allow: boolean }
  | { kind: "payment.authorize"; currencies?: string[]; maxAmount?: number }
  | { kind: "payment.capture"; currencies?: string[]; maxAmount?: number };
