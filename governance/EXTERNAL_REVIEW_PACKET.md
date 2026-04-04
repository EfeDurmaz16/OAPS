# External Review Packet

## Purpose

This document defines the minimum package used to ask external reviewers, cosigners, or adjacent ecosystem maintainers to review an OAPS artifact.

The goal is to make reviews concrete, bounded, and technically useful.

## When To Use

Use an external review packet when asking for review of:

- the charter
- the suite architecture
- a binding draft
- a profile draft
- a conformance pack
- a governance or pledge document

Do not use it to ask people to review the entire ecosystem at once.

## Packet Contents

Every packet should include:

- a short review ask
- the exact artifact being reviewed
- the reason this review matters
- the specific decision needed from the reviewer
- the current implementation status
- the conformance status
- the open questions
- the deadline or desired review window
- the contact point for follow-up

The packet should also reference the target family and packet type selected from:

- `docs/REVIEW-TARGET-MATRIX.md`
- `docs/REVIEW-PACKET-INDEX.md`

## Recommended Packet Structure

### 1. One-paragraph summary

Explain what the artifact is and what you want the reviewer to do.

### 2. Scope boundary

State clearly whether the review covers:

- core semantics
- bindings
- profiles
- conformance
- governance

### 3. What is already true

List the parts that are already implemented, drafted, or validated.

This is important because reviewers should not spend time re-litigating settled points.

### 4. What is still open

List the specific unresolved items that need feedback.

### 5. Why this reviewer

Explain why this ecosystem or company is a relevant reviewer.

### 6. Desired outcome

State whether the ask is:

- comment-only review
- implementation feedback
- profile mapping feedback
- conformance feedback
- cosigner consideration

## Audience-Specific Variants

### MCP-oriented packet

Include:

- capability mapping summary
- invocation flow
- policy and approval mapping
- evidence mapping

### A2A-oriented packet

Include:

- task and message mapping
- long-running state handling
- approval and delegation mapping
- evidence and replay handling

### Payment-oriented packet

Include:

- mandate and authorization mapping
- payment coordination primitives
- settlement and receipt references
- whether the profile is rail-specific or rail-agnostic

### Provisioning-oriented packet

Include:

- service lifecycle mapping
- credential delivery or rotation concerns
- approval and policy boundaries
- evidence capture expectations

## Review Ask Rules

- ask for review of one artifact or one profile family at a time
- ask for concrete comments, not generic endorsement
- do not ask external reviewers to approve unresolved scope that is still changing
- do not ask for a cosignature until the relevant draft is stable enough to defend

## Good Packet Size

The packet should be short enough to read quickly, but complete enough that the reviewer can answer without asking for basic context.

As a rule of thumb:

- one short summary
- one main artifact
- one appendix or link bundle
- one concrete ask

## Follow-Up

After the review, capture:

- feedback received
- decisions taken
- unresolved objections
- required follow-up changes

If the review informs a normative change, convert it into an issue or OEP so the decision trail stays durable.
