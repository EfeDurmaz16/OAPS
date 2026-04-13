# AOSL Monorepo Scaffold

## Status

Draft reference implementation scaffold for the AOSL execution language and
runtime family.

This directory is intentionally separate from the current `reference/oaps-monorepo/`
line. The existing line remains the active AICP/OAPS TypeScript reference slice.
This scaffold is the execution-profile incubation line for AOSL.

## Purpose

This monorepo is a staging area for:

- a TypeScript SDK for AOSL authoring
- a syntax-independent IR
- a policy-enforced runtime skeleton
- static linting and planning
- later DSL parsing and profile integrations

## Package Layout

- `packages/core` — shared AICP-aligned types, effect descriptors, and errors
- `packages/ir` — intermediate representation and validators
- `packages/sdk-ts` — TypeScript authoring surface
- `packages/runtime` — policy checks, planning helpers, evidence helpers
- `packages/linter` — static diagnostics over IR
- `packages/cli` — initial CLI shell for `aosl`
- `examples/repo-test` — starter example task

## Initial Commands

```bash
pnpm install
pnpm build
pnpm typecheck
```

## Immediate Roadmap

1. wire real adapter interfaces into `runtime`
2. add `aosl plan` task loading from source files
3. add IR builders in `sdk-ts`
4. add simulation output and richer lint rules
5. add approval, delegation, and evidence orchestration

## Relationship To The Main Repo

- AICP core semantics remain under `spec/core/`
- the AOSL execution-profile draft lives under `spec/profiles/aosl-runtime-draft.md`
- the AICP ↔ AOSL boundary doc lives under `docs/AICP-AOSL-BOUNDARY.md`
- this directory is the corresponding implementation scaffold
