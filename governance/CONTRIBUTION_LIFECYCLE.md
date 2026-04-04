# Contribution Lifecycle

## Purpose

This document defines the expected path for contributions to OAPS so review is predictable and material changes do not appear by surprise.

## Contribution Types

- issue
- clarification
- editorial change
- schema change
- implementation change
- conformance change
- binding change
- profile change
- governance change
- external review artifact

## Lifecycle

### 1. Intake

Open an issue or reference an existing discussion.

Required at this stage:

- the problem statement
- the impacted area
- whether the change is normative or informational
- whether the change touches core, binding, profile, conformance, or governance

### 2. Triage

The change is categorized into one of these paths:

- editorial only
- implementation-only
- conformance-only
- material spec change
- governance change

Material changes should be routed to an OEP and, where useful, a working group.

### 3. Drafting

The contributor prepares the smallest reviewable artifact that can prove the change.

Expected supporting material:

- prose diff or OEP draft
- schema diff if applicable
- example diff if applicable
- implementation note if applicable
- conformance impact note if applicable

### 4. Working Group Review

Relevant working groups review the draft in parallel where possible.

Examples:

- core semantics changes go to Core Semantics WG
- transport changes go to Bindings WG
- MCP/A2A/payment changes go to Profiles WG
- fixture and harness changes go to Conformance WG
- review coordination goes to Governance and Outreach WG

### 5. Maintainer Review

Maintainership checks:

- normative scope
- internal consistency
- backward compatibility
- whether the change belongs in core or in a profile/binding
- whether the contribution introduces hidden ecosystem-specific assumptions

### 6. Merge or Accept

The artifact may be:

- merged as editorial or implementation work
- accepted as an OEP
- deferred pending missing dependencies
- rejected with reasons

### 7. Follow-Through

A spec change is not complete when prose merges.

The change is complete only when the required downstream artifacts are updated:

- schemas
- examples
- conformance fixtures
- implementation code where support is claimed
- review packet or release note if external review is needed

## Ready Criteria

A material contribution is ready for acceptance when:

- its normative scope is explicit
- it states whether it changes core, binding, profile, or governance
- it includes backward-compatibility notes
- it includes conformance impact
- it includes implementation impact where relevant

## What Not To Do

- do not merge normative changes without the supporting schema or fixture updates when those artifacts are part of the claim
- do not force profile-specific behavior into the core without a strong written justification
- do not use a working group discussion as a substitute for a formal decision record

## Practical Rule

If the change would matter to an external implementer, it should leave a durable trail:

- issue
- draft
- review
- decision
- downstream update
