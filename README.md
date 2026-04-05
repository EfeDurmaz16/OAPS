# OAPS

**Open Agentic Primitive Standard**

OAPS is an open protocol suite for agentic primitives and control-plane semantics across protocol boundaries.

It is designed to compose with systems such as MCP, A2A, ACP, UCP, AP2, x402, MPP, OSP, and higher-assurance trust systems rather than replace them. OAPS focuses on the horizontal primitive layer that these ecosystems do not standardize consistently today: **identity references, delegation, mandates, intents, tasks, approvals, execution outcomes, evidence, and payment coordination**.

## Core thesis

As autonomous agents begin to call tools, speak to merchants, move money, delegate work, and operate across multiple systems, the missing question is no longer only *can the agent act?* but:

- who authorized the action?
- what limits applied?
- were those limits actually checked before the side effect happened?
- what tamper-evident proof exists afterward?

OAPS standardizes those primitives as a **semantic super-protocol**, not as a transport replacement or framework product.

## What OAPS does differently

OAPS is not another isolated protocol silo. It provides:

- a shared **semantic core**
- multiple **bindings**
- interop **profiles** for existing ecosystems
- long-term **domain protocol families**
- replayable, hash-linked **evidence**

This means an implementation can add governance and accountability **without rewriting the underlying ecosystem protocol**.

## Design principles

1. **Standardize primitives, not products**
2. **Compose with existing protocols**
3. **Fail closed on ambiguous authority**
4. **Treat human approval as first-class**
5. **Make evidence structural, not optional**
6. **Prefer implementation paths with low adoption friction**

## Status

This repository now contains two overlapping things:

- the original consolidated **v0.4-draft** spec pack and MCP-backed reference slice
- the new suite-level charter, architecture, and foundation draft documents

It includes:

- a suite charter
- a suite architecture document
- a maturity matrix explaining what is stable, draft, and still conceptual
- a foundation draft for the hard semantic core
- JSON Schemas
- examples
- a machine-readable conformance manifest and fixture index
- the `oaps-mcp-v1` profile
- governance and roadmap docs
- a working TypeScript reference implementation for the MCP wedge

## Maturity Matrix

Use the following shorthand when reading the repo:

- **Stable** means the repository currently depends on the surface operationally or validates it regularly in the reference slice. It does **not** mean the protocol is governance-frozen.
- **Draft** means the surface is intended to be implementable and reviewable now, but it is still expected to evolve.
- **Concept** means the surface is directional only and should not yet be treated as implemented or frozen.

| Surface | Status | What that means right now |
| --- | --- | --- |
| Repository execution contract (`AGENTS.md`, `PLANS.md`, `docs/STATUS.md`, Codex harness scripts) | Stable | This is the repo's active operating contract for long-horizon execution and durable progress tracking. |
| Current implementation-backed MCP/HTTP reference slice (`reference/oaps-monorepo`, exercised conformance fixtures, Python manifest consumer) | Stable | The behavior exists, is validated in-repo, and is the most credible implementation baseline today. |
| Suite/spec documents (`SPEC.md`, `spec/`, `profiles/`, `schemas/`, `examples/`, `conformance/`) | Draft | These are the active standardization surfaces: real enough to implement and review, but still expected to change with evidence. |
| JSON-RPC binding draft, larger domain families beyond the current drafts, and future external governance/cosigner structures | Draft / Concept | JSON-RPC now has a first draft spec and fixture stubs; the broader remaining non-HTTP binding/domain/governance work is still directional rather than implementation-backed. |

## Current Reference Slice

The current code implementation focus is one concrete path, not the whole long-term protocol suite:

1. discover MCP tools and map them to `CapabilityCard`
2. receive an OAPS `intent.request`
3. evaluate policy before execution
4. require approval for high-risk actions
5. invoke the MCP tool only if allowed
6. emit hash-linked evidence for the lifecycle
7. expose the flow through the reference HTTP binding

This is the smallest real working system in the repo today, and it should be understood as a reference profile slice rather than the entire standard.

## New Document Set

- `CHARTER.md` — mission, boundaries, neutrality, and governance posture
- `docs/MATURITY-MATRIX.md` — what is stable now vs draft vs concept
- `docs/HOW-TO-REVIEW-OAPS.md` — shortest public-facing review packet
- `docs/SUITE-ARCHITECTURE.md` — protocol suite layering and long-term structure
- `docs/STANDARDS-LANDSCAPE.md` — adjacent protocol and standards-body landscape
- `docs/ECOSYSTEM-MAP.md` — how OAPS relates to internal and external protocol ecosystems
- `docs/REVIEW-CALENDAR.md` — external review and outreach sequencing
- `docs/PARALLEL-AGENT-WORKSTREAMS.md` — founder-led, agent-amplified execution model
- `spec/core/FOUNDATION-DRAFT.md` — narrow hard-normative semantic core draft
- `spec/INDEX.md` — spec tree entry point
- `schemas/INDEX.md` — schema tree entry point
- `schemas/foundation/` — machine-readable contracts for the foundation draft
- `examples/foundation/` — examples for the foundation draft schemas
- `governance/OEP_PROCESS.md` — spec change process
- `governance/RF_PATENT_PLEDGE.md` — draft royalty-free standardization posture

## What Is Working Now

- schema-backed spec pack validation over `schemas/` and `examples/`
- core protocol types, IDs, version negotiation, auth binding checks, and hashing utilities
- evidence chain creation and verification
- `oaps-policy-v1` evaluation with fail-closed behavior
- MCP capability discovery and invocation through `@oaps/mcp-adapter`
- approval gating for high-risk actions
- reference HTTP server with interaction, approval, revoke, evidence, and events endpoints, including incremental `after`/`limit` replay windows
- durable file-backed state for interaction and idempotency records in the reference server

## What Is Not Built Yet

- suite-level HTTP/JSON-RPC/gRPC/events binding family
- hard-normative A2A and payment profiles
- domain protocol families for provisioning, jobs, and commerce
- registry infrastructure and broader cross-implementation conformance at suite scale
- broader external governance and cosigner structure

## Repository layout

- `CHARTER.md` — suite charter
- `SPEC.md` — consolidated legacy draft spec pack, still useful for the current reference slice
- `docs/SUITE-ARCHITECTURE.md` — suite architecture
- `spec/core/FOUNDATION-DRAFT.md` — hard-core semantic draft
- `VISION.md` — motivation, framing, long-term scope
- `ROADMAP.md` — phased implementation and ecosystem plan
- `TECH_STACK.yaml` — reference implementation stack
- `schemas/` — JSON Schemas
- `schemas/INDEX.md` — schema tree index
- `examples/` — example payloads
- `profiles/` — adapter profiles
- `governance/` — contribution and governance docs
- `conformance/` — suite-level TCK manifest, taxonomy, and fixture indexes
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
- `scripts/validate-conformance-pack.mjs` — validates the suite-level TCK manifest and fixture indexes
- `scripts/generate-core-schema-constants.mjs` — derives core constants from the schema pack and fails tests if stale

A second implementation line now exists under `reference/oaps-python` as a minimal Python interoperability starter for the suite conformance manifest.

## Relationship to Sardis

Sardis is an aligned system and proving ground for the OAPS vision in the commerce and payments domain. In OAPS terms, Sardis is an opinionated implementation of **payment governance, mandate enforcement, approval, execution, evidence, and economic coordination**.

OAPS is intended to remain neutral by design even while being incubated alongside Sardis.

## Parallel Agent Teams

The intended operating model is founder-led and agent-amplified.

Parallel agent lanes should be treated as part of the founding team across:

- spec writing
- standards research
- reference implementation
- conformance and fixtures
- outreach and cosigner preparation

## Codex Harness

This repo now includes a project-scoped Codex harness for long-horizon execution:

- `AGENTS.md` — execution contract for autonomous tranche work
- `PLANS.md` — completed first execution-wave queue
- `PLANS-V2.md` — active long-horizon execution program
- `docs/NEXT-STEPS.md` — short-horizon execution priority
- `.codex/config.toml` — recommended project defaults
- `codex/instructions/harness.txt` — no-check-in execution instructions
- `codex/prompts/full-oaps-implementation.txt` — default long-run prompt
- `docs/STATUS.md` — durable progress log
- `docs/RUNBOOK.md` — operator guide
- `scripts/codex-harness.sh` — single non-interactive tranche runner
- `scripts/codex-tranche-loop.sh` — auto-resume loop until `DONE:` or `BLOCKED:`
- `scripts/codex-supervisor.sh` — detached top-level supervisor for host-shell tranche runs

If the local Codex CLI still blocks `.git/index.lock` under the configured sandbox, rerun either harness with `CODEX_HARNESS_BYPASS_SANDBOX=1` in this externally sandboxed repo.

The intended model is:

- use interactive Codex for steering and review
- use `codex exec` via the harness scripts for long implementation runs
- load charter, vision, roadmap, spec, suite architecture, and profile docs at run start
- use `PLANS-V2.md` and `docs/NEXT-STEPS.md` as the active tranche queue
- use `docs/STATUS.md` as the durable memory between resumed runs

## Current implementation priorities

1. `@oaps/core`
2. `@oaps/evidence`
3. `@oaps/policy`
4. `@oaps/mcp-adapter`
5. `@oaps/http`

## Immediate Next Work

- turn the new foundation draft into schema-backed semantic contracts
- split the current reference slice clearly into core, binding, and profile claims
- build the suite-level document and governance surface without pretending the entire suite is already implemented

## Reference Server Note

The reference HTTP server currently uses small local `hono`-compatible workspace packages rather than the upstream framework packages directly. That is a deliberate simplification for the spec-focused reference stack, not a long-term framework commitment.

## Short positioning

**OAPS is the governance and accountability standard for autonomous agent actions across protocol boundaries.**
