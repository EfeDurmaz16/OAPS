# OAPS Maturity Matrix

## Purpose

This matrix answers a simple reader question:

> What in OAPS is stable enough to rely on now, what is still a draft, and what is only a concept?

The labels below are about **current repo maturity**, not eventual standards status.

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
| Core foundation draft | Draft | It is the main semantic target and now has stronger schema/runtime/conformance backing, but it is not frozen. | `spec/core/FOUNDATION-DRAFT.md`, `schemas/foundation/`, `examples/foundation/`, core fixture pack |
| HTTP binding draft | Draft | The reference server proves a real binding slice, but open binding questions remain. | `spec/bindings/http-binding-draft.md`, `reference/oaps-monorepo/packages/http/`, HTTP fixture pack |
| MCP profile | Draft | This is the most implementation-backed profile, but it is still a draft profile rather than a stable standard. | `profiles/mcp.md`, `reference/oaps-monorepo/packages/mcp-adapter/`, MCP fixture pack |
| A2A, auth-web, auth-fides-tap, x402, OSP, and agent-client profiles | Draft | These profiles now have explicit mapping notes and fixture coverage, but they are not yet backed by dedicated end-to-end runtimes. | `profiles/`, `spec/profiles/`, profile fixture packs |
| Compatibility declaration examples and review packet scaffolding | Draft | Useful and machine-readable, but still part of the suite-hardening phase rather than a public finalized review program. | `docs/COMPATIBILITY-DECLARATIONS.md`, `docs/REVIEW-*`, `conformance/results/examples/` |
| JSON-RPC binding family | Draft | The repo now includes a first JSON-RPC binding draft plus fixture-only conformance stubs, but no runtime implementation yet. | `spec/bindings/jsonrpc-binding-draft.md`, `examples/jsonrpc/`, `conformance/fixtures/bindings/jsonrpc/` |
| gRPC binding family | Draft | The repo now includes a first gRPC binding draft, proto package layout, and fixture-only conformance stubs, but no runtime implementation yet. | `spec/bindings/grpc-binding-draft.md`, `reference/proto/oaps/bindings/grpc/v1/`, `examples/grpc/`, `conformance/fixtures/bindings/grpc/` |
| event/webhook binding family | Draft | The repo now includes a first events/webhooks binding draft plus fixture-only conformance stubs, but no runtime implementation yet. | `spec/bindings/events-binding-draft.md`, `examples/events/`, `conformance/fixtures/bindings/events/` |
| Commerce and Jobs domain families | Concept | Intentionally part of the long-term suite shape, but not yet drafted as concrete protocol families. | `CHARTER.md`, `ROADMAP.md`, `docs/SUITE-ARCHITECTURE.md` |
| Neutral consortium/governance expansion and broad external cosigner program | Concept | Governance intent exists, but the broader external structure is still ahead of the current repo maturity. | `CHARTER.md`, `governance/`, `docs/REVIEW-*` |

## Practical Reading Rule

If you need the **most defensible current OAPS surface**, start with:

1. `README.md`
2. this matrix
3. `CHARTER.md`
4. `docs/SUITE-ARCHITECTURE.md`
5. `spec/core/FOUNDATION-DRAFT.md`
6. `spec/bindings/http-binding-draft.md`
7. `profiles/mcp.md`
8. `conformance/README.md`

If you are reviewing A2A, trust, payment, or provisioning work, treat those profile drafts as **real draft tracks with explicit non-claim boundaries**, not as finished interoperable standards.
