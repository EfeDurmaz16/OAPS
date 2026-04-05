# OAPS Coverage Map

## Purpose

This map shows which major surfaces in the repository have a clear home today.

It is meant to make the current coverage visible across docs, schemas, examples, reference code, and conformance artifacts.

## Legend

- **Stable** means the repo already exercises the surface operationally or through validated reference code.
- **Draft** means the surface is active and reviewable, but still expected to evolve.
- **Concept** means the surface is directional and should not be treated as settled.

## Coverage Matrix

| Surface area | Docs | Schemas / examples | Reference code | Conformance | Current label |
| --- | --- | --- | --- | --- | --- |
| Core semantics | `spec/`, `SPEC.md`, `docs/SUITE-ARCHITECTURE.md` | `schemas/foundation/`, `examples/foundation/` | TypeScript core package | core fixture pack | Draft / implementation-backed |
| HTTP binding | `spec/bindings/http-binding-draft.md` | binding-related examples | TypeScript HTTP package | HTTP fixture pack | Draft / runtime-backed |
| JSON-RPC binding | `spec/bindings/jsonrpc-binding-draft.md` | binding examples | none yet | JSON-RPC fixture pack | Draft |
| gRPC binding | `spec/bindings/grpc-binding-draft.md` | binding examples | none yet | gRPC fixture pack | Draft |
| Events / webhooks binding | `spec/bindings/events-binding-draft.md` | binding examples | none yet | events fixture pack | Draft |
| MCP profile | `profiles/mcp.md` | MCP examples and support declarations | MCP adapter package | MCP fixture pack | Draft / runtime-backed |
| A2A profile | `profiles/a2a-draft.md` | A2A examples and support declarations | none yet | A2A fixture pack | Draft |
| Auth / trust profiles | `profiles/auth-web.md`, `profiles/auth-fides-tap-draft.md` | auth/trust examples and support declarations | core auth checks | auth fixture packs | Draft / partial runtime-backed |
| Payment profiles | `profiles/x402-draft.md`, `profiles/mpp-draft.md`, `profiles/ap2-draft.md` | payment examples and support declarations | none yet | payment fixture packs | Draft |
| Commerce alignment | `docs/COMMERCE-LANDSCAPE.md`, `spec/domain/commerce-draft.md` | commerce examples | none yet | commerce fixture pack | Draft |
| Provisioning | `profiles/osp-draft.md` | provisioning examples | none yet | OSP fixture pack | Draft |
| Python interoperability | `reference/oaps-python/README.md` | result examples and compatibility declarations | Python CLI and manifest tools | result validation and comparison tests | Stable |
| Harness and supervisor | `docs/RUNBOOK.md` | run metadata files under `.codex/` | shell harness scripts | not applicable | Stable |

## Practical Use

Use this map to answer three questions:

1. Is the surface actually represented somewhere in the repo?
2. Is the surface backed by examples, code, or conformance artifacts?
3. Is the label stable, draft, or only conceptual?

## Boundary Rule

This map is not a substitute for the spec, profile, or manifest files.
It is a navigation aid for humans trying to understand what is covered where.
