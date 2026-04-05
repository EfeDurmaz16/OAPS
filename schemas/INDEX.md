# OAPS Schema Index

This directory holds the machine-readable schema packs for the OAPS suite.

Current schema families:

- `foundation/` — core foundation draft schemas
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

When new bindings or profiles become hard-normative, add their schema families here instead of overloading the existing foundation pack.
