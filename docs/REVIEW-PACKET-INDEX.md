# AICP Review Packet Index

## Purpose

This index names the review packet shapes AICP should use so outreach stays bounded and repeatable.

The packet is the unit of external review. The target matrix decides who gets which packet.

For the shortest public-facing entry point before any packet-specific deep dive, start with [`HOW-TO-REVIEW-OAPS.md`](./HOW-TO-REVIEW-OAPS.md).

For packet drafting help, see:

- [`docs/REVIEW-PACKET-TEMPLATE.md`](./REVIEW-PACKET-TEMPLATE.md)
- [`docs/REVIEW-READINESS-CHECKLISTS.md`](./REVIEW-READINESS-CHECKLISTS.md)
- [`docs/REVIEW-ISSUE-TAXONOMY.md`](./REVIEW-ISSUE-TAXONOMY.md)
- [`docs/COSIGNERS.md`](./COSIGNERS.md)
- [`docs/DESIGN-PARTNERS.md`](./DESIGN-PARTNERS.md)

## Packet Types

### MCP Packet

Use for MCP maintainers and tool-runtime reviewers.

Includes:

- [`docs/REVIEW-PACKET-MCP.md`](./REVIEW-PACKET-MCP.md)
- `oaps-mcp-v1` profile draft
- capability mapping summary
- policy and approval mapping
- evidence mapping
- conformance status for current fixture packs

Requested decision:

- whether the mapping preserves MCP utility while adding AICP governance semantics

### A2A Packet

Use for A2A maintainers and task/workflow reviewers.

Includes:

- [`docs/REVIEW-PACKET-A2A.md`](./REVIEW-PACKET-A2A.md)
- `oaps-a2a-v1` profile draft
- task and message mapping
- lifecycle preservation notes
- delegation and approval mapping
- evidence lineage notes

Requested decision:

- whether AICP task semantics align cleanly with A2A workflow semantics

### Trust Packet

Use for identity, signing, and attestation reviewers.

Includes:

- [`docs/REVIEW-PACKET-TRUST.md`](./REVIEW-PACKET-TRUST.md)
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

- [`docs/REVIEW-PACKET-PAYMENT.md`](./REVIEW-PACKET-PAYMENT.md)
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

- [`docs/REVIEW-PACKET-PROVISIONING.md`](./REVIEW-PACKET-PROVISIONING.md)
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

- [`docs/REVIEW-PACKET-COMMERCE.md`](./REVIEW-PACKET-COMMERCE.md)
- AICP Commerce concept note
- order/authorization/fulfillment boundary note
- merchant and checkout mapping notes

Requested decision:

- whether AICP commerce semantics stay abstract enough to map across ecosystems without recreating a checkout spec

## Packet Index Rule

The packet index is not a list of all possible reviewers.

It is the approved packet shape for each review class so new outreach can be scheduled without rewriting the ask.

## Follow-Up Rule

Every packet must be closed with one of:

- accepted with no changes
- accepted with follow-up OEP
- revised and re-reviewed
- deferred with explicit reason
