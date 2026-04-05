# OAPS Schema Index

This directory holds the machine-readable schema packs for the OAPS suite.

Current schema families:

- `foundation/` — core foundation draft schemas
- `payment/` — draft payment profile schemas for MPP/AP2-style mappings
- `domain/` — draft domain-family schemas for commerce alignment
- `profiles/` — draft cross-profile helper schemas for auth, trust, payment, provisioning, and compatibility declarations
- top-level draft-pack schemas used by the current MCP-oriented reference slice

Current foundation entry points:

- `foundation/actor.json`
- `foundation/capability.json`
- `foundation/intent.json`
- `foundation/task.json`
- `foundation/delegation.json`
- `foundation/mandate.json`
- `foundation/approval-request.json`
- `foundation/approval-decision.json`
- `foundation/challenge.json`
- `foundation/execution-result.json`
- `foundation/evidence-event.json`
- `foundation/error-object.json`
- `foundation/extension-descriptor.json`
- `foundation/interaction-transition.json`
- `foundation/task-transition.json`

Current reference-slice entry points:

- `actor-card.json`
- `capability-card.json`
- `intent.json`
- `approval-request.json`
- `approval-decision.json`
- `execution-request.json`
- `execution-result.json`
- `interaction-created.json`
- `interaction-updated.json`
- `evidence-event.json`
- `error.json`
- `delegation-token.json`
- `envelope.json`

Suite rule:

- normative drafts should ship with schemas
- schemas should ship with examples
- conformance should reference both

Draft payment entry points:

- `payment/payment-session.json`
- `payment/payment-authorization.json`
- `payment/mandate-chain.json`

Draft domain entry points:

- `domain/order-intent.json`
- `domain/merchant-authorization.json`
- `domain/fulfillment-commitment.json`
- `domain/commercial-evidence.json`

Draft profile helper entry points:

- `profiles/subject-binding-assertion.json`
- `profiles/trust-attestation.json`
- `profiles/payment-challenge.json`
- `profiles/provisioning-operation.json`
- `profiles/profile-support-declaration.json`

When new bindings or profiles become hard-normative, add their schema families here instead of overloading the existing foundation pack.
