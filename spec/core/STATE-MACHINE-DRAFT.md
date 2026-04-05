# OAPS Core State Machine Draft

## Status

Draft normative companion to the OAPS core foundation draft.

This document sharpens lifecycle semantics that were previously spread across
`SPEC.md`, `spec/core/FOUNDATION-DRAFT.md`, schemas, examples, and reference
runtime behavior.

## Purpose

The OAPS core distinguishes:

- compact requested work (`Intent`)
- longer-lived execution (`Task`)
- approval gates
- challenge flows
- terminal failure and authority-withdrawal outcomes

This draft defines the canonical lifecycle model for those distinctions so
bindings and profiles can map them without inventing incompatible semantics.

## 1. Object-Level Lifecycle Rule

The core keeps `Intent` and `Task` separate:

- an `Intent` is the semantic request for an action or outcome
- a `Task` is the tracked execution unit once lifecycle progression matters

An implementation MAY execute an intent immediately without materializing a
task object, but it MUST preserve task-equivalent lifecycle semantics whenever
the work becomes long-running, approval-gated, challenged, delegated, revoked,
or otherwise replay-relevant.

## 2. Canonical Task States

The canonical core task states are:

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

These states align with `schemas/foundation/common.json#/$defs/taskState`.

## 3. State Meanings

| State | Meaning |
| --- | --- |
| `created` | A task has been materialized from an intent or external mapping, but execution has not started. |
| `queued` | The task is accepted for future work and is waiting for scheduling or resource allocation. |
| `running` | Work is actively executing. |
| `pending_approval` | Work is paused until an explicit approval decision arrives. |
| `challenged` | Execution cannot continue until an external challenge is satisfied, such as stronger auth, payment authorization, or proof refresh. |
| `blocked` | Execution cannot currently continue for operational reasons that are not an approval or challenge. |
| `partially_completed` | Some intended work has succeeded, but more execution remains or compensating follow-up is still required. |
| `completed` | The task reached its intended terminal success condition. |
| `failed` | The task reached a terminal error condition without completing its intended outcome. |
| `compensated` | A prior side effect occurred and a compensating action was completed afterward. |
| `revoked` | Authority to continue the task was withdrawn after the task existed. |
| `cancelled` | The task was intentionally stopped before terminal success, without necessarily implying authority withdrawal or execution failure. |

## 4. Canonical Transition Rules

Permitted forward transitions are:

- `created -> queued | running | pending_approval | challenged | blocked | revoked | cancelled | failed`
- `queued -> running | pending_approval | challenged | blocked | revoked | cancelled | failed`
- `running -> pending_approval | challenged | blocked | partially_completed | completed | failed | compensated | revoked | cancelled`
- `pending_approval -> running | revoked | cancelled | failed`
- `challenged -> running | revoked | cancelled | failed`
- `blocked -> queued | running | revoked | cancelled | failed`
- `partially_completed -> running | pending_approval | challenged | blocked | completed | compensated | failed | revoked | cancelled`
- `completed -> compensated`
- `failed -> compensated`

States not listed as valid successors MUST be treated as illegal transitions.

Terminal states are:

- `completed`
- `failed`
- `compensated`
- `revoked`
- `cancelled`

Except for the explicit `completed -> compensated` and `failed -> compensated`
repair path, a terminal state MUST NOT transition to another state.

## 5. Illegal Transition Guidance

The following are canonical examples of illegal transitions:

- `completed -> running`
- `revoked -> running`
- `cancelled -> completed`
- `pending_approval -> completed` without an intervening approval or an equivalent profile-mapped approval result
- `challenged -> completed` without challenge satisfaction and resumed execution

Bindings and profiles MAY expose different wire-level event shapes, but they
MUST preserve these semantic constraints.

## 6. Intent-To-Task Promotion

An implementation SHOULD promote an `Intent` into a tracked `Task` when any of
the following becomes true:

- execution is not immediate
- an approval gate is introduced
- a challenge must be satisfied before continuation
- delegated or reassigned work needs durable tracking
- partial completion or resumable replay matters
- revoke or cancel behavior must be expressed explicitly

Once promoted:

- the task MUST keep a stable `task_id`
- the originating intent SHOULD remain referenced via `intent_ref`
- evidence SHOULD preserve both the original request semantics and later task progression

If an implementation keeps the task implicit internally, it MUST still expose a
task-equivalent lifecycle through interaction state, evidence, or profile-level
mapping artifacts.

## 7. Approval Versus Challenge

`pending_approval` and `challenged` are not interchangeable.

Use `pending_approval` when:

- a human or policy-authorized approver must explicitly accept, reject, or modify the proposed action

Use `challenged` when:

- continuation depends on satisfying an external requirement rather than receiving discretionary approval
- examples include authentication step-up, payment challenge completion, proof refresh, or additional verification material

An approval decision answers **whether** the action may proceed.
A challenge answers **what extra condition** must be satisfied before it can proceed.

## 8. Revoke Versus Reject Versus Cancel Versus Fail

These outcomes remain distinct:

| Term | When to use it |
| --- | --- |
| `reject` | An approval request was denied before the gated action was allowed to proceed. |
| `revoked` | Previously granted or still-live authority was withdrawn after the task or delegation already existed. |
| `cancelled` | Work was intentionally stopped, but the stop does not by itself mean authority was withdrawn or execution failed. |
| `failed` | Execution attempted the work and ended in an error condition. |

Guidance:

- rejection is primarily an approval outcome
- revocation is primarily an authority/lifecycle outcome
- cancellation is primarily an operator/requester stop outcome
- failure is primarily an execution outcome

Profiles and bindings SHOULD preserve these distinctions even if their native
surfaces collapse some of them into fewer API methods.

## 9. Mandate Versus Delegation

`Delegation` and `Mandate` are also distinct.

Use `Delegation` for:

- scoped authority transfer
- bounded actor-to-actor permission handoff
- optional limits, expiry, and revocation hooks

Use `Mandate` for:

- stronger authorization over sensitive or economic actions
- explicit principal authorization for a concrete action family
- cases where approval, payment, or higher-assurance evidence chains matter

In short:

- delegation answers **who may act on whose behalf within a scope**
- mandate answers **what stronger authority exists for a sensitive action and under which principal authorization**

### Example Boundary

1. a merchant owner delegates repo-maintenance actions to an internal agent
2. the same merchant separately issues a mandate for a capped purchase action

The first is ordinary delegated capability use.
The second is a stronger authorization object suitable for payment or other
high-risk side effects.

## 10. Binding And Profile Mapping Rule

Bindings and profiles MAY add transport-specific or ecosystem-specific state
details, but they SHOULD map them back to the canonical task states above.

They MUST NOT claim compatibility if they erase the distinction between:

- approval and challenge
- reject and revoke
- cancel and fail
- delegation and mandate
- intent and task when lifecycle tracking is required
