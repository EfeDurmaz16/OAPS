# AICP ↔ AOSL Boundary

## Purpose

This document defines the architectural and normative boundary between:

- **AICP**: the open protocol suite for agent semantics
- **AOSL**: the AICP-native execution language and runtime

AICP standardizes shared meanings.
AOSL standardizes how a local or distributed runtime can author, plan, simulate,
and execute those meanings.

AOSL is **not** the protocol itself.
It is an execution profile and reference language/runtime family built on top of
AICP.

## Short Definitions

### AICP

AICP is the protocol suite that defines shared objects and lifecycle rules for:

- actors
- capabilities
- intents
- tasks
- delegations
- mandates
- approvals
- challenges
- execution results
- evidence events
- payment coordination
- errors
- bindings
- profiles
- domain protocol families

### AOSL

AOSL is an execution language and runtime family that:

- gives agents a typed action surface
- exposes effect declarations through `requires`
- compiles authoring inputs to a shared IR
- validates authority, scope, and policy before execution
- emits canonical evidence during important state transitions
- maps execution flows to AICP primitives and lifecycles

## Normative Separation

### What belongs to AICP

AICP owns:

- semantic object definitions
- lifecycle meanings
- transition legality
- fail-closed requirements
- evidence requirements
- approval semantics
- mandate semantics
- payment coordination semantics
- binding semantics
- profile semantics
- conformance expectations

In short:

> AICP defines what things mean.

### What belongs to AOSL

AOSL owns:

- language syntax
- SDK surface
- IR model
- execution planning
- simulation
- static linting
- adapter routing
- runtime policy checks
- local execution APIs
- artifact store behavior
- CLI ergonomics
- developer authoring workflows

In short:

> AOSL defines how agent programs are authored, validated, planned, and executed.

## Layer Mapping

| Layer | Owned By | Role |
| --- | --- | --- |
| Core semantics | AICP | Shared object meanings and lifecycle rules |
| Bindings | AICP | HTTP / JSON-RPC / gRPC / events transport semantics |
| Profiles | AICP | Mapping AICP semantics into MCP, A2A, auth, payment, and adjacent systems |
| Execution profile | AOSL | Runtime interpretation of AICP objects in executable tasks |
| SDK | AOSL | TypeScript and future language surfaces |
| DSL | AOSL | Agent-friendly textual syntax |
| Runtime | AOSL | Policy engine, executor, simulation, evidence emission |
| Adapters | AOSL | fs/process/git/http/payment and related integrations |

## Primitive Ownership Matrix

### AICP-owned primitives

The following primitives remain owned normatively by AICP:

- `Actor`
- `Capability`
- `Intent`
- `Task`
- `Delegation`
- `Mandate`
- `ApprovalRequest`
- `ApprovalDecision`
- `Challenge`
- `ExecutionResult`
- `EvidenceEvent`
- `ErrorObject`
- `PaymentCoordination`
- `InteractionTransition`
- `TaskTransition`
- `ExtensionDescriptor`

AOSL MUST NOT redefine their meaning.
AOSL MAY construct, validate, reference, serialize, and route them through local
execution machinery, but it MUST preserve AICP semantics.

### AOSL-owned execution constructs

The following constructs are AOSL-owned and are not AICP core primitives:

- `task` declarations
- `requires` blocks
- effect descriptors
- execution plan objects
- simulation results
- adapter contracts
- artifact store records
- local runtime context
- step IR
- linter diagnostics
- CLI commands
- source file, module, and package formats

These can be described as an AICP execution profile or a reference
language/runtime layer, but not as AICP core objects.

## Interaction and Task

AICP distinguishes:

- **Interaction**: cross-boundary authority, approval, evidence, and settlement lineage
- **Task**: durable work object with execution progression

AOSL MUST preserve this separation.

AOSL runtimes MAY expose both a runtime interaction context and a runtime task
execution context, but they MUST NOT collapse them into a single local job
abstraction.

## Evidence Semantics

AICP requires important state transitions to produce evidence.
AOSL therefore adopts this rule:

> Evidence emission for canonical transitions is runtime-native, not developer-optional.

AOSL SDKs MAY expose developer-level `emit(...)` hooks for domain artifacts or
custom evidence hints, but canonical evidence for the following surfaces MUST be
emitted automatically when they map to AICP lifecycle changes:

- interaction state changes
- task state changes
- approval requests and decisions
- delegation issuance and use
- mandate issuance and use
- payment coordination state changes

## Effects and Capability

Effects are primarily an AOSL concern.
They relate to AICP `Capability`, but AICP core does not need to standardize
all local effect kinds.

AICP `Capability` describes the action surface.
AOSL `requires` describes the local execution powers needed to realize that
surface.

Profiles MAY later standardize portable subsets of effect descriptors, but the
base execution effect vocabulary belongs to AOSL first.

## Approval, Delegation, and Mandate

AICP owns their semantics.
AOSL owns their executable workflow integration.

AICP defines:

- what an approval request means
- what a delegation means
- what a mandate means
- how expiry and scope mismatch fail closed

AOSL defines:

- how developers request approval in code
- how mandates are validated during execution
- how delegation scope is checked against effects
- how the runtime interrupts or blocks execution when policy requires approval

## Payment Coordination

Payment remains an AICP primitive.
AOSL may provide:

- payment adapter contracts
- mandate-aware payment authorization steps
- simulation of payment risk
- CLI display and audit tooling

Rail-specific settlement formats remain out of AICP core and out of AOSL core
language unless provided through profiles or adapters.

## Conformance Model

### AICP conformance

A system conforms to AICP when it preserves AICP object semantics, lifecycle
semantics, evidence rules, and binding/profile requirements.

### AOSL conformance

A system conforms to AOSL when it:

- compiles valid source to valid IR
- enforces declared effects
- preserves AICP semantics where AICP primitives are used
- emits required evidence
- fails closed on policy, authority, mandate, and evidence violations
- produces deterministic planning output

### Relationship

A system may be AICP-conforming without implementing AOSL.
A system is only honestly AOSL-conforming if it remains AICP-compatible where
AICP primitives are used.

## Recommended Repository Placement

Recommended structure:

- `spec/core/` → AICP core semantics
- `spec/bindings/` → AICP transport bindings
- `profiles/` → AICP ecosystem profiles
- `spec/profiles/aosl-runtime-draft.md` → AOSL execution profile draft
- `reference/aosl-monorepo/` → AOSL reference implementation scaffold

## Final Boundary Rule

> AICP is the semantic standard.
> AOSL is the execution language/runtime family that compiles, plans,
> simulates, and executes against that standard.
