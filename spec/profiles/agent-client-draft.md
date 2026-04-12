# oaps-agent-client-v1

## Status

Draft profile for OAPS composition with agent-client, CLI-mediated, and SSH-executed task surfaces.

**Version:** `0.1.0-draft`

## Purpose

`oaps-agent-client-v1` defines how OAPS semantics attach to practical
agent-client execution flows where an operator, an agent, and optionally a
remote host participate in shell-oriented work.

The profile exists to normalize:

- CLI-mediated session start and task initiation
- remote execution target identity
- approval-gated shell execution
- replayable evidence for command-driven work

without pretending that SSH itself or one vendor CLI is the standard.

## Normative Scope

This profile is normative for:

- mapping CLI-mediated session start into OAPS interactions or tasks
- mapping SSH-executed shell work into task and execution-result semantics
- preserving explicit operator / agent / remote-host authority boundaries
- attaching approval semantics before sensitive remote execution
- preserving evidence lineage for remote shell work

This profile remains informative for:

- terminal UX details
- shell dialect details
- SSH transport negotiation
- vendor-specific client session ergonomics

## Relationship To The Suite

`oaps-agent-client-v1` is a profile layered above the core and any chosen binding.

It should compose with:

- HTTP, JSON-RPC, gRPC, or events/webhooks control surfaces
- `oaps-auth-web-v1` or stronger trust profiles for operator / agent binding
- future provisioning or jobs-style domain tracks when remote hosts are lifecycle-managed

It should not force remote-shell details back into the OAPS core.

## Authenticated Operator / Agent / Remote-Host Model

The current draft uses a three-party authority model:

| Party | Role | OAPS anchor |
| --- | --- | --- |
| Operator | authenticated human or supervising service requesting work | `Actor` plus intent/task requester |
| Agent | actor planning and executing the work | `Actor` plus execution subject |
| Remote host | execution target or environment | target metadata, host actor, or remote resource reference |

Profile expectations:

- the operator SHOULD be distinguishable from the acting agent when delegated or supervised execution is in play
- the acting agent SHOULD remain explicit in task and evidence metadata
- the remote host SHOULD be represented as a stable host reference or actor id when commands are executed remotely
- delegation or approval state MUST NOT be inferred only from the shell transport

## CLI-Mediated Session Mapping

A CLI-mediated agent run SHOULD map as follows:

- session start -> interaction creation or task creation
- operator prompt / request -> `Intent` or task seed payload
- stepwise command or tool action -> append-only message progression plus evidence emission
- final answer or produced artifact -> `ExecutionResult`

This mapping keeps CLI sessions governable without standardizing the CLI UX itself.

## SSH-Executed Task Mapping

When an agent executes shell work over SSH, the profile expects these portable anchors:

- remote command bundle or shell step -> task execution boundary
- remote host reference -> task metadata or addressed target object
- command digest, argv summary, or referenced script hash -> evidence metadata
- stdout/stderr blob references -> evidence artifact references rather than necessarily inline payloads
- exit status / timeout / signal outcome -> `ExecutionResult` status and portable error mapping

The transport may be SSH, but the portable semantics are task, evidence, and approval semantics above SSH.

## Approval Semantics For Remote Shell Execution

High-impact remote actions SHOULD remain approval-gated.

Typical approval boundaries include:

- privilege escalation
- destructive file mutation
- deployment or rollback on production-like hosts
- long-running unattended command bundles

The profile expects:

- approval to be attached before the sensitive shell step proceeds
- approval rejection to remain visible as an explicit OAPS authorization outcome
- approval metadata to be linkable from the resulting evidence chain when the step later executes

## Evidence Expectations

A conforming implementation SHOULD preserve enough lineage to replay or audit remote shell work.

At minimum, the evidence slice should make it possible to recover:

- who requested the work
- which agent acted
- which remote host or workspace was targeted
- which command bundle or artifact digest was executed
- whether approval was required, granted, or rejected
- what execution outcome occurred

Raw shell streams MAY be stored externally, but the OAPS evidence chain SHOULD keep stable hashes or artifact references.

## Non-Goal Note

This profile is explicitly **not** SSH itself.

It does not standardize:

- key exchange
- shell protocol negotiation
- terminal emulation
- PTY behavior
- shell syntax

It standardizes the portable authority, approval, task, and evidence semantics around those systems.

## Conformance Expectations

The current profile slice is fixture-only.

It currently expects:

- CLI-run task initiation examples
- explicit operator / agent / host authority examples
- remote execution evidence examples
- approval-gated remote shell examples
- an explicit non-goal boundary showing the profile is not SSH itself
