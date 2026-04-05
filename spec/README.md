# OAPS Spec Tree

This directory holds the suite-level specification material.

For a compact directory index, see [`INDEX.md`](./INDEX.md).

Status labels:

- draft: the current core, binding, profile, and domain drafts
- support-only: the older consolidated `SPEC.md` reference slice
- concept: future family expansions that are not yet added to the tree

Current structure:

- `INDEX.md` - entry point for the spec tree
- `core/` — hard semantic core drafts
- `bindings/` — binding drafts
- `profiles/` — suite-owned profile drafts that currently live inside the spec tree
- `domain/` — domain-family drafts such as commerce

Current entry points:

- `../CHARTER.md` — mission, boundaries, and governance posture
- `../docs/SUITE-ARCHITECTURE.md` — suite architecture
- `INDEX.md` — spec tree entry point and navigation
- `core/FOUNDATION-DRAFT.md` — first hard semantic core draft
- `core/STATE-MACHINE-DRAFT.md` — canonical task and lifecycle semantics draft
- `bindings/http-binding-draft.md` — first binding-track draft
- `bindings/jsonrpc-binding-draft.md` — first JSON-RPC binding-track draft
- `bindings/grpc-binding-draft.md` — first gRPC binding-track draft
- `bindings/events-binding-draft.md` — first events/webhooks binding-track draft
- `profiles/agent-client-draft.md` — first agent-client / CLI / SSH profile-track draft
- `domain/commerce-draft.md` — first commerce domain-family draft
- `../profiles/mpp-draft.md` — draft MPP payment-session profile
- `../profiles/ap2-draft.md` — draft AP2 payment authorization profile
- `../profiles/acp-draft.md` — draft ACP commerce alignment profile
- `../profiles/ucp-draft.md` — draft UCP commerce alignment profile

The older consolidated `../SPEC.md` still exists because it backs the current MCP-oriented reference slice, but it should no longer be treated as the entire future shape of OAPS.
