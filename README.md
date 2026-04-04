# OAPS

**Open Agentic Primitive Standard**

OAPS is an open standard for agentic primitives across protocol boundaries.

It is designed to compose with existing systems such as MCP, A2A, ACP, agentic commerce flows, AP2, x402, and MPP rather than replace them. OAPS focuses on the horizontal primitive layer that these systems do not standardize consistently today: **delegation, policy, evidence, approval, and accountable execution**.

## Core thesis

As autonomous agents begin to call tools, speak to merchants, move money, delegate work, and operate across multiple systems, the missing question is no longer only *can the agent act?* but:

- who authorized the action?
- what limits applied?
- were those limits actually checked before the side effect happened?
- what tamper-evident proof exists afterward?

OAPS standardizes those primitives.

## What OAPS does differently

OAPS is not another isolated protocol silo. It provides:

- a common **interaction envelope**
- scoped **delegation**
- deterministic **policy evaluation**
- first-class **approval** primitives
- hash-linked **evidence**
- a canonical **HTTP binding**
- adapter profiles for existing ecosystems, starting with **MCP**

This means an implementation can add governance and accountability **without rewriting the underlying protocol**.

## Design principles

1. **Standardize primitives, not products**
2. **Compose with existing protocols**
3. **Fail closed on ambiguous authority**
4. **Treat human approval as first-class**
5. **Make evidence structural, not optional**
6. **Prefer implementation paths with low adoption friction**

## Status

This repository contains the consolidated **v0.4-draft** spec pack. It includes:

- the core specification
- JSON Schemas
- examples
- the `oaps-mcp-v1` profile
- governance and roadmap docs
- a working TypeScript reference implementation for the MCP wedge

## Current MVP

The current implementation focus is one concrete path, not the whole long-term protocol vision:

1. discover MCP tools and map them to `CapabilityCard`
2. receive an OAPS `intent.request`
3. evaluate policy before execution
4. require approval for high-risk actions
5. invoke the MCP tool only if allowed
6. emit hash-linked evidence for the lifecycle
7. expose the flow through the reference HTTP binding

This is the smallest real working system in the repo today.

## What Is Working Now

- schema-backed spec pack validation over `schemas/` and `examples/`
- core protocol types, IDs, version negotiation, auth binding checks, and hashing utilities
- evidence chain creation and verification
- `oaps-policy-v1` evaluation with fail-closed behavior
- MCP capability discovery and invocation through `@oaps/mcp-adapter`
- approval gating for high-risk actions
- reference HTTP server with interaction, approval, revoke, evidence, and events endpoints
- durable file-backed state for interaction and idempotency records in the reference server

## What Is Not Built Yet

- A2A profile support
- economic authorization profile support
- registry/governance workflows
- production gateway hardening
- Rust gateway
- multi-profile adapters

## Repository layout

- `SPEC.md` — consolidated core specification
- `VISION.md` — motivation, framing, long-term scope
- `ROADMAP.md` — phased implementation and ecosystem plan
- `TECH_STACK.yaml` — reference implementation stack
- `schemas/` — JSON Schemas
- `examples/` — example payloads
- `profiles/` — adapter profiles
- `governance/` — contribution and governance docs
- `reference/` — implementation scaffold

## Reference Implementation

The implementation lives under `reference/oaps-monorepo`.

The most relevant packages are:

- `@oaps/core` — shared contracts, IDs, version negotiation, hashing, auth checks
- `@oaps/evidence` — evidence chain builder and verifier
- `@oaps/policy` — deterministic policy evaluator
- `@oaps/mcp-adapter` — MCP discovery, mapping, policy enforcement, approval gating
- `@oaps/http` — reference HTTP server and persistent interaction store

The reference workspace also includes:

- `scripts/validate-spec-pack.mjs` — validates examples against the JSON Schemas
- `scripts/generate-core-schema-constants.mjs` — derives core constants from the schema pack and fails tests if stale

## Relationship to Sardis

Sardis is an implementation of the OAPS vision in the commerce and payments domain. In OAPS terms, Sardis is an opinionated implementation of the **delegation, policy, approval, execution, evidence, and economic authorization** layers.

## Current implementation priorities

1. `@oaps/core`
2. `@oaps/evidence`
3. `@oaps/policy`
4. `@oaps/mcp-adapter`
5. `@oaps/http`

## Immediate Next Work

- document and tighten the reference HTTP binding behavior
- add deeper conformance-style tests beyond the current vertical slice
- keep schema-to-code generation expanding so drift is harder to reintroduce

## Reference Server Note

The reference HTTP server currently uses small local `hono`-compatible workspace packages rather than the upstream framework packages directly. That is a deliberate simplification for the spec-focused reference stack, not a long-term framework commitment.

## Short positioning

**OAPS is the governance and accountability standard for autonomous agent actions across protocol boundaries.**
