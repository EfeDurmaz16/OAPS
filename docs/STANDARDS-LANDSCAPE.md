# AICP Standards Landscape

## Purpose

This document maps AICP to adjacent standards so the suite can stay broad without becoming a wrapper or a replacement claim.

## Strategic Rule

AICP should define the semantics that are missing across ecosystems, then map to existing protocols where they already solve the narrow problem well.

## Adjacent Standards

| Standard | What It Solves | AICP Relationship | Program Implication |
| --- | --- | --- | --- |
| MCP | Tool and context access | AICP maps capabilities, approvals, evidence, and delegated execution above MCP | Keep `oaps-mcp-v1` as a hard profile track |
| A2A | Task/message exchange | AICP maps tasks, lifecycle, delegation, and replayable evidence above A2A | Keep `oaps-a2a-v1` as a hard profile track |
| x402 | HTTP payment challenge flow | AICP maps payment coordination and authorization semantics into x402-style flows | Draft payment profile after trust/task tracks stabilize |
| MPP | Machine payment session semantics | AICP maps payment coordination objects to machine payment sessions | Use as a payment profile input, not a core dependency |
| AP2 | Agent payment / authorization semantics | AICP maps mandates and authorization references into AP2-like flows | Treat as a payment-side profile target |
| ACP / UCP | Commerce workflow ecosystems | AICP maps order, authorization, and fulfillment semantics above these ecosystems | Treat as domain-alignment inputs |
| Visa TAP | Trusted agent payment coordination | AICP uses this as a high-assurance trust/payment review target | Use for trust and payment profile review, not fiat standardization |
| FIDES | Trust and attestation | AICP uses this as the high-assurance trust profile family | Keep `oaps-auth-web-v1` baseline; add FIDES/TAP upgrades later |
| Sardis | Payment governance and mandate enforcement | AICP uses Sardis as a proving ground for payment and approval semantics | Keep Sardis aligned but outside mandatory core |
| agit | Lineage, replay, rollback | AICP can reference agit as the companion system for evidence lineage | Keep replay semantics in the suite, not the implementation |
| OSP | Provisioning and lifecycle | AICP aligns with OSP for provisioning domain semantics | Use as a domain-protocol proving ground |

## What This Means For The Program

- build the semantic core once
- map it into MCP and A2A first
- keep payments and provisioning as second-wave tracks
- use the aligned systems as proving grounds, not as mandatory dependencies

## Non-Goals

- do not make AICP a wrapper around one standard
- do not make AICP a replacement for ecosystem protocols that already work
- do not force payment, commerce, or provisioning semantics into the first hard core before the task/tool/trust layer is stable
