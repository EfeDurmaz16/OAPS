# AICP Core Foundation Draft

## Status

Foundation draft for the first hard-normative AICP (Agent Interaction Control Protocol) semantic layer.

**Version:** `0.1.0-draft`

**Requirements notation:** The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174) when, and only when, they appear in all capitals.

This draft intentionally defines a narrower semantic core than the total long-term AICP vision. An implementation that conforms to the normative requirements below is a conforming AICP foundation implementation regardless of which bindings or profiles it additionally supports.

Companion normative document: `spec/core/STATE-MACHINE-DRAFT.md`, which specifies the canonical interaction and task lifecycles referenced by this document.

## Goal

The AICP core is the smallest semantic layer that lets multiple agent ecosystems share:

- identity references
- capabilities
- requested and long-running work
- delegated authority
- stronger authorization chains (mandates)
- explicit approvals
- execution outcomes
- tamper-evident lineage
- payment coordination (authorization, capture, settlement)
- portable failure semantics

## First-Class Core Objects

A conforming AICP foundation implementation **MUST** provide schema-validatable representations of the following 16 primitives. Each is defined normatively in the sections that follow.

1. `Actor`
2. `Capability`
3. `Intent`
4. `Task`
5. `Delegation`
6. `Mandate`
7. `PaymentCoordination`
8. `ApprovalRequest`
9. `ApprovalDecision`
10. `ExecutionResult`
11. `EvidenceEvent`
12. `ErrorObject`
13. `ExtensionDescriptor`
14. `Challenge`
15. `InteractionTransition`
16. `TaskTransition`

Implementations **MAY** additionally expose profile-specific or domain-specific objects, but those extensions **MUST NOT** contradict the normative requirements below.

## Cross-Cutting Normative Requirements

These requirements apply across every primitive.

### CC1. Schema Validation

A conforming implementation **MUST** validate all primitive instances against the canonical schemas under `schemas/foundation/`. When a binding or profile extends a primitive, the extended form **MUST** continue to validate against the foundation schema for the shared fields.

### CC2. Identifier Stability

Every primitive listed above **MUST** carry a stable identifier field (`actor_id`, `intent_id`, `task_id`, `mandate_id`, etc.). Identifiers **MUST** be unique within their issuing authority and **MUST NOT** be reused after revocation.

### CC3. Timestamps

Every primitive that records temporal state **MUST** use RFC 3339 `date-time` format in UTC. Implementations **MUST NOT** silently truncate or reformat timestamps when persisting or replaying evidence.

### CC4. Evidence Emission

Every canonical state transition defined in `STATE-MACHINE-DRAFT.md` **MUST** produce a corresponding `EvidenceEvent`. An implementation that skips evidence emission for a state transition is non-conforming even if the transition itself is legal.

### CC5. Error Category Binding

Every `ErrorObject` instance **MUST** carry a `category` field drawn from the canonical category vocabulary in Appendix A. Narrower `error_code` values **MAY** be introduced by bindings or profiles but **MUST** map back to one of the canonical categories.

### CC6. Version Negotiation

A conforming implementation **MUST** support version negotiation at binding edges. The `schemas/foundation/version-negotiation.json` object is the canonical shape. Bindings **MAY** expose negotiation through binding-native mechanisms (HTTP headers, gRPC metadata, etc.) but **MUST** preserve the same semantics.

### CC7. Fail-Closed Defaults

When faced with ambiguous authority, expired authorization, tampered evidence, or unrecognized extensions, a conforming implementation **MUST** fail closed. Implementations **MUST NOT** silently downgrade, ignore, or rewrite these conditions.

---

## Core Primitives

### Actor

An `Actor` identifies the principal that performs, requests, approves, or hosts an operation.

Canonical schema: `schemas/foundation/actor.json`

**Normative requirements:**

- An `Actor` instance **MUST** include a stable `actor_id`.
- The `actor_id` **MUST** be method-agnostic. Both web-native identifiers (HTTPS URIs) and DID-style identifiers **MUST** be permitted.
- An `Actor` **MUST** declare an `actor_type` drawn from at least `human`, `agent`, `service`.
- An `Actor` **SHOULD** include a human-readable `display_name` when one is available to the issuing authority.
- An `Actor` **MAY** include trust-level metadata, but higher-assurance trust semantics are handled by profiles, not by the core alone.
- Implementations **MUST NOT** conflate an `actor_id` with an authentication credential. Credentials are binding-layer concerns.

### Capability

A `Capability` describes an action surface exposed by an `Actor` or a system.

Canonical schema: `schemas/foundation/capability.json`

**Normative requirements:**

- A `Capability` instance **MUST** include a stable `capability_id` that is a URI.
- A `Capability` **MUST** describe the action surface it exposes in a form that is independent of ecosystem-specific method families (MCP tool method names, A2A task structures, vendor-specific RPC families).
- A `Capability` **SHOULD** reference input and output schemas when the action surface accepts structured data.
- A `Capability` **MAY** include rate limits, cost hints, approval policy hints, and supported binding references.
- A `Capability` **MUST NOT** embed binding-specific transport details inside the core object.

### Intent

An `Intent` describes a requested action or outcome. It is the compact semantic unit for single actions, direct invocations, and constrained requests.

Canonical schema: `schemas/foundation/intent.json`

**Normative requirements:**

- An `Intent` instance **MUST** include a stable `intent_id`.
- An `Intent` **MUST** reference the requesting `Actor` by `actor_ref`.
- An `Intent` **MUST** reference the target `Capability` by `capability_ref`.
- An `Intent` **MUST** include a `created_at` timestamp.
- An `Intent` **SHOULD** carry an `input` payload when the `Capability` accepts structured input.
- An `Intent` **MAY** include context metadata, correlation IDs, and profile-specific hints.
- An implementation that promotes an `Intent` into a `Task` **MUST** keep the original `intent_id` stable and reference it from the resulting `Task`. See **Task** below and `STATE-MACHINE-DRAFT.md` §"Intent-To-Task Promotion".

### Task

A `Task` describes longer-lived execution with lifecycle and status.

Canonical schema: `schemas/foundation/task.json`

**Normative requirements:**

- A `Task` instance **MUST** include a stable `task_id` distinct from any `intent_id` it was promoted from.
- A `Task` **MUST** reference its originating `Intent` through `intent_ref` when promoted.
- A `Task` **MUST** carry a `state` drawn from the canonical task state set defined in `STATE-MACHINE-DRAFT.md`.
- A `Task` **MUST** support asynchronous progression.
- A `Task` **SHOULD** support reassignment to a different worker while preserving `task_id` and `intent_ref`.
- A `Task` **SHOULD** support partial completion, cancellation, and compensation transitions as defined in the state machine draft.
- A `Task` **MAY** carry profile-specific execution metadata, but **MUST NOT** redefine the canonical lifecycle.

### Delegation

`Delegation` represents scoped authority transfer.

Canonical schema: `schemas/foundation/delegation.json`

**Normative requirements:**

- A `Delegation` instance **MUST** specify `delegator`, `delegatee`, `scope`, and `expiry`.
- The `scope` **MUST** be non-empty. An empty scope **MUST** be rejected as invalid.
- The `expiry` **MUST** be an RFC 3339 timestamp. Implementations **MUST** fail closed when evaluating an expired delegation for authorization.
- A `Delegation` **SHOULD** include a revocation reference describing how the delegation can be invalidated before expiry.
- A `Delegation` **MAY** describe a transitive delegation chain, but each link in the chain **MUST** be independently verifiable.
- Implementations **MUST NOT** treat a `Mandate` as equivalent to a `Delegation`. See **Mandate** below.

### Mandate

A `Mandate` is a stronger authorization object than generic `Delegation`. Mandates are designed for economic actions, higher-risk execution, and explicit policy or principal authorization chains.

Canonical schema: `schemas/foundation/mandate.json`

**Normative requirements:**

- A `Mandate` instance **MUST** include `mandate_id`, `principal`, `authorized_actor`, `scope`, and `expiry`.
- A `Mandate` **MUST** include a reference to the authorization chain that justifies it. A `Mandate` without an authorization chain reference is invalid.
- A `Mandate` **MUST** remain domain-neutral in the core. Payment-specific mandate semantics are layered via the `PaymentCoordination` primitive below.
- A `Mandate` **SHOULD** include a reference to the evidence event that records its creation.
- A `Mandate` **MAY** reference one or more supporting `Delegation` instances, but a `Mandate` **MUST NOT** be represented as a mere alias for a `Delegation`.
- Profiles concerned with high-risk economic action **SHOULD** require a `Mandate` before or alongside a plain `Delegation`.
- Implementations **MUST** fail closed on expired, revoked, or scope-mismatched mandates.

### PaymentCoordination

`PaymentCoordination` represents the binding between a payment session, the mandate chain that authorizes it, and the interaction it supports.

Canonical schemas: `schemas/payment/payment-session.json`, `schemas/payment/payment-authorization.json`, `schemas/payment/mandate-chain.json`

**Normative requirements:**

- A `PaymentCoordination` instance **MUST** bind a `payment_session` to exactly one `interaction_id`. A payment session with no interaction binding is invalid at the foundation level.
- A `PaymentCoordination` **MUST** reference a valid `mandate_chain` that authorizes the payment amount and scope.
- A conforming implementation **MUST** verify the mandate chain before producing a `PaymentAuthorization` record. Verification **MUST** fail closed on expired, revoked, or scope-mismatched mandate chains.
- A `PaymentCoordination` **SHOULD** separate authorization from capture. An implementation **MAY** collapse them only when the underlying payment system makes the distinction meaningless.
- A `PaymentCoordination` **MUST** emit an `EvidenceEvent` on every state change (`authorized`, `captured`, `settled`, `refunded`, `voided`). Implementations that skip settlement evidence are non-conforming.
- A `PaymentCoordination` **MAY** defer settlement to a later interaction, but the settlement **MUST** remain linkable to the originating `interaction_id` via evidence replay.
- Rail-specific payment challenge mechanics, settlement wire formats, and merchant-side cart abstractions are **out of scope** for the foundation and belong to profiles (for example `x402`, `ap2`, `mpp`) or domain protocol families.

### ApprovalRequest and ApprovalDecision

Approval is first-class.

Canonical schemas: `schemas/foundation/approval-request.json`, `schemas/foundation/approval-decision.json`

**Normative requirements for `ApprovalRequest`:**

- An `ApprovalRequest` instance **MUST** include `request_id`, `target_interaction`, `requester`, and `approver` references.
- An `ApprovalRequest` **MUST** include a `reason` describing why approval is required.
- An `ApprovalRequest` **MUST** be timestamped with `created_at`.
- An `ApprovalRequest` **SHOULD** include a `timeout` indicating when the request expires if unresolved.
- An `ApprovalRequest` **MAY** include a context snapshot (intent, mandate, policy evaluation) to help the approver decide.

**Normative requirements for `ApprovalDecision`:**

- An `ApprovalDecision` instance **MUST** include `decision_id`, a reference to the originating `ApprovalRequest`, a `decider` actor reference, and a `decided_at` timestamp.
- The `decision` field **MUST** be one of `approved`, `rejected`, or `modified`.
- When `decision` is `modified`, the decision **MUST** preserve a reference to the modification target. If the modification target reference does not match the target of the original request, implementations **MUST** emit error code `APPROVAL_MODIFICATION_TARGET_MISMATCH`.
- An `ApprovalDecision` **SHOULD** include a human-readable explanation.
- An `ApprovalDecision` **MAY** include attached evidence references.
- Implementations **MUST NOT** silently rewrite a rejected decision as a generic failure. See **Error Taxonomy** below.

### ExecutionResult

`ExecutionResult` carries the canonical outcome of work.

Canonical schema: `schemas/foundation/execution-result.json`

**Normative requirements:**

- An `ExecutionResult` instance **MUST** include a `result_id` and an `execution_status` drawn from at least `success`, `partial`, `failed`.
- An `ExecutionResult` **MUST** reference the terminal interaction or task state it corresponds to.
- An `ExecutionResult` **SHOULD** include output payload references or inline output when small and structured.
- An `ExecutionResult` **MAY** include cost, duration, and resource metadata.
- An `ExecutionResult` **MUST NOT** be used as a substitute for an `EvidenceEvent`. Evidence and results serve distinct roles and both **MUST** exist for a completed interaction.

### EvidenceEvent

`EvidenceEvent` is the core lineage primitive. It is not just an audit log entry.

Canonical schema: `schemas/foundation/evidence-event.json`

**Normative requirements:**

- An `EvidenceEvent` instance **MUST** include `event_id`, `event_type`, `hash`, `prev_hash`, `actor_ref`, and `created_at`.
- The `hash` field **MUST** form a chain by including `prev_hash` in its computation. Implementations **MUST** verify the chain on replay and **MUST** fail closed on any mismatch.
- An `EvidenceEvent` **MUST** be emitted for every canonical state transition (see **CC4**). Bindings that omit intermediate states **MUST** still emit evidence for the terminal transitions they do expose.
- An `EvidenceEvent` **SHOULD** reference the input and output data it describes when applicable.
- An `EvidenceEvent` **MUST NOT** be mutated after emission. Corrections are represented as new evidence events, not edits.
- Replay consumers **MUST** apply events in append order. A replay that observes an event out of order or sees `prev_hash` pointing at a non-present ancestor **MUST** fail closed.

### ErrorObject

`ErrorObject` defines portable failure semantics across bindings and profiles.

Canonical schema: `schemas/foundation/error-object.json`

**Normative requirements:**

- An `ErrorObject` instance **MUST** include `error_code` and `category`.
- The `category` field **MUST** be drawn from the canonical category vocabulary in Appendix A.
- An `ErrorObject` **MUST** specify whether the failure is retryable via a `retryable` boolean.
- An `ErrorObject` **SHOULD** include machine-readable `details` that help an operator diagnose the condition.
- An `ErrorObject` **MAY** include a remediation hint.
- Bindings and profiles **MAY** introduce narrower `error_code` values, but each new code **MUST** map back to a canonical category.

### ExtensionDescriptor

`ExtensionDescriptor` is the controlled escape hatch. It lets the suite evolve without forcing ecosystem-specific or domain-specific details back into the core.

Canonical schema: `schemas/foundation/extension-descriptor.json`

**Normative requirements:**

- An `ExtensionDescriptor` instance **MUST** include `extension_id` and a `namespace`.
- An `ExtensionDescriptor` **MUST NOT** contradict the normative semantics of any core primitive defined in this draft.
- An `ExtensionDescriptor` **SHOULD** reference a schema that defines its extended fields.
- An `ExtensionDescriptor` **MAY** include version negotiation hints consistent with **CC6**.
- Implementations that do not recognize an extension **MUST** either ignore it safely (when the extension is marked advisory) or fail closed (when the extension is marked required). Unknown required extensions **MUST NOT** be silently dropped.

### Challenge

A `Challenge` is a new blocking condition discovered during or after execution progress. Challenges are distinct from approvals, which gate known-in-advance actions.

Canonical schema: `schemas/foundation/challenge.json`

**Normative requirements:**

- A `Challenge` instance **MUST** include `challenge_id`, `interaction_ref`, and `challenge_type`.
- A `Challenge` **MUST NOT** be represented as an `ApprovalRequest`. The state machine draft defines the semantic difference (§"Approval Versus Challenge").
- A `Challenge` **SHOULD** describe the required additional input via a schema reference when the challenge expects structured input from the caller.
- A `Challenge` **MAY** include a timeout indicating when the challenge expires if unresolved.
- When a challenge is resolved, the resolution **MUST** be recorded as an `EvidenceEvent` and **SHOULD** be followed by a `TaskTransition` or `InteractionTransition` out of the `challenged` state.

### InteractionTransition

`InteractionTransition` is the serialized record of an interaction moving between canonical states.

Canonical schema: `schemas/foundation/interaction-transition.json`

**Normative requirements:**

- An `InteractionTransition` instance **MUST** include `from_state`, `to_state`, `at`, and `actor_ref`.
- The `from_state` and `to_state` fields **MUST** be drawn from the canonical interaction state set in `STATE-MACHINE-DRAFT.md`.
- The transition **MUST** match a canonical legal transition rule. Illegal transitions **MUST** be rejected with error code `ILLEGAL_STATE_TRANSITION`.
- An `InteractionTransition` **SHOULD** reference the `EvidenceEvent` that records it.
- Bindings **MAY** omit intermediate transitions from the wire format but **MUST NOT** claim a transition whose meaning contradicts the state machine draft.

### TaskTransition

`TaskTransition` is the serialized record of a task moving between canonical states.

Canonical schema: `schemas/foundation/task-transition.json`

**Normative requirements:**

- A `TaskTransition` instance **MUST** include `from_state`, `to_state`, `at`, and `task_id`.
- The `from_state` and `to_state` fields **MUST** be drawn from the canonical task state set in `STATE-MACHINE-DRAFT.md`.
- The transition **MUST** match a canonical legal task transition. Illegal transitions **MUST** be rejected with error code `ILLEGAL_STATE_TRANSITION`.
- A `TaskTransition` **SHOULD** include an `actor_ref` identifying the actor that caused the transition.
- A `TaskTransition` **MUST** be accompanied by an `EvidenceEvent` per **CC4**.

---

## Core Distinctions That MUST Stay Sharp

The following pairs **MUST** remain distinguishable in a conforming implementation:

- `Intent` vs `Task` — compact semantic request vs durable work instance
- `Delegation` vs `Mandate` — scoped authority transfer vs stronger authorization chain
- `Approval` vs generic policy evaluation — explicit human or system gate vs automated rule
- `Evidence` vs plain logging — hash-chained lineage vs free-form logs
- `Core semantics` vs `profile mappings` — normative primitives vs ecosystem translations
- `ApprovalRequest` vs `Challenge` — known-in-advance gate vs newly-discovered blocker
- `Reject` vs `Revoke` vs `Cancel` vs `Fail` — see `STATE-MACHINE-DRAFT.md` §"Reject Versus Revoke Versus Cancel Versus Fail"

An implementation that collapses any of these distinctions is non-conforming.

## Intentionally Out Of Scope For This Draft

The following belong to later drafts, profiles, or domain protocols:

- rail-specific payment challenge mechanics (belongs to payment profiles)
- settlement rail wire formats (belongs to payment profiles)
- merchant cart and order abstractions (belongs to commerce domain family)
- provisioning provider lifecycle contracts (belongs to provisioning domain family)
- binding-specific headers and transport details (belongs to bindings)
- full trust graph semantics (belongs to trust profiles)
- full quote, receipt, and dispute object families (belongs to commerce and payment profiles)

Note: payment *coordination* — the binding of payment sessions to interactions, mandate chain verification, and settlement evidence emission — **is** normatively defined at the foundation level via the `PaymentCoordination` primitive above. Only rail-specific details are deferred.

## Next Normative Documents

The expected next hard-normative documents after this foundation draft are:

- Core state machine draft (already present: `spec/core/STATE-MACHINE-DRAFT.md`)
- HTTP binding draft (already present: `spec/bindings/http-binding-draft.md`)
- MCP profile (already present: `profiles/mcp.md`)
- A2A profile draft (already present: `profiles/a2a-draft.md`)

Payment, provisioning, and commerce continue as structured domain tracks. The payment track now has a foundation-level normative hook (`PaymentCoordination`) even while rail-specific details remain profile-scope.

## Appendix A: Core Error Taxonomy Alignment

The `ErrorObject.category` field is the durable cross-binding anchor. Concrete error codes refine those categories.

The current core/runtime/docs alignment is:

| Error code | Category | Current role |
| --- | --- | --- |
| `VALIDATION_FAILED` | `validation` | malformed intents, illegal transitions, or structurally invalid input |
| `AUTHENTICATED_SUBJECT_MISMATCH` | `authentication` | authenticated caller does not match the acting subject |
| `DELEGATION_EXPIRED` | `authorization` | scoped delegated authority exists but is no longer valid |
| `POLICY_DENIED` | `authorization` | deterministic policy rejected the requested action |
| `APPROVAL_REQUIRED` | `authorization` | execution is blocked pending an explicit approval decision |
| `APPROVAL_REJECTED` | `authorization` | an approval gate denied the requested action |
| `APPROVAL_MODIFICATION_TARGET_MISMATCH` | `validation` | a modified approval changed the target incompatibly |
| `CAPABILITY_NOT_FOUND` | `capability` | the requested action surface could not be resolved |
| `EXECUTION_TIMEOUT` | `timeout` | execution did not complete within the expected bound |
| `VERSION_NEGOTIATION_FAILED` | `versioning` | sender and receiver could not agree on a protocol version |
| `ILLEGAL_STATE_TRANSITION` | `validation` | a lifecycle move contradicted the canonical core state machine |
| `MANDATE_EXPIRED` | `authorization` | a payment or stronger-authorization mandate is no longer valid |
| `MANDATE_SCOPE_MISMATCH` | `authorization` | a mandate's scope does not cover the attempted action |

**Normative alignment rules:**

- Specs **SHOULD** describe portable categories first, then refine them with stable error codes where behavior matters for conformance.
- Schemas **MUST** continue to anchor the portable `category` vocabulary.
- Reference runtimes **MUST** emit stable codes whenever the core defines one explicitly for the condition.
- Bindings and profiles **MAY** add narrower codes, but **MUST** map them back to one of the portable categories above.
- Implementations **MUST NOT** silently collapse distinct error codes into a single generic failure unless the binding transport cannot distinguish them, in which case the collapse **MUST** be documented.

Binding-specific codes such as `AUTHENTICATION_REQUIRED`, `INTERACTION_NOT_FOUND`, `APPROVAL_NOT_PENDING`, `REPLAY_CURSOR_NOT_FOUND`, and `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD` remain valid as binding-layer refinements built on top of the portable core categories.

## Appendix B: Conformance Checklist Summary

A quick checklist for implementers. Each item maps to a normative requirement above. A conforming AICP foundation implementation satisfies all items marked **MUST**.

- [ ] Validates all primitives against `schemas/foundation/*.json` (CC1)
- [ ] Uses stable, unique identifiers across primitives (CC2)
- [ ] Uses RFC 3339 timestamps in UTC (CC3)
- [ ] Emits `EvidenceEvent` for every canonical state transition (CC4)
- [ ] Uses canonical error categories from Appendix A (CC5)
- [ ] Supports version negotiation at binding edges (CC6)
- [ ] Fails closed on ambiguous authority, expired authorization, tampered evidence (CC7)
- [ ] Implements all 16 core primitives with normative fields
- [ ] Verifies mandate chains before producing `PaymentAuthorization` (PaymentCoordination)
- [ ] Emits settlement evidence for every payment state change (PaymentCoordination)
- [ ] Keeps `intent_id` stable across intent-to-task promotion (Task)
- [ ] Fails closed on expired delegations and mandates (Delegation, Mandate)
- [ ] Preserves approval modification target references (ApprovalDecision)
- [ ] Verifies evidence hash chains on replay (EvidenceEvent)
- [ ] Rejects illegal state transitions with `ILLEGAL_STATE_TRANSITION` (InteractionTransition, TaskTransition)
