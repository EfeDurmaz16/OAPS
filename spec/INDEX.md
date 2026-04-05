# OAPS Spec Index

This is the entry point for the suite-level specification tree.

## Current Structure

- `core/FOUNDATION-DRAFT.md` - first hard semantic core draft
- `core/STATE-MACHINE-DRAFT.md` - canonical task and lifecycle semantics draft
- `bindings/http-binding-draft.md` - first binding-track draft
- `bindings/jsonrpc-binding-draft.md` - first JSON-RPC binding-track draft
- `bindings/grpc-binding-draft.md` - first gRPC binding-track draft
- `bindings/events-binding-draft.md` - first events/webhooks binding-track draft
- `profiles/agent-client-draft.md` - first agent-client / CLI / SSH profile-track draft
- `domain/commerce-draft.md` - first commerce domain-family draft
- `../profiles/mpp-draft.md` - draft MPP payment-session profile
- `../profiles/ap2-draft.md` - draft AP2 payment authorization profile
- `../profiles/acp-draft.md` - draft ACP commerce alignment profile
- `../profiles/ucp-draft.md` - draft UCP commerce alignment profile

## Current Reading Order

1. `../CHARTER.md`
2. `../docs/SUITE-ARCHITECTURE.md`
3. `README.md`
4. `core/FOUNDATION-DRAFT.md`
5. `core/STATE-MACHINE-DRAFT.md`
6. `bindings/http-binding-draft.md`
7. `bindings/jsonrpc-binding-draft.md`
8. `bindings/grpc-binding-draft.md`
9. `bindings/events-binding-draft.md`
10. `profiles/agent-client-draft.md`
11. `domain/commerce-draft.md`
12. `../profiles/mpp-draft.md`
13. `../profiles/ap2-draft.md`
14. `../profiles/acp-draft.md`
15. `../profiles/ucp-draft.md`

## Status Notes

- `core/` is the main hard-normative area currently being expanded
- `bindings/` currently starts with HTTP, JSON-RPC, gRPC, and events/webhooks and can grow into other transports later
- `schemas/` and `conformance/` are the machine-readable companions to this spec tree
- `domain/` now starts the broader domain-family track with commerce alignment
- the lifecycle companion draft is backed by `challenge` and `task-transition`
  foundation schemas

The legacy consolidated `../SPEC.md` still exists for the current reference slice, but it is no longer the best starting point for the suite program.
