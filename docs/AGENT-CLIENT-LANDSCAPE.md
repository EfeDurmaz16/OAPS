# OAPS Agent-Client Landscape

## Purpose

This document maps the emerging agent-client / CLI / SSH execution surface to
OAPS without pretending that terminal tooling, SSH itself, or remote shell
products all use one transport shape today.

The goal is to capture the shared control-plane semantics that repeatedly show
up across:

- local CLI-mediated agent sessions
- remote coding-agent sessions launched by a client or orchestrator
- SSH-executed task runs where an agent drives commands on a remote host
- approval-gated shell or automation flows that need replayable evidence

## Strategic Rule

OAPS should standardize the portable task, authority, approval, and evidence
semantics around agent-client execution.

OAPS should **not** try to standardize:

- SSH itself
- shell syntax
- terminal multiplexers
- editor integration protocols
- vendor-specific session UX details

## Repeating Surface Areas

Across current agent-client systems, the recurring concerns are:

1. who started the session
2. which agent instance is acting
3. which host or workspace is being targeted
4. whether commands are delegated or directly operator-authorized
5. when approval is required before a side-effecting shell step
6. how command results and artifacts become replayable evidence

Those are the surfaces OAPS can normalize.

## Three-Party Model

The most reusable model is a three-party graph:

- **Operator** — the authenticated human or supervising service asking for work
- **Agent** — the actor planning, invoking tools, or driving shell actions
- **Remote host** — the execution target, workspace host, or SSH-reachable machine

The operator and agent are usually OAPS actors.
The remote host may be represented as:

- an actor when it exposes a durable execution identity
- a target resource referenced in task metadata when it is merely the execution environment

## Common Flow Shapes

### 1. Local CLI-Mediated Agent Session

A CLI launches or resumes an agent session on the operator's current machine.

Useful OAPS anchors:

- session start -> interaction creation
- operator request -> intent or task seed
- tool/shell step -> execution request plus evidence event
- approval prompt -> approval request / approval decision
- final output -> execution result plus evidence chain

### 2. SSH-Executed Agent Task

An agent or orchestrator opens a remote shell session over SSH and runs one or
more commands on a remote host.

Useful OAPS anchors:

- remote command bundle -> task or execution step
- host reference -> target metadata on the task
- privilege escalation -> approval boundary or stronger delegation requirement
- stdout/stderr/artifact references -> evidence payloads or external artifact refs
- exit status -> execution result status

### 3. Remote Coding-Agent Session

A controller starts a durable remote coding-agent run that may execute many shell
steps, gather evidence, and require approvals over time.

Useful OAPS anchors:

- durable run id -> interaction/task continuity
- incremental shell/file steps -> message append plus evidence emission
- human checkpoints -> approval objects
- remote workspace lineage -> evidence metadata and artifact references

## Non-Goals

OAPS should be explicit that this track is:

- **not** an SSH replacement
- **not** a command-language standard
- **not** a terminal protocol
- **not** a vendor CLI UX specification

It is the portable semantic layer above those systems.

## Why This Matters

Agent-client systems are converging on real remote-action semantics faster than
shared standards for authority, approvals, and evidence.

This track gives OAPS a place to normalize those semantics without forcing every
CLI or remote-shell product into the same transport envelope.
