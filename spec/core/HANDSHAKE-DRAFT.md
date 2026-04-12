# AICP Agent Handshake Protocol Draft

## Status

Draft specification for the AICP Agent Handshake protocol.

**Version:** `0.1.0-draft`

**Requirements notation:** The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174) when, and only when, they appear in all capitals.

Companion normative documents:
- `spec/core/FOUNDATION-DRAFT.md` — core primitives referenced by this document.
- `spec/core/STATE-MACHINE-DRAFT.md` — canonical interaction and task lifecycles.

## Purpose

This document defines how two AICP agents establish a governed interaction: version negotiation, capability matching, identity verification, delegation verification, and evidence chain initialization.

Every AICP interaction begins with a handshake. The handshake produces a shared `interaction_id`, an initialized evidence chain, and a binding endpoint through which subsequent protocol messages flow.

## Handshake Flow

The handshake is a four-step exchange between an initiator (Agent A) and a responder (Agent B):

```
Agent A (initiator)              Agent B (responder)
    |                                |
    |-- 1. PROPOSE ----------------->|
    |   { aicp_version, actor_card,  |
    |     required_capabilities,     |
    |     delegation_chain,          |
    |     proposed_binding }         |
    |                                |
    |<-- 2. ACCEPT/REJECT ----------|
    |   { selected_version,          |
    |     matched_capabilities,      |
    |     actor_card,                |
    |     interaction_id,            |
    |     evidence_chain_root }      |
    |                                |
    |-- 3. CONFIRM ----------------->|
    |   { interaction_id,            |
    |     evidence_ack }             |
    |                                |
    |<-- 4. READY -------------------|
    |   { binding_endpoint,          |
    |     session_token }            |
```

## Step 1 — PROPOSE

The initiator sends a `HandshakeProposal` to the responder.

**Normative requirements:**

- The initiator **MUST** include their `ActorCard` in the proposal.
- The initiator **MUST** include the AICP version range they support (`spec_version`, `min_supported_version`, `max_supported_version`).
- The initiator **MUST** include a list of `required_capabilities` — capability identifiers the responder must satisfy.
- The initiator **MUST** include a `proposed_binding` indicating the transport mechanism (`http`, `websocket`, `grpc`).
- The initiator **SHOULD** include a `delegation_chain` (array of `DelegationToken`) if acting on behalf of another actor.
- The initiator **MAY** include a `mandate_ref` if the interaction involves economic actions governed by a mandate.
- The initiator **MAY** include a `nonce` for replay prevention.

## Step 2 — ACCEPT or REJECT

The responder evaluates the proposal and responds with either an acceptance or a rejection.

**Normative requirements:**

- The responder **MUST** verify the initiator's actor identity via the provided `ActorCard`.
- The responder **MUST** verify every `DelegationToken` in the delegation chain if present:
  - The chain **MUST** be verified using `assertAuthenticatedActor` semantics.
  - Every token **MUST** be checked for expiry; expired delegations **MUST** abort the handshake with `DELEGATION_EXPIRED`.
- The responder **MUST** check that all `required_capabilities` are present in its own capability set. Missing capabilities **MUST** produce a `CAPABILITY_NOT_FOUND` rejection.
- The responder **MUST** negotiate the AICP version using the existing `negotiateVersion` function from `@oaps/core`. A failed negotiation **MUST** produce a `VERSION_NEGOTIATION_FAILED` rejection.
- If all checks pass, the responder **MUST** respond with an `ACCEPT` containing:
  - A newly generated `interaction_id`.
  - The `selected_version` from negotiation.
  - The list of `matched_capabilities`.
  - The responder's own `ActorCard`.
  - An `evidence_chain_root` — the hash of the initial evidence event for this interaction.
- If any check fails, the responder **MUST** respond with a `REJECT` containing an `ErrorObject` with one of the following codes:
  - `CAPABILITY_NOT_FOUND` (category: `capability`) — one or more required capabilities are not available.
  - `DELEGATION_EXPIRED` (category: `authorization`) — a delegation token in the chain has expired.
  - `VERSION_NEGOTIATION_FAILED` (category: `versioning`) — no compatible AICP version exists.
  - `AUTHENTICATED_SUBJECT_MISMATCH` (category: `authentication`) — the actor identity could not be verified.

## Step 3 — CONFIRM

The initiator acknowledges the acceptance and verifies the responder.

**Normative requirements:**

- The initiator **MUST** acknowledge the `evidence_chain_root` from the responder's acceptance.
- The initiator **MUST** verify the responder's `ActorCard`.
- The initiator **MUST** echo the `interaction_id` to confirm the binding.

## Step 4 — READY

The responder activates the interaction.

**Normative requirements:**

- The responder **MUST** provide the `binding_endpoint` for the established interaction.
- The responder **SHOULD** provide a `session_token` for subsequent message authentication.
- Both sides **MUST** have emitted `EvidenceEvent` records for their respective handshake steps before any interaction messages flow.

## Normative Requirements

### Atomicity

The handshake **MUST** be atomic. If any step fails, the interaction **MUST NOT** be created. A partial handshake (e.g., PROPOSE sent but ACCEPT never received) **MUST NOT** produce a usable `interaction_id`.

### Evidence Chain

- Every handshake step **MUST** produce an `EvidenceEvent` with `event_type` set to one of: `handshake.propose`, `handshake.accept`, `handshake.reject`, `handshake.confirm`, `handshake.ready`.
- The evidence chain **MUST** be initialized before any interaction messages flow.
- The `prev_event_hash` of the first handshake event **MUST** be `sha256:genesis`.

### Delegation Verification

- Delegation chains **MUST** be verified fail-closed per FOUNDATION-DRAFT CC7.
- Expired delegations **MUST** abort the handshake immediately.
- A delegation chain with a subject mismatch **MUST** abort the handshake with `AUTHENTICATED_SUBJECT_MISMATCH`.

### Error Handling

All rejection error codes **MUST** use `ErrorObject` from the foundation layer with the appropriate `category` field drawn from the canonical category vocabulary.

## Appendix A — Handshake Error Codes

| Code | Category | Description |
|---|---|---|
| `CAPABILITY_NOT_FOUND` | `capability` | Required capability not available on responder |
| `DELEGATION_EXPIRED` | `authorization` | Delegation token in chain has expired |
| `VERSION_NEGOTIATION_FAILED` | `versioning` | No compatible AICP version between parties |
| `AUTHENTICATED_SUBJECT_MISMATCH` | `authentication` | Actor identity verification failed |
