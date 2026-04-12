# AICP Shared Context Protocol Draft

## Status

Shared Context draft for the AICP (Agent Interaction Control Protocol) semantic layer.

**Version:** `0.1.0-draft`

**Requirements notation:** The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174) when, and only when, they appear in all capitals.

Companion normative documents:
- `spec/core/FOUNDATION-DRAFT.md` — defines the core primitives referenced by this document.
- `spec/core/STATE-MACHINE-DRAFT.md` — specifies the canonical interaction and task lifecycles.

## Purpose

This specification defines how AICP agents share, synchronize, and replay interaction state. It solves the "copy-paste between agents" problem by making interaction context a first-class portable object.

An Interaction Context is the portable state bundle that any participant in an interaction can read and contribute to. By standardizing the shape and synchronization rules for this bundle, agents from different ecosystems can collaborate within a single interaction without proprietary bridging.

## Interaction Context Object

An Interaction Context **MUST** be a JSON-serializable object conforming to `schemas/foundation/interaction-context.json`.

### Required Fields

A conforming Interaction Context instance **MUST** include the following fields:

- `context_id` — A stable, unique identifier for this context instance. **MUST** be a non-empty string.
- `interaction_id` — The identifier of the interaction this context belongs to. **MUST** match a valid Interaction as defined in FOUNDATION-DRAFT.
- `participants` — An ordered array of `ActorRef` objects identifying who is in this interaction. **MUST** contain at least two participants at creation time.
- `messages` — An ordered array of Message objects appended during the interaction. **MUST** be append-only.
- `transitions` — An ordered array of `InteractionTransition` objects recording state changes. **MUST** be append-only.
- `evidence_chain` — An ordered array of `EvidenceEvent` objects forming the hash-linked evidence for all state changes. **MUST** conform to the evidence chain rules in FOUNDATION-DRAFT CC4.
- `delegations` — An array of active delegation chain(s) within this interaction.
- `current_state` — The current `InteractionState` as defined in `common.json#/$defs/interactionState`.
- `created_at` — RFC 3339 `date-time` in UTC. The timestamp when this context was created.
- `updated_at` — RFC 3339 `date-time` in UTC. The timestamp of the most recent context update.

### Optional Fields

A conforming Interaction Context instance **MAY** include:

- `tasks` — Task objects promoted from intents within this interaction.
- `approvals` — Pending or resolved `ApprovalRequest`/`ApprovalDecision` pairs.
- `challenges` — Open or resolved `Challenge` objects.
- `metadata` — Arbitrary context metadata. Implementations **MUST NOT** require specific metadata keys for conformance.

## Context Synchronization

### SC1. Visibility

When Agent A sends a message, the context **MUST** be updated and the update **MUST** be visible to Agent B before Agent B's next read of the context.

### SC2. Append-Only

Context updates **MUST** be append-only. New messages, new transitions, and new evidence **MUST** be appended. Existing entries **MUST NOT** be mutated or removed.

### SC3. Evidence Emission

Each context update **MUST** produce an `EvidenceEvent` and append it to the `evidence_chain`. This requirement extends FOUNDATION-DRAFT CC4 to context-level operations.

### SC4. Full Snapshot

Agents **MUST** be able to request a full context snapshot at any time. The snapshot **MUST** return the complete Interaction Context object as it exists at the time of the request.

### SC5. Incremental Replay

Agents **MUST** be able to request incremental updates after a cursor (timestamp or event index). The response **MUST** include only messages, transitions, and evidence events appended after the specified cursor.

## Context Replay

### CR1. Reconstructibility

Any participant **MUST** be able to reconstruct the full interaction from the context's evidence chain. The evidence chain, combined with the messages and transitions arrays, **MUST** contain sufficient information to replay the interaction from genesis.

### CR2. Fail-Closed Verification

Replay **MUST** fail closed on tampered or out-of-order evidence, per FOUNDATION-DRAFT CC4 and CC7. An implementation that silently accepts a broken evidence chain during replay is non-conforming.

### CR3. Cursor-Based Replay

Context **MUST** support `after` cursor for incremental replay, consistent with the HTTP binding's replay endpoints. The cursor **MAY** be an event index (integer) or a timestamp.

## Context Transfer

### CT1. Transferability

When an agent delegates to another agent, the interaction context **MUST** be transferable to the receiving agent. The transfer **MUST** include the full context object and the delegation that authorizes the transfer.

### CT2. Evidence Verification on Accept

The receiving agent **MUST** verify the evidence chain before accepting the context. A context with a broken evidence chain **MUST** be rejected per CC7 (fail-closed defaults).

### CT3. Delegation Visibility

Delegation boundaries **MUST** be visible in the context. Every delegation recorded via `addDelegation` **MUST** appear in the `delegations` array, and the transfer event **MUST** be recorded in the evidence chain.

## Multi-Agent Interactions

### MA1. Participant Count

An interaction **MAY** have more than two participants. Implementations **MUST NOT** impose a hard upper bound on participant count, though they **MAY** impose practical limits documented in their profile.

### MA2. Participant Listing

Each participant **MUST** be listed in the `participants` array. Adding a participant after context creation **MUST** produce an `EvidenceEvent` of type `context.participant_added`.

### MA3. Message Attribution

Messages **MUST** identify the sending actor via `actor_ref`. An implementation **MUST NOT** accept a message whose `actor_ref` does not match any entry in `participants`.

### MA4. Transition Attribution

Transitions **MUST** identify the triggering actor via `triggered_by`. The triggering actor **MUST** be a current participant.

---

## Conformance

A conforming Shared Context implementation:

1. **MUST** produce and consume Interaction Context objects that validate against `schemas/foundation/interaction-context.json`.
2. **MUST** enforce append-only semantics (SC2).
3. **MUST** emit evidence for every context mutation (SC3).
4. **MUST** support full snapshot (SC4) and incremental replay (SC5, CR3).
5. **MUST** verify evidence chain integrity on context transfer (CT2) and replay (CR2).
6. **MUST** record delegation boundaries in the context (CT3).
7. **MUST** support multi-agent interactions with proper attribution (MA2, MA3, MA4).
