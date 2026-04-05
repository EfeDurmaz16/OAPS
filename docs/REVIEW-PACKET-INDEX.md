# OAPS Review Packet Index

## Purpose

This index names the review packet shapes OAPS should use so outreach stays bounded and repeatable.

The packet is the unit of external review. The target matrix decides who gets which packet.

For the shortest public-facing entry point before any packet-specific deep dive, start with [`HOW-TO-REVIEW-OAPS.md`](./HOW-TO-REVIEW-OAPS.md).

## Packet Types

### MCP Packet

Use for MCP maintainers and tool-runtime reviewers.

Includes:

- `oaps-mcp-v1` profile draft
- capability mapping summary
- policy and approval mapping
- evidence mapping
- conformance status for current fixture packs

Requested decision:

- whether the mapping preserves MCP utility while adding OAPS governance semantics

### A2A Packet

Use for A2A maintainers and task/workflow reviewers.

Includes:

- `oaps-a2a-v1` profile draft
- task and message mapping
- lifecycle preservation notes
- delegation and approval mapping
- evidence lineage notes

Requested decision:

- whether OAPS task semantics align cleanly with A2A workflow semantics

### Trust Packet

Use for identity, signing, and attestation reviewers.

Includes:

- `oaps-auth-web-v1` baseline profile
- `oaps-fides-tap-v1` draft
- subject binding rules
- delegation proof boundaries
- trust-upgrade semantics

Requested decision:

- whether the baseline trust model is defensible and upgradeable without fragmenting the core

### Payment Packet

Use for x402, MPP, AP2, Sardis, and payment infrastructure reviewers.

Includes:

- `oaps-x402-v1` draft
- payment coordination primitives
- mandate and authorization references
- settlement and receipt references
- rail-specific vs rail-agnostic boundary

Requested decision:

- whether the payment semantics are narrow enough to interop and broad enough to stay rail-agnostic

### Provisioning Packet

Use for OSP and provisioning reviewers.

Includes:

- `oaps-osp-v1` draft
- service lifecycle mapping
- credential delivery and rotation concerns
- approval and policy boundaries
- evidence capture expectations

Requested decision:

- whether provisioning should remain a domain-family profile rather than being pushed into core

### Commerce Packet

Use for ACP/UCP-adjacent reviewers and commerce design partners.

Includes:

- OAPS Commerce concept note
- order/authorization/fulfillment boundary note
- merchant and checkout mapping notes

Requested decision:

- whether OAPS commerce semantics stay abstract enough to map across ecosystems without recreating a checkout spec

## Packet Index Rule

The packet index is not a list of all possible reviewers.

It is the approved packet shape for each review class so new outreach can be scheduled without rewriting the ask.

## Follow-Up Rule

Every packet must be closed with one of:

- accepted with no changes
- accepted with follow-up OEP
- revised and re-reviewed
- deferred with explicit reason
