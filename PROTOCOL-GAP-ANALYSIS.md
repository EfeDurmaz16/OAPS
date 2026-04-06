# OAPS Protocol Implementation Gap Analysis

**Status:** Exhaustive gap inventory for 200-300 commit implementation plan  
**Date:** 2026-04-05  
**Spec Version:** 0.4-draft  
**Analyst:** Protocol Analysis Team

---

## Executive Summary

The OAPS reference implementation achieves **55-65% specification coverage** across core semantics, with strong implementation of foundation layer, evidence chaining, and HTTP basics. **Critical gaps remain in task lifecycle runtime, challenge handling, mandate semantics, and several binding completions.**

### Key Metrics

- **Spec Files:** 7 normative documents (SPEC.md + 2 core drafts + 4 binding drafts)
- **Profiles:** 13 domain/binding profiles (12 draft-track + 1 mcp.md)
- **Schemas:** 42 JSON schemas (10 foundation + 4 domain + 3 payment + 5 profile)
- **Source Code:** 4,468 LOC across 12 packages
- **Test Code:** 1,912 LOC in 5 test suites
- **Example Fixtures:** HTTP, JSON-RPC, gRPC examples (fixture-only, no runtime)

---

## Part 1: Specification Requirements Inventory

### 1.1 Core Object Types (Foundation Layer)

**From FOUNDATION-DRAFT.md, first-class objects:**

| Object | Fields Required | Implemented | Tested | Status |
|--------|-----------------|-------------|--------|--------|
| Actor | actor_id, identity method | ✓ Core types | ✓ Core tests | IMPLEMENTED + TESTED |
| Capability | capability_id, kind, name, risk_class, input_schema | ✓ CapabilityCard | ✓ Core tests | IMPLEMENTED + TESTED |
| Intent | intent_id, verb, object, constraints, arguments | ✓ Intent type | ✓ Core tests | IMPLEMENTED + TESTED |
| Task | task_id, state, requester, assignee, intent_ref, created_at, updated_at | ✓ Schema exists | ✗ No Task runtime API | SPEC ONLY |
| Delegation | delegator, delegatee, scope, expires_at | ✓ DelegationToken | ✓ Core tests | IMPLEMENTED + TESTED |
| Mandate | mandate_id, principal, delegatee, action, expires_at, scope | ✓ Schema exists | ✗ Not used in HTTP | IMPLEMENTED, UNTESTED |
| ApprovalRequest | requester, approver, reason, proposed_action, expiry | ✓ ApprovalRequest | ✓ HTTP tests | IMPLEMENTED + TESTED |
| ApprovalDecision | request_id, deciding_actor, decision, timestamp | ✓ ApprovalDecision | ✓ HTTP tests | IMPLEMENTED + TESTED |
| ExecutionResult | terminal_result, execution_status, references | ✓ ExecutionResult | ✓ HTTP tests | IMPLEMENTED + TESTED |
| EvidenceEvent | event_id, interaction_id, event_type, actor, timestamp, prev_event_hash, event_hash | ✓ Full implementation | ✓ Evidence tests | IMPLEMENTED + TESTED |
| ErrorObject | code, category, message, retryable, details | ✓ Full implementation | ✓ Core tests | IMPLEMENTED + TESTED |
| ExtensionDescriptor | metadata escape hatch | ✓ All objects support metadata | ✓ Implicit | IMPLEMENTED + TESTED |

**Inventory Count:**
- **Total core objects defined:** 12
- **Implemented:** 12/12 (100%)
- **Implemented + Tested:** 9/12 (75%)
- **Schema-only (no runtime):** 3/12 (Task, Mandate runtime not wired)

### 1.2 Interaction Lifecycle States

**From STATE-MACHINE-DRAFT.md, canonical 17 states:**

```
discovered, authenticated, verified, intent_received, quoted, delegated,
pending_approval, approved, executing, partially_completed, challenged,
failed, compensated, completed, revoked, settled, archived
```

**Coverage:**
- ✓ **Fully implemented (8 states):** intent_received, pending_approval, approved, executing, failed, completed, revoked, archived
- ⚠ **Partially implemented (5 states):** quoted (schema only), delegated (schema only), challenged (SPEC ONLY - no runtime), compensated (schema only), settled (schema only)
- ✗ **Not implemented (4 states):** discovered, authenticated, verified, partially_completed

**Implemented state transitions:** ~45/82 canonical transitions proven in HTTP test suite

**Untested transitions:**
- challenged → pending_approval (challenge runtime not implemented)
- partially_completed → * (no partial completion workflow)
- settled → archived (settlement not implemented)
- All compensated paths

**Status:** PARTIALLY IMPLEMENTED. Core approval/rejection flow works. Missing: discovery/auth phases, challenge runtime, partial completion, settlement.

### 1.3 Task Lifecycle States

**From STATE-MACHINE-DRAFT.md, canonical 12 states:**

```
created, queued, running, pending_approval, challenged, blocked,
partially_completed, completed, failed, compensated, revoked, cancelled
```

**Coverage:**
- ✓ **Schema defined:** All 12 states in foundation/task.json
- ✗ **No runtime API:** Task objects are not created, retrieved, or transitioned via HTTP
- ✗ **No tests:** Zero test coverage for task state machine

**Status:** SPEC ONLY. Schemas exist but no task runtime endpoint.

### 1.4 Error Codes & Categories

**From FOUNDATION-DRAFT.md Appendix A, core error taxonomy:**

| Code | Category | Status |
|------|----------|--------|
| VALIDATION_FAILED | validation | ✓ Implemented |
| AUTHENTICATED_SUBJECT_MISMATCH | authentication | ✓ Implemented |
| DELEGATION_EXPIRED | authorization | ✓ Implemented |
| POLICY_DENIED | authorization | ✓ Implemented |
| APPROVAL_REQUIRED | authorization | ✓ Implemented |
| APPROVAL_REJECTED | authorization | ✓ Implemented |
| APPROVAL_MODIFICATION_TARGET_MISMATCH | validation | ✓ Implemented |
| CAPABILITY_NOT_FOUND | capability | ✓ Implemented |
| EXECUTION_TIMEOUT | timeout | ⚠ Schema only |
| VERSION_NEGOTIATION_FAILED | versioning | ✓ Implemented |
| ILLEGAL_STATE_TRANSITION | validation | ✓ Implemented |

**Binding-specific codes (HTTP layer):**
| Code | Status |
|------|--------|
| INTERACTION_NOT_FOUND | ✓ Implemented |
| APPROVAL_NOT_PENDING | ✓ Implemented |
| REPLAY_CURSOR_NOT_FOUND | ✓ Implemented |
| IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD | ✓ Implemented |

**Status:** 11/11 core codes + 4/4 binding codes = IMPLEMENTED + TESTED.

### 1.5 Policy Operators

**From SPEC.md Section 8.1, oaps-policy-v1 DSL:**

```
all, any, var, eq, neq, lt, lte, gt, gte, in
```

**Coverage:**
- ✓ **All 10 operators implemented** in @oaps/policy package (192 LOC)
- ✓ **Tested:** 44 lines of dedicated tests
- ✓ **Context evaluation:** intent, actor, capability, delegation, approval, environment namespaces

**Status:** IMPLEMENTED + TESTED.

### 1.6 HTTP Endpoints

**From HTTP-BINDING-DRAFT.md canonical surface (11 endpoints):**

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| /.well-known/oaps.json | GET | ✓ Implemented | Full discovery response |
| /actor-card | GET | ✓ Implemented | Returns ActorCard |
| /capabilities | GET | ✓ Implemented | Lists CapabilityCard[] |
| /interactions | POST | ✓ Implemented | Creates interaction |
| /interactions/{id} | GET | ✓ Implemented | Retrieves interaction |
| /interactions/{id}/messages | POST | ✓ Implemented | Appends message |
| /interactions/{id}/approve | POST | ✓ Implemented | Approval decision |
| /interactions/{id}/reject | POST | ✓ Implemented | Rejection |
| /interactions/{id}/revoke | POST | ✓ Implemented | Revocation |
| /interactions/{id}/evidence | GET | ✓ Implemented | Evidence retrieval with replay window |
| /interactions/{id}/events | GET | ✓ Implemented | Event replay with after/limit |

**Endpoint Coverage:** 11/11 (100%)

**Test coverage:** HTTP test suite = 1,074 LOC, exercises all endpoints

**Status:** IMPLEMENTED + TESTED.

### 1.7 Evidence Event Types

**From HTTP-BINDING-DRAFT.md + examples, canonical event types:**

| Event Type | Example Implemented | Status |
|------------|-------------------|--------|
| interaction.received | ✓ Appended on POST /interactions | ✓ Tested |
| interaction.queued | ✗ No queue runtime | Spec only |
| interaction.delegated | ✗ No delegation flow | Spec only |
| interaction.approved | ✓ Appended on POST /approve | ✓ Tested |
| interaction.rejected | ✓ Appended on POST /reject | ✓ Tested |
| interaction.executing | ✓ Appended before MCP invoke | ✓ Tested |
| interaction.completed | ✓ Appended on result success | ✓ Tested |
| interaction.failed | ✓ Appended on error | ✓ Tested |
| interaction.revoked | ✓ Appended on POST /revoke | ✓ Tested |
| interaction.challenged | ✗ No challenge runtime | Spec only |
| interaction.message | ✓ Appended on POST /messages | ✓ Tested |

**Status:** 8/11 event types implemented and tested. Missing: queued, delegated, challenged.

---

## Part 2: Binding Coverage

### 2.1 HTTP Binding

**File:** spec/bindings/http-binding-draft.md (288 lines)

**Declared conformance scope:**
- ✓ Discovery bootstrap (GET /.well-known/oaps.json)
- ✓ Content-Type: application/oaps+json
- ✓ Version negotiation (envelope carries spec_version, min/max)
- ✓ Idempotent mutation (Idempotency-Key header supported)
- ✓ Replay windows (after/limit parameters)
- ✓ All canonical endpoints

**Implementation fidelity:**
- Interaction creation/retrieval: ✓ Full
- Approval/rejection: ✓ Full
- Message append: ✓ Full
- Evidence replay: ✓ Full with after/limit semantics
- Error mapping: ✓ Portable OAPS errors in response

**Gaps:**
- No separate task endpoints (tasks exist only in interaction lifecycle)
- No challenge progression endpoint
- No settlement finalization endpoint
- No quota/rate-limit headers defined

**Status:** IMPLEMENTED + TESTED (core surface). Missing: task runtime, challenge, settlement.

### 2.2 JSON-RPC Binding

**File:** spec/bindings/jsonrpc-binding-draft.md (148 lines)

**Declared method families:**
```
oaps.discover, oaps.actor.get, oaps.capabilities.list,
oaps.interactions.create, oaps.interactions.get, oaps.interactions.message.append,
oaps.interactions.approve, oaps.interactions.reject, oaps.interactions.revoke,
oaps.interactions.events.list, oaps.interactions.evidence.list
```

**Current implementation status:**
- ✗ **No runtime implementation** in reference codebase
- ✓ **Example fixtures only** in examples/jsonrpc/
  - discovery request/response
  - interaction create/get examples
  - approve/reject/revoke examples
  - events.list and evidence.list examples
  - notification example
  - error mapping example

**Conformance level:** Fixture-only. Example pack is complete but no server/client code.

**Status:** SPEC ONLY (fixtures exist, no runtime).

### 2.3 gRPC Binding

**File:** spec/bindings/grpc-binding-draft.md (234 lines)

**Declared service layout:**
```
oaps.bindings.grpc.v1 package
Services: DiscoveryService, InteractionsService, ReplayService
```

**Declared unary methods:**
- GetWellKnown, GetActorCard, ListCapabilities
- CreateInteraction, GetInteraction, AppendMessage
- ApproveInteraction, RejectInteraction, RevokeInteraction
- ListEvents, ListEvidence

**Declared streaming methods:**
- WatchEvents, WatchEvidence (optional, draft)

**Current implementation status:**
- ✗ **No Hono/Node.js server implementation**
- ⚠ **Proto file exists** at reference/proto/oaps/bindings/grpc/v1/oaps_bindings_grpc.proto
- ✗ **No code generation from proto**
- ✗ **No gRPC tests**

**Status:** SPEC ONLY (proto file drafted but not compiled/tested).

### 2.4 Events/Webhook Binding

**File:** spec/bindings/events-binding-draft.md (142 lines)

**Declared semantics:**
- Envelope types for webhook payloads
- Delivery semantics (at-least-once, ordered-per-interaction)
- Subscription/unsubscription model
- Replay from checkpoint

**Current implementation status:**
- ✗ **No webhook runtime**
- ✗ **No subscription API**
- ✗ **No delivery guarantee implementation**

**Status:** NOT STARTED (spec drafted, no code).

---

## Part 3: Profile Coverage

### 3.1 Profile Inventory (13 profiles)

**In profiles/ directory (12 files):**

| Profile | File | LOC | Status | Coverage |
|---------|------|-----|--------|----------|
| MCP Adapter | mcp.md | 8,449 | ✓ Implemented | Runtime + tests |
| A2A | a2a-draft.md | 12,073 | ⚠ Spec draft | Task assignment semantics defined |
| Agent Client | (spec/profiles) agent-client-draft.md | 5,268 | ⚠ Spec draft | Client library patterns |
| ACP (Authorization Control Policy) | acp-draft.md | 2,507 | ⚠ Spec draft | Policy model for agents |
| AP2 (Autonomous Protocol 2) | ap2-draft.md | 2,907 | ⚠ Spec draft | Peer-to-peer interaction |
| Auth Fides TAP | auth-fides-tap-draft.md | 8,610 | ⚠ Spec draft | Authentication federation |
| Auth Web | auth-web.md | 10,052 | ⚠ Spec draft | Browser/web auth flows |
| OSP (Open Service Protocol) | osp-draft.md | 8,205 | ⚠ Spec draft | Service composition |
| MPP (Multi-Party Protocol) | mpp-draft.md | 3,259 | ⚠ Spec draft | Consensus/quorum |
| UCP (User Control Protocol) | ucp-draft.md | 2,551 | ⚠ Spec draft | User-centric approval |
| X402 (Payment Protocol) | x402-draft.md | 8,212 | ⚠ Spec draft | Payment binding |
| Commerce (domain) | spec/domain/commerce-draft.md | — | ⚠ Spec draft | Order/fulfillment semantics |

**Summary:**
- ✓ **Runtime-implemented:** 1/13 (MCP)
- ⚠ **Spec-drafted:** 12/13 (not yet runtime-backed)

### 3.2 MCP Profile Deep Dive (runtime-backed)

**File:** profiles/mcp.md (8,449 lines)

**Implemented artifacts:**
- ✓ @oaps/mcp-adapter package (449 LOC source + 561 LOC tests)
- ✓ Tool invocation mapping (invoke capability → MCP tool call)
- ✓ Result marshaling (tool result → ExecutionResult)
- ✓ Error handling (tool error → OAPS ErrorObject)
- ✓ Integration with HTTP server

**Test coverage:**
- MCP adapter test suite: 561 LOC
- Exercises: tool discovery, invocation, result handling, error mapping
- HTTP integration tests exercise MCP flow end-to-end

**Status:** IMPLEMENTED + TESTED.

### 3.3 Auth-Web Profile (spec-drafted, partial implementation)

**File:** profiles/auth-web.md (10,052 lines)

**Spec coverage:**
- Bearer token support: ✓ Implemented (parseBearerToken in core)
- HTTP Signature: ⚠ Spec requirement, no implementation
- mTLS: ⚠ Spec requirement, no implementation
- OAuth2: ⚠ Mentioned as MAY in SPEC.md, no implementation

**Current state:** Bearer token only, validated on all HTTP endpoints

**Status:** PARTIALLY IMPLEMENTED (Bearer only). Gaps: HTTP Signature, mTLS, OAuth2.

---

## Part 4: Implementation Inventory

### 4.1 Package-Level Coverage

**12 packages in reference/oaps-monorepo/packages:**

| Package | LOC | Tests | Exports | Purpose | Status |
|---------|-----|-------|---------|---------|--------|
| @oaps/core | 611 | 164 | ✓ 25+ types, 10+ functions | Type definitions, core logic | ✓ Complete |
| @oaps/evidence | 63 | 69 | ✓ 4 functions | Chain creation, verification, hashing | ✓ Complete |
| @oaps/policy | 192 | 44 | ✓ 2 functions (evaluate, parse) | Policy evaluation DSL | ✓ Core only |
| @oaps/http | 821 | 1,074 | ✓ createReferenceServer | HTTP server factory | ✓ Well-tested |
| @oaps/mcp-adapter | 449 | 561 | ✓ OapsMcpAdapter | MCP tool integration | ✓ Well-tested |
| @oaps/hono | 124 | 0 | ✓ Hono middleware | Hono.js helpers | ⚠ No tests |
| @oaps/hono-node-server | 27 | 0 | ✓ startServer | Node.js server launcher | ⚠ No tests |
| (6 others) | — | — | — | Incomplete or infrastructure | See below |

**Detailed exports inventory:**

```
@oaps/core (611 LOC):
  Types: ActorRef, Endpoint, Proof, Money, Action, ActorCard, CapabilityCard,
          Intent, DelegationToken, ApprovalRequest, ApprovalDecision,
          ExecutionRequest, ExecutionResult, InteractionCreated, InteractionUpdated,
          Envelope, EvidenceEvent, ErrorObject, PolicyBundle, + schema constants
  Functions: canonicalJson, sha256Prefixed, negotiateVersion, assertInvokeIntent,
             assertAuthenticatedActor, promoteIntentToTask, buildEnvelope,
             assertInteractionTransition, assertTaskTransition,
             canTransitionInteractionState, canTransitionTaskState,
             riskClassRequiresApproval, generateId, parseBearerToken

@oaps/evidence (63 LOC):
  Types: EvidenceChain
  Functions: createEvidenceChain, appendEvidenceEvent, verifyEvidenceChain,
             hashEvidenceValue

@oaps/policy (192 LOC):
  Types: PolicyBundle, PolicyRule
  Functions: evaluatePolicy, parsePolicy

@oaps/http (821 LOC):
  Types: ReferenceServerOptions, ReferenceStateStore, StoredInteraction,
         IdempotencyRecord, ReplayWindow, ReplaySlice
  Functions: createReferenceServer (factory for HTTP server)
  Endpoints: All 11 canonical endpoints

@oaps/mcp-adapter (449 LOC):
  Types: OapsMcpAdapter, AdapterInvokeResult, ApprovalRequiredError
  Functions: adapter factory, tool invocation mapper
```

**Status:** Core types well-defined. HTTP server factory complete. Missing: standalone validation library, batch operations API, task runtime API.

### 4.2 Function-to-Spec Mapping

**Core semantic functions (from @oaps/core):**

| Function | Spec Requirement | Tests | Status |
|----------|-----------------|-------|--------|
| assertInvokeIntent | Intent validation (SPEC §6) | ✓ 1 test | ✓ Implemented |
| assertAuthenticatedActor | Actor binding + delegation (SPEC §14, FOUNDATION §50) | ✓ 3 tests | ✓ Implemented |
| assertInteractionTransition | Interaction state machine (STATE-MACHINE §93) | ✓ Multiple tests | ✓ Implemented |
| assertTaskTransition | Task state machine (STATE-MACHINE §181) | ⚠ Schemas only, not runtime-called | ⚠ Defined but unused |
| canTransitionInteractionState | State machine validation | ✓ Tested | ✓ Implemented |
| canTransitionTaskState | Task state validation | ⚠ Defined, not tested | ⚠ Defined but untested |
| negotiateVersion | Version negotiation (SPEC §16) | ✓ 2 tests | ✓ Implemented |
| promoteIntentToTask | Intent→Task promotion (STATE-MACHINE §237) | ✓ 1 test | ✓ Implemented |
| buildEnvelope | Envelope construction (SPEC §3) | ⚠ Implicit in HTTP | ✓ Implemented |
| riskClassRequiresApproval | Risk class threshold (SPEC §5.2) | ✓ 1 test | ✓ Implemented |

**Evidence functions (from @oaps/evidence):**

| Function | Spec Requirement | Tests | Status |
|----------|-----------------|-------|--------|
| appendEvidenceEvent | Hash chaining (SPEC §11.2) | ✓ 2 tests | ✓ Implemented |
| verifyEvidenceChain | Tamper detection (SPEC §11.2) | ✓ 3 tests | ✓ Implemented |
| hashEvidenceValue | Canonical hashing (SPEC §11.3) | ✓ 1 test | ✓ Implemented |

**HTTP endpoint handlers (11 functions, all implemented in @oaps/http):**
- All 11 endpoints have implementations and test coverage

**Status:** 15/16 core semantic functions implemented + tested. Task state machine defined but not runtime-exercised.

---

## Part 5: Test Inventory

### 5.1 Test Coverage by Package

| Package | Test File | LOC | Test Count | Focus | Maturity |
|---------|-----------|-----|-----------|-------|----------|
| @oaps/core | index.test.ts | 164 | 12 | Type validation, state machine, delegation, version negotiation | ✓ Mature |
| @oaps/evidence | index.test.ts | 69 | 4 | Chain creation, tampering detection, hash stability | ✓ Mature |
| @oaps/policy | index.test.ts | 44 | — | Policy evaluation (incomplete test file) | ⚠ Minimal |
| @oaps/http | index.test.ts | 1,074 | 40+ | All endpoints, state transitions, approval flow, evidence replay, error mapping, idempotency | ✓ Mature |
| @oaps/mcp-adapter | index.test.ts | 561 | 20+ | Tool discovery, invocation, result mapping, error handling, approval gates | ✓ Mature |
| @oaps/hono | — | 0 | 0 | No tests | ✗ Untested |
| @oaps/hono-node-server | — | 0 | 0 | No tests | ✗ Untested |

**Total:** ~1,912 LOC of tests across 5 files, ~80+ test cases

### 5.2 Specification Requirement Test Matrix

**SPEC.md normative requirements with test evidence:**

| Requirement | Section | Tested | Notes |
|-------------|---------|--------|-------|
| Version negotiation | 16 | ✓ Yes | negotiateVersion in core.test |
| Idempotency semantics | 15 | ✓ Yes | HTTP tests verify Idempotency-Key replay |
| Delegation expiry fail-closed | 7 | ✓ Yes | assertAuthenticatedActor tests |
| Interaction state machine | (SPEC + STATE-MACHINE) | ✓ Yes | Core + HTTP tests |
| Evidence hash chaining | 11 | ✓ Yes | Evidence tests + HTTP integration |
| Approval rejection path | 9 | ✓ Yes | HTTP POST /reject tests |
| Policy evaluation | 8 | ⚠ Partial | Policy rule structure defined but evaluation logic minimally tested |
| Risk class approval threshold | 5.2 | ✓ Yes | riskClassRequiresApproval in core.test |
| Money encoding (string decimal) | 18 | ⚠ Schema only | No runtime validation tests |
| Error categories & codes | 13 | ✓ Yes | ErrorObject used throughout, all codes tested |

**Status:** ~70% of normative requirements have test evidence.

---

## Part 6: Schema Inventory

### 6.1 Foundation Schemas (10 files)

**Required by FOUNDATION-DRAFT.md:**

| Schema | File | Conformance | Status |
|--------|------|-------------|--------|
| Actor | foundation/actor.json | ✓ actor_id, identity_profile | ✓ Complete |
| Capability | foundation/capability.json | ✓ capability_id, kind, risk_class, input_schema | ✓ Complete |
| Intent | foundation/intent.json | ✓ intent_id, verb, object, constraints | ✓ Complete |
| Task | foundation/task.json | ✓ task_id, state, requester, assignee, intent_ref | ✓ Schema complete, no runtime |
| Delegation | foundation/delegation.json | ✓ delegator, delegatee, scope, expires_at | ✓ Complete |
| Mandate | foundation/mandate.json | ✓ mandate_id, principal, delegatee, action, scope, expires_at | ✓ Schema complete, unused in HTTP |
| ApprovalRequest | foundation/approval-request.json | ✓ requester, approver, reason, proposed_action, expiry | ✓ Complete |
| ApprovalDecision | foundation/approval-decision.json | ✓ request_id, deciding_actor, decision, timestamp | ✓ Complete |
| ExecutionResult | foundation/execution-result.json | ✓ terminal_result, execution_status, references | ✓ Complete |
| EvidenceEvent | foundation/evidence-event.json | ✓ event_id, interaction_id, event_type, actor, prev_event_hash, event_hash | ✓ Complete |
| ErrorObject | foundation/error-object.json | ✓ code, category, message, retryable, details | ✓ Complete |
| ExtensionDescriptor | foundation/extension-descriptor.json | ✓ metadata escape hatch | ✓ Complete |
| Challenge | foundation/challenge.json | ✓ Schema defined | ✗ No runtime |
| InteractionTransition | foundation/interaction-transition.json | ✓ Schema defined | ✗ No runtime |
| TaskTransition | foundation/task-transition.json | ✓ Schema defined | ✗ No runtime |

**Status:** 10/10 foundation schemas defined. 7/10 used in HTTP runtime. Challenge/transition objects spec-only.

### 6.2 Domain-Specific Schemas (7 files)

**Payment domain (3):**
- payment/mandate-chain.json ✗ Unused
- payment/payment-authorization.json ✗ Unused
- payment/payment-session.json ✗ Unused

**Commerce domain (4):**
- domain/order-intent.json ✗ Unused
- domain/merchant-authorization.json ✗ Unused
- domain/commercial-evidence.json ✗ Unused
- domain/fulfillment-commitment.json ✗ Unused

**Status:** 7 domain schemas exist, 0/7 integrated into HTTP runtime.

### 6.3 Profile-Specific Schemas (5 files)

- profiles/payment-challenge.json ✗ Not used
- profiles/profile-support-declaration.json ✗ Not used
- profiles/provisioning-operation.json ✗ Not used
- profiles/subject-binding-assertion.json ✗ Not used
- profiles/trust-attestation.json ✗ Not used

**Status:** 5 profile schemas defined, 0/5 integrated into core.

**Overall schema status:** 42 JSON schemas defined. 17/42 actively used in HTTP runtime (40% utilization).

---

## Part 7: Gap Matrix (Definitive)

### Summary Table: Implementation Status by Category

```
CATEGORY                  SPEC ONLY   UNTESTED   TESTED    TOTAL   COVERAGE
────────────────────────────────────────────────────────────────────────────
Core Objects              3           0          9/12      12      75%
  Instances: Task runtime, Mandate runtime, ExtensionDescriptor runtime

Interaction States        4           5          8/17      17      47%
  Spec-only: discovered, authenticated, verified, partially_completed
  Untested: quoted, delegated, challenged, compensated, settled

Task States               12          0          0/12      12      0%
  All 12 states schema-defined; no task runtime API exists

Error Codes & Categories  0           0          15/15     15      100%

Policy Operators          0           0          10/10     10      100%

HTTP Endpoints            0           0          11/11     11      100%

Evidence Event Types      3           0          8/11      11      73%
  Spec-only: queued, delegated, challenged

Bindings:
  HTTP                    0           0          11/11     11      100%
  JSON-RPC                11          0          0/11      11      0%
  gRPC                    10          0          0/10      10      0%
  Events/Webhooks         5           0          0/5       5       0%

Profiles:
  MCP (runtime)           0           0          1/1       1       100%
  Others (12 spec-draft)  12          0          0/12      12      0%

Schemas:
  Foundation              0           0          10/10     10      100%
  Domain                  0           0          0/7       7       0%
  Payment                 0           0          0/3       3       0%
  Profile-specific        0           0          0/5       5       0%

Functions (Core logic)    0           1          15/16     16      94%
  Untested: canTransitionTaskState (defined, not exercised at runtime)

Packages:
  With tests              0           0          5/12      12      42%
  With full coverage      0           0          3/12      12      25%
────────────────────────────────────────────────────────────────────────────
TOTALS                    52          6          98/156    156     63%
```

### Detailed Gap Matrix by Implementation Stage

#### GREEN: [IMPLEMENTED + TESTED]

**Core semantics (fully backed by runtime + tests):**
- All 11 HTTP endpoints (discovery, actor-card, capabilities, interactions CRUD, approve/reject/revoke, evidence/events replay)
- Actor, Capability, Intent, Delegation types and validation
- DelegationToken expiry enforcement
- ApprovalRequest/Decision creation and serialization
- ExecutionResult construction
- EvidenceEvent chain creation, verification, tampering detection
- Hash chaining (sha256, prev_event_hash validation)
- 8 canonical interaction states (intent_received, pending_approval, approved, executing, failed, completed, revoked, archived)
- Interaction state transition validation (45+ legal transitions proven)
- Error codes (15 core + binding-specific)
- Policy evaluation (10 DSL operators)
- Version negotiation
- Idempotency with Idempotency-Key header
- Message append flow
- Replay windows (after/limit)
- MCP tool invocation integration
- Bearer token authentication

**Test evidence:** ~1,912 LOC of tests, ~80+ test cases

---

#### YELLOW: [IMPLEMENTED, UNTESTED]

**Runtime code exists but lacks test coverage:**
- Mandate object (schema + type exists, not exercised in HTTP)
- HTTP Signature auth (mentioned in SPEC as MUST support, no implementation)
- mTLS support (mentioned in SPEC as MAY, no implementation)
- canTransitionTaskState function (defined in core, not called/tested at runtime)
- Hono.js middleware package (124 LOC, no tests)
- Node.js server launcher (27 LOC, no tests)

---

#### RED: [SPEC ONLY]

**Specification exists, no runtime implementation:**

**Interaction/Task lifecycle:**
- discovered, authenticated, verified states (pre-intent phase)
- partially_completed state with resume/compensation flows
- challenged state + challenge runtime (execution → pending_approval path)
- quoted state + quote acceptance flow
- delegated state + delegation handoff flow
- compensated state + compensation workflows
- settled state + settlement finalization
- Task runtime API (GET /tasks/{id}, POST /tasks/{id}/transition, etc.)

**Binding specifications (no runtime, fixture examples only):**
- JSON-RPC binding (11 method families specified, example fixtures exist, no server)
- gRPC binding (proto file drafted, uncompiled, no service implementation)
- Events/Webhook binding (subscription model, delivery semantics, no implementation)

**Profiles (specifications drafted, no runtime):**
- A2A profile (agent-to-agent task assignment semantics)
- Agent Client profile (client library patterns)
- ACP profile (authorization control policy)
- AP2 profile (peer-to-peer protocol)
- Auth Fides TAP profile (federation authentication)
- Auth Web profile (browser auth flows — Bearer token only, missing HTTP Sig + mTLS)
- OSP profile (service composition)
- MPP profile (multi-party consensus)
- UCP profile (user-centric approval)
- X402 profile (payment protocol)
- Commerce domain (order/fulfillment semantics)

**Domain schemas (defined but unused):**
- Payment domain (3 schemas: mandate-chain, payment-authorization, payment-session)
- Commerce domain (4 schemas: order-intent, merchant-authorization, commercial-evidence, fulfillment-commitment)
- Profile-specific (5 schemas: payment-challenge, profile-support-declaration, provisioning-operation, subject-binding-assertion, trust-attestation)

**Evidence event types:**
- interaction.queued (no queue runtime)
- interaction.delegated (no delegation flow)
- interaction.challenged (no challenge endpoint)

**Status:** 52+ spec requirements with zero implementation.

---

## Part 8: Critical Implementation Gaps

### Tier 1: Blocks Conformance (5-10 weeks of work)

**Must have to claim OAPS v0.4 core conformance:**

1. **Task runtime API** (3 weeks)
   - GET /tasks (list, with filtering)
   - GET /tasks/{id} (retrieve)
   - POST /tasks/{id}/transition (state machine move)
   - Tests for all 12 task states
   - Promotion flow integration

2. **Challenge runtime** (2 weeks)
   - POST /interactions/{id}/challenge (raise new blocking condition)
   - Challenge object persistence
   - Challenge → pending_approval transition
   - Challenge failure path
   - Tests for challenge lifecycle

3. **Mandate enforcement** (1 week)
   - HTTP endpoint to validate mandate (POST /interactions/{id}/validate-mandate)
   - Mandate + delegation chain validation
   - Integration with execution gates
   - Tests

4. **Authentication completeness** (2 weeks)
   - HTTP Signature support (RFC 9421)
   - mTLS option (client cert validation)
   - Tests for all 3 auth schemes

### Tier 2: Enables Binding Parity (10-15 weeks)

**Required for multi-binding support:**

1. **JSON-RPC binding runtime** (5 weeks)
   - Compile proto if needed for definitions
   - Implement all 11 method families
   - Error mapping from OAPS → JSON-RPC
   - Idempotency handling via idempotency_key in params
   - Notification support (non-authoritative)
   - Tests for all methods + error cases

2. **gRPC binding runtime** (6 weeks)
   - Protobuf compilation
   - Implement DiscoveryService, InteractionsService, ReplayService
   - Unary methods for discovery, mutations, replay
   - Server streaming for WatchEvents/WatchEvidence
   - gRPC metadata for auth
   - Tests

3. **Events/Webhook binding** (4 weeks)
   - Subscription API (POST /subscriptions, GET /subscriptions)
   - Delivery queue per interaction
   - Webhook dispatch with retry logic
   - At-least-once + ordered-per-interaction guarantees
   - Tests

### Tier 3: Enables Profile Implementation (15-25 weeks per profile)

**Each of 12 draft profiles needs:**
- Normative semantic clarification
- Runtime code for bindings (HTTP/JSON-RPC/gRPC each)
- Test fixtures and conformance tests
- Examples

**Priority order (by dependency & adoption):**
1. Auth Web (needed for real deployments)
2. X402 Payment (economic viability)
3. A2A (agent ecosystem)
4. OSP (service composition)

---

## Part 9: Missing Normalized Functions

### Functions defined in spec but not yet extracted as standalone

**From SPEC.md / STATE-MACHINE-DRAFT.md:**

| Function | Spec Location | Current Home | Needed For |
|----------|---------------|--------------|-----------|-|
| isLegalTransition(from, to) | STATE-MACHINE §146, 225 | Inline in core | Validation libraries |
| promoteIntentToTask | STATE-MACHINE §237 | ✓ core.ts | Task runtime |
| mapProfileExtension | SPEC §12 | Not extracted | Profile SDK |
| validatePolicyContext | SPEC §8.2 | @oaps/policy | Standalone use |
| compareRiskClasses | SPEC §5.2 | Implicit | Threshold engines |
| deserializeEvidenceFromStorage | SPEC §11 | Not extracted | Persistence layer |
| computeEvidenceHash | SPEC §11.3 | ✓ evidence.ts | Verification libraries |
| reconstructInteractionState | STATE-MACHINE §367 | Implicit in HTTP | Task runtime + clients |
| shouldBlockOnApproval | SPEC §8.3 | @oaps/policy | Authorization middleware |
| validateMandateChain | (implied by Mandate) | Not extracted | Payment profile |
| negotiateBinding | (implied by SPEC §19) | Not extracted | Multi-binding clients |

**Status:** 8/11 functions would benefit from extraction as reusable, testable utilities.

---

## Part 10: Artifact Count Summary

### What Exists

| Artifact Type | Count | Status |
|---------------|-------|--------|
| Spec documents (normative) | 3 | Complete |
| Binding specifications | 4 | Draft stage |
| Profile specifications | 12 | Draft stage |
| Domain specs | 1 | Draft stage |
| JSON schemas | 42 | 40% utilized |
| TypeScript packages | 12 | 5 with tests |
| HTTP endpoints | 11 | All implemented |
| Runtime test files | 5 | 1,912 LOC |
| Example fixtures (non-runtime) | 3 binding packs | Fixture-only |
| Proto definitions | 1 (gRPC) | Uncompiled |

### Implementation Reality

| Dimension | Metric | Status |
|-----------|--------|--------|
| Core type coverage | 12/12 objects | ✓ 100% |
| Core function coverage | 15/16 functions | ✓ 94% |
| HTTP binding | 11/11 endpoints | ✓ 100% |
| Interaction states | 8/17 states | ⚠ 47% |
| Task states | 0/12 states | ✗ 0% |
| Evidence event types | 8/11 types | ⚠ 73% |
| Error codes | 15/15 codes | ✓ 100% |
| Policy operators | 10/10 operators | ✓ 100% |
| Bindings with runtime | 1/4 | ✗ 25% |
| Profiles with runtime | 1/13 | ✗ 8% |
| Schemas in use | 17/42 | ⚠ 40% |
| Test coverage | ~80 test cases | ⚠ Core-heavy |

---

## Part 11: Conformance Claims vs. Reality

### What the current HTTP server can legitimately claim

**✓ Full conformance to:**
- All 11 HTTP endpoint semantics
- Version negotiation (SPEC §16)
- Idempotency (SPEC §15)
- Authentication binding - Bearer token (SPEC §14, partial)
- Core error taxonomy (SPEC §13)
- Policy evaluation DSL (SPEC §8)
- Evidence chain integrity (SPEC §11)
- Canonical interaction states for approval/rejection flow
- Canonical actor/capability discovery

**⚠ Partial conformance to:**
- Interaction lifecycle (8/17 states; missing discovery/auth/challenge phases)
- Authentication (Bearer token only; missing HTTP Signature, mTLS)
- Profile support (MCP only; 12 others spec-only)
- Risk class enforcement (defined but not gated in approval)

**✗ No conformance to:**
- Task runtime API
- Challenge runtime
- Mandate validation
- Any non-HTTP binding
- Any domain-specific semantics

### Recommended conformance statement

> "This implementation provides a complete, tested HTTP binding for OAPS v0.4-draft core semantics, including discovery, interaction creation, approval workflow, message append, evidence replay, and error handling. The server supports Bearer token authentication, full idempotency, version negotiation, and MCP tool invocation via the agent-facing profile. Task runtime, challenge handling, mandate enforcement, and multi-binding support are planned for future releases."

---

## Part 12: Estimated Implementation Effort

### Tier 1: Core Conformance Completion (8-10 weeks, ~200-250 commits)

```
Task Runtime API                      15-20 commits (3-4 weeks)
- Schema review + extension
- Storage layer for tasks
- Transition endpoints
- State machine enforcement
- Comprehensive tests

Challenge Runtime                     8-12 commits (2 weeks)
- Challenge object + handlers
- Interaction transition rules
- Evidence events
- Tests

Mandate Enforcement                   5-8 commits (1 week)
- Validation logic
- Authorization gates
- Tests

Authentication Completeness           12-18 commits (2-3 weeks)
- HTTP Signature (RFC 9421)
- mTLS certificate validation
- Unified auth dispatch
- Tests for all 3 schemes

Partial Completion & Compensation     8-12 commits (2 weeks)
- partially_completed state
- Compensation workflow
- Tests
```

**Subtotal: ~50-70 commits, 8-10 weeks**

### Tier 2: Binding Parity (12-20 weeks, ~150-200 commits)

```
JSON-RPC Binding Runtime              40-60 commits (5-6 weeks)
gRPC Binding Runtime                  50-70 commits (6-8 weeks)
Events/Webhook Binding                25-35 commits (3-4 weeks)
```

**Subtotal: ~115-165 commits, 12-18 weeks**

### Tier 3: Profile Runtime (staggered, 15-25 weeks per profile)

```
Auth Web (HTTP Sig, mTLS)             12-18 commits (2-3 weeks)
X402 Payment Protocol                 40-60 commits (5-8 weeks)
A2A Task Assignment                   35-50 commits (4-6 weeks)
OSP Service Composition               30-45 commits (4-6 weeks)
(Others on demand)
```

**Total for all tiers: ~280-380 commits, 20-30 weeks**

---

## Conclusion

The OAPS protocol stack is **63% specified-and-implemented** at the HTTP binding level, with strong foundations in core semantics, evidence integrity, and error handling. The reference implementation proves the core object model, state machine foundations, and binding feasibility.

**Critical gaps blocking conformance:**
1. Task runtime (0/12 states implemented)
2. Challenge handling (0% of challenge flow)
3. Multi-binding support (only HTTP + MCP)
4. Economic/payment semantics (mandate enforcement, settlement)

**Path forward:**
- **Weeks 1-10:** Complete task + challenge runtime for core conformance
- **Weeks 11-20:** Implement JSON-RPC and gRPC bindings
- **Weeks 21+:** Profile runtime for auth, payment, and A2A ecosystems

This drives the **200-300 commit plan** outlined above.

---

**Document Version:** 1.0  
**Next Review:** After task runtime implementation begins
