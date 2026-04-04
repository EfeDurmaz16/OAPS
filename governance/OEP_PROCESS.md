# OAPS Enhancement Proposal Process

## Purpose

OEPs are the change mechanism for OAPS.

Any material change to:

- core semantics
- bindings
- profile contracts
- conformance requirements
- governance rules

should be proposed through an OEP.

## Proposal Types

- `core` — semantic object and lifecycle changes
- `binding` — HTTP, JSON-RPC, gRPC, or events changes
- `profile` — ecosystem mapping changes
- `conformance` — TCK, fixtures, negative-path, or compatibility rules
- `governance` — process, review, or policy changes

## Required Sections

Every OEP should include:

1. Summary
2. Motivation
3. Scope
4. Specification changes
5. Conformance impact
6. Backward compatibility
7. Alternatives considered
8. Open questions

## Lifecycle

1. `draft`
2. `review`
3. `accepted`
4. `implemented`
5. `superseded` or `withdrawn`

## Acceptance Rules

An OEP should not be accepted unless:

- its normative target is clear
- it identifies whether the change belongs in core, binding, profile, or domain protocol
- required conformance changes are specified
- it does not force ecosystem-specific details into the core without strong justification

## Compatibility Policy

Default compatibility expectations:

- core semantics should evolve conservatively
- bindings can add optional capabilities without breaking old clients
- profiles may evolve faster, but must document mapping changes explicitly
- conformance suites must track every accepted normative change

## Implementation Rule

Spec changes are not complete when the prose merges.

They are complete when:

- schemas are updated if applicable
- examples are updated if applicable
- conformance fixtures are updated if applicable
- reference implementations are updated where the project claims support

## Initial Review Model

Until the governance body expands, review can be maintained by:

- the primary maintainer
- designated collaborators
- invited external profile or ecosystem reviewers

The long-term goal is a broader technical steering structure, but the process should still be public and disciplined from the start.

## Working Group Integration

Working groups may produce draft language, compatibility notes, and review findings, but they should route material normative changes through an OEP.

Relevant group review should be attached when the change touches:

- core semantics
- bindings
- profiles
- conformance
- governance

## External Review Packaging

If an OEP is intended for outside review or cosigner outreach, package it using `governance/EXTERNAL_REVIEW_PACKET.md` so the ask is specific and bounded.
