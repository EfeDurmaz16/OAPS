# AOSL Runtime and Language Draft

## Status

Draft execution language and runtime profile aligned to AICP core semantics.

**Version:** `0.1.0-draft`

This document is a profile-track execution draft.
It does not replace AICP core semantics, bindings, or profile rules.
Instead, it defines how an AICP-native execution environment can author,
compile, validate, plan, simulate, and execute typed agent work.

## Purpose

AOSL defines a typed execution and interaction language for agent-native
runtimes.

Its goal is to give agents a native action and authority layer instead of
forcing important execution semantics to hide inside terminal text or ad hoc
tool wrappers.

A conforming AOSL runtime SHOULD provide:

- typed task authoring
- explicit effect declarations
- a syntax-independent IR
- runtime policy enforcement
- simulation before execution
- canonical evidence emission for critical transitions
- AICP-aligned approval, delegation, mandate, and payment behavior

## Non-Goals

AOSL is not:

- a shell replacement
- a generic scripting language
- a transport binding
- a payment rail
- a replacement for AICP core semantics

## Relationship to AICP

AOSL is an AICP-native execution profile and runtime family.

AICP defines the meaning of primitives such as `Actor`, `Capability`, `Intent`,
`Task`, `Delegation`, `Mandate`, `ApprovalRequest`, `ApprovalDecision`,
`Challenge`, `ExecutionResult`, `EvidenceEvent`, `ErrorObject`, and
`PaymentCoordination`.

AOSL defines how programs and runtimes construct, validate, and execute work
that uses those primitives.

## Architectural Model

AOSL is organized into five layers:

1. **Language kernel** — authoring constructs such as `task`, `let`, `if`, `await`, `return`, `fail`, `emit`, and `requires`
2. **Execution primitives** — typed local operations such as filesystem, process, git, HTTP, search, and artifact emission
3. **AICP primitive integration** — authoring and runtime use of AICP objects and lifecycle semantics
4. **Profiles** — optional integrations for MCP, A2A, payment, trust, jobs, commerce, and provisioning
5. **Bindings** — optional transport and remote execution surfaces when the runtime is distributed

A conforming implementation MAY expose only a subset of the higher layers in
its first release, but it MUST preserve the meaning of the lower layers it does
claim.

## Runtime Components

A conforming AOSL runtime SHOULD include the following major modules:

- **Policy engine** — validates effects, scope, approvals, mandates, and fail-closed rules
- **Executor** — interprets IR steps and routes them to adapters
- **Adapter layer** — filesystem, process, git, HTTP, payment, approval, evidence, and artifact integrations
- **Evidence log** — append-only, hash-chained, replayable lineage storage
- **Artifact store** — emitted logs, reports, files, and related hashes and metadata
- **Simulation engine** — generates side-effect-free plans and effect summaries before execution

## Conformance

### AOSL implementation conformance

A conforming AOSL implementation MUST:

- parse or construct valid task definitions
- compile source to a shared IR
- validate declared effects before execution
- fail closed on authority and policy violations
- emit canonical evidence for critical transitions
- preserve AICP lifecycle semantics when AICP primitives are used
- provide deterministic planning output for the same source and runtime policy inputs

### AOSL source unit conformance

A conforming AOSL task definition MUST:

- declare required effects
- use only permitted operations
- preserve structured typing for inputs, outputs, and errors
- reference interaction or task context where required by the active profile or runtime policy

## Core Language Kernel

The minimal kernel SHOULD remain intentionally small.
A v0 implementation SHOULD support at least:

- `task`
- `let`
- `if`
- `match`
- `for`
- `await`
- `return`
- `fail`
- `emit`
- `requires`

Future constructs such as `retry`, `defer`, `parallel`, `transaction`, and
`compensate` MAY be added later, but they SHOULD not block the first execution
profile.

## Type Model

AOSL SHOULD support the following type families:

- scalars: `string`, `number`, `boolean`, `datetime`, `duration`, `bytes`, `json`
- structural: object, array, union, optional, schema-ref
- typed results for success, partial success, and failure surfaces

Every operation SHOULD expose:

- typed input
- typed output
- typed error category
- explicit effect implications

## Effect System

### Purpose

Effects declare what a task is allowed to do.
A runtime MUST NOT execute undeclared effects.

### Canonical v0 effect kinds

AOSL v0 SHOULD define a canonical vocabulary that includes:

- `fs.read`
- `fs.write`
- `search.text`
- `process.run`
- `git.read`
- `git.mutate`
- `http.fetch`
- `artifact.emit`
- `approval.request`
- `approval.decide`
- `payment.authorize`
- `payment.capture`

### Effect rules

A conforming runtime MUST reject or fail closed when:

- destructive wildcard effects are unbounded
- network effects omit bounded host declarations where the runtime policy requires them
- process execution lacks a required timeout or executable allowlist
- execution attempts an undeclared effect

Delegation and mandate scope SHOULD be checked against the effective effect set
before execution begins.

## Execution Primitives

The execution surface SHOULD remain small in v0.
AOSL v0 SHOULD prioritize the following primitives:

- filesystem: `fs.read`, `fs.write`, `fs.glob`
- search: `search.text`
- process: `process.run`, `process.spawn`
- HTTP: `http.fetch`
- git: `git.status`, `git.diff`, `git.commit`
- artifacts: `artifact.emit`

Each primitive SHOULD define:

- input shape
- output shape
- declared effect requirement
- canonical error category mapping
- evidence implications where applicable

## AICP Primitive Integration

### Actor and Capability

AOSL MAY construct and reference AICP actors and capabilities.
Capabilities MAY annotate exported task surfaces, but AOSL MUST NOT collapse the
core `Capability` meaning into binding-specific transport details.

### Intent

AOSL SHOULD support first-class intent creation.
An intent remains the compact semantic request.
If the runtime promotes an intent into a task, it MUST preserve the originating
intent reference.

### Task and Interaction

AOSL MUST preserve the AICP distinction between:

- **Interaction** — authority, approval, evidence, and settlement lineage
- **Task** — durable work progression and assignment semantics

The runtime MAY expose both surfaces, but it MUST NOT collapse them into a
single untyped job abstraction.

### Delegation and Mandate

AOSL MUST treat delegations and mandates as distinct objects.
The runtime MUST fail closed on expired, revoked, or scope-mismatched instances.
Mandates SHOULD be required for higher-risk economic actions when the active
policy profile says so.

### ApprovalRequest and ApprovalDecision

AOSL SHOULD provide first-class approval workflows.
A runtime MUST block or interrupt execution when policy requires approval and no
valid approval decision exists.

### Challenge

A runtime SHOULD support explicit challenge handling for cases such as missing
input, stronger authentication, risk escalation, or payment authorization.
Challenges MUST remain distinct from approvals even when both surface as pauses
in execution.

### ExecutionResult

AOSL SHOULD map terminal execution into AICP `ExecutionResult` objects.
A runtime MUST NOT treat an execution result as a substitute for required
canonical evidence.

### EvidenceEvent

AOSL MUST produce append-only, hash-chained evidence records for critical
transitions.
Canonical evidence emission is runtime-native and MUST NOT depend on the
application author remembering to emit custom records.

### ErrorObject

AOSL SHOULD map runtime and adapter failures into AICP-compatible error objects.
Profile-specific errors MAY be narrower, but they MUST map back to canonical
categories.

### PaymentCoordination

AOSL MAY expose payment-aware execution steps.
A runtime that performs payment coordination MUST validate the associated
mandate chain and MUST emit evidence for each critical payment state transition.

## Plans and Simulation

A conforming AOSL runtime SHOULD expose a planning mode before execution.

At minimum, a plan SHOULD summarize:

- declared effects
- likely actions
- approval requirements
- payment requirements
- risk level
- possible artifacts
- target interaction or task references when known

A simulation SHOULD remain side-effect free and SHOULD estimate:

- file reads and writes
- process executions
- network calls
- approval requests
- payment authorizations
- mutation surfaces

## Evidence Semantics

The runtime MUST automatically emit canonical evidence for:

- interaction state changes
- task state changes
- approval requests and decisions
- delegation issuance and use
- mandate issuance and use
- payment coordination state changes

The evidence log MUST be:

- append-only
- hash chained
- replayable
- tamper-detectable

A developer-level `emit(...)` surface MAY exist for custom events or artifacts,
but it MUST NOT replace canonical runtime evidence.

## Error Model

AOSL SHOULD support at least the following canonical error categories:

- `validation`
- `permission`
- `policy`
- `timeout`
- `network`
- `execution`
- `payment`
- `auth`
- `evidence`

Every surfaced error SHOULD indicate retryability and SHOULD preserve
machine-readable details when available.

## Policy Engine

A conforming runtime SHOULD validate at least:

- effect declarations
- delegation scope
- mandate validity and expiry
- approval requirements
- evidence continuity
- fail-closed behavior for ambiguity or unrecognized mandatory extensions

The runtime MUST stop or reject execution on:

- expired delegation
- expired mandate
- scope mismatch
- tampered evidence chain
- missing approval where the active policy requires it
- unknown mandatory extension

## IR Specification

AOSL requires a shared, syntax-independent intermediate representation.
The IR exists so that:

- the TypeScript SDK
- the textual DSL
- future Python or other language SDKs

all compile to the same execution model.

A v0 IR SHOULD include:

- task metadata
- declared effects
- steps
- branching structures
- return shape
- evidence hints
- policy hints

The IR SHOULD be fully type-checkable and SHOULD remain independent of any one
surface syntax.

## SDK Surface

AOSL SHOULD provide a TypeScript SDK first.
Future SDKs MAY exist in Python or other languages, but they MUST preserve the
same runtime semantics and IR behavior.

SDK ergonomics MAY differ across languages.
Semantics MUST NOT.

## DSL Surface

The textual DSL is optional in v0.
It SHOULD compile to the same IR as the SDK and MUST NOT define semantics
independently of the runtime and IR.

A small grammar and formatter MAY arrive after the runtime skeleton, linter,
simulation engine, and evidence flow exist.

## CLI

AOSL SHOULD provide a CLI with at least:

- `aosl run`
- `aosl plan`
- `aosl lint`
- `aosl replay`
- `aosl inspect`

CLI output SHOULD prefer structured output and MAY also provide human-readable
summaries.

## Security Considerations

Important security considerations include:

- host allowlists
- process restrictions
- write restrictions
- artifact hash integrity
- approval spoofing resistance
- evidence tamper resistance
- mandate expiry enforcement
- fail-closed behavior by default

## Privacy Considerations

Important privacy considerations include:

- artifact retention rules
- evidence minimization
- sensitive input redaction
- payment metadata handling
- replay visibility boundaries

## Extension Model

AOSL SHOULD integrate with AICP `ExtensionDescriptor` semantics.
Unknown mandatory extensions MUST fail closed.
Optional extensions MAY be ignored only when the active profile and policy model
allow it.

## Profile Integration

AOSL-specific integrations MAY exist for:

- MCP
- A2A
- trust and auth
- payment
- jobs
- provisioning
- commerce

These integrations MUST extend AOSL without contradicting AICP core semantics.

## Conformance and Test Kit

An eventual AOSL TCK SHOULD include:

- parser fixtures
- IR fixtures
- lint fixtures
- simulation fixtures
- evidence replay fixtures
- approval flow fixtures
- delegation scope fixtures
- mandate expiry fixtures
- payment authorization fixtures

## Recommended Minimal v0 Scope

### v0.1

A realistic first implementation SHOULD prioritize:

- TypeScript SDK
- IR
- runtime skeleton
- `fs.read`
- `fs.write`
- `search.text`
- `process.run`
- `git.status`
- `artifact.emit`
- `Intent`
- `Delegation`
- `ApprovalRequest`
- `ApprovalDecision`
- `EvidenceEvent`

### v0.2

A second pass MAY add:

- `Mandate`
- `PaymentCoordination`
- `Challenge`
- simulation
- richer linting
- host allowlists

### v0.3

A later pass MAY add:

- textual DSL parser
- formatter
- richer profile integrations
- MCP and A2A execution bindings

## Current Repository Placement

The current repository path for this execution-profile draft is:

- `docs/AICP-AOSL-BOUNDARY.md`
- `spec/profiles/aosl-runtime-draft.md`
- `reference/aosl-monorepo/`

That split intentionally keeps AICP core semantics, AOSL profile semantics, and
AOSL reference implementation scaffolding distinct.
