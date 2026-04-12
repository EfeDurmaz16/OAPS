# AICP Maturity Matrix

## Purpose

This matrix answers a simple reader question:

> What in AICP is stable enough to rely on now, what is still a draft, and what is only a concept?

The labels below are about **current repo maturity**, not eventual standards status.

The matrix was most recently re-audited on 2026-04-11 against actual file contents, runtime coverage, and conformance fixture backing. Several surfaces were downgraded from Draft to Concept where the claim exceeded implementation reality — see `AUDIT-MATURITY-MATRIX.md` at repo root for the full independent audit.

## Label Meanings

| Label | Meaning now |
| --- | --- |
| Stable | Repeatedly exercised in-repo, tied to validation or runtime behavior, and unlikely to change casually without corresponding conformance or implementation work. |
| Draft | Written down and actively implemented or tested in part, but still expected to change as the suite hardens. |
| Concept | Directionally important, but not yet specified or implemented enough to claim as a current interoperable surface. |

## Current Matrix

| Surface | Current label | Why | Current anchors |
| --- | --- | --- | --- |
| Repository execution contract (`AGENTS.md`, `PLANS.md`, `docs/STATUS.md`, harness scripts) | Stable | The execution loop, tranche queue, and status logging are now exercised in-repo and used to drive real work. | `AGENTS.md`, `scripts/codex-harness.sh`, `scripts/codex-tranche-loop.sh`, `docs/RUNBOOK.md` |
| TypeScript reference slice (`@oaps/core`, `@oaps/evidence`, `@oaps/policy`, `@oaps/mcp-adapter`, `@oaps/http`) | Stable | This is the concrete implementation slice the repo validates on every test run. | `reference/oaps-monorepo/`, runtime-backed conformance scenarios |
| Python interoperability starter for manifest/result checking | Stable | It is narrow, but it is implemented, tested, and already produces/validates suite result artifacts. | `reference/oaps-python/`, `conformance/results/` |
| Conformance manifest, taxonomy, fixture indexes, result schema, compatibility declaration schema | Draft | Machine-readable and validated, but still expected to evolve as more bindings and profiles harden. | `conformance/manifest/`, `conformance/taxonomy/`, `conformance/results/` |
| Charter, vision, roadmap, suite architecture, ecosystem/standards positioning docs | Draft | These define the current program shape, but governance and public positioning are still maturing. | `CHARTER.md`, `VISION.md`, `ROADMAP.md`, `docs/SUITE-ARCHITECTURE.md`, `docs/ECOSYSTEM-MAP.md`, `docs/STANDARDS-LANDSCAPE.md` |
| Core foundation draft | Draft | Normative RFC 2119 rewrite (v0.1.0-draft, 2026-04-11) anchors every primitive to testable MUST requirements. Schema and fixture backing is complete for all 16 primitives. | `spec/core/FOUNDATION-DRAFT.md`, `schemas/foundation/`, `examples/foundation/`, `VERSIONING.md`, core fixture pack |
| HTTP binding draft | Draft | The reference server proves a real binding slice, but open binding questions remain. | `spec/bindings/http-binding-draft.md`, `reference/oaps-monorepo/packages/http/`, HTTP fixture pack |
| MCP profile | Draft | This is the most implementation-backed profile, but it is still a draft profile rather than a stable standard. | `profiles/mcp.md`, `reference/oaps-monorepo/packages/mcp-adapter/`, MCP fixture pack |
| A2A, auth-web, auth-fides-tap, x402, and OSP profiles | Draft | These profiles have substantive mapping content and fixture coverage, but they are not yet backed by dedicated end-to-end runtimes. | `profiles/a2a-draft.md`, `profiles/auth-web.md`, `profiles/auth-fides-tap-draft.md`, `profiles/x402-draft.md`, `profiles/osp-draft.md`, profile fixture packs |
| agent-client, ACP, AP2, MPP, UCP profiles | Concept | Downgraded 2026-04-11. These profiles are 2.4-3.2 KB stubs with minimal substance, fixture-only presence, and no runtime backing. They are directional, not implementable as drafts. | `spec/profiles/agent-client-draft.md`, `profiles/acp-draft.md`, `profiles/ap2-draft.md`, `profiles/mpp-draft.md`, `profiles/ucp-draft.md` |
| Compatibility declaration examples and review packet scaffolding | Draft | Useful and machine-readable, but still part of the suite-hardening phase rather than a public finalized review program. | `docs/COMPATIBILITY-DECLARATIONS.md`, `docs/REVIEW-*`, `conformance/results/examples/` |
| JSON-RPC binding family | Concept | Downgraded 2026-04-11. A first draft spec and fixture-only stubs exist, but there is no runtime implementation and no proof the binding works end-to-end. Honestly pre-draft. | `spec/bindings/jsonrpc-binding-draft.md`, `examples/jsonrpc/`, `conformance/fixtures/bindings/jsonrpc/` |
| gRPC binding family | Concept | Downgraded 2026-04-11. A first draft spec, proto package layout, and fixture-only stubs exist, but there is no runtime implementation. Honestly pre-draft. | `spec/bindings/grpc-binding-draft.md`, `reference/proto/oaps/bindings/grpc/v1/`, `examples/grpc/`, `conformance/fixtures/bindings/grpc/` |
| event/webhook binding family | Concept | Downgraded 2026-04-11. A first draft spec and fixture-only stubs exist, but there is no runtime implementation. Honestly pre-draft. | `spec/bindings/events-binding-draft.md`, `examples/events/`, `conformance/fixtures/bindings/events/` |
| Commerce and Jobs domain families | Concept | Intentionally part of the long-term suite shape, but not yet drafted as concrete protocol families. | `CHARTER.md`, `ROADMAP.md`, `docs/SUITE-ARCHITECTURE.md` |
| Neutral consortium/governance expansion and broad external cosigner program | Concept | Governance intent exists, but the broader external structure is still ahead of the current repo maturity. | `CHARTER.md`, `governance/`, `docs/REVIEW-*` |

## Practical Reading Rule

If you need the **most defensible current AICP surface**, start with:

1. `README.md`
2. this matrix
3. `CHARTER.md`
4. `docs/SUITE-ARCHITECTURE.md`
5. `spec/core/FOUNDATION-DRAFT.md`
6. `spec/bindings/http-binding-draft.md`
7. `profiles/mcp.md`
8. `conformance/README.md`

If you are reviewing A2A, trust, payment, or provisioning work, treat those profile drafts as **real draft tracks with explicit non-claim boundaries**, not as finished interoperable standards.
