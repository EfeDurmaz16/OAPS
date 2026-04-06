# OAPS Master Implementation Plan

> 490 commits from ~57% to 100% spec completion, with full ecosystem integration.
>
> **Status**: Draft — 2026-04-05
>
> **Baseline**: 103 tests, 4,468 LOC across 6 packages (core, evidence, http, mcp-adapter, policy, hono).
> 12/17 core types, 11/11 HTTP endpoints, ~50/77 transitions, 14/16 error codes, 1/4 auth schemes.
> 0/11 JSON-RPC, 0/13 gRPC, 0/5 events, 0/4 task runtime, 0/3 challenge, 0/5 agent-client profile.

---

## Principles

1. **Open standard first** — Sardis, Agit, FIDES, OSP integrations are profile implementations behind clear boundaries.
2. **Core spec never depends on ecosystem repos** — all integration packages are optional.
3. **Tests pass independently** — no ecosystem repo needs to be present for core/binding tests.
4. **Atomic commits** — each commit compiles, passes its own tests, and is independently reviewable.
5. **Foundation layer** — `reference/oaps-monorepo/packages/` is the implementation root.

---

## Phase 1: Core Completion (commits 1-40)

### 1.1 Missing Schemas — Task (commits 1-5)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 1 | `feat(core): add Task interface and factory` | `packages/core/src/index.ts` | Add Task type with id, interaction_id, agent_id, state, input, output, created_at, updated_at fields. Add createTask() factory. | 45 |
| 2 | `feat(core): add TaskState enum and guards` | `packages/core/src/index.ts` | Add TASK_STATES literal union, isTaskState() guard, assertTaskState() validator. Wire to generated-schema-constants. | 35 |
| 3 | `test(core): add Task creation and validation tests` | `packages/core/src/index.test.ts` | Positive tests for createTask(), TaskState guards. Negative tests for invalid states. | 60 |
| 4 | `feat(core): add Task JSON schema cross-reference` | `schemas/foundation/task.json`, `packages/core/src/index.ts` | Ensure runtime Task type matches foundation/task.json. Add schema version constant. | 30 |
| 5 | `test(core): add Task schema round-trip test` | `packages/core/src/index.test.ts` | Validate createTask() output against foundation/task.json example. | 25 |

### 1.2 Missing Schemas — Mandate (commits 6-10)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 6 | `feat(core): add Mandate interface` | `packages/core/src/index.ts` | Mandate with mandate_id, issuer, subject, scope, constraints, max_amount, currency, expires_at, status. | 50 |
| 7 | `feat(core): add Mandate factory and validators` | `packages/core/src/index.ts` | createMandate(), isMandateActive(), assertMandateScope(). | 40 |
| 8 | `test(core): add Mandate positive and negative tests` | `packages/core/src/index.test.ts` | Test creation, scope validation, expiry check, amount bounds. | 55 |
| 9 | `feat(core): add MandateStatus transitions` | `packages/core/src/index.ts` | active -> suspended -> revoked, active -> exhausted, active -> expired. Transition guard. | 35 |
| 10 | `test(core): add Mandate transition tests` | `packages/core/src/index.test.ts` | Legal and illegal transition coverage for MandateStatus. | 40 |

### 1.3 Missing Schemas — Challenge (commits 11-15)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 11 | `feat(core): add Challenge interface` | `packages/core/src/index.ts` | Challenge with challenge_id, type, issuer, subject, payload, response_schema, expires_at, status. | 45 |
| 12 | `feat(core): add ChallengeType enum and factory` | `packages/core/src/index.ts` | ChallengeTypes: payment_required, identity_verification, capability_proof. createChallenge(). | 35 |
| 13 | `feat(core): add challenge response validation` | `packages/core/src/index.ts` | validateChallengeResponse() that checks type, expiry, schema conformance. | 40 |
| 14 | `test(core): add Challenge lifecycle tests` | `packages/core/src/index.test.ts` | Create, respond, expire, invalid-response tests. | 55 |
| 15 | `test(core): add Challenge schema conformance test` | `packages/core/src/index.test.ts` | Validate against schemas/foundation/challenge.json examples. | 25 |

### 1.4 Missing Schemas — InteractionTransition (commits 16-19)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 16 | `feat(core): add InteractionTransition interface` | `packages/core/src/index.ts` | InteractionTransition with interaction_id, from_state, to_state, timestamp, trigger, actor_id, evidence_hash. | 40 |
| 17 | `feat(core): add createInteractionTransition factory` | `packages/core/src/index.ts` | Factory that validates from/to legality before construction. | 30 |
| 18 | `test(core): add InteractionTransition tests` | `packages/core/src/index.test.ts` | All legal transitions succeed, all illegal transitions throw. | 50 |
| 19 | `feat(core): wire InteractionTransition to evidence chain` | `packages/core/src/index.ts`, `packages/evidence/src/index.ts` | Auto-append evidence event on transition creation. | 35 |

### 1.5 Missing Schemas — TaskTransition (commits 20-23)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 20 | `feat(core): add TaskTransition interface` | `packages/core/src/index.ts` | TaskTransition with task_id, from_state, to_state, timestamp, trigger, metadata. | 35 |
| 21 | `feat(core): add TaskTransition factory with guard` | `packages/core/src/index.ts` | Factory enforcing legal task state transitions only. | 30 |
| 22 | `test(core): add TaskTransition legal/illegal tests` | `packages/core/src/index.test.ts` | Cover all TASK_STATES x TASK_STATES combinations. | 55 |
| 23 | `feat(core): wire TaskTransition to evidence chain` | `packages/core/src/index.ts`, `packages/evidence/src/index.ts` | Auto-append evidence event on task transition. | 30 |

### 1.6 Full State Machine Enforcement (commits 24-32)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 24 | `feat(core): define complete interaction transition table` | `packages/core/src/index.ts` | Export INTERACTION_TRANSITIONS as Map<InteractionState, InteractionState[]> covering all 77 spec transitions. | 40 |
| 25 | `feat(core): add assertInteractionTransition guard` | `packages/core/src/index.ts` | Throws OapsError with INVALID_TRANSITION code for illegal transitions. | 25 |
| 26 | `test(core): test all 77 legal interaction transitions` | `packages/core/src/index.test.ts` | Parameterized test for every legal from->to pair. | 70 |
| 27 | `test(core): test illegal interaction transitions exhaustively` | `packages/core/src/index.test.ts` | Every non-legal from->to pair must throw INVALID_TRANSITION. | 60 |
| 28 | `feat(core): define complete task transition table` | `packages/core/src/index.ts` | Export TASK_TRANSITIONS Map for all legal task state changes. | 30 |
| 29 | `feat(core): add assertTaskTransition guard` | `packages/core/src/index.ts` | Guard function for task state machine. | 20 |
| 30 | `test(core): test all legal task transitions` | `packages/core/src/index.test.ts` | Parameterized coverage for task transitions. | 45 |
| 31 | `test(core): test illegal task transitions` | `packages/core/src/index.test.ts` | Negative cases for task state machine. | 40 |
| 32 | `feat(core): add transition event emitter hook` | `packages/core/src/index.ts` | onTransition callback slot for both interaction and task state machines. | 30 |

### 1.7 Task Runtime Endpoints (commits 33-36)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 33 | `feat(http): add POST /interactions/:id/tasks endpoint` | `packages/http/src/index.ts` | Create a task within an interaction. Validate interaction exists and is in executing state. | 50 |
| 34 | `feat(http): add GET /interactions/:id/tasks/:taskId endpoint` | `packages/http/src/index.ts` | Retrieve task by ID within interaction. | 30 |
| 35 | `feat(http): add PATCH /interactions/:id/tasks/:taskId endpoint` | `packages/http/src/index.ts` | Update task state with transition guard. | 45 |
| 36 | `test(http): add task endpoint tests` | `packages/http/src/index.test.ts` | Create, get, update, invalid-transition tests for task endpoints. | 80 |

### 1.8 Challenge Semantics + Missing Error Codes (commits 37-40)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 37 | `feat(http): add POST /interactions/:id/challenge endpoint` | `packages/http/src/index.ts` | Issue a challenge within an interaction context. | 40 |
| 38 | `feat(http): add POST /interactions/:id/challenge/respond endpoint` | `packages/http/src/index.ts` | Submit challenge response, validate, transition interaction. | 50 |
| 39 | `feat(core): add remaining error codes MANDATE_EXHAUSTED, CHALLENGE_EXPIRED` | `packages/core/src/index.ts` | Add the 2 missing error codes to complete all 16. | 20 |
| 40 | `test(core): add error code completeness test` | `packages/core/src/index.test.ts` | Verify all 16 spec error codes are defined and constructable. | 35 |

---

## Phase 2: MCP Adapter Production-Grade (commits 41-70)

### 2.1 Input Validation Edge Cases (commits 41-46)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 41 | `test(mcp): add empty tool list edge case test` | `packages/mcp-adapter/src/index.test.ts` | McpClient.listTools() returns [] — adapter must return empty capabilities. | 20 |
| 42 | `test(mcp): add malformed inputSchema rejection test` | `packages/mcp-adapter/src/index.test.ts` | Tool with invalid inputSchema must be filtered or error. | 25 |
| 43 | `feat(mcp): validate inputSchema before capability mapping` | `packages/mcp-adapter/src/index.ts` | Skip tools with missing/invalid inputSchema, log warning. | 20 |
| 44 | `test(mcp): add duplicate tool name handling test` | `packages/mcp-adapter/src/index.test.ts` | Two tools with same name — adapter deduplicates or errors. | 25 |
| 45 | `test(mcp): add null/undefined arguments handling test` | `packages/mcp-adapter/src/index.test.ts` | callTool with null args must not crash. | 20 |
| 46 | `feat(mcp): coerce null arguments to empty object` | `packages/mcp-adapter/src/index.ts` | Defensive coercion for missing arguments. | 10 |

### 2.2 Approval Flow Hardening (commits 47-54)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 47 | `test(mcp): add modified approval passthrough test` | `packages/mcp-adapter/src/index.test.ts` | Approval decision with modifications array must propagate to execution. | 35 |
| 48 | `feat(mcp): pass approval modifications to execution context` | `packages/mcp-adapter/src/index.ts` | Thread modifications from ApprovalDecision into callTool arguments. | 25 |
| 49 | `test(mcp): add custom risk threshold override test` | `packages/mcp-adapter/src/index.test.ts` | approvalRiskThreshold = 'critical' skips approval for 'high'. | 30 |
| 50 | `test(mcp): add approval handler timeout test` | `packages/mcp-adapter/src/index.test.ts` | ApprovalHandler that never resolves — adapter must timeout. | 25 |
| 51 | `feat(mcp): add approval handler timeout with configurable duration` | `packages/mcp-adapter/src/index.ts` | Wrap approvalHandler in Promise.race with timeout. | 25 |
| 52 | `test(mcp): add approval handler error isolation test` | `packages/mcp-adapter/src/index.test.ts` | Throwing approvalHandler must not crash adapter — returns error result. | 25 |
| 53 | `feat(mcp): isolate approval handler errors` | `packages/mcp-adapter/src/index.ts` | try/catch around approvalHandler, convert to OapsError. | 20 |
| 54 | `test(mcp): add approval re-request after rejection test` | `packages/mcp-adapter/src/index.test.ts` | Rejected approval followed by new call must create fresh ApprovalRequest. | 30 |

### 2.3 Delegation Scope Enforcement (commits 55-60)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 55 | `test(mcp): add delegation scope exceeds capability test` | `packages/mcp-adapter/src/index.test.ts` | DelegationToken with narrower scope than intent — must reject. | 30 |
| 56 | `feat(mcp): enforce delegation scope subsumption` | `packages/mcp-adapter/src/index.ts` | Check intent scope fits within delegation scope. | 35 |
| 57 | `test(mcp): add expired delegation rejection test` | `packages/mcp-adapter/src/index.test.ts` | DelegationToken past expires_at must be rejected. | 20 |
| 58 | `feat(mcp): check delegation expiry before execution` | `packages/mcp-adapter/src/index.ts` | Validate expires_at against current time. | 15 |
| 59 | `test(mcp): add delegation chain depth limit test` | `packages/mcp-adapter/src/index.test.ts` | Delegation with depth > configured max must be rejected. | 25 |
| 60 | `feat(mcp): add configurable delegation chain depth limit` | `packages/mcp-adapter/src/index.ts` | maxDelegationDepth option, default 5. | 15 |

### 2.4 Evidence Chain Completeness (commits 61-65)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 61 | `test(mcp): verify evidence chain records intent` | `packages/mcp-adapter/src/index.test.ts` | After invoke, chain must contain intent evidence event. | 25 |
| 62 | `test(mcp): verify evidence chain records policy evaluation` | `packages/mcp-adapter/src/index.test.ts` | Chain must contain policy_evaluated event with result. | 25 |
| 63 | `test(mcp): verify evidence chain records approval request/decision` | `packages/mcp-adapter/src/index.test.ts` | When approval occurs, both request and decision events in chain. | 30 |
| 64 | `test(mcp): verify evidence chain records execution result` | `packages/mcp-adapter/src/index.test.ts` | Final chain event is execution_completed with result hash. | 25 |
| 65 | `test(mcp): verify evidence chain hash continuity` | `packages/mcp-adapter/src/index.test.ts` | Each event's prev_hash matches prior event's hash. | 30 |

### 2.5 Risk Classification (commits 66-70)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 66 | `test(mcp): add defaultRiskClassResolver for read-only tools` | `packages/mcp-adapter/src/index.test.ts` | Tool with name containing 'get'/'list'/'read' classified as 'low'. | 25 |
| 67 | `test(mcp): add defaultRiskClassResolver for write tools` | `packages/mcp-adapter/src/index.test.ts` | Tool with name containing 'create'/'update'/'delete' classified as 'high'. | 25 |
| 68 | `test(mcp): add defaultRiskClassResolver for payment tools` | `packages/mcp-adapter/src/index.test.ts` | Tool with 'pay'/'transfer'/'send' classified as 'critical'. | 25 |
| 69 | `feat(mcp): implement defaultRiskClassResolver` | `packages/mcp-adapter/src/index.ts` | Pattern-based risk classification for MCP tools. | 35 |
| 70 | `test(mcp): add conformance fixture annotations for MCP profile` | `packages/mcp-adapter/src/index.test.ts` | Map each test to conformance/fixtures/profiles/mcp/index.v1.json scenario IDs. | 30 |

---

## Phase 3: HTTP Server Hardening (commits 71-100)

### 3.1 404 Paths and Error Responses (commits 71-77)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 71 | `test(http): add 404 for nonexistent interaction` | `packages/http/src/index.test.ts` | GET /interactions/nonexistent returns 404 with INTERACTION_NOT_FOUND. | 20 |
| 72 | `test(http): add 404 for nonexistent task` | `packages/http/src/index.test.ts` | GET /interactions/:id/tasks/nonexistent returns 404. | 20 |
| 73 | `test(http): add 404 for nonexistent evidence` | `packages/http/src/index.test.ts` | GET /interactions/:id/evidence with no events returns empty array. | 20 |
| 74 | `test(http): add 404 for nonexistent events` | `packages/http/src/index.test.ts` | GET /interactions/:id/events with no events returns empty array. | 20 |
| 75 | `test(http): add 405 for unsupported methods` | `packages/http/src/index.test.ts` | PUT on interactions/ returns 405. | 20 |
| 76 | `test(http): add 409 for idempotency key conflict` | `packages/http/src/index.test.ts` | Duplicate Idempotency-Key with different body returns 409. | 30 |
| 77 | `feat(http): add idempotency key conflict detection` | `packages/http/src/index.ts`, `packages/http/src/storage.ts` | Store idempotency key -> request hash, check on reuse. | 40 |

### 3.2 State Guard Validation (commits 78-83)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 78 | `test(http): add approve on non-pending interaction rejection` | `packages/http/src/index.test.ts` | POST approve on 'executing' interaction returns APPROVAL_NOT_PENDING. | 25 |
| 79 | `test(http): add reject on non-pending interaction rejection` | `packages/http/src/index.test.ts` | POST reject on 'completed' interaction returns error. | 25 |
| 80 | `test(http): add revoke on completed interaction rejection` | `packages/http/src/index.test.ts` | POST revoke on 'completed' returns INVALID_TRANSITION. | 25 |
| 81 | `test(http): add message append on completed interaction rejection` | `packages/http/src/index.test.ts` | POST messages/append on 'completed' returns error. | 25 |
| 82 | `feat(http): enforce state guards on all mutation endpoints` | `packages/http/src/index.ts` | Add pre-check for valid interaction state before each mutation. | 40 |
| 83 | `test(http): add double-approve idempotency test` | `packages/http/src/index.test.ts` | Approve twice with same Idempotency-Key returns original response. | 25 |

### 3.3 Evidence Chain Verification via HTTP (commits 84-87)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 84 | `feat(http): add GET /interactions/:id/evidence/verify endpoint` | `packages/http/src/index.ts` | Returns chain verification result with valid/invalid and broken_at. | 40 |
| 85 | `test(http): add evidence chain verification positive test` | `packages/http/src/index.test.ts` | Valid chain returns { valid: true }. | 25 |
| 86 | `test(http): add evidence chain verification tamper detection` | `packages/http/src/index.test.ts` | Modify stored event, verify returns { valid: false, broken_at }. | 30 |
| 87 | `test(http): add evidence chain verification empty chain` | `packages/http/src/index.test.ts` | No evidence returns { valid: true, count: 0 }. | 15 |

### 3.4 Content Negotiation (commits 88-91)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 88 | `feat(http): add application/oaps+json content type support` | `packages/http/src/index.ts` | Set Content-Type to application/oaps+json on all responses. Accept fallback to application/json. | 25 |
| 89 | `test(http): add content negotiation Accept header test` | `packages/http/src/index.test.ts` | Request with Accept: application/oaps+json gets proper response. | 20 |
| 90 | `test(http): add content negotiation 406 test` | `packages/http/src/index.test.ts` | Request with Accept: text/xml returns 406. | 20 |
| 91 | `feat(http): add version header negotiation` | `packages/http/src/index.ts` | OAPS-Version request/response header handling. | 25 |

### 3.5 HTTP Signature Auth (commits 92-95)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 92 | `feat(core): add HTTP Signature auth scheme validator interface` | `packages/core/src/index.ts` | AuthValidator interface with verify(request) method. HttpSignatureValidator type. | 30 |
| 93 | `feat(http): add HTTP Signature verification middleware` | `packages/http/src/index.ts` | Middleware that extracts Signature/Signature-Input headers, validates via AuthValidator. | 60 |
| 94 | `test(http): add HTTP Signature auth positive test` | `packages/http/src/index.test.ts` | Valid signature passes, actor extracted from key_id. | 35 |
| 95 | `test(http): add HTTP Signature auth rejection test` | `packages/http/src/index.test.ts` | Invalid/missing signature returns 401 AUTHENTICATION_REQUIRED. | 25 |

### 3.6 OAuth2 Support (commits 96-98)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 96 | `feat(core): add OAuth2 auth scheme types` | `packages/core/src/index.ts` | OAuth2TokenValidator interface, OAuth2Config type. | 25 |
| 97 | `feat(http): add OAuth2 Bearer token validation middleware` | `packages/http/src/index.ts` | Extract Authorization: Bearer token, validate via introspection or JWT. | 50 |
| 98 | `test(http): add OAuth2 auth tests` | `packages/http/src/index.test.ts` | Valid token, expired token, malformed token tests. | 40 |

### 3.7 mTLS Support (commits 99-100)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 99 | `feat(core): add mTLS auth scheme types` | `packages/core/src/index.ts` | MtlsValidator interface, certificate chain types. | 25 |
| 100 | `feat(http): add mTLS client certificate validation hook` | `packages/http/src/index.ts` | Hook for TLS termination proxy to pass client cert, validate actor. | 35 |

---

## Phase 4: Policy Engine Deepening (commits 101-120)

### 4.1 All Operators (commits 101-108)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 101 | `test(policy): add neq operator test` | `packages/policy/src/index.test.ts` | field neq value evaluates correctly. | 15 |
| 102 | `feat(policy): implement neq operator` | `packages/policy/src/index.ts` | Add 'neq' to operator switch. | 10 |
| 103 | `test(policy): add lt and lte operator tests` | `packages/policy/src/index.test.ts` | Numeric less-than and less-than-or-equal. | 25 |
| 104 | `feat(policy): implement lt and lte operators` | `packages/policy/src/index.ts` | Add numeric comparison operators. | 15 |
| 105 | `test(policy): add gt and gte operator tests` | `packages/policy/src/index.test.ts` | Numeric greater-than and greater-than-or-equal. | 25 |
| 106 | `feat(policy): implement gt and gte operators` | `packages/policy/src/index.ts` | Add numeric comparison operators. | 15 |
| 107 | `test(policy): add in operator test` | `packages/policy/src/index.test.ts` | field in [array] membership test. | 20 |
| 108 | `feat(policy): implement in operator` | `packages/policy/src/index.ts` | Array membership check operator. | 10 |

### 4.2 Boolean Combinators (commits 109-113)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 109 | `test(policy): add all combinator test` | `packages/policy/src/index.test.ts` | All rules must pass for combined pass. | 25 |
| 110 | `feat(policy): implement all combinator` | `packages/policy/src/index.ts` | Short-circuit AND logic across rule array. | 20 |
| 111 | `test(policy): add any combinator test` | `packages/policy/src/index.test.ts` | At least one rule passes for combined pass. | 25 |
| 112 | `feat(policy): implement any combinator` | `packages/policy/src/index.ts` | Short-circuit OR logic across rule array. | 20 |
| 113 | `test(policy): add nested combinators test` | `packages/policy/src/index.test.ts` | any([all([...]), all([...])]) nesting works. | 30 |

### 4.3 First-Match and Fail-Closed (commits 114-117)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 114 | `feat(policy): implement first-match evaluation semantics` | `packages/policy/src/index.ts` | PolicyBundle evaluates rules in order, first match wins. | 25 |
| 115 | `test(policy): add first-match ordering test` | `packages/policy/src/index.test.ts` | Conflicting rules — first wins. | 25 |
| 116 | `feat(policy): implement fail-closed for undefined variables` | `packages/policy/src/index.ts` | Missing context variable -> rule fails (deny). | 15 |
| 117 | `test(policy): add fail-closed undefined variable test` | `packages/policy/src/index.test.ts` | Rule referencing nonexistent context key fails closed. | 20 |

### 4.4 PolicyBundle Type and Context Hashing (commits 118-120)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 118 | `feat(policy): add PolicyBundle wrapper type` | `packages/policy/src/index.ts` | PolicyBundle with name, version, rules[], default_effect. Distinct from bare rule array. | 30 |
| 119 | `test(policy): add PolicyBundle vs bare array evaluation test` | `packages/policy/src/index.test.ts` | Both forms work with evaluatePolicy(). | 25 |
| 120 | `test(policy): add hashPolicyContext stability test` | `packages/policy/src/index.test.ts` | Same context always produces same hash. Different context produces different hash. Ordering irrelevant. | 30 |

---

## Phase 5: Evidence System Hardening (commits 121-140)

### 5.1 Full Chain Verification (commits 121-126)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 121 | `feat(evidence): add verifyChain function` | `packages/evidence/src/index.ts` | Walk chain from genesis, verify each event's prev_hash and content hash. Return VerificationResult. | 45 |
| 122 | `test(evidence): add verifyChain positive test` | `packages/evidence/src/index.test.ts` | Valid chain returns { valid: true, length: N }. | 25 |
| 123 | `test(evidence): add verifyChain tampered content detection` | `packages/evidence/src/index.test.ts` | Modified event payload breaks hash, detected. | 25 |
| 124 | `test(evidence): add verifyChain broken link detection` | `packages/evidence/src/index.test.ts` | Modified prev_hash detected. | 25 |
| 125 | `test(evidence): add verifyChain missing event detection` | `packages/evidence/src/index.test.ts` | Gap in sequence numbers detected. | 25 |
| 126 | `test(evidence): add verifyChain single-event chain` | `packages/evidence/src/index.test.ts` | Chain with one event is valid. | 15 |

### 5.2 Replay Cursor (commits 127-131)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 127 | `feat(evidence): add ReplayCursor interface` | `packages/evidence/src/index.ts` | Cursor with chain_id, position, last_hash for resumable reads. | 25 |
| 128 | `feat(evidence): add createReplayCursor and advanceCursor` | `packages/evidence/src/index.ts` | Create cursor at head, advance through events. | 30 |
| 129 | `feat(evidence): add replayFrom function` | `packages/evidence/src/index.ts` | Read events from cursor position to head. | 25 |
| 130 | `test(evidence): add replay cursor round-trip test` | `packages/evidence/src/index.test.ts` | Create cursor, append events, replay from cursor, verify only new events returned. | 35 |
| 131 | `test(evidence): add stale cursor detection test` | `packages/evidence/src/index.test.ts` | Cursor with mismatched last_hash returns REPLAY_CURSOR_NOT_FOUND error. | 25 |

### 5.3 Tamper Detection Edge Cases (commits 132-136)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 132 | `test(evidence): add empty chain verification` | `packages/evidence/src/index.test.ts` | Empty chain is trivially valid. | 15 |
| 133 | `test(evidence): add reordered events detection` | `packages/evidence/src/index.test.ts` | Events in wrong order detected as tampered. | 25 |
| 134 | `test(evidence): add duplicate event detection` | `packages/evidence/src/index.test.ts` | Same event twice in chain detected. | 20 |
| 135 | `test(evidence): add future timestamp detection` | `packages/evidence/src/index.test.ts` | Event with timestamp far in future flagged as suspicious. | 20 |
| 136 | `feat(evidence): add timestamp monotonicity check` | `packages/evidence/src/index.ts` | Warn if event timestamp < previous event timestamp. | 15 |

### 5.4 Hash Stability and Export/Import (commits 137-140)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 137 | `test(evidence): add hash algorithm stability test` | `packages/evidence/src/index.test.ts` | Known input -> known hash output. Pin SHA-256 behavior. | 20 |
| 138 | `feat(evidence): add exportChain and importChain` | `packages/evidence/src/index.ts` | Serialize chain to JSON, deserialize with verification. | 40 |
| 139 | `test(evidence): add export/import round-trip test` | `packages/evidence/src/index.test.ts` | Export, import, verify chain integrity. | 25 |
| 140 | `test(evidence): add import tampered chain rejection` | `packages/evidence/src/index.test.ts` | Modified export JSON rejected on import. | 20 |

---

## Phase 6: A2A Reference Runtime (commits 141-190)

### 6.1 Package Scaffold (commits 141-145)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 141 | `feat(a2a): scaffold packages/a2a package` | `packages/a2a/package.json`, `packages/a2a/tsconfig.json`, `packages/a2a/src/index.ts` | New package with @oaps/a2a name, dep on @oaps/core and @oaps/evidence. | 30 |
| 142 | `feat(a2a): add A2A status type mapping` | `packages/a2a/src/index.ts` | Map A2A task statuses (submitted, working, input-required, completed, canceled, failed) to OAPS InteractionStates. | 40 |
| 143 | `test(a2a): add status mapping coverage` | `packages/a2a/src/index.test.ts` | Every A2A status maps to valid OAPS state. | 30 |
| 144 | `feat(a2a): add A2A client interface types` | `packages/a2a/src/index.ts` | A2aClient interface with createTask, getTaskStatus, updateTask, cancelTask, sendMessage. | 35 |
| 145 | `feat(a2a): add A2A artifact-to-evidence mapper` | `packages/a2a/src/index.ts` | Map A2A artifacts to OAPS EvidenceEvents. | 30 |

### 6.2 OapsA2aAdapter Core (commits 146-155)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 146 | `feat(a2a): add OapsA2aAdapter class shell` | `packages/a2a/src/index.ts` | Class with constructor taking A2aClient, policy config, evidence chain. | 30 |
| 147 | `feat(a2a): implement createTask method` | `packages/a2a/src/index.ts` | Create OAPS interaction, map to A2A task creation, record evidence. | 50 |
| 148 | `test(a2a): add createTask positive test` | `packages/a2a/src/index.test.ts` | Task created, interaction in executing state, evidence chain started. | 35 |
| 149 | `feat(a2a): implement getTaskStatus method` | `packages/a2a/src/index.ts` | Poll A2A task, map status to OAPS interaction state. | 35 |
| 150 | `test(a2a): add getTaskStatus mapping test` | `packages/a2a/src/index.test.ts` | Each A2A status returns correct OAPS state. | 30 |
| 151 | `feat(a2a): implement updateTask method` | `packages/a2a/src/index.ts` | Send update to A2A task, record transition evidence. | 40 |
| 152 | `test(a2a): add updateTask with transition evidence test` | `packages/a2a/src/index.test.ts` | Update triggers transition event in evidence chain. | 30 |
| 153 | `feat(a2a): implement cancelTask method` | `packages/a2a/src/index.ts` | Cancel A2A task, transition OAPS interaction to cancelled. | 35 |
| 154 | `test(a2a): add cancelTask state transition test` | `packages/a2a/src/index.test.ts` | Interaction moves to cancelled, evidence recorded. | 25 |
| 155 | `feat(a2a): implement sendMessage method` | `packages/a2a/src/index.ts` | Append message to A2A task, record as OAPS evidence event. | 35 |

### 6.3 Approval Interposition (commits 156-162)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 156 | `test(a2a): add sendMessage evidence recording test` | `packages/a2a/src/index.test.ts` | Message appended and visible in evidence chain. | 25 |
| 157 | `feat(a2a): implement insertApproval method` | `packages/a2a/src/index.ts` | Pause A2A task, create OAPS approval request, wait for decision, resume or cancel. | 55 |
| 158 | `test(a2a): add insertApproval approved flow test` | `packages/a2a/src/index.test.ts` | Approval granted -> task resumed -> evidence recorded. | 35 |
| 159 | `test(a2a): add insertApproval rejected flow test` | `packages/a2a/src/index.test.ts` | Approval denied -> task cancelled -> evidence recorded. | 30 |
| 160 | `test(a2a): add insertApproval with modifications test` | `packages/a2a/src/index.test.ts` | Approved with modifications -> modifications propagated. | 30 |
| 161 | `feat(a2a): add approval interposition at risk threshold` | `packages/a2a/src/index.ts` | Auto-insert approval request when task risk class >= threshold. | 35 |
| 162 | `test(a2a): add automatic approval interposition test` | `packages/a2a/src/index.test.ts` | High-risk task auto-triggers approval before execution. | 30 |

### 6.4 Delegation Carryover (commits 163-168)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 163 | `feat(a2a): add delegation carryover for sub-tasks` | `packages/a2a/src/index.ts` | Parent delegation token propagated to child A2A tasks. | 35 |
| 164 | `test(a2a): add delegation carryover positive test` | `packages/a2a/src/index.test.ts` | Child task inherits parent delegation scope. | 30 |
| 165 | `test(a2a): add delegation carryover scope narrowing test` | `packages/a2a/src/index.test.ts` | Child cannot exceed parent delegation scope. | 25 |
| 166 | `test(a2a): add delegation chain depth enforcement test` | `packages/a2a/src/index.test.ts` | Too-deep delegation chain rejected. | 25 |
| 167 | `feat(a2a): add delegation expiry propagation` | `packages/a2a/src/index.ts` | Child delegation expires at min(parent_expiry, child_requested_expiry). | 20 |
| 168 | `test(a2a): add delegation expiry propagation test` | `packages/a2a/src/index.test.ts` | Child expiry clamped to parent expiry. | 20 |

### 6.5 A2A Fixture-Aligned Tests (commits 169-180)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 169 | `test(a2a): add approval.interposition fixture test` | `packages/a2a/src/index.test.ts` | Replay examples/a2a/approval.interposition.v1.json scenario. | 40 |
| 170 | `test(a2a): add cancellation.revocation fixture test` | `packages/a2a/src/index.test.ts` | Replay examples/a2a/cancellation.revocation.v1.json. | 35 |
| 171 | `test(a2a): add delegation.carryover fixture test` | `packages/a2a/src/index.test.ts` | Replay examples/a2a/delegation.carryover.v1.json. | 35 |
| 172 | `test(a2a): add message.threading fixture test` | `packages/a2a/src/index.test.ts` | Replay examples/a2a/message.threading.v1.json. | 35 |
| 173 | `test(a2a): add partial-update.replay fixture test` | `packages/a2a/src/index.test.ts` | Replay examples/a2a/partial-update.replay.v1.json. | 35 |
| 174 | `test(a2a): add profile-support.compatible fixture test` | `packages/a2a/src/index.test.ts` | Validate profile support declaration. | 25 |
| 175 | `test(a2a): add profile-support.partial fixture test` | `packages/a2a/src/index.test.ts` | Validate partial profile support. | 25 |
| 176 | `feat(a2a): add A2A error mapping` | `packages/a2a/src/index.ts` | Map A2A error codes to OAPS error codes. | 25 |
| 177 | `test(a2a): add A2A error mapping coverage` | `packages/a2a/src/index.test.ts` | Every A2A error maps to valid OAPS error. | 25 |
| 178 | `feat(a2a): update conformance fixture index for A2A profile` | `conformance/fixtures/profiles/a2a/index.v1.json` | Add scenario IDs for all implemented A2A tests. | 30 |
| 179 | `test(a2a): add multi-agent coordination test` | `packages/a2a/src/index.test.ts` | Two agents with separate tasks, shared delegation chain. | 45 |
| 180 | `test(a2a): add full lifecycle integration test` | `packages/a2a/src/index.test.ts` | Create -> execute -> approve -> complete -> verify evidence. | 50 |

### 6.6 A2A Partial Update and Streaming (commits 181-190)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 181 | `feat(a2a): add partial update support` | `packages/a2a/src/index.ts` | Handle A2A task partial updates as OAPS progress evidence events. | 35 |
| 182 | `test(a2a): add partial update to evidence mapping test` | `packages/a2a/src/index.test.ts` | Each partial update creates evidence event. | 25 |
| 183 | `feat(a2a): add streaming status subscription` | `packages/a2a/src/index.ts` | Subscribe to A2A task status changes, emit OAPS transition events. | 40 |
| 184 | `test(a2a): add streaming status to transitions test` | `packages/a2a/src/index.test.ts` | Status stream triggers correct OAPS transitions. | 30 |
| 185 | `feat(a2a): add task history reconstruction` | `packages/a2a/src/index.ts` | Reconstruct OAPS evidence chain from A2A task history. | 35 |
| 186 | `test(a2a): add history reconstruction fidelity test` | `packages/a2a/src/index.test.ts` | Reconstructed chain matches live-recorded chain. | 30 |
| 187 | `feat(a2a): add agent card to actor card mapper` | `packages/a2a/src/index.ts` | Map A2A Agent Card to OAPS ActorCard. | 25 |
| 188 | `test(a2a): add agent card mapping test` | `packages/a2a/src/index.test.ts` | Agent Card fields map correctly to ActorCard. | 25 |
| 189 | `feat(a2a): export all public API types` | `packages/a2a/src/index.ts` | Clean public API surface export. | 15 |
| 190 | `docs(a2a): add README for a2a package` | `packages/a2a/README.md` | Package purpose, API overview, example usage. | 40 |

---

## Phase 7: JSON-RPC Binding Runtime (commits 191-230)

### 7.1 Package Scaffold (commits 191-195)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 191 | `feat(jsonrpc): scaffold packages/jsonrpc package` | `packages/jsonrpc/package.json`, `packages/jsonrpc/tsconfig.json`, `packages/jsonrpc/src/index.ts` | New package @oaps/jsonrpc. Deps on @oaps/core, @oaps/evidence. | 30 |
| 192 | `feat(jsonrpc): add JSON-RPC 2.0 envelope types` | `packages/jsonrpc/src/index.ts` | JsonRpcRequest, JsonRpcResponse, JsonRpcError, JsonRpcNotification types. | 40 |
| 193 | `feat(jsonrpc): add method router` | `packages/jsonrpc/src/index.ts` | Router mapping method names to handlers. Validates envelope structure. | 45 |
| 194 | `test(jsonrpc): add envelope parsing tests` | `packages/jsonrpc/src/index.test.ts` | Valid request, notification, batch. Invalid: missing jsonrpc, missing method. | 40 |
| 195 | `feat(jsonrpc): add OAPS error code to JSON-RPC error code mapping` | `packages/jsonrpc/src/index.ts` | Map OAPS error codes to JSON-RPC -32000 range. | 25 |

### 7.2 Discovery and Interaction Methods (commits 196-205)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 196 | `feat(jsonrpc): implement oaps.discovery method` | `packages/jsonrpc/src/index.ts` | Return actor card and capabilities. | 35 |
| 197 | `test(jsonrpc): add oaps.discovery test` | `packages/jsonrpc/src/index.test.ts` | Validate response against examples/jsonrpc/discovery.response.json. | 25 |
| 198 | `feat(jsonrpc): implement oaps.interactions.create method` | `packages/jsonrpc/src/index.ts` | Create interaction via JSON-RPC, return interaction state. | 45 |
| 199 | `test(jsonrpc): add oaps.interactions.create test` | `packages/jsonrpc/src/index.test.ts` | Validate against examples/jsonrpc/interactions.create.response.json. | 30 |
| 200 | `feat(jsonrpc): implement oaps.interactions.get method` | `packages/jsonrpc/src/index.ts` | Get interaction by ID. | 25 |
| 201 | `test(jsonrpc): add oaps.interactions.get test` | `packages/jsonrpc/src/index.test.ts` | Get existing and nonexistent interactions. | 25 |
| 202 | `feat(jsonrpc): implement oaps.messages.append method` | `packages/jsonrpc/src/index.ts` | Append message to interaction. | 35 |
| 203 | `test(jsonrpc): add oaps.messages.append test` | `packages/jsonrpc/src/index.test.ts` | Validate against examples/jsonrpc/messages.append.request.json. | 25 |
| 204 | `feat(jsonrpc): implement oaps.interactions.approve method` | `packages/jsonrpc/src/index.ts` | Approve pending interaction. | 35 |
| 205 | `test(jsonrpc): add oaps.interactions.approve test` | `packages/jsonrpc/src/index.test.ts` | Validate against examples/jsonrpc/approve.request.json. | 25 |

### 7.3 Reject, Revoke, Evidence, Events Methods (commits 206-215)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 206 | `feat(jsonrpc): implement oaps.interactions.reject method` | `packages/jsonrpc/src/index.ts` | Reject pending interaction. | 30 |
| 207 | `test(jsonrpc): add oaps.interactions.reject test` | `packages/jsonrpc/src/index.test.ts` | Validate against examples/jsonrpc/reject.request.json. | 25 |
| 208 | `feat(jsonrpc): implement oaps.interactions.revoke method` | `packages/jsonrpc/src/index.ts` | Revoke active interaction. | 30 |
| 209 | `test(jsonrpc): add oaps.interactions.revoke test` | `packages/jsonrpc/src/index.test.ts` | Validate against examples/jsonrpc/revoke.request.json. | 25 |
| 210 | `feat(jsonrpc): implement oaps.evidence.list method` | `packages/jsonrpc/src/index.ts` | List evidence events for interaction. | 30 |
| 211 | `test(jsonrpc): add oaps.evidence.list test` | `packages/jsonrpc/src/index.test.ts` | Returns evidence chain events. | 25 |
| 212 | `feat(jsonrpc): implement oaps.events.list method` | `packages/jsonrpc/src/index.ts` | List lifecycle events for interaction. | 30 |
| 213 | `test(jsonrpc): add oaps.events.list test` | `packages/jsonrpc/src/index.test.ts` | Returns events in order. | 25 |
| 214 | `feat(jsonrpc): implement oaps.capabilities.list method` | `packages/jsonrpc/src/index.ts` | List available capabilities. | 25 |
| 215 | `test(jsonrpc): add oaps.capabilities.list test` | `packages/jsonrpc/src/index.test.ts` | Returns capability cards. | 20 |

### 7.4 Correlation, Idempotency, Notifications (commits 216-225)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 216 | `feat(jsonrpc): add correlation ID tracking` | `packages/jsonrpc/src/index.ts` | Extract/inject oaps_correlation_id from params, thread through evidence. | 25 |
| 217 | `test(jsonrpc): add correlation ID propagation test` | `packages/jsonrpc/src/index.test.ts` | Correlation ID appears in response and evidence. | 25 |
| 218 | `feat(jsonrpc): add idempotency key support` | `packages/jsonrpc/src/index.ts` | Extract oaps_idempotency_key from params, detect replays. | 30 |
| 219 | `test(jsonrpc): add idempotency key replay test` | `packages/jsonrpc/src/index.test.ts` | Same key returns cached response. | 25 |
| 220 | `test(jsonrpc): add idempotency key conflict test` | `packages/jsonrpc/src/index.test.ts` | Same key, different params returns error. | 25 |
| 221 | `feat(jsonrpc): add notification support for progress events` | `packages/jsonrpc/src/index.ts` | Emit JSON-RPC notifications for interaction progress. | 35 |
| 222 | `test(jsonrpc): add notification emission test` | `packages/jsonrpc/src/index.test.ts` | Progress events emitted as notifications. Validate against examples/jsonrpc/notification.progress.json. | 30 |
| 223 | `feat(jsonrpc): add batch request support` | `packages/jsonrpc/src/index.ts` | Handle JSON-RPC batch arrays. | 35 |
| 224 | `test(jsonrpc): add batch request test` | `packages/jsonrpc/src/index.test.ts` | Batch of 3 requests returns 3 responses. | 25 |
| 225 | `test(jsonrpc): add mixed batch (request + notification) test` | `packages/jsonrpc/src/index.test.ts` | Batch with both request and notification types. | 25 |

### 7.5 Error Mapping and Full Suite (commits 226-230)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 226 | `test(jsonrpc): add error mapping for all OAPS errors` | `packages/jsonrpc/src/index.test.ts` | Every OAPS error code maps to correct JSON-RPC error. | 35 |
| 227 | `test(jsonrpc): add invalid method name error test` | `packages/jsonrpc/src/index.test.ts` | Unknown method returns -32601 Method not found. | 15 |
| 228 | `test(jsonrpc): add invalid params error test` | `packages/jsonrpc/src/index.test.ts` | Missing required params returns -32602. | 15 |
| 229 | `feat(jsonrpc): update conformance fixture index` | `conformance/fixtures/bindings/jsonrpc/index.v1.json` | Add scenario IDs for all implemented JSON-RPC tests. | 20 |
| 230 | `docs(jsonrpc): add README for jsonrpc package` | `packages/jsonrpc/README.md` | Package purpose, method list, example usage. | 35 |

---

## Phase 8: gRPC Binding Runtime (commits 231-260)

### 8.1 Proto Codegen Setup (commits 231-236)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 231 | `feat(grpc): scaffold packages/grpc package` | `packages/grpc/package.json`, `packages/grpc/tsconfig.json`, `packages/grpc/src/index.ts` | New package @oaps/grpc. Deps on @oaps/core, @oaps/evidence, @grpc/grpc-js, @grpc/proto-loader. | 30 |
| 232 | `feat(grpc): add proto codegen script` | `packages/grpc/scripts/codegen.sh`, `packages/grpc/buf.gen.yaml` | Generate TypeScript from reference/proto/oaps/bindings/grpc/v1/oaps.proto. | 25 |
| 233 | `feat(grpc): generate TypeScript stubs from proto` | `packages/grpc/src/generated/oaps.ts` | Auto-generated gRPC service stubs and message types. | 200 |
| 234 | `feat(grpc): add gRPC server factory` | `packages/grpc/src/index.ts` | createOapsGrpcServer() that registers all service handlers. | 45 |
| 235 | `feat(grpc): add gRPC metadata mapping` | `packages/grpc/src/index.ts` | Map OAPS headers (correlation, idempotency, auth) to gRPC metadata. | 35 |
| 236 | `test(grpc): add metadata mapping test` | `packages/grpc/src/index.test.ts` | Validate against examples/grpc/metadata.headers.json. | 25 |

### 8.2 Unary Methods (commits 237-248)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 237 | `feat(grpc): implement Discovery unary method` | `packages/grpc/src/index.ts` | GetActorCard + ListCapabilities. | 35 |
| 238 | `test(grpc): add Discovery method test` | `packages/grpc/src/index.test.ts` | Validate against examples/grpc/discovery.response.json. | 25 |
| 239 | `feat(grpc): implement CreateInteraction unary method` | `packages/grpc/src/index.ts` | Create interaction via gRPC. | 40 |
| 240 | `test(grpc): add CreateInteraction test` | `packages/grpc/src/index.test.ts` | Validate against examples/grpc/interactions.create.response.json. | 25 |
| 241 | `feat(grpc): implement GetInteraction unary method` | `packages/grpc/src/index.ts` | Get interaction by ID. | 25 |
| 242 | `feat(grpc): implement AppendMessage unary method` | `packages/grpc/src/index.ts` | Append message to interaction. | 30 |
| 243 | `test(grpc): add AppendMessage test` | `packages/grpc/src/index.test.ts` | Validate against examples/grpc/messages.append.request.json. | 25 |
| 244 | `feat(grpc): implement Approve unary method` | `packages/grpc/src/index.ts` | Approve pending interaction. | 30 |
| 245 | `test(grpc): add Approve test` | `packages/grpc/src/index.test.ts` | Validate against examples/grpc/approve.request.json. | 25 |
| 246 | `feat(grpc): implement Reject unary method` | `packages/grpc/src/index.ts` | Reject pending interaction. | 25 |
| 247 | `feat(grpc): implement Revoke unary method` | `packages/grpc/src/index.ts` | Revoke active interaction. | 25 |
| 248 | `test(grpc): add Reject and Revoke tests` | `packages/grpc/src/index.test.ts` | Both methods with positive and invalid-state tests. | 35 |

### 8.3 Streaming Methods (commits 249-255)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 249 | `feat(grpc): implement ListEvidence unary method` | `packages/grpc/src/index.ts` | List evidence events for interaction. | 30 |
| 250 | `test(grpc): add ListEvidence test` | `packages/grpc/src/index.test.ts` | Validate against examples/grpc/evidence.list.response.json. | 25 |
| 251 | `feat(grpc): implement StreamEvidence server-streaming method` | `packages/grpc/src/index.ts` | Server-side streaming of evidence events. | 45 |
| 252 | `test(grpc): add StreamEvidence test` | `packages/grpc/src/index.test.ts` | Validate stream against examples/grpc/evidence.stream.response.json. | 30 |
| 253 | `feat(grpc): implement ListEvents unary method` | `packages/grpc/src/index.ts` | List lifecycle events. | 30 |
| 254 | `feat(grpc): implement WatchEvents server-streaming method` | `packages/grpc/src/index.ts` | Real-time event stream for interaction. | 45 |
| 255 | `test(grpc): add WatchEvents streaming test` | `packages/grpc/src/index.test.ts` | Validate stream against examples/grpc/events.stream.response.json. | 30 |

### 8.4 Error Mapping and Full Suite (commits 256-260)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 256 | `feat(grpc): add OAPS error to gRPC status code mapping` | `packages/grpc/src/index.ts` | Map OAPS errors to gRPC status codes (NOT_FOUND, FAILED_PRECONDITION, etc). | 30 |
| 257 | `test(grpc): add error mapping for all OAPS errors` | `packages/grpc/src/index.test.ts` | Every OAPS error maps to correct gRPC status. Validate against examples/grpc/errors/. | 35 |
| 258 | `feat(grpc): add idempotency metadata handling` | `packages/grpc/src/index.ts` | Extract idempotency key from metadata, detect replays. | 25 |
| 259 | `test(grpc): add idempotency metadata test` | `packages/grpc/src/index.test.ts` | Validate against examples/grpc/metadata.idempotency.json. | 20 |
| 260 | `feat(grpc): update conformance fixture index` | `conformance/fixtures/bindings/grpc/index.v1.json` | Add scenario IDs for all implemented gRPC tests. | 20 |

---

## Phase 9: Events/Webhooks Runtime (commits 261-280)

### 9.1 Event Broker Scaffold (commits 261-265)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 261 | `feat(events): scaffold packages/events package` | `packages/events/package.json`, `packages/events/tsconfig.json`, `packages/events/src/index.ts` | New package @oaps/events. Deps on @oaps/core. | 25 |
| 262 | `feat(events): add EventBroker interface` | `packages/events/src/index.ts` | EventBroker with publish(), subscribe(), unsubscribe(), replay(). | 30 |
| 263 | `feat(events): add InMemoryEventBroker implementation` | `packages/events/src/index.ts` | In-memory broker for testing and development. | 50 |
| 264 | `test(events): add InMemoryEventBroker publish/subscribe test` | `packages/events/src/index.test.ts` | Publish event, subscriber receives it. | 25 |
| 265 | `test(events): add multiple subscribers test` | `packages/events/src/index.test.ts` | Multiple subscribers each receive the event. | 20 |

### 9.2 Push Envelope (commits 266-270)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 266 | `feat(events): add WebhookEnvelope type` | `packages/events/src/index.ts` | Envelope with event_id, event_type, timestamp, payload, signature, dedupe_key. | 30 |
| 267 | `feat(events): add WebhookDelivery with signing` | `packages/events/src/index.ts` | Sign envelope with HMAC-SHA256. POST to subscriber URL. | 40 |
| 268 | `test(events): add webhook delivery positive test` | `packages/events/src/index.test.ts` | Validate envelope against examples/events/interaction.updated.webhook.json. | 25 |
| 269 | `test(events): add webhook signature verification test` | `packages/events/src/index.test.ts` | Subscriber verifies HMAC signature. | 25 |
| 270 | `test(events): add webhook delivery to approval.requested test` | `packages/events/src/index.test.ts` | Validate against examples/events/approval.requested.webhook.json. | 25 |

### 9.3 Dedupe and At-Least-Once Delivery (commits 271-276)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 271 | `feat(events): add dedupe key generation` | `packages/events/src/index.ts` | Generate deterministic dedupe_key from event_type + interaction_id + sequence. | 20 |
| 272 | `test(events): add dedupe key uniqueness test` | `packages/events/src/index.test.ts` | Different events get different dedupe keys. Same event gets same key. | 20 |
| 273 | `feat(events): add at-least-once delivery with retry` | `packages/events/src/index.ts` | Retry on 5xx/timeout. Configurable max_retries and backoff. | 45 |
| 274 | `test(events): add retry on failure test` | `packages/events/src/index.test.ts` | Subscriber 500s, retry succeeds. Validate retry against examples/events/delivery.retry.webhook.json. | 30 |
| 275 | `test(events): add max retries exhaustion test` | `packages/events/src/index.test.ts` | After max retries, event moves to dead letter. | 25 |
| 276 | `feat(events): add dead letter queue` | `packages/events/src/index.ts` | Store failed deliveries for later inspection. | 25 |

### 9.4 Replay Cursor and Full Suite (commits 277-280)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 277 | `feat(events): add event replay from cursor` | `packages/events/src/index.ts` | Replay events from a given sequence number. | 30 |
| 278 | `test(events): add event replay test` | `packages/events/src/index.test.ts` | Replay from mid-stream returns only subsequent events. Validate against examples/events/replay.resumption.v1.json. | 30 |
| 279 | `feat(events): update conformance fixture index` | `conformance/fixtures/bindings/events/index.v1.json` | Add scenario IDs for all implemented event tests. | 15 |
| 280 | `docs(events): add README for events package` | `packages/events/README.md` | Package purpose, API overview, webhook format. | 30 |

---

## Phase 10: FIDES Integration — Identity Layer (commits 281-295)

> **Profile boundary**: All FIDES integration lives in `packages/profile-fides/`. Core packages never import this.

### 10.1 Package Scaffold and DID Mapping (commits 281-286)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 281 | `feat(profile-fides): scaffold packages/profile-fides package` | `packages/profile-fides/package.json`, `packages/profile-fides/tsconfig.json`, `packages/profile-fides/src/index.ts` | New package @oaps/profile-fides. Optional dep on fides-sdk. Dep on @oaps/core. | 25 |
| 282 | `feat(profile-fides): add OAPS actor to FIDES DID mapping` | `packages/profile-fides/src/index.ts` | actorToDid() and didToActor(). Map actor_id to did:key or did:web. | 35 |
| 283 | `test(profile-fides): add actor-DID round-trip test` | `packages/profile-fides/src/index.test.ts` | Actor -> DID -> Actor preserves identity. | 25 |
| 284 | `feat(profile-fides): add DID-signed mandate envelope` | `packages/profile-fides/src/index.ts` | signMandate() wraps Mandate in signed envelope using FIDES Ed25519. | 40 |
| 285 | `test(profile-fides): add mandate signing and verification test` | `packages/profile-fides/src/index.test.ts` | Sign, verify, tamper-detect. | 35 |
| 286 | `feat(profile-fides): add DID-signed delegation token envelope` | `packages/profile-fides/src/index.ts` | signDelegation() wraps DelegationToken in signed envelope. | 35 |

### 10.2 Trust Graph Integration (commits 287-291)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 287 | `test(profile-fides): add delegation signing and verification test` | `packages/profile-fides/src/index.test.ts` | Sign, verify, tamper-detect delegation. | 30 |
| 288 | `feat(profile-fides): add trust graph delegation scoring` | `packages/profile-fides/src/index.ts` | Use FIDES trust graph to compute delegation trust score. Score decays with chain depth. | 40 |
| 289 | `test(profile-fides): add trust score computation test` | `packages/profile-fides/src/index.test.ts` | Direct delegation: high trust. 3-hop: reduced trust. Unknown: zero trust. | 30 |
| 290 | `feat(profile-fides): add trust threshold policy rule` | `packages/profile-fides/src/index.ts` | PolicyRule that fails if trust score below threshold. | 25 |
| 291 | `test(profile-fides): add trust threshold policy test` | `packages/profile-fides/src/index.test.ts` | Below-threshold delegation rejected by policy. | 25 |

### 10.3 HTTP Signature Verification (commits 292-295)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 292 | `feat(profile-fides): add HTTP Signature verification via FIDES` | `packages/profile-fides/src/index.ts` | FidesHttpSignatureValidator implementing AuthValidator. Resolves key_id to FIDES DID, verifies signature. | 50 |
| 293 | `test(profile-fides): add HTTP Signature verification test` | `packages/profile-fides/src/index.test.ts` | Valid FIDES-signed request passes. Invalid signature rejected. | 35 |
| 294 | `test(profile-fides): add HTTP Signature with unknown DID rejection` | `packages/profile-fides/src/index.test.ts` | Unknown DID returns AUTHENTICATION_REQUIRED. | 20 |
| 295 | `feat(profile-fides): update conformance fixture index for auth-fides-tap` | `conformance/fixtures/profiles/auth-fides-tap/index.v1.json` | Add scenario IDs for FIDES integration tests. | 15 |

---

## Phase 11: Agit Integration — Evidence Layer (commits 296-310)

> **Profile boundary**: All Agit integration lives in `packages/profile-agit/`. Core packages never import this.

### 11.1 Package Scaffold and Evidence Codec (commits 296-301)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 296 | `feat(profile-agit): scaffold packages/profile-agit package` | `packages/profile-agit/package.json`, `packages/profile-agit/tsconfig.json`, `packages/profile-agit/src/index.ts` | New package @oaps/profile-agit. Optional dep on agit-client. Dep on @oaps/core, @oaps/evidence. | 25 |
| 297 | `feat(profile-agit): add OAPS evidence to Agit commit codec` | `packages/profile-agit/src/index.ts` | evidenceToCommit() converts EvidenceEvent to Agit commit payload. commitToEvidence() for reverse. | 45 |
| 298 | `test(profile-agit): add evidence-commit round-trip test` | `packages/profile-agit/src/index.test.ts` | Evidence -> Commit -> Evidence preserves data. | 30 |
| 299 | `feat(profile-agit): add evidence chain to DAG mapper` | `packages/profile-agit/src/index.ts` | Map linear evidence chain to Agit DAG with parent references. | 40 |
| 300 | `test(profile-agit): add chain-to-DAG structure test` | `packages/profile-agit/src/index.test.ts` | Linear chain maps to linear DAG. Branching preserves topology. | 30 |
| 301 | `feat(profile-agit): add Agit commit hash as evidence hash` | `packages/profile-agit/src/index.ts` | Use Agit SHA-256 commit hash as evidence event hash for cross-verification. | 25 |

### 11.2 Approval Workflow Mapping (commits 302-305)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 302 | `feat(profile-agit): add OAPS approval to Agit approval mapping` | `packages/profile-agit/src/index.ts` | Map ApprovalRequest/Decision to Agit approval.rs workflow. | 40 |
| 303 | `test(profile-agit): add approval workflow mapping test` | `packages/profile-agit/src/index.test.ts` | OAPS approve -> Agit approve commit. OAPS reject -> Agit reject commit. | 30 |
| 304 | `feat(profile-agit): add evidence replay via DAG traversal` | `packages/profile-agit/src/index.ts` | Replay OAPS evidence chain by walking Agit DAG from root. | 40 |
| 305 | `test(profile-agit): add DAG replay fidelity test` | `packages/profile-agit/src/index.test.ts` | Replayed chain matches original. | 25 |

### 11.3 Delegation Chain as Branches (commits 306-310)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 306 | `feat(profile-agit): add delegation chain as Agit branches` | `packages/profile-agit/src/index.ts` | Each delegation creates an Agit branch. Revocation merges/closes branch. | 45 |
| 307 | `test(profile-agit): add delegation branch creation test` | `packages/profile-agit/src/index.test.ts` | New delegation creates branch, evidence commits to branch. | 30 |
| 308 | `test(profile-agit): add delegation revocation branch merge test` | `packages/profile-agit/src/index.test.ts` | Revoked delegation merges branch back. | 25 |
| 309 | `test(profile-agit): add multi-delegation branch isolation test` | `packages/profile-agit/src/index.test.ts` | Two concurrent delegations have isolated evidence branches. | 30 |
| 310 | `feat(profile-agit): update conformance fixture index` | `conformance/fixtures/profiles/a2a/index.v1.json` | Add Agit-specific scenario IDs (evidence DAG scenarios). | 15 |

---

## Phase 12: Sardis Integration — Payment Layer (commits 311-330)

> **Profile boundary**: All Sardis integration lives in `packages/profile-sardis/`. Core packages never import this.

### 12.1 Package Scaffold and Mandate Mapping (commits 311-316)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 311 | `feat(profile-sardis): scaffold packages/profile-sardis package` | `packages/profile-sardis/package.json`, `packages/profile-sardis/tsconfig.json`, `packages/profile-sardis/src/index.ts` | New package @oaps/profile-sardis. Optional dep on sardis-client. Dep on @oaps/core, @oaps/evidence. | 25 |
| 312 | `feat(profile-sardis): add OAPS mandate to Sardis SpendingMandate mapping` | `packages/profile-sardis/src/index.ts` | mandateToSpendingPolicy() and spendingPolicyToMandate(). Map scope, constraints, limits. | 50 |
| 313 | `test(profile-sardis): add mandate-SpendingMandate round-trip test` | `packages/profile-sardis/src/index.test.ts` | OAPS mandate -> Sardis SpendingPolicy -> OAPS mandate preserves semantics. | 35 |
| 314 | `feat(profile-sardis): add constraint mapping` | `packages/profile-sardis/src/index.ts` | Map OAPS mandate constraints (max_amount, allowed_actions, time_window) to Sardis policy constraints. | 40 |
| 315 | `test(profile-sardis): add constraint mapping test` | `packages/profile-sardis/src/index.test.ts` | Each constraint type maps correctly both ways. | 30 |
| 316 | `feat(profile-sardis): add mandate status synchronization` | `packages/profile-sardis/src/index.ts` | Sync OAPS MandateStatus with Sardis SpendingPolicy status. | 30 |

### 12.2 Payment Execution Adapter (commits 317-322)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 317 | `feat(profile-sardis): add payment execution adapter` | `packages/profile-sardis/src/index.ts` | SardisPaymentAdapter implementing OAPS payment execution interface. | 50 |
| 318 | `feat(profile-sardis): add payment authorization via AP2` | `packages/profile-sardis/src/index.ts` | Map OAPS approval flow to Sardis AP2 verification. | 40 |
| 319 | `test(profile-sardis): add payment execution positive test` | `packages/profile-sardis/src/index.test.ts` | Execute payment within mandate limits, receive settlement proof. | 35 |
| 320 | `test(profile-sardis): add payment execution over-limit rejection test` | `packages/profile-sardis/src/index.test.ts` | Payment exceeding mandate max_amount rejected. | 25 |
| 321 | `test(profile-sardis): add AP2 verification integration test` | `packages/profile-sardis/src/index.test.ts` | AP2 verification maps to OAPS approval decision. | 30 |
| 322 | `feat(profile-sardis): add multi-rail support` | `packages/profile-sardis/src/index.ts` | Route to Stripe, USDC, Wire, ACH based on mandate currency/preference. | 35 |

### 12.3 Ledger Evidence Bridge (commits 323-327)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 323 | `feat(profile-sardis): add ledger evidence bridge` | `packages/profile-sardis/src/index.ts` | Map Sardis ledger entries to OAPS evidence events. | 40 |
| 324 | `test(profile-sardis): add ledger-to-evidence mapping test` | `packages/profile-sardis/src/index.test.ts` | Sardis ledger entry creates OAPS evidence event with correct type and amount. | 30 |
| 325 | `feat(profile-sardis): add settlement proof to evidence event` | `packages/profile-sardis/src/index.ts` | Convert Sardis settlement confirmation to OAPS evidence event with proof reference. | 30 |
| 326 | `test(profile-sardis): add settlement proof evidence test` | `packages/profile-sardis/src/index.test.ts` | Settlement creates evidence with transaction_id, rail, timestamp. | 25 |
| 327 | `test(profile-sardis): add payment lifecycle end-to-end test` | `packages/profile-sardis/src/index.test.ts` | Mandate -> authorize -> execute -> settle -> evidence chain complete. | 45 |

### 12.4 AP2 Integration and Conformance (commits 328-330)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 328 | `feat(profile-sardis): add AP2 mandate chain support` | `packages/profile-sardis/src/index.ts` | Support Sardis AP2 mandate chains (parent -> child mandates with scope narrowing). | 35 |
| 329 | `test(profile-sardis): add AP2 mandate chain test` | `packages/profile-sardis/src/index.test.ts` | Validate against examples/ap2/mandate-chain.v1.json pattern. | 30 |
| 330 | `feat(profile-sardis): update conformance fixture index for AP2` | `conformance/fixtures/profiles/ap2/index.v1.json` | Add Sardis-specific scenario IDs. | 15 |

---

## Phase 13: OSP Integration — Provisioning Layer (commits 331-345)

> **Profile boundary**: All OSP integration lives in `packages/profile-osp/`. Core packages never import this.

### 13.1 Package Scaffold and Payment Method (commits 331-335)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 331 | `feat(profile-osp): scaffold packages/profile-osp package` | `packages/profile-osp/package.json`, `packages/profile-osp/tsconfig.json`, `packages/profile-osp/src/index.ts` | New package @oaps/profile-osp. Optional dep on osp-client. Dep on @oaps/core. | 25 |
| 332 | `feat(profile-osp): add pact_payment method for OSP` | `packages/profile-osp/src/index.ts` | Register pact_payment as OSP payment method. Maps OAPS mandate to OSP payment proof. | 40 |
| 333 | `test(profile-osp): add pact_payment registration test` | `packages/profile-osp/src/index.test.ts` | Payment method registered and discoverable in .well-known/osp.json. | 25 |
| 334 | `feat(profile-osp): add mandate-as-proof for provisioning` | `packages/profile-osp/src/index.ts` | OAPS active mandate serves as payment proof for OSP provisioning. | 35 |
| 335 | `test(profile-osp): add mandate-as-proof validation test` | `packages/profile-osp/src/index.test.ts` | Valid mandate accepted as proof. Expired mandate rejected. | 30 |

### 13.2 Escrow Lifecycle Mapping (commits 336-340)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 336 | `feat(profile-osp): add escrow lifecycle mapping` | `packages/profile-osp/src/index.ts` | Map OAPS mandate lifecycle to OSP escrow states (hold -> release / hold -> refund). | 40 |
| 337 | `test(profile-osp): add escrow hold test` | `packages/profile-osp/src/index.test.ts` | Mandate activation creates escrow hold. | 25 |
| 338 | `test(profile-osp): add escrow release on completion test` | `packages/profile-osp/src/index.test.ts` | Interaction completion releases escrow. | 25 |
| 339 | `test(profile-osp): add escrow refund on cancellation test` | `packages/profile-osp/src/index.test.ts` | Interaction cancellation triggers escrow refund. | 25 |
| 340 | `feat(profile-osp): add credential delivery on provision` | `packages/profile-osp/src/index.ts` | Map OSP credential delivery to OAPS evidence event. Validate against examples/osp/credential-delivery.v1.json. | 35 |

### 13.3 Provider Registration and Conformance (commits 341-345)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 341 | `test(profile-osp): add credential delivery evidence test` | `packages/profile-osp/src/index.test.ts` | Credential delivery creates evidence event. | 25 |
| 342 | `feat(profile-osp): add provider registration template` | `packages/profile-osp/src/index.ts` | Template for OSP providers to register OAPS-compatible payment methods. | 30 |
| 343 | `test(profile-osp): add provider registration template test` | `packages/profile-osp/src/index.test.ts` | Template generates valid OSP registration payload. | 25 |
| 344 | `test(profile-osp): add full provisioning lifecycle test` | `packages/profile-osp/src/index.test.ts` | Mandate -> escrow -> provision -> credential -> evidence. | 40 |
| 345 | `feat(profile-osp): update conformance fixture index for OSP` | `conformance/fixtures/profiles/osp/index.v1.json` | Add OSP-specific scenario IDs. | 15 |

---

## Phase 14: Agent-Client Profile Runtime (commits 346-360)

> **Profile boundary**: Lives in `packages/profile-agent-client/`.

### 14.1 CLI Session Mapping (commits 346-351)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 346 | `feat(agent-client): scaffold packages/profile-agent-client package` | `packages/profile-agent-client/package.json`, `packages/profile-agent-client/tsconfig.json`, `packages/profile-agent-client/src/index.ts` | New package @oaps/profile-agent-client. Dep on @oaps/core, @oaps/evidence. | 25 |
| 347 | `feat(agent-client): add CLI session to OAPS interaction mapping` | `packages/profile-agent-client/src/index.ts` | Map CLI session start/end to interaction lifecycle. Session commands to messages. | 40 |
| 348 | `test(agent-client): add CLI session mapping test` | `packages/profile-agent-client/src/index.test.ts` | Validate against examples/agent-client/cli.task-initiation.v1.json. | 30 |
| 349 | `feat(agent-client): add SSH task to OAPS task mapping` | `packages/profile-agent-client/src/index.ts` | Map SSH command execution to OAPS task with evidence. | 40 |
| 350 | `test(agent-client): add SSH task mapping test` | `packages/profile-agent-client/src/index.test.ts` | Validate against examples/agent-client/ssh.execution-evidence.v1.json. | 30 |
| 351 | `feat(agent-client): add remote execution evidence capture` | `packages/profile-agent-client/src/index.ts` | Capture command, args, exit_code, stdout_hash, stderr_hash as evidence. | 35 |

### 14.2 Approval Gating and Integration (commits 352-360)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 352 | `test(agent-client): add remote execution evidence test` | `packages/profile-agent-client/src/index.test.ts` | Evidence contains all execution details. | 25 |
| 353 | `feat(agent-client): add approval gating for remote commands` | `packages/profile-agent-client/src/index.ts` | Commands matching risk pattern require approval before execution. | 40 |
| 354 | `test(agent-client): add approval gating test` | `packages/profile-agent-client/src/index.test.ts` | Validate against examples/agent-client/ssh.approval-boundary.v1.json. | 30 |
| 355 | `feat(agent-client): add configurable command risk patterns` | `packages/profile-agent-client/src/index.ts` | Pattern-based risk classification for shell commands (rm, sudo, etc). | 25 |
| 356 | `test(agent-client): add command risk classification test` | `packages/profile-agent-client/src/index.test.ts` | sudo -> critical, rm -rf -> critical, ls -> low. | 20 |
| 357 | `feat(agent-client): add session delegation scope` | `packages/profile-agent-client/src/index.ts` | CLI/SSH session creates delegation scoped to session capabilities. | 30 |
| 358 | `test(agent-client): add session delegation scope test` | `packages/profile-agent-client/src/index.test.ts` | Session delegation limits agent to declared capabilities. | 25 |
| 359 | `test(agent-client): add full agent-client lifecycle test` | `packages/profile-agent-client/src/index.test.ts` | Session start -> task -> approve -> execute -> evidence -> session end. | 40 |
| 360 | `feat(agent-client): update conformance fixture index` | `conformance/fixtures/profiles/agent-client/index.v1.json` | Add agent-client scenario IDs. | 15 |

---

## Phase 15: Payment Profiles Runtime (commits 361-380)

> **Profile boundary**: Lives in `packages/profile-x402/`, `packages/profile-mpp/`, `packages/profile-ap2/`.

### 15.1 x402 Adapter (commits 361-367)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 361 | `feat(x402): scaffold packages/profile-x402 package` | `packages/profile-x402/package.json`, `packages/profile-x402/tsconfig.json`, `packages/profile-x402/src/index.ts` | New package @oaps/profile-x402. | 25 |
| 362 | `feat(x402): add HTTP 402 challenge/response types` | `packages/profile-x402/src/index.ts` | PaymentChallenge and PaymentResponse types mapping to OAPS Challenge. | 35 |
| 363 | `feat(x402): add 402 challenge to OAPS challenge mapper` | `packages/profile-x402/src/index.ts` | Map HTTP 402 + payment requirements to OAPS Challenge object. | 35 |
| 364 | `test(x402): add challenge mapping test` | `packages/profile-x402/src/index.test.ts` | Validate against examples/x402/payment-requirement.challenge.v1.json. | 25 |
| 365 | `feat(x402): add authorization retry lineage tracking` | `packages/profile-x402/src/index.ts` | Track retry chain for failed payment authorizations. | 30 |
| 366 | `test(x402): add retry lineage test` | `packages/profile-x402/src/index.test.ts` | Validate against examples/x402/authorization.retry-lineage.v1.json. | 25 |
| 367 | `test(x402): add settlement metadata alignment test` | `packages/profile-x402/src/index.test.ts` | Validate against examples/x402/settlement.metadata-alignment.v1.json. | 25 |

### 15.2 MPP Adapter (commits 368-373)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 368 | `feat(mpp): scaffold packages/profile-mpp package` | `packages/profile-mpp/package.json`, `packages/profile-mpp/tsconfig.json`, `packages/profile-mpp/src/index.ts` | New package @oaps/profile-mpp. | 25 |
| 369 | `feat(mpp): add machine payment session types` | `packages/profile-mpp/src/index.ts` | Map MPP session lifecycle to OAPS interaction lifecycle. | 35 |
| 370 | `test(mpp): add payment session mapping test` | `packages/profile-mpp/src/index.test.ts` | Validate against examples/mpp/payment-session.v1.json. | 25 |
| 371 | `feat(mpp): add mandate-linked session support` | `packages/profile-mpp/src/index.ts` | Link MPP session to OAPS mandate for spending control. | 30 |
| 372 | `test(mpp): add mandate-linked session test` | `packages/profile-mpp/src/index.test.ts` | Validate against examples/mpp/mandate-linked-session.v1.json. | 25 |
| 373 | `test(mpp): add profile support declaration tests` | `packages/profile-mpp/src/index.test.ts` | Validate compatible, partial, incompatible declarations. | 25 |

### 15.3 AP2 Adapter (commits 374-380)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 374 | `feat(ap2): scaffold packages/profile-ap2 package` | `packages/profile-ap2/package.json`, `packages/profile-ap2/tsconfig.json`, `packages/profile-ap2/src/index.ts` | New package @oaps/profile-ap2. | 25 |
| 375 | `feat(ap2): add mandate chain types` | `packages/profile-ap2/src/index.ts` | MandateChain with parent/child links, scope narrowing enforcement. | 35 |
| 376 | `test(ap2): add mandate chain test` | `packages/profile-ap2/src/index.test.ts` | Validate against examples/ap2/mandate-chain.v1.json. | 25 |
| 377 | `feat(ap2): add payment authorization adapter` | `packages/profile-ap2/src/index.ts` | Map AP2 payment authorization to OAPS approval flow. | 40 |
| 378 | `test(ap2): add payment authorization test` | `packages/profile-ap2/src/index.test.ts` | Validate against examples/ap2/payment-authorization.v1.json. | 25 |
| 379 | `test(ap2): add approval handoff test` | `packages/profile-ap2/src/index.test.ts` | Validate against examples/ap2/approval-handoff.v1.json. | 25 |
| 380 | `feat(ap2): update conformance fixture indices for payment profiles` | `conformance/fixtures/profiles/x402/index.v1.json`, `conformance/fixtures/profiles/mpp/index.v1.json`, `conformance/fixtures/profiles/ap2/index.v1.json` | Add scenario IDs for all payment profile tests. | 20 |

---

## Phase 16: Commerce Domain Runtime (commits 381-395)

> **Profile boundary**: Lives in `packages/profile-commerce/`.

### 16.1 ACP Adapter (commits 381-387)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 381 | `feat(commerce): scaffold packages/profile-commerce package` | `packages/profile-commerce/package.json`, `packages/profile-commerce/tsconfig.json`, `packages/profile-commerce/src/index.ts` | New package @oaps/profile-commerce. Dep on @oaps/core, @oaps/evidence. | 25 |
| 382 | `feat(commerce): add order intent mapping` | `packages/profile-commerce/src/index.ts` | Map OAPS Intent to commerce OrderIntent. Validate against schemas/domain/order-intent.json. | 35 |
| 383 | `test(commerce): add order intent mapping test` | `packages/profile-commerce/src/index.test.ts` | Validate against examples/commerce/order-intent.v1.json. | 25 |
| 384 | `feat(commerce): add merchant authorization mapping` | `packages/profile-commerce/src/index.ts` | Map OAPS approval to MerchantAuthorization. | 35 |
| 385 | `test(commerce): add merchant authorization test` | `packages/profile-commerce/src/index.test.ts` | Validate against examples/commerce/merchant-authorization.v1.json. | 25 |
| 386 | `feat(commerce): add delegated checkout flow` | `packages/profile-commerce/src/index.ts` | Agent acts on behalf of buyer with delegation scope. | 40 |
| 387 | `test(commerce): add delegated checkout test` | `packages/profile-commerce/src/index.test.ts` | Validate against examples/commerce/delegated-checkout.v1.json. | 30 |

### 16.2 Fulfillment and Evidence (commits 388-392)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 388 | `feat(commerce): add fulfillment outcome mapping` | `packages/profile-commerce/src/index.ts` | Map fulfillment to OAPS ExecutionResult + evidence. | 35 |
| 389 | `test(commerce): add fulfillment outcome test` | `packages/profile-commerce/src/index.test.ts` | Validate against examples/commerce/fulfillment-outcome.v1.json. | 25 |
| 390 | `feat(commerce): add commercial evidence types` | `packages/profile-commerce/src/index.ts` | Commerce-specific evidence events: order_placed, payment_authorized, item_shipped, item_delivered. | 30 |
| 391 | `test(commerce): add commercial evidence test` | `packages/profile-commerce/src/index.test.ts` | Validate against examples/commerce/commercial-evidence.v1.json. | 25 |
| 392 | `feat(commerce): add UCP cart/order/authorization types` | `packages/profile-commerce/src/index.ts` | UCP profile types mapping to OAPS interaction phases. | 35 |

### 16.3 Profile Support and Conformance (commits 393-395)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 393 | `test(commerce): add profile support declaration tests` | `packages/profile-commerce/src/index.test.ts` | Validate compatible, partial, incompatible. | 25 |
| 394 | `test(commerce): add full commerce lifecycle test` | `packages/profile-commerce/src/index.test.ts` | Browse -> cart -> authorize -> pay -> fulfill -> evidence. | 50 |
| 395 | `feat(commerce): update conformance fixture indices` | `conformance/fixtures/domains/commerce/index.v1.json`, `conformance/fixtures/profiles/acp/index.v1.json`, `conformance/fixtures/profiles/ucp/index.v1.json` | Add scenario IDs. | 20 |

---

## Phase 17: Schema Completeness (commits 396-410)

### 17.1 Core Schemas (commits 396-402)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 396 | `feat(schemas): add JSON schema for Task` | `schemas/foundation/task.json` | Complete JSON Schema with all required/optional fields, examples. | 50 |
| 397 | `feat(schemas): add JSON schema for Mandate` | `schemas/foundation/mandate.json` | Complete JSON Schema with constraints, status enum. | 55 |
| 398 | `feat(schemas): add JSON schema for Challenge` | `schemas/foundation/challenge.json` | Complete JSON Schema with type enum, response_schema. | 45 |
| 399 | `feat(schemas): add JSON schema for InteractionTransition` | `schemas/foundation/interaction-transition.json` | Complete JSON Schema with from/to state enums. | 40 |
| 400 | `feat(schemas): add JSON schema for TaskTransition` | `schemas/foundation/task-transition.json` | Complete JSON Schema with from/to task state enums. | 40 |
| 401 | `feat(schemas): add schema validation script` | `scripts/validate-schemas.mjs` | Validate all schemas are valid JSON Schema draft-2020-12, all have examples. | 40 |
| 402 | `test(schemas): add schema validation positive examples` | `scripts/validate-schemas.mjs` | Each schema's positive example validates against schema. | 30 |

### 17.2 Profile and Domain Schemas (commits 403-407)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 403 | `test(schemas): add schema validation negative examples` | `scripts/validate-schemas.mjs` | Each schema rejects its negative examples. | 30 |
| 404 | `feat(schemas): add JSON schema for PaymentChallenge profile` | `schemas/profiles/payment-challenge.json` | Update/complete payment challenge schema. | 35 |
| 405 | `feat(schemas): add JSON schema for ProvisioningOperation profile` | `schemas/profiles/provisioning-operation.json` | Update/complete provisioning operation schema. | 35 |
| 406 | `feat(schemas): add JSON schema for TrustAttestation profile` | `schemas/profiles/trust-attestation.json` | Update/complete trust attestation schema. | 35 |
| 407 | `feat(schemas): add JSON schema for SubjectBindingAssertion profile` | `schemas/profiles/subject-binding-assertion.json` | Update/complete subject binding schema. | 35 |

### 17.3 Schema Index (commits 408-410)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 408 | `feat(schemas): update schema INDEX.md with all schemas` | `schemas/INDEX.md` | Complete index listing every schema with status. | 30 |
| 409 | `feat(schemas): add schema cross-reference validation` | `scripts/validate-schemas.mjs` | Verify all $ref links resolve correctly across schemas. | 35 |
| 410 | `feat(core): regenerate schema constants from updated schemas` | `packages/core/src/generated-schema-constants.ts`, `scripts/generate-core-schema-constants.mjs` | Run generator with updated schemas. | 20 |

---

## Phase 18: Conformance TCK Runner (commits 411-430)

### 18.1 Runner Scaffold (commits 411-416)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 411 | `feat(tck): scaffold packages/tck-runner package` | `packages/tck-runner/package.json`, `packages/tck-runner/tsconfig.json`, `packages/tck-runner/src/index.ts` | New package @oaps/tck-runner. Dep on @oaps/core. | 25 |
| 412 | `feat(tck): add fixture loader` | `packages/tck-runner/src/index.ts` | Load and parse conformance/fixtures/ directory structure. | 45 |
| 413 | `feat(tck): add scenario executor interface` | `packages/tck-runner/src/index.ts` | ScenarioExecutor with setup(), execute(), verify() methods. | 30 |
| 414 | `feat(tck): add result collector` | `packages/tck-runner/src/index.ts` | Collect pass/fail/skip for each scenario. Generate result JSON per conformance/results/result-schema.v1.json. | 40 |
| 415 | `test(tck): add fixture loader test` | `packages/tck-runner/src/index.test.ts` | Loads all fixture files, parses correctly. | 25 |
| 416 | `test(tck): add result schema validation` | `packages/tck-runner/src/index.test.ts` | Generated results validate against result-schema.v1.json. | 25 |

### 18.2 Core Scenario Runners (commits 417-422)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 417 | `feat(tck): add core scenario executor` | `packages/tck-runner/src/index.ts` | Execute core/index.v1.json scenarios (state transitions, type validation). | 50 |
| 418 | `feat(tck): add invalid scenario executor` | `packages/tck-runner/src/index.ts` | Execute core/invalid/ scenarios — must reject. | 35 |
| 419 | `test(tck): add core scenario execution test` | `packages/tck-runner/src/index.test.ts` | All core scenarios pass against reference implementation. | 30 |
| 420 | `feat(tck): add HTTP binding scenario executor` | `packages/tck-runner/src/index.ts` | Execute bindings/http/ scenarios against HTTP server. | 50 |
| 421 | `feat(tck): add JSON-RPC binding scenario executor` | `packages/tck-runner/src/index.ts` | Execute bindings/jsonrpc/ scenarios against JSON-RPC server. | 45 |
| 422 | `feat(tck): add gRPC binding scenario executor` | `packages/tck-runner/src/index.ts` | Execute bindings/grpc/ scenarios against gRPC server. | 45 |

### 18.3 Profile and Multi-Binding Runners (commits 423-428)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 423 | `feat(tck): add events binding scenario executor` | `packages/tck-runner/src/index.ts` | Execute bindings/events/ scenarios. | 35 |
| 424 | `feat(tck): add profile scenario executor` | `packages/tck-runner/src/index.ts` | Execute profiles/ scenarios (MCP, A2A, x402, MPP, AP2, OSP, etc). | 50 |
| 425 | `feat(tck): add multi-binding runner` | `packages/tck-runner/src/index.ts` | Run same scenario across HTTP, JSON-RPC, gRPC bindings. | 40 |
| 426 | `test(tck): add multi-binding execution test` | `packages/tck-runner/src/index.test.ts` | Same scenario produces consistent results across bindings. | 30 |
| 427 | `feat(tck): add result reporting` | `packages/tck-runner/src/index.ts` | Generate human-readable report + JSON result file. | 35 |
| 428 | `feat(tck): add compatibility declaration validation` | `packages/tck-runner/src/index.ts` | Validate generated results against conformance/results/compatibility-declaration-schema.v1.json. | 30 |

### 18.4 CLI and Documentation (commits 429-430)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 429 | `feat(tck): add CLI entry point` | `packages/tck-runner/src/cli.ts` | `oaps-tck run --binding http --scope core,profiles/mcp` CLI. | 45 |
| 430 | `docs(tck): add README for tck-runner` | `packages/tck-runner/README.md` | Usage, configuration, extending with custom scenarios. | 40 |

---

## Phase 19: Python Second Implementation (commits 431-450)

### 19.1 Core Types in Python (commits 431-437)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 431 | `feat(python): add core type models` | `reference/oaps-python/src/oaps_python/types.py` | Pydantic models for all 17 core types (Actor, Capability, Intent, Interaction, Mandate, Task, etc). | 120 |
| 432 | `test(python): add type model validation tests` | `reference/oaps-python/tests/test_types.py` | Validate each model against foundation examples. | 60 |
| 433 | `feat(python): add state machine enforcement` | `reference/oaps-python/src/oaps_python/state_machine.py` | Interaction and Task state machines with transition guards. | 70 |
| 434 | `test(python): add state machine tests` | `reference/oaps-python/tests/test_state_machine.py` | Legal and illegal transitions for both machines. | 55 |
| 435 | `feat(python): add evidence chain` | `reference/oaps-python/src/oaps_python/evidence.py` | EvidenceChain with append, verify, export. | 60 |
| 436 | `test(python): add evidence chain tests` | `reference/oaps-python/tests/test_evidence.py` | Append, verify, tamper detection. | 45 |
| 437 | `feat(python): add policy evaluator` | `reference/oaps-python/src/oaps_python/policy.py` | Policy evaluation with all operators and combinators. | 55 |

### 19.2 HTTP Client and Cross-Language Conformance (commits 438-445)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 438 | `test(python): add policy evaluator tests` | `reference/oaps-python/tests/test_policy.py` | All operators, combinators, fail-closed. | 50 |
| 439 | `feat(python): add HTTP client` | `reference/oaps-python/src/oaps_python/client.py` | OapsHttpClient with all 11 HTTP endpoints. | 80 |
| 440 | `test(python): add HTTP client integration test` | `reference/oaps-python/tests/test_client.py` | Create interaction, approve, get evidence against reference server. | 50 |
| 441 | `feat(python): add error handling` | `reference/oaps-python/src/oaps_python/errors.py` | All 16 OAPS error codes as Python exceptions. | 40 |
| 442 | `test(python): add error handling tests` | `reference/oaps-python/tests/test_errors.py` | Each error code constructable and serializable. | 30 |
| 443 | `feat(python): add content type negotiation` | `reference/oaps-python/src/oaps_python/client.py` | Send Accept: application/oaps+json, handle fallback. | 20 |
| 444 | `test(python): add cross-language evidence verification test` | `reference/oaps-python/tests/test_cross_language.py` | TypeScript produces chain, Python verifies it. | 40 |
| 445 | `test(python): add cross-language state machine test` | `reference/oaps-python/tests/test_cross_language.py` | Same transitions produce same states in both languages. | 30 |

### 19.3 Python TCK Runner and Conformance (commits 446-450)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 446 | `feat(python): add Python TCK runner` | `reference/oaps-python/src/oaps_python/tck_runner.py` | Load fixtures, execute scenarios against Python implementation. | 60 |
| 447 | `test(python): add Python TCK core scenarios` | `reference/oaps-python/tests/test_tck.py` | Run all core scenarios against Python implementation. | 40 |
| 448 | `feat(python): add compatibility declaration generator` | `reference/oaps-python/src/oaps_python/tck_runner.py` | Generate compatibility declaration from TCK results. | 30 |
| 449 | `feat(python): update pyproject.toml with all dependencies` | `reference/oaps-python/pyproject.toml` | Add pydantic, httpx, pytest dependencies. | 15 |
| 450 | `docs(python): update README with API overview` | `reference/oaps-python/README.md` | Usage, type models, client, TCK runner. | 35 |

---

## Phase 20: Integration & E2E Tests (commits 451-470)

### 20.1 Full Lifecycle Test (commits 451-456)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 451 | `feat(e2e): scaffold packages/e2e package` | `packages/e2e/package.json`, `packages/e2e/tsconfig.json`, `packages/e2e/src/index.test.ts` | New package @oaps/e2e for integration tests. | 25 |
| 452 | `test(e2e): add full lifecycle — mandate to evidence` | `packages/e2e/src/index.test.ts` | Agent creates mandate -> FIDES signs -> OSP provisions -> Sardis settles -> Agit records evidence. | 80 |
| 453 | `test(e2e): add lifecycle with approval interposition` | `packages/e2e/src/index.test.ts` | Full lifecycle with approval required mid-flow. | 60 |
| 454 | `test(e2e): add lifecycle with delegation chain` | `packages/e2e/src/index.test.ts` | Parent delegates to child agent, child executes within scope. | 55 |
| 455 | `test(e2e): add lifecycle with mandate exhaustion` | `packages/e2e/src/index.test.ts` | Multiple payments exhaust mandate limit. | 45 |
| 456 | `test(e2e): add lifecycle with cancellation and rollback` | `packages/e2e/src/index.test.ts` | Cancel mid-execution, verify cleanup and evidence. | 45 |

### 20.2 Multi-Agent Coordination (commits 457-462)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 457 | `test(e2e): add multi-agent task coordination` | `packages/e2e/src/index.test.ts` | Two agents working on sub-tasks of shared interaction. | 55 |
| 458 | `test(e2e): add multi-agent delegation chain` | `packages/e2e/src/index.test.ts` | Agent A delegates to Agent B, B delegates to Agent C. | 50 |
| 459 | `test(e2e): add multi-agent conflict resolution` | `packages/e2e/src/index.test.ts` | Two agents try concurrent state transitions — one wins, one gets conflict. | 45 |
| 460 | `test(e2e): add multi-agent evidence chain merge` | `packages/e2e/src/index.test.ts` | Evidence from multiple agents merged in correct order. | 40 |
| 461 | `test(e2e): add agent recovery after failure` | `packages/e2e/src/index.test.ts` | Agent crashes mid-task, new agent resumes from evidence chain. | 50 |
| 462 | `test(e2e): add cross-binding interop test` | `packages/e2e/src/index.test.ts` | Agent A uses HTTP, Agent B uses JSON-RPC, both interact with same server. | 50 |

### 20.3 Cross-Binding and Failure Tests (commits 463-470)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 463 | `test(e2e): add HTTP to JSON-RPC cross-binding test` | `packages/e2e/src/index.test.ts` | Create via HTTP, query via JSON-RPC, same state. | 35 |
| 464 | `test(e2e): add HTTP to gRPC cross-binding test` | `packages/e2e/src/index.test.ts` | Create via HTTP, stream via gRPC. | 35 |
| 465 | `test(e2e): add JSON-RPC to gRPC cross-binding test` | `packages/e2e/src/index.test.ts` | Full lifecycle split across bindings. | 40 |
| 466 | `test(e2e): add webhook delivery during lifecycle` | `packages/e2e/src/index.test.ts` | Events delivered via webhook at each state transition. | 40 |
| 467 | `test(e2e): add network failure resilience test` | `packages/e2e/src/index.test.ts` | Simulated network failure mid-request, idempotency key retry succeeds. | 35 |
| 468 | `test(e2e): add storage failure resilience test` | `packages/e2e/src/index.test.ts` | Simulated storage failure, evidence chain remains consistent. | 35 |
| 469 | `test(e2e): add concurrent request stress test` | `packages/e2e/src/index.test.ts` | 50 concurrent requests, all resolve correctly. | 40 |
| 470 | `test(e2e): add evidence chain verification across full lifecycle` | `packages/e2e/src/index.test.ts` | After full lifecycle, verify entire evidence chain end-to-end. | 35 |

---

## Phase 21: Documentation & Public Surface (commits 471-490)

### 21.1 API Reference (commits 471-477)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 471 | `docs: add TypeDoc configuration` | `packages/core/typedoc.json`, `typedoc.json` | Configure TypeDoc for monorepo API reference generation. | 25 |
| 472 | `docs: add API reference for @oaps/core` | `docs/api/core.md` | Generated API reference with all types, functions, constants. | 80 |
| 473 | `docs: add API reference for @oaps/evidence` | `docs/api/evidence.md` | Generated API reference for evidence chain. | 40 |
| 474 | `docs: add API reference for @oaps/policy` | `docs/api/policy.md` | Generated API reference for policy engine. | 40 |
| 475 | `docs: add API reference for @oaps/http` | `docs/api/http.md` | Generated API reference for HTTP server. | 40 |
| 476 | `docs: add API reference for @oaps/mcp-adapter` | `docs/api/mcp-adapter.md` | Generated API reference for MCP adapter. | 40 |
| 477 | `docs: add API reference for binding packages` | `docs/api/jsonrpc.md`, `docs/api/grpc.md`, `docs/api/events.md` | Generated API reference for all binding packages. | 60 |

### 21.2 Developer Quickstart (commits 478-483)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 478 | `docs: add developer quickstart guide` | `docs/QUICKSTART.md` | Install, create first interaction, add approval, view evidence. | 80 |
| 479 | `docs: add MCP integration guide` | `docs/guides/MCP-INTEGRATION.md` | Step-by-step: wrap MCP server with OAPS. | 60 |
| 480 | `docs: add A2A integration guide` | `docs/guides/A2A-INTEGRATION.md` | Step-by-step: add OAPS to A2A task flow. | 60 |
| 481 | `docs: add payment integration guide` | `docs/guides/PAYMENT-INTEGRATION.md` | Step-by-step: mandate, authorize, settle with OAPS. | 60 |
| 482 | `docs: add provisioning integration guide` | `docs/guides/PROVISIONING-INTEGRATION.md` | Step-by-step: OSP provider with OAPS payment. | 50 |
| 483 | `docs: add identity integration guide` | `docs/guides/IDENTITY-INTEGRATION.md` | Step-by-step: FIDES DID signing with OAPS. | 50 |

### 21.3 Architecture and Index (commits 484-490)

| # | Commit message | Files | Description | ~LOC |
|---|---------------|-------|-------------|------|
| 484 | `docs: add evidence system architecture guide` | `docs/guides/EVIDENCE-ARCHITECTURE.md` | How evidence chains work, verification, replay. | 50 |
| 485 | `docs: add policy engine guide` | `docs/guides/POLICY-ENGINE.md` | Operators, combinators, bundles, fail-closed semantics. | 50 |
| 486 | `docs: add ADR-001 state machine design` | `docs/adr/ADR-001-STATE-MACHINE.md` | Why two state machines, transition table design. | 40 |
| 487 | `docs: add ADR-002 evidence chain design` | `docs/adr/ADR-002-EVIDENCE-CHAIN.md` | Hash-linked chain, SHA-256, tamper detection. | 40 |
| 488 | `docs: add ADR-003 profile boundary design` | `docs/adr/ADR-003-PROFILE-BOUNDARIES.md` | Why integrations are profiles, not core. | 35 |
| 489 | `docs: add ADR-004 multi-binding design` | `docs/adr/ADR-004-MULTI-BINDING.md` | HTTP, JSON-RPC, gRPC, Events — shared core, binding-specific transport. | 35 |
| 490 | `docs: update root README with complete package map` | `README.md` | Update with all packages, status, links to guides. | 40 |

---

## Summary

| Phase | Commits | Focus | New Tests | New LOC |
|-------|---------|-------|-----------|---------|
| 1. Core Completion | 1-40 | Missing schemas, state machine, task/challenge runtime | ~40 | ~1,400 |
| 2. MCP Adapter | 41-70 | Input validation, approval, delegation, evidence, risk | ~25 | ~700 |
| 3. HTTP Hardening | 71-100 | 404/405/409, state guards, content neg, auth schemes | ~25 | ~900 |
| 4. Policy Engine | 101-120 | All operators, combinators, fail-closed, bundles | ~15 | ~400 |
| 5. Evidence Hardening | 121-140 | Verification, replay cursor, tamper detection, export | ~15 | ~500 |
| 6. A2A Runtime | 141-190 | Full A2A adapter with fixtures | ~30 | ~1,700 |
| 7. JSON-RPC Binding | 191-230 | All 11 methods + correlation + idempotency | ~25 | ~1,200 |
| 8. gRPC Binding | 231-260 | Proto codegen, unary + streaming methods | ~15 | ~1,100 |
| 9. Events/Webhooks | 261-280 | Broker, delivery, dedupe, replay | ~12 | ~600 |
| 10. FIDES Integration | 281-295 | DID, signing, trust graph, HTTP Sig | ~8 | ~500 |
| 11. Agit Integration | 296-310 | Evidence DAG, approval mapping, branches | ~8 | ~450 |
| 12. Sardis Integration | 311-330 | Mandate mapping, payment, ledger, AP2 | ~10 | ~650 |
| 13. OSP Integration | 331-345 | pact_payment, escrow, provisioning | ~8 | ~450 |
| 14. Agent-Client | 346-360 | CLI/SSH mapping, approval gating | ~8 | ~450 |
| 15. Payment Profiles | 361-380 | x402, MPP, AP2 adapters | ~10 | ~550 |
| 16. Commerce Domain | 381-395 | ACP, UCP, evidence events | ~7 | ~450 |
| 17. Schema Completeness | 396-410 | All JSON schemas + validation | ~5 | ~550 |
| 18. Conformance TCK | 411-430 | Executable test runner + CLI | ~8 | ~750 |
| 19. Python Implementation | 431-450 | Core types, client, cross-language | ~10 | ~850 |
| 20. E2E Tests | 451-470 | Full lifecycle, multi-agent, cross-binding | ~20 | ~850 |
| 21. Documentation | 471-490 | API ref, guides, ADRs | ~0 | ~1,050 |

**Totals**: 490 commits, ~294 new tests, ~14,050 new lines of code.

### Critical Path

```
Phase 1 (core) ─┬─> Phase 2 (mcp)
                 ├─> Phase 3 (http) ──> Phase 5 (evidence) ──> Phase 10 (fides)
                 ├─> Phase 4 (policy)                         Phase 11 (agit)
                 ├─> Phase 6 (a2a) ────────────────────────── Phase 12 (sardis)
                 ├─> Phase 7 (jsonrpc)                        Phase 13 (osp)
                 ├─> Phase 8 (grpc)
                 └─> Phase 9 (events) ──> Phase 14-16 (profiles)
                                     └─> Phase 17 (schemas) ──> Phase 18 (tck)
                                                              ──> Phase 19 (python)
                                                              ──> Phase 20 (e2e)
                                                              ──> Phase 21 (docs)
```

### Parallelism Opportunities

- **Phases 2, 3, 4** can run in parallel after Phase 1 completes.
- **Phases 6, 7, 8, 9** can run in parallel after Phase 1 completes.
- **Phases 10, 11, 12, 13** can run in parallel after Phase 5 completes.
- **Phases 14, 15, 16** can run in parallel after core profiles exist.
- **Phase 19** (Python) can start after Phase 17 (schemas).
- **Phase 20** (E2E) requires all runtime packages.
- **Phase 21** (Docs) can start incrementally alongside any phase.

### File Path Reference

All implementation paths are relative to `reference/oaps-monorepo/`:

```
reference/oaps-monorepo/
├── packages/
│   ├── core/src/                    # Core types, state machines, error codes
│   ├── evidence/src/                # Evidence chain, verification, replay
│   ├── policy/src/                  # Policy engine, operators, bundles
│   ├── http/src/                    # HTTP binding server
│   ├── hono/src/                    # Hono framework adapter
│   ├── hono-node-server/src/        # Node.js Hono server
│   ├── mcp-adapter/src/             # MCP tool adapter
│   ├── a2a/src/                     # [NEW] A2A runtime adapter
│   ├── jsonrpc/src/                 # [NEW] JSON-RPC binding
│   ├── grpc/src/                    # [NEW] gRPC binding
│   ├── events/src/                  # [NEW] Events/webhooks binding
│   ├── profile-fides/src/           # [NEW] FIDES identity integration
│   ├── profile-agit/src/            # [NEW] Agit evidence integration
│   ├── profile-sardis/src/          # [NEW] Sardis payment integration
│   ├── profile-osp/src/             # [NEW] OSP provisioning integration
│   ├── profile-agent-client/src/    # [NEW] Agent-client profile
│   ├── profile-x402/src/            # [NEW] x402 payment profile
│   ├── profile-mpp/src/             # [NEW] MPP payment profile
│   ├── profile-ap2/src/             # [NEW] AP2 payment profile
│   ├── profile-commerce/src/        # [NEW] Commerce domain profile
│   ├── tck-runner/src/              # [NEW] Conformance test runner
│   └── e2e/src/                     # [NEW] End-to-end tests
├── scripts/
│   ├── generate-core-schema-constants.mjs
│   ├── validate-conformance-pack.mjs
│   └── validate-spec-pack.mjs
└── pnpm-workspace.yaml
```
