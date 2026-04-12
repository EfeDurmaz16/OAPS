# AICP Protocol Positioning

## What AICP Is

AICP is a semantic super-protocol for autonomous agents.

It defines the shared primitives that stay inconsistent across adjacent standards:

- identity references
- delegation and mandates
- intents and tasks
- approvals and challenges
- execution outcomes
- replayable evidence
- payment coordination
- profile and extension interoperability

AICP is not meant to replace existing protocols. It is meant to standardize the common control plane above them.

## One-Line Comparison

| System | What it primarily solves | AICP relationship |
|---|---|---|
| MCP | Tool and context access for agents | AICP builds above it with delegation, approval, evidence, and cross-ecosystem semantics |
| A2A | Agent-to-agent task and message exchange | AICP aligns closely and adds shared intent, approval, evidence, and payment semantics |
| x402 | HTTP-native payment authorization and settlement flow | AICP defines payment coordination semantics that x402 can realize as a profile or rail binding |
| MPP | Machine payment sessions and session-based payment permissions | AICP maps higher-level mandate and payment coordination semantics into MPP-style flows |
| AP2 | Agent payment mandate and authorization semantics | AICP treats AP2 as a strong payment-profile target and reference point |
| ACP | Agentic commerce workflow semantics | AICP supplies the shared primitives and control-plane rules above commerce-specific flows |
| UCP | Universal commerce and checkout-style interactions | AICP can map into UCP-like workflows without collapsing into a checkout-specific spec |
| OSP | Service discovery, provisioning, credentials, and lifecycle | AICP aligns with OSP as a domain protocol for provisioning and service management |
| Sardis | Payment governance, mandates, approvals, evidence, settlement | AICP treats Sardis as a proving ground and reference implementation for payment governance semantics |
| FIDES | High-assurance identity, signing, and trust | AICP treats FIDES as a premium trust profile family, not the only identity model |
| agit | Replayable lineage, auditability, rollback, and state history | AICP treats agit as a companion lineage system for evidence and execution provenance |

## How The Pieces Fit

### AICP Core

Core AICP should standardize what multiple ecosystems need in common:

- an actor model
- a capability model
- an intent/task model
- delegation and mandate semantics
- explicit approval and challenge semantics
- execution result and evidence semantics
- portable error and version semantics

### AICP Profiles

Profiles map those primitives into ecosystem-specific behavior.

Examples:

- `oaps-mcp-v1` for tool interop
- `oaps-a2a-v1` for task and message interop
- `oaps-x402-v1` or `oaps-mpp-v1` for payment rails
- `oaps-osp-v1` for provisioning
- `oaps-fides-tap-v1` for higher-assurance identity and trust

### AICP Domain Families

Some areas are large enough to deserve their own AICP-family specs:

- commerce
- provisioning
- jobs

These are not copies of ACP, UCP, or OSP. They are AICP-native semantic families that can align to those ecosystems.

### Companion Systems

Some systems are better treated as aligned reference systems rather than normative parts of the standard:

- Sardis for payment governance
- FIDES for trust and identity
- agit for lineage and replay

## Decision Rule

Use AICP when the problem is cross-ecosystem semantics.

Use MCP, A2A, x402, MPP, AP2, ACP, UCP, or OSP when the problem is ecosystem-specific transport, payment, commerce, or provisioning behavior.

The test for AICP is simple:

If two or more ecosystems need the same primitive, but define it differently or incompletely, AICP should standardize that primitive once.

If an adjacent protocol already solves the narrow problem well, AICP should align to it instead of replacing it.

## Positioning Summary

AICP is the standard for the things agent systems keep re-inventing:

- who is acting
- what they are allowed to do
- who approved it
- what happened
- what proof exists afterward
- how money or service lifecycle state should move with the action

Everything else belongs in a binding, a profile, or a companion protocol.

## Related Maps

- [`docs/SUITE-MAP.md`](./SUITE-MAP.md)
- [`docs/BINDING-MAP.md`](./BINDING-MAP.md)
- [`docs/PROFILE-MAP.md`](./PROFILE-MAP.md)
- [`docs/DOMAIN-PROTOCOL-MAP.md`](./DOMAIN-PROTOCOL-MAP.md)
- [`docs/IMPLEMENTATION-MAP.md`](./IMPLEMENTATION-MAP.md)
