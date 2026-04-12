# AICP Ecosystem Map

## Purpose

This document explains how AICP relates to internal aligned projects and adjacent external protocols.

The goal is to prevent two common mistakes:

- treating AICP as a wrapper around a single existing protocol
- treating AICP as if it must replace every adjacent standard

For a compact reader-facing summary, see [PROTOCOL-POSITIONING.md](./PROTOCOL-POSITIONING.md).

## Internal Aligned Projects

### Sardis

Sardis is the strongest current proving ground for:

- payment governance
- mandate enforcement
- approval orchestration
- evidence and auditability for economic actions
- multi-rail coordination

AICP should treat Sardis as:

- an aligned payment governance system
- a proving ground for payment-related profiles
- a source of real-world requirements

It should not treat Sardis as the standard by fiat.

### FIDES

FIDES is the most natural high-assurance trust and identity profile family in the current ecosystem.

It contributes:

- cryptographic identity
- request signing
- attestations
- trust and reputation semantics

AICP should treat FIDES as:

- an aligned trust profile family
- one strong answer to higher-assurance identity

It should not force all AICP users into FIDES-only identity.

### agit

agit is most relevant to AICP as a lineage and replay companion.

It contributes:

- durable state history
- rollback and replay
- execution provenance
- diffable and auditable state evolution

AICP should treat agit as:

- a companion system for replayable lineage and execution history

The standard should define semantics that agit can realize well, without making agit mandatory.

### OSP

OSP is the most natural aligned provisioning domain protocol.

It contributes:

- resource discovery
- provisioning and deprovisioning
- credential delivery
- billing and lifecycle semantics

AICP should treat OSP as:

- a closely aligned domain protocol
- a likely proving ground for AICP Provisioning semantics

## External Protocol Families

### MCP

MCP solves tool and context access well.

AICP should build above it by adding:

- portable capability semantics
- approval and delegation semantics
- evidence and replay semantics
- cross-protocol coordination

### A2A

A2A is closest to AICP on task and workflow concerns.

AICP should align strongly here by offering:

- dual intent and task semantics
- approval, delegation, and evidence overlays
- interoperability with non-A2A systems

### x402 and MPP

These are payment-side protocols and rails.

AICP should not replace them.

It should define:

- payment coordination semantics
- authorization and challenge semantics
- references that profiles can map into these rails

### AP2, ACP, and UCP

These are commerce and payment-adjacent ecosystems with their own native concerns.

AICP should engage them as:

- profile targets
- domain alignment inputs
- proof that shared semantics are needed above the individual ecosystems

## Strategic Rule

If an adjacent protocol already solves a narrow problem well, AICP should:

- reuse it
- align to it
- map to it

AICP should only define new semantics when:

- the gap is genuinely cross-ecosystem
- the semantics are missing or inconsistent elsewhere
- the result improves interop rather than captures an ecosystem
