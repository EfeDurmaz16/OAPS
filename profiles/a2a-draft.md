# oaps-a2a-v1

## Status

Draft profile for OAPS composition with A2A.

This document is intentionally incomplete and is meant to mature into the next major profile after MCP.

## Purpose

`oaps-a2a-v1` defines how OAPS semantics attach to A2A task exchange.

It should let A2A systems preserve their own transport and discovery semantics while gaining:

- OAPS intent and task normalization
- delegation and mandate semantics
- approval and challenge semantics
- evidence and lineage semantics
- policy-aware execution boundaries

## Normative Scope

This profile is normative for:

- mapping A2A tasks to OAPS tasks or interactions
- preserving lifecycle semantics across the mapping
- attaching OAPS approval and delegation semantics where needed
- preserving evidence and lineage across task progression
- carrying thread and progress continuity across long-running task updates

This profile remains informative for:

- A2A-native discovery and routing behavior
- A2A-specific transport details
- future payment subprofile decisions

## Relationship To The Suite

A2A is the closest external ecosystem to the OAPS task model.

This profile therefore focuses on:

- mapping between A2A tasks and OAPS tasks
- mapping between A2A messages/events and OAPS interaction semantics
- preserving async workflow behavior without forcing A2A into an OAPS-shaped transport

It does not attempt to replace A2A discovery, routing, or transport behavior.

## Core Mapping Goals

The profile should eventually define how to map:

- A2A task identifiers to OAPS task/interaction identifiers
- task state transitions to OAPS lifecycle states
- agent cards to OAPS actor references
- task payloads to OAPS intents or task records
- approvals and delegated authority into OAPS mandate and approval objects
- message/thread identifiers into portable state-propagation metadata

The core design rule is that OAPS should add portable semantics without flattening A2A-specific strengths.

## Current Mapping Matrix

The current draft should be read as a semantic mapping matrix, not as a transport rewrite.

| A2A surface | OAPS anchor | Current fixture anchor | Current claim level |
| --- | --- | --- | --- |
| agent card or peer identity | `Actor` / `actorRef` | task and delegation fixtures plus actor-oriented examples | fixture-backed only |
| task creation request | `Task` and, when compact invocation semantics are needed, `Intent` | `a2a.task.lifecycle.preservation` | fixture-backed only |
| task status update | canonical OAPS lifecycle state on `Task` or `InteractionUpdated` | `a2a.task.lifecycle.preservation`, `a2a.task.long-running.partial-update` | fixture-backed only |
| task message or progress event | interaction/task metadata plus evidence continuity | `a2a.message.threading.state-propagation`, `a2a.message.evidence.carryover` | fixture-backed only |
| delegated handoff between agents | `Delegation` and, where authority is stronger, `Mandate` | `a2a.delegation.carryover` | fixture-backed only |
| human or policy gate during task progression | `ApprovalRequest` / `ApprovalDecision` | `a2a.approval.interposition` | fixture-backed only |
| cancellation or authority withdrawal | `revoked`, `failed`, or `challenged` depending on why the task stopped | `a2a.task.cancellation.revocation-mapping` | fixture-backed only |
| completion, partial completion, compensation, or failure | `ExecutionResult` plus canonical lifecycle states | `a2a.task.lifecycle.preservation`, `a2a.task.long-running.partial-update`, and `a2a.message.evidence.carryover` | fixture-backed only |

The matrix is intentionally phrased in generic A2A surface terms. The suite is not yet claiming one frozen field-by-field mapping for every A2A implementation.

## Lifecycle Mapping Notes

The current draft expects a conforming mapper to preserve semantic continuity across typical A2A task phases as follows:

| Typical A2A phase | Preferred OAPS state anchor | Notes |
| --- | --- | --- |
| task accepted or created | `intent_received` or `discovered` | choose the narrower state based on whether work has merely been registered or semantically accepted |
| task in progress | `executing` | stepwise progress may also emit evidence or append messages without changing the core mapping rule |
| waiting on human or policy review | `pending_approval` | approval semantics stay first-class rather than becoming opaque task metadata |
| partially complete | `partially_completed` | preserves multi-step progress without forcing premature terminal success |
| challenge or remediation required | `challenged` | use when the task must pause on a dispute, proof request, or recovery boundary |
| completed successfully | `completed` | pair with `ExecutionResult` when concrete outputs exist |
| failed | `failed` | preserve stable failure semantics instead of vendor-specific status strings alone |
| revoked or cancelled authority | `revoked` | use when authority is withdrawn rather than the task merely erroring |
| compensating after side effects | `compensated` | keeps rollback-like semantics visible in the portable model |

These mappings remain profile guidance, not a claim that the current reference implementation already runs A2A traffic end to end.

## Deeper Task And Message Lifecycle Mapping

The current A2A draft now distinguishes three continuity layers that an implementation SHOULD preserve together:

1. **task identity continuity** — the A2A task identifier, its portable OAPS `interaction_id`, and any task-local retry key or checkpoint id stay linked throughout the lifecycle
2. **message/thread continuity** — progress messages, tool outputs, clarifications, and approval prompts SHOULD carry a stable thread handle or parent-event reference so an OAPS replay consumer can reconstruct why the task changed state
3. **state propagation continuity** — when an A2A task update changes status, the same semantic update SHOULD also be visible as an OAPS lifecycle transition, evidence append, or message metadata update rather than being trapped inside transport-only fields

A conforming mapper SHOULD therefore be able to answer:

- which A2A task a given OAPS interaction update belongs to
- which prior message or approval boundary caused the next state change
- whether a later partial-completion update supersedes, extends, or compensates a prior update
- whether the task was cancelled because work was no longer desired, because authority was revoked, or because execution failed for a separate reason

## Message Threading And State Propagation

A2A systems commonly expose task comments, progress messages, or subtask notes that advance a long-running workflow without replacing the whole task object.

This profile treats those message streams as first-class semantic carryover, not as opaque chatter.

A conforming implementation SHOULD preserve enough information for each portable task message to identify:

- the parent task or interaction
- the sending actor
- the logical thread or phase within the task
- whether the message is informational, approval-seeking, evidence-bearing, or result-bearing
- the portable state implications, if any, of the message

When an A2A update changes both the task payload and the task status, implementations SHOULD keep the status transition and the message/evidence lineage aligned so a replay consumer does not have to infer the reason from vendor-specific task deltas alone.

## Approval Interposition On A2A Boundaries

The current profile explicitly allows OAPS approval to interpose on A2A task boundaries such as:

- initial task acceptance for high-risk delegated work
- transition from planning to side-effectful execution
- subtask handoff to a stronger authority domain
- finalization or compensation after a partial result

The approval object SHOULD reference the same portable task or interaction identifier that the A2A implementation uses for subsequent state updates. Approval interposition therefore pauses the portable task lifecycle; it does not create a detached review object with no replayable relationship to the task that is being governed.

## Delegation Carryover

A2A task handoff often preserves authority across multiple agents.

This profile requires delegation carryover to stay explicit when:

- a primary requesting actor delegates execution to another agent
- a delegated agent opens one or more subtasks on a downstream A2A peer
- a downstream agent returns progress or completion evidence back up the task chain

Portable carryover SHOULD preserve:

- delegator and delegatee identity
- the scope or mandate being exercised
- expiry or revocation boundaries
- whether the downstream task is still within the original delegated authority

## Evidence Carryover And Replay

A conforming implementation SHOULD preserve a replayable lineage for task progression.

At minimum, the profile should attach evidence for:

- task creation
- task updates
- approval requests and decisions
- execution milestones
- completion, failure, rejection, or revoke paths
- partial-completion checkpoints and later compensating updates

Replay consumers should be able to reconstruct not only that a task reached a state, but also which messages, approvals, delegation boundaries, and evidence records explain the path to that state.

## Workflow Semantics

`oaps-a2a-v1` should support:

- long-running tasks
- stepwise progress updates
- human-in-the-loop gates
- delegated execution
- partial completion and compensation
- evidence attachment on task progression

This profile is where OAPS's dual intent/task model becomes especially visible.

## Policy And Approval

A conforming `oaps-a2a-v1` mapping should make it possible to insert OAPS policy and approval before high-risk task transitions or side effects.

The profile should be explicit about:

- where policy is evaluated
- where approval is required
- what state changes are blocked until approval is recorded
- how policy decisions are reflected in the task lineage

## Identity And Trust

The profile remains compatible with `oaps-auth-web-v1` and higher-assurance trust profiles such as FIDES/TAP-family deployments.

It does not force a single identity technology into the A2A mapping.

## Compatibility Declaration Notes

Partial A2A implementations are expected.

An implementation MAY therefore declare:

- **compatible** support when it preserves task lifecycle, message/evidence carryover, approval interposition, and delegation continuity for the profile scenarios it claims
- **partial** support when it only maps task creation plus terminal completion, but not long-running partial updates or cancellation/revocation boundaries
- **incompatible** support when it forwards A2A task payloads without preserving stable OAPS lifecycle or delegation semantics

The example pack now includes both partial-support and fuller-lifecycle declaration examples so implementations can describe their claim level honestly.

## Conformance

`oaps-a2a-v1` will eventually need a TCK that checks:

- task mapping fidelity
- lifecycle state preservation
- message threading and state propagation
- approval and delegation attachment
- evidence replayability
- cancellation or revocation mapping
- cross-binding compatibility

The draft is intentionally not yet a full normative profile, but it should be detailed enough to guide implementation work now.

The current fixture pack remains foundation-backed: it uses the core task, delegation, approval, execution-result, interaction-transition, and evidence examples to model lifecycle preservation, message threading, long-running progress, revocation mapping, and evidence carryover. That keeps the profile honest without claiming runtime-backed interop that does not exist yet.

## Open Questions

The draft still needs decisions on:

- how much of the A2A message model should be exposed in OAPS core versus profile metadata
- how to represent multi-party task delegation cleanly
- whether A2A-specific payment or commerce hooks need their own subprofile or can rely on the payment profiles
