# OAPS Core Foundation Draft

## Status

Foundation draft for the first hard-normative OAPS semantic layer.

This draft intentionally defines a narrower semantic core than the total long-term OAPS vision.

## Goal

The OAPS core should be the smallest semantic layer that still lets multiple agent ecosystems share:

- identity references
- capabilities
- requested and long-running work
- delegated authority
- explicit approvals
- execution outcomes
- tamper-evident lineage
- portable failure semantics

## First-Class Core Objects

The recommended first hard-normative core object set is:

1. `Actor`
2. `Capability`
3. `Intent`
4. `Task`
5. `Delegation`
6. `Mandate`
7. `ApprovalRequest`
8. `ApprovalDecision`
9. `ExecutionResult`
10. `EvidenceEvent`
11. `ErrorObject`
12. `ExtensionDescriptor`

## Core Semantic Rules

### Actor

An actor identifies the principal that performs, requests, approves, or hosts an operation.

Core requirements:

- actor identifiers must be method-agnostic
- both web-native and DID-style identifiers must be allowed
- higher-assurance trust is handled by profiles, not by the core alone

### Capability

A capability describes an action surface exposed by an actor or system.

The core capability model must remain independent of:

- MCP-specific tool method names
- A2A-specific task structures
- vendor-specific RPC method families

### Intent

An intent describes a requested action or outcome.

It is the compact semantic unit for:

- single actions
- direct invocations
- constrained requests

### Task

A task describes longer-lived execution with lifecycle and status.

Tasks should support:

- asynchronous progression
- delegation and reassignment
- approval gates
- partial completion
- failure and compensation states

### Delegation

Delegation represents scoped authority transfer.

The core must define:

- delegator
- delegatee
- scope
- expiry
- optional revocation hooks

The current reference-backed conformance slice already exercises fail-closed expiry handling for delegated authenticated-subject binding.

### Mandate

A mandate is a stronger authorization object than generic delegation.

It is designed for:

- economic actions
- higher-risk execution
- explicit policy or principal authorization chains

Mandates should remain domain-neutral in the core even if payment systems are their strongest first use case.

### ApprovalRequest and ApprovalDecision

Approval is first-class.

The core should define:

- who is requesting approval
- who is being asked
- what action is proposed
- why it requires review
- the decision, timestamp, and any modification or rejection

### ExecutionResult

ExecutionResult carries the canonical outcome of work.

The core should normalize:

- terminal result
- execution status
- references to produced artifacts or external results

### EvidenceEvent

EvidenceEvent is not just an audit log entry.

It is the core lineage primitive and must support:

- hash chaining
- replayability
- actor attribution
- event typing
- input/output references where applicable

The current reference-backed conformance slice already exercises successful chain verification, tamper detection, previous-hash mismatch detection, and canonical hash stability.

### ErrorObject

ErrorObject defines portable failure semantics across bindings and profiles.

The core should standardize:

- error code
- category
- retryability
- machine-readable details

### ExtensionDescriptor

ExtensionDescriptor is the controlled escape hatch.

It should let the suite evolve without forcing ecosystem-specific or domain-specific details back into the core.

## Core Distinctions That Must Stay Sharp

The following pairs must remain distinct:

- `Intent` vs `Task`
- `Delegation` vs `Mandate`
- `Approval` vs generic policy evaluation
- `Evidence` vs plain logging
- `Core semantics` vs `profile mappings`

## Intentionally Out Of Scope For This Draft

The following belong to later drafts, profiles, or domain protocols:

- rail-specific payment challenge mechanics
- settlement rail wire formats
- merchant cart and order abstractions
- provisioning provider lifecycle contracts
- binding-specific headers and transport details
- full trust graph semantics
- full quote, receipt, and dispute object families

## Next Normative Documents

The expected next hard-normative documents after this foundation draft are:

- HTTP binding draft
- MCP profile draft
- A2A profile draft

Payment, provisioning, and commerce should continue as structured draft tracks without overloading the first core draft.
