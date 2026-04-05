# OAPS Spec Index

This is the entry point for the suite-level specification tree.

## Current Structure

- `core/FOUNDATION-DRAFT.md` - first hard semantic core draft
- `core/STATE-MACHINE-DRAFT.md` - canonical task and lifecycle semantics draft
- `bindings/http-binding-draft.md` - first binding-track draft
- `bindings/jsonrpc-binding-draft.md` - first JSON-RPC binding-track draft

## Current Reading Order

1. `../CHARTER.md`
2. `../docs/SUITE-ARCHITECTURE.md`
3. `README.md`
4. `core/FOUNDATION-DRAFT.md`
5. `core/STATE-MACHINE-DRAFT.md`
6. `bindings/http-binding-draft.md`
7. `bindings/jsonrpc-binding-draft.md`

## Status Notes

- `core/` is the main hard-normative area currently being expanded
- `bindings/` currently starts with HTTP and can grow into other transports later
- `schemas/` and `conformance/` are the machine-readable companions to this spec tree
- the lifecycle companion draft is backed by `challenge` and `task-transition`
  foundation schemas

The legacy consolidated `../SPEC.md` still exists for the current reference slice, but it is no longer the best starting point for the suite program.
