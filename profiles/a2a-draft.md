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
