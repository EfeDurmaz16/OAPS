# OAPS Specification

**Version:** v0.4-draft  
**Status:** consolidated draft for implementation

> Note: this document remains the original consolidated draft spec pack that backs the current MCP-oriented reference slice. The suite-level direction now lives alongside it in [CHARTER.md](/Users/efebarandurmaz/OAPS/CHARTER.md), [docs/SUITE-ARCHITECTURE.md](/Users/efebarandurmaz/OAPS/docs/SUITE-ARCHITECTURE.md), and [spec/core/FOUNDATION-DRAFT.md](/Users/efebarandurmaz/OAPS/spec/core/FOUNDATION-DRAFT.md).

## 1. Scope

OAPS defines a standard set of primitives for autonomous agent interactions across protocol boundaries. It specifies:

- actor identification references
- capability description
- intent representation
- delegation
- policy evaluation context
- approval primitives
- execution and interaction events
- evidence records
- canonical HTTP binding
- version negotiation
- idempotency behavior
- authentication binding
- extension and profile model

OAPS does **not** replace lower-level transport or domain-specific protocols. It composes with them through profiles.

## 2. Conformance language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are to be interpreted as described in RFC 2119 and RFC 8174.

## 3. Core model

The core object graph is:

`ActorCard -> CapabilityCard -> Intent -> DelegationToken -> PolicyBundle -> Envelope -> EvidenceEvent`

### 3.1 Core primitive summary

- **ActorCard**: describes an actor, its endpoints, and supported profiles
- **CapabilityCard**: describes a capability exposed by an actor
- **Intent**: describes the requested action
- **DelegationToken**: binds authority from a delegator to a delegatee
- **ApprovalRequest / ApprovalDecision**: human or policy-driven intervention points
- **ExecutionRequest / ExecutionResult**: concrete executable action and result
- **InteractionCreated / InteractionUpdated**: lifecycle events
- **Envelope**: universal transportable wrapper
- **EvidenceEvent**: append-only, hash-linked accountability record

## 4. Actor identity model

### 4.1 Baseline identifiers

An `actor_id` MUST be a non-empty string and SHOULD be one of:

- a URI
- a URN
- a DID

Examples:

- `https://merchant.example/actors/checkout`
- `urn:oaps:actor:agent:planner`
- `did:web:merchant.example`

DID is an optional higher-assurance profile, not the baseline requirement.

### 4.2 Actor references

Most protocol objects refer to actors using `actorRef`, which MUST contain `actor_id` and MAY contain `display_name` and `endpoint_hint`.

### 4.3 Compact actor identifiers in evidence

`EvidenceEvent.actor` is intentionally a plain string rather than `actorRef`. This is a deliberate compact encoding for high-volume append-only event streams. Implementations SHOULD treat it as the actor identifier only, not a full actor object.

## 5. Capability model

A `CapabilityCard` describes an action surface exposed by an actor.

### 5.1 CapabilityCard actor binding

A `CapabilityCard` does **not** carry `actor_id`. Capabilities are discovered in the context of an `ActorCard`, which owns the actor binding. This omission is intentional.

### 5.2 Risk classes

OAPS defines canonical risk classes:

- `R0` — informational, no side effects
- `R1` — low-risk read or reversible non-financial action
- `R2` — bounded mutation, reversible operational action
- `R3` — sensitive operational action or user-visible effect
- `R4` — economic or security-sensitive action
- `R5` — high-value irreversible or compliance-sensitive action

Implementations SHOULD apply stricter approval and evidence requirements for `R4` and `R5`.

## 6. Intent model

An `Intent` represents the requested outcome.

Fields:
- `intent_id`
- `verb`
- `object`
- `constraints`
- `requested_outcome`
- `metadata`

If `verb == "invoke"`, then `constraints.arguments` MUST be present.

## 7. Delegation model

A `DelegationToken` represents scoped authority.

A conforming token MUST bind:
- delegator
- delegatee
- scope
- expiry

It MAY also bind:
- quantitative limits
- approval policy
- revocation endpoint
- metadata

A conforming implementation MUST fail closed if requested action falls outside the declared scope.

## 8. Policy model

### 8.1 Policy language

OAPS defines `oaps-policy-v1`, a deterministic JSONLogic-style DSL using operators such as:
- `all`
- `any`
- `var`
- `eq`
- `neq`
- `lt`
- `lte`
- `gt`
- `gte`
- `in`

### 8.2 Policy evaluation context

Conforming policy engines MUST evaluate expressions against a canonical `ctx` object.

Required top-level namespaces:
- `intent`
- `actor`
- `capability`
- `delegation`
- `approval`
- `environment`

Recommended namespaces:
- `economic`
- `merchant`
- `risk`
- `evidence`

Profile-specific namespaces MAY be added.

### 8.3 Engine behavior

A conforming policy engine:
- MUST fail closed on undefined critical variables unless explicitly defaulted
- MUST treat type mismatch as evaluation failure
- MUST record the evaluated context hash in evidence for `R4` and `R5`
- SHOULD return matched rule ids and resulting effects

## 9. Approval model

Approval is a first-class primitive.

### 9.1 ApprovalRequest

An `ApprovalRequest` MUST include:
- requester
- approver
- reason
- proposed action
- expiry

### 9.2 ApprovalDecision

An `ApprovalDecision` MUST include:
- request id
- deciding actor
- decision
- timestamp

If `decision == "modify"`, `modified_action` MUST be present.

## 10. Interaction lifecycle

Canonical interaction states are:

- `discovered`
- `authenticated`
- `verified`
- `intent_received`
- `quoted`
- `delegated`
- `pending_approval`
- `approved`
- `executing`
- `partially_completed`
- `challenged`
- `failed`
- `compensated`
- `completed`
- `revoked`
- `settled`
- `archived`

`InteractionCreated.state` and `InteractionUpdated.state` SHOULD use one of these canonical states. Implementations MAY extend behavior through `state_detail` and `metadata`, but SHOULD NOT invent incompatible state semantics lightly.

## 11. Evidence model

### 11.1 Structure

Evidence is represented as an append-only sequence of `EvidenceEvent` objects.

Every evidence event MUST include:
- `event_id`
- `interaction_id`
- `event_type`
- `actor`
- `timestamp`
- `prev_event_hash`
- `event_hash`

### 11.2 Hash chaining

`prev_event_hash` MUST be:
- `sha256:0` for genesis events
- the `event_hash` of the immediately preceding event otherwise

Hash generation MUST use canonical JSON serialization of the event payload excluding transport-only mutable fields.

### 11.3 Input and output hashes

`input_hash` and `output_hash` SHOULD be included where the event corresponds to a request or result.

## 12. Extension model

Strict schemas and extensibility must coexist.

Objects that are likely to be extended by profiles MAY include an optional `metadata` object. This is the preferred extension escape hatch. Profile authors SHOULD namespace keys inside metadata to avoid collisions.

## 13. Error model

An `ErrorObject` contains:
- `code`
- `category`
- `message`
- `retryable`
- optional `details`

Canonical categories:
- `authentication`
- `authorization`
- `validation`
- `capability`
- `discovery`
- `transport`
- `execution`
- `economic`
- `settlement`
- `timeout`
- `versioning`
- `internal`

## 14. Authentication binding

An OAPS HTTP implementation MUST support at least one of:
- Bearer
- HTTP Signature

It MAY support:
- OAuth2
- mTLS

The authenticated subject and `Envelope.from.actor_id` MUST match unless valid delegation proof is present.

## 15. Idempotency

Mutating HTTP endpoints SHOULD accept `Idempotency-Key`.

A receiver MUST return the original result when the same authenticated actor sends the same request body to the same endpoint with the same idempotency key.

If the same key is reused with a different payload, the receiver MUST return `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD`.

This rule applies to the canonical follow-on HTTP mutations as well as initial interaction creation. In particular, repeated `POST /interactions/{id}/messages`, `/approve`, `/reject`, and `/revoke` requests by the same authenticated actor SHOULD replay the original result rather than duplicating lifecycle transitions or evidence.

## 16. Version negotiation

### 16.1 Envelope fields

The envelope carries:
- `spec_version`
- `min_supported_version`
- `max_supported_version`

### 16.2 Negotiation rule

If a sender and receiver cannot agree on a compatible version, the receiver MUST return `VERSION_NEGOTIATION_FAILED`.

## 17. Canonical HTTP binding

### 17.1 Content type

The canonical content type is:

`application/oaps+json`

### 17.2 Discovery bootstrap

A conforming HTTP implementation SHOULD expose:

`GET /.well-known/oaps.json`

with at least:
- `oaps_version`
- `actor_card_url`
- `capabilities_url`
- `interactions_url`
- `auth_schemes`
- `supported_profiles`

### 17.3 Endpoints

Recommended baseline endpoints:
- `GET /.well-known/oaps.json`
- `GET /actor-card`
- `GET /capabilities`
- `POST /interactions`
- `GET /interactions/{id}`
- `POST /interactions/{id}/messages`
- `POST /interactions/{id}/approve`
- `POST /interactions/{id}/reject`
- `POST /interactions/{id}/revoke`
- `GET /interactions/{id}/evidence`
- `GET /interactions/{id}/events`

### 17.4 Replay windows

HTTP replay endpoints MAY support incremental replay windows using query parameters.

When supported:

- `after` MUST identify the last seen `event_id` and replay begins strictly after that event
- `limit` MUST be a positive integer when present
- invalid `after` or `limit` inputs MUST fail with a stable validation error
- returned order MUST preserve the append order of the interaction's event lineage
- append order means oldest-to-newest within the addressed interaction

## 18. Money encoding

To avoid floating-point ambiguity, `money.value` is encoded as a **string decimal**, not a JSON number.

Recommended pattern:

`^[0-9]+(\.[0-9]{1,8})?$`

Implementations MAY enforce tighter precision depending on domain.

## 19. Profiles

Profiles define how OAPS composes with existing systems.

Current profiles in this pack:
- `oaps-mcp-v1`

Future profiles may include:
- A2A
- ACP
- commerce
- AP2
- x402
- MPP

## 20. Implementation priorities

The reference implementation order is:

1. `@oaps/core`
2. `@oaps/evidence`
3. `@oaps/policy`
4. `@oaps/mcp-adapter`
5. `@oaps/http`

## 21. Publishability and maturity

This draft is intended to be implementable, not frozen. Code is expected to surface remaining ambiguities. Spec evolution SHOULD follow implementation evidence.
