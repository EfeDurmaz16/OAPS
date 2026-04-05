# OAPS Conformance

## Purpose

This directory is the suite-level home for OAPS conformance definitions, fixture indexes, and TCK coordination.

The goal is to make it possible for an implementation to answer a concrete question:

> Does this implementation conform to the OAPS core, binding, and profile behavior it claims?

## Current Layout

- `manifest/oaps-tck.manifest.v1.json` - machine-readable entry point for the suite-level TCK
- `taxonomy/scenario-taxonomy.v1.json` - normalized scenario vocabulary and coverage dimensions
- `fixtures/index.v1.json` - top-level map of fixture packs
- `fixtures/core/index.v1.json` - core semantics fixture pack
- `fixtures/bindings/http/index.v1.json` - HTTP binding fixture pack
- `fixtures/bindings/jsonrpc/index.v1.json` - JSON-RPC binding fixture pack
- `fixtures/bindings/grpc/index.v1.json` - gRPC binding fixture pack
- `fixtures/profiles/mcp/index.v1.json` - MCP profile fixture pack
- `fixtures/profiles/a2a/index.v1.json` - A2A profile fixture pack
- `fixtures/profiles/auth-web/index.v1.json` - web auth baseline fixture pack
- `fixtures/profiles/auth-fides-tap/index.v1.json` - high-assurance trust fixture pack
- `fixtures/profiles/x402/index.v1.json` - x402 payment coordination fixture pack
- `fixtures/profiles/osp/index.v1.json` - provisioning fixture pack
- `runner-contract.md` - minimum behavior required from any TCK runner
- `results/result-schema.v1.json` - machine-readable result format for compatibility claims
- `results/compatibility-declaration-schema.v1.json` - machine-readable scope-level compatibility summary format
- `results/examples/` - example result files and derived compatibility declarations

These files now exist in-repo and are validated by the reference workspace.

## Conformance Layers

The first-pass suite-level TCK structure covers:

- core semantics
- HTTP binding
- JSON-RPC binding
- gRPC binding
- MCP profile mapping
- A2A profile mapping
- auth-web baseline profile mapping
- auth-fides-tap high-assurance trust mapping
- x402 payment coordination mapping
- osp provisioning mapping

The suite can expand into payment, provisioning, commerce, and jobs profiles once those drafts are ready for fixture-backed coverage.

## What Conformance Checks

At minimum, conformance should verify:

- schema validity
- version negotiation
- identity and delegation semantics
- approval and task lifecycle semantics
- idempotency behavior
- evidence hash chaining
- error translation
- binding-to-core equivalence

## Initial Conformance Scope

The current fixture packs are centered on the reference slice already present in the repository:

- foundation actor, capability, intent, task, delegation, mandate, approval, execution, evidence, error, and extension schemas
- lifecycle companion objects for challenge, interaction-transition, and task-transition semantics
- runtime-backed core checks for delegation expiry, evidence tamper detection, replay-chain mismatch detection, and stable evidence hashing
- runtime-backed core lifecycle checks for intent-to-task promotion and reject-versus-revoke distinction
- runtime-backed HTTP discovery, interaction/message lifecycle, fail-closed message subject binding, idempotent retry behavior across create/message/approve/reject/revoke mutations, approval/rejection/revocation, and evidence/event retrieval behavior, including incremental replay windows
- fixture-backed JSON-RPC discovery, interaction/mutation, replay, correlation, idempotency, notification-boundary, and error-mapping stubs for the draft binding track
- fixture-backed gRPC discovery, unary mutation, replay, server-streaming, metadata/header, and error-mapping stubs for the draft binding track
- runtime-backed MCP capability mapping, policy gating, approval insertion, evidence emission, and error translation
- shared auth-web runtime anchors for discovery, interaction/message subject binding, and delegation fail-closed behavior
- A2A task mapping, lifecycle preservation, and evidence lineage

## Conformance Rules

- Every normative spec change must have a corresponding fixture or scenario update.
- Every new binding must ship with fixture coverage before it claims support.
- Every profile must define how it translates or preserves OAPS core semantics.
- Every error code that becomes normative must have a stable conformance expectation.

## Status

This is the first concrete TCK structure, not the final conformance system.

The repository already has a reference implementation and a foundation example pack. This directory now provides the suite-level registry that future runners and CI can consume directly.
