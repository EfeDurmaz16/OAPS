# oaps-mpp-v1

## Status

Draft payment-session profile for the OAPS suite.

This profile maps OAPS payment coordination semantics onto machine payment
sessions and session-based payment permissions.

## Purpose

`oaps-mpp-v1` defines how OAPS represents payment session objects when a
machine-readable payment flow is needed.

It exists so OAPS can coordinate paid actions while remaining rail-neutral
at the semantic layer.

## Normative Scope

This profile is normative for:

- mapping OAPS payment requirements to machine payment session objects
- preserving authorization intent across session retries and settlement
- recording payment authorization state in evidence
- translating session completion or failure into stable OAPS lifecycle and
  error semantics

This profile is informative for:

- rail-specific settlement mechanics
- facilitator implementation details
- merchant or wallet UI decisions

## Relationship To The Suite

`oaps-mpp-v1` sits above the payment session surface and below the rail or
wallet implementation that executes it.

It should compose cleanly with:

- HTTP binding surfaces
- auth profiles that identify the paying actor
- MCP and A2A workflows that need paid execution
- commerce or provisioning workflows that need payment gating

## Payment Session Mapping Goals

A conforming mapper SHOULD be able to preserve:

- who is paying
- who receives value
- what action is being authorized
- the allowed amount or limit
- the session state
- the evidence trail for authorization and settlement

## Current Mapping Matrix

| MPP concern | OAPS anchor | Example anchor | Claim level |
| --- | --- | --- | --- |
| session discovery | `OrderIntent` or payment requirement metadata | `examples/mpp/payment-session.v1.json` | example-only |
| authorization grant | `ApprovalDecision` or `Mandate` | `examples/mpp/mandate-linked-session.v1.json` | example-only |
| settlement reference | `ExecutionResult` or payment settlement metadata | `examples/mpp/payment-session.v1.json` | example-only |
| retry after challenge | preserved interaction lineage | `examples/mpp/profile-support.partial.v1.json` | draft-only |
| compatibility declaration | profile-support example | `examples/mpp/profile-support.compatible.v1.json` | draft-only |

The profile does not claim a live MPP runtime in this repository.

## Authorization And Evidence

A conforming mapping SHOULD make the authorization story explicit:

- the payment session should identify the payer and payee
- the authorization intent should be durable enough to replay
- the settlement outcome should be attachable to the same lineage
- high-value flows SHOULD preserve approval evidence

## Conformance

`oaps-mpp-v1` will eventually need fixture coverage for:

- partial support declarations
- compatibility declarations
- session lifecycle mapping
- settlement reference mapping
- approval-gated payment flows

The current draft is intentionally example-backed only.

## Open Questions

- Should MPP map to a distinct OAPS payment session object or remain a
  metadata pattern over tasks and approvals?
- How much rail-specific detail belongs in the profile versus examples?
- What is the minimum evidence required for a paid action that may be
  retried after challenge?
