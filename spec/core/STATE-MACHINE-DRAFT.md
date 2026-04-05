# OAPS Core State Machine Draft

## Status

Draft normative companion to the core foundation draft.

This document sharpens lifecycle behavior that was previously spread across
`SPEC.md`, the foundation draft, and the current HTTP reference slice.

## Purpose

The OAPS core needs a shared lifecycle model so bindings and profiles can:

- preserve the same meaning for long-running work
- distinguish approval gating from later challenge handling
- distinguish rejection, revocation, cancellation, and failure
- map intent-oriented requests into task-oriented execution without inventing
  incompatible local states

This draft defines the canonical lifecycle vocabulary and the minimum transition
rules that bindings and profiles should preserve.

## Lifecycle Model

OAPS has two closely related but distinct lifecycle surfaces:

1. **Interaction lifecycle** — the cross-boundary conversation or execution
   lineage anchored by `interaction_id`
2. **Task lifecycle** — the durable work object that may be promoted from an
   intent when execution becomes longer-lived, delegated, queued, or otherwise
   needs explicit task semantics

An implementation may expose one or both surfaces, but it MUST NOT collapse
their meanings completely:

- an **Interaction** is the durable protocol envelope for exchange, approval,
  replay, and evidence
- a **Task** is the durable work instance for scheduling, assignment,
  progression, compensation, and cancellation semantics

The current reference slice is primarily interaction-backed. It already proves
`intent_received`, `pending_approval`, `completed`, `failed`, and `revoked`
interaction behavior. It does **not** yet expose a dedicated standalone task
runtime API, so task semantics remain draft-track but still normatively useful.

## Canonical Interaction States

The canonical interaction state set is:

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

Bindings and profiles MAY expose narrower subsets, but they SHOULD preserve the
same state meanings when they reuse these labels.

### Interaction State Meanings

| State | Meaning |
| --- | --- |
| `discovered` | The peer and capability surface are known, but no authenticated action has started. |
| `authenticated` | The caller identity has been bound to the session or request surface. |
| `verified` | Additional trust, attestation, delegation, or policy preconditions have been verified. |
| `intent_received` | A concrete OAPS request has been accepted into the interaction lineage. |
| `quoted` | The responder has returned terms, cost, or bounded execution conditions that may require confirmation. |
| `delegated` | Authority has been handed to another actor while preserving the same interaction lineage. |
| `pending_approval` | Execution is blocked on an explicit approval decision. |
| `approved` | Approval was granted, but execution has not necessarily begun yet. |
| `executing` | Concrete work is in progress. |
| `partially_completed` | Some work completed successfully, but additional work or compensation remains. |
| `challenged` | Progress is blocked on a new requirement discovered after the original request, such as stronger auth, payment authorization, or missing input. |
| `failed` | The requested work did not succeed for execution, validation, policy, or approval-rejection reasons. |
| `compensated` | Previously completed work required compensating action. |
| `completed` | The requested work reached its successful terminal outcome. |
| `revoked` | Authority or permission for the interaction was withdrawn. |
| `settled` | Economic or ledger-side finalization has been completed. |
| `archived` | The interaction is retained for replay and audit but no longer active. |

### Interaction Transition Rules

The following transitions are canonical:

- `discovered -> authenticated`
- `authenticated -> verified`
- `authenticated -> intent_received`
- `verified -> intent_received`
- `intent_received -> quoted`
- `intent_received -> delegated`
- `intent_received -> pending_approval`
- `intent_received -> approved`
- `intent_received -> executing`
- `intent_received -> completed`
- `intent_received -> failed`
- `quoted -> pending_approval`
- `quoted -> approved`
- `quoted -> executing`
- `quoted -> failed`
- `delegated -> pending_approval`
- `delegated -> approved`
- `delegated -> executing`
- `delegated -> failed`
- `pending_approval -> approved`
- `pending_approval -> failed`
- `pending_approval -> revoked`
- `approved -> executing`
- `approved -> completed`
- `approved -> failed`
- `approved -> revoked`
- `executing -> partially_completed`
- `executing -> challenged`
- `executing -> failed`
- `executing -> completed`
- `executing -> revoked`
- `partially_completed -> executing`
- `partially_completed -> challenged`
- `partially_completed -> compensated`
- `partially_completed -> completed`
- `partially_completed -> failed`
- `partially_completed -> revoked`
- `challenged -> pending_approval`
- `challenged -> approved`
- `challenged -> executing`
- `challenged -> failed`
- `challenged -> revoked`
- `completed -> settled`
- `completed -> archived`
- `failed -> archived`
- `revoked -> archived`
- `compensated -> archived`
- `settled -> archived`

### Illegal Interaction Transitions

Implementations SHOULD fail closed on obviously incompatible transitions.
Examples include:

- any transition from `completed` back to `executing`
- any transition from `failed` back to `approved`
- any transition from `revoked` back to `executing`
- `pending_approval -> completed` without an approval decision or equivalent
  profile-defined approval bypass
- `discovered -> completed` without at least an accepted request lineage
- `archived` transitioning back into any active state

Bindings MAY omit intermediate states, but they MUST NOT claim a transition
whose meaning contradicts these rules.

## Canonical Task States

The canonical task state set is:

- `created`
- `queued`
- `running`
- `pending_approval`
- `challenged`
- `blocked`
- `partially_completed`
- `completed`
- `failed`
- `compensated`
- `revoked`
- `cancelled`

These states are already reflected in the current foundation task schema.

### Task Transition Rules

The following transitions are canonical:

- `created -> queued`
- `created -> pending_approval`
- `created -> running`
- `created -> revoked`
- `queued -> running`
- `queued -> pending_approval`
- `queued -> cancelled`
- `queued -> revoked`
- `queued -> failed`
- `running -> blocked`
- `running -> pending_approval`
- `running -> challenged`
- `running -> partially_completed`
- `running -> completed`
- `running -> failed`
- `running -> revoked`
- `running -> cancelled`
- `blocked -> queued`
- `blocked -> running`
- `blocked -> challenged`
- `blocked -> failed`
- `blocked -> revoked`
- `blocked -> cancelled`
- `pending_approval -> queued`
- `pending_approval -> running`
- `pending_approval -> failed`
- `pending_approval -> revoked`
- `challenged -> pending_approval`
- `challenged -> queued`
- `challenged -> running`
- `challenged -> failed`
- `challenged -> revoked`
- `partially_completed -> running`
- `partially_completed -> challenged`
- `partially_completed -> compensated`
- `partially_completed -> completed`
- `partially_completed -> failed`
- `partially_completed -> revoked`
- `completed -> compensated`

### Illegal Task Transitions

Examples of illegal task transitions include:

- `completed -> running`
- `cancelled -> running`
- `revoked -> queued`
- `failed -> running`
- `created -> completed` without any execution or profile-defined no-op
  completion path

## Intent-To-Task Promotion

An `Intent` is the compact semantic request. A `Task` is the durable work
instance that may arise from that request.

### Promotion Rule

An implementation SHOULD promote an intent into a task when any of the
following becomes true:

- the work becomes asynchronous or long-running
- the work must be queued, reassigned, or retried over time
- a separate assignee, worker, or delegated executor must carry the work
- the work needs explicit partial-completion, cancellation, or compensation
  semantics

### Promotion Requirements

When an implementation promotes an intent into a task:

- the original `intent_id` MUST remain stable
- the resulting task MUST reference the originating intent through `intent_ref`
- the task MUST get its own `task_id`
- the interaction lineage SHOULD continue to use the same `interaction_id`
- evidence SHOULD let a reviewer reconstruct that the task was promoted from a
  specific intent
- when serialized directly, task progression SHOULD use a `TaskTransition`
  object rather than an ad hoc state delta

The current reference slice does not yet emit a dedicated `Task` object. The
interaction record therefore remains the runtime anchor today. This is an
implementation limitation, not a reason to erase the distinction in the core.

## Approval Versus Challenge

Approval and challenge are not interchangeable.

### Approval

Use approval when:

- an action is known in advance
- an approver can decide whether the action may proceed
- the gate exists before the next sensitive side effect

Typical approval path:

`intent_received -> pending_approval -> approved -> executing`

### Challenge

Use challenge when:

- execution cannot continue with the current inputs or authorization
- a new payment, trust, policy, or operator response is required
- the system needs additional information after work has already advanced

Typical challenge path:

`executing -> challenged -> pending_approval|approved|executing`

A challenge is therefore a **new blocking condition discovered during or after
execution progress**, not merely an approval that has not yet been granted.

When serialized directly, an open challenge SHOULD be carried as a `Challenge`
object plus the corresponding `TaskTransition` into `challenged`.

The current reference slice has approval behavior, but no dedicated challenge
runtime endpoint yet. Challenge semantics are therefore defined here
normatively before they are runtime-backed.

## Reject Versus Revoke Versus Cancel Versus Fail

These outcomes must remain distinct:

| Term | Meaning | Typical state result |
| --- | --- | --- |
| Reject | An approval gate denied the proposed action before that gated action was allowed to proceed. | `failed` |
| Revoke | Previously granted authority, delegation, or interaction permission was withdrawn. | `revoked` |
| Cancel | A requester, operator, or orchestrator intentionally stopped work that no longer needs to continue, without claiming execution failure. | `cancelled` |
| Fail | The work could not complete because of execution, validation, policy, transport, or similar non-cancellation error conditions. | `failed` |

### Additional Rules

- approval rejection SHOULD preserve the approval decision in evidence and
  SHOULD map to a failure reason such as `APPROVAL_REJECTED`
- revocation MUST remain distinguishable from ordinary failure because it
  withdraws authority rather than reporting an execution defect
- cancellation SHOULD be reserved for operator/requester stop semantics and
  SHOULD NOT be silently rewritten into revocation or failure unless the
  implementation genuinely cannot preserve the distinction

The current HTTP reference slice already distinguishes:

- approval rejection -> `failed`
- revoke endpoint -> `revoked`

It does not yet expose a dedicated cancellation surface.

## Mandate Versus Delegation

Delegation and mandate are related but not interchangeable.

| Primitive | Use when | Typical strength |
| --- | --- | --- |
| Delegation | A delegator grants bounded authority to another actor to act within a scoped capability set. | general scoped authority |
| Mandate | A principal or authorizing party grants stronger authorization for sensitive, economic, or compliance-relevant action. | stronger authorization chain |

### Boundary Rules

- a delegation is about **who may act within a scope**
- a mandate is about **what stronger authorization chain justifies the act**
- mandates MAY reference delegations, but MUST NOT be treated as mere aliases
  for them
- profiles SHOULD require mandates before or alongside delegation for
  high-risk economic action when a plain delegation would be insufficient

### Examples

#### Delegation Example

A merchant owner delegates a repository-maintenance agent to rotate a staging
credential before a deadline. The key semantics are delegatee identity, scope,
and expiry.

#### Mandate Example

A business principal authorizes a purchasing agent to spend up to a bounded
amount on compute capacity for production workloads. The key semantics are the
authorization chain, action boundary, and stronger review/evidence posture.

## Conformance Notes

This state-machine draft is intended to drive:

- stronger core schemas and examples for task-oriented semantics
- invalid fixtures for illegal transitions
- runtime-backed reference assertions for promotion, rejection, and revocation
  distinctions

Until dedicated task and challenge runtimes exist, implementations SHOULD make
non-claim boundaries explicit rather than pretending every state is equally
backed by code today.
