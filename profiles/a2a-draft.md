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

This profile remains informative for:

- A2A-native discovery and routing behavior
- A2A-specific transport details
- future payment subprofile decisions

## Relationship To The Suite

A2A is the closest external ecosystem to the OAPS task model.

This profile should therefore focus on:

- mapping between A2A tasks and OAPS tasks
- mapping between A2A messages/events and OAPS interaction semantics
- preserving async workflow behavior without forcing A2A into an OAPS-shaped transport

It should not attempt to replace A2A discovery, routing, or transport behavior.

## Core Mapping Goals

The profile should eventually define how to map:

- A2A task identifiers to OAPS task/interaction identifiers
- task state transitions to OAPS lifecycle states
- agent cards to OAPS actor references
- task payloads to OAPS intents or task records
- approvals and delegated authority into OAPS mandate and approval objects

The core design rule is that OAPS should add portable semantics without flattening A2A-specific strengths.

## Current Mapping Matrix

The current draft should be read as a semantic mapping matrix, not as a transport rewrite.

| A2A surface | OAPS anchor | Current fixture anchor | Current claim level |
| --- | --- | --- | --- |
| agent card or peer identity | `Actor` / `actorRef` | task and delegation fixtures plus actor-oriented examples | fixture-backed only |
| task creation request | `Task` and, when compact invocation semantics are needed, `Intent` | `a2a.task.lifecycle.preservation` | fixture-backed only |
| task status update | canonical OAPS lifecycle state on `Task` or `InteractionUpdated` | `a2a.task.lifecycle.preservation` | fixture-backed only |
| task message or progress event | interaction/task metadata plus evidence continuity | `a2a.message.evidence.carryover` | fixture-backed only |
| delegated handoff between agents | `Delegation` and, where authority is stronger, `Mandate` | `a2a.delegation.carryover` | fixture-backed only |
| human or policy gate during task progression | `ApprovalRequest` / `ApprovalDecision` | `a2a.approval.interposition` | fixture-backed only |
| completion, partial completion, compensation, or failure | `ExecutionResult` plus canonical lifecycle states | `a2a.task.lifecycle.preservation` and `a2a.message.evidence.carryover` | fixture-backed only |

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

## Workflow Semantics

`oaps-a2a-v1` should support:

- long-running tasks
- stepwise progress updates
- human-in-the-loop gates
- delegated execution
- partial completion and compensation
- evidence attachment on task progression

This profile is where OAPS's dual intent/task model should become especially visible.

## Policy And Approval

A conforming `oaps-a2a-v1` mapping should make it possible to insert OAPS policy and approval before high-risk task transitions or side effects.

The profile should be explicit about:

- where policy is evaluated
- where approval is required
- what state changes are blocked until approval is recorded
- how policy decisions are reflected in the task lineage

## Evidence

A conforming implementation SHOULD preserve a replayable lineage for task progression.

At minimum, the profile should attach evidence for:

- task creation
- task updates
- approval requests and decisions
- execution milestones
- completion, failure, rejection, or revoke paths

## Identity And Trust

The profile should remain compatible with `oaps-auth-web-v1` and higher-assurance trust profiles such as FIDES/TAP-family deployments.

It should not force a single identity technology into the A2A mapping.

## Conformance

`oaps-a2a-v1` will eventually need a TCK that checks:

- task mapping fidelity
- lifecycle state preservation
- approval and delegation attachment
- evidence replayability
- cross-binding compatibility

The draft is intentionally not yet a full normative profile, but it should be detailed enough to guide implementation work now.

The current fixture pack is intentionally foundation-backed: it uses the core task, delegation, approval, execution-result, and evidence examples to model lifecycle preservation, partial completion, compensation, approval interposition, and message/evidence carryover. That keeps the profile honest without claiming runtime-backed interop that does not exist yet.

## Open Questions

The draft still needs decisions on:

- how much of the A2A message model should be exposed in OAPS core versus profile metadata
- how to represent multi-party task delegation cleanly
- whether A2A-specific payment or commerce hooks need their own subprofile or can rely on the payment profiles
