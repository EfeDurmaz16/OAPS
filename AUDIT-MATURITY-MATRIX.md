# Pact (OAPS) Maturity Matrix Audit

**Auditor:** Independent technical audit
**Date:** 2026-04-11
**Methodology:** Every self-claimed maturity label was verified by reading the actual files, running the validation scripts, building and testing the reference implementation, and cross-checking conformance claims against fixture counts. Ratings reflect what the repo can demonstrate today, not what it intends to become.

## Rating Key

| Rating | Meaning |
|--------|---------|
| 🟢 GREEN | Claim matches reality |
| 🟡 YELLOW | Partial — needs work to match claim |
| 🔴 RED | Claim is aspirational — reality is not yet there |

## Audited Matrix

| Surface | Self-Claimed | Audited Rating | Justification |
|---------|-------------|----------------|---------------|
| **Repository execution contract** (`AGENTS.md`, `PLANS.md`, `docs/STATUS.md`, harness scripts) | Stable | 🟢 GREEN | The execution loop, tranche queue, STATUS.md (1100+ lines of real progress log), and harness scripts are actively used and operationally exercised. This is the most honest "Stable" claim in the repo. |
| **TypeScript reference slice** (`@oaps/core`, `@oaps/evidence`, `@oaps/policy`, `@oaps/mcp-adapter`, `@oaps/http`) | Stable | 🟢 GREEN | Build passes clean. All tests pass (core: 12, evidence: 4, policy: 3, mcp-adapter: 11, http: 28+ cases). The code actually implements the claimed flow: MCP discovery → intent → policy → approval → execution → evidence → HTTP binding. File-backed state store provides crash recovery. In-tree Hono shims are deliberate simplifications, not gaps. This is the strongest surface in the repo. |
| **Python interoperability starter** | Stable | 🟢 GREEN | Narrow but real. 7 CLI commands, 25+ passing tests, stdlib-only dependencies. Does exactly what it claims: conformance manifest validation, fixture checking, result validation, compatibility declarations. Not a protocol implementation — correctly scoped as tooling. |
| **Conformance manifest, taxonomy, fixture indexes, result schema, compatibility declaration schema** | Draft | 🟡 YELLOW | 167 scenarios across 17 packs is substantial. Machine-readable and validated. However: 3 of 5 invalid examples are orphaned from the conformance fixture index. 3 of 11 error codes have zero conformance fixtures (APPROVAL_MODIFICATION_TARGET_MISMATCH, CAPABILITY_NOT_FOUND, EXECUTION_TIMEOUT). 8 of 15 primitives lack runtime-backed conformance. The conformance system is well-structured but has real coverage gaps that undermine the "Draft" claim's implied implementability. |
| **Charter, vision, roadmap, suite architecture, ecosystem/standards positioning docs** | Draft | 🟡 YELLOW | Charter and suite architecture are solid vision documents. But: governance commitments reference structures that don't exist (WGs, cosigner program, review calendar). Roadmap milestones have no dates. "Neutral by design" would not survive adversarial reading given all "aligned systems" are the author's own projects. The documents read as a credible first draft of what governance *should* look like, not what it *is*. |
| **Core foundation draft** | Draft | 🔴 RED | This is the most significant overrating in the repo. The foundation draft (`spec/core/FOUNDATION-DRAFT.md`) is titled "first hard-normative OAPS semantic layer" but contains **zero MUST keywords**, only 5 SHOULD, and 1 MAY. It reads as prose narrative, not specification. A "Draft" spec must be implementable from the document alone — this one is not, because it never says what an implementation MUST do. The STATE-MACHINE-DRAFT carries the normative weight. The foundation draft is accurately a **Concept** that has been partially backed by schemas. |
| **HTTP binding draft** | Draft | 🟢 GREEN | The HTTP binding has a written spec (`spec/bindings/http-binding-draft.md`), a runtime implementation (`@oaps/http` with 28+ test cases), and conformance fixtures. The implementation matches the spec. REST endpoints for interaction, approval, revoke, evidence, and events with `after`/`limit` replay windows all work. Draft claim is accurate. |
| **MCP profile** | Draft | 🟢 GREEN | Best-quality profile in the repo. Spec document exists (`profiles/mcp.md`), runtime-backed by `@oaps/mcp-adapter` with 11 test cases, conformance fixtures exist. Maps MCP tools to OAPS CapabilityCards and gates high-risk actions per spec. Draft claim is accurate — it's the most implementation-backed profile but still lacks an independent implementation. |
| **A2A profile** | Draft | 🟡 YELLOW | Substantive spec content (12K+ doc with mapping tables, lifecycle rules, semantic alignment). Fixture-backed. But: NO runtime implementation, no end-to-end test, no proof the mapping actually works in code. "Draft" implies implementable and partially proven — this is implementable on paper but unproven. Closer to late Concept. |
| **auth-web profile** | Draft | 🟡 YELLOW | 10K+ substantive spec with session-based and token-based flows. Fixture-backed but no dedicated runtime. Same gap as A2A: well-specified but unproven in code. |
| **auth-fides-tap profile** | Draft | 🟡 YELLOW | 8K+ spec with TAP integration mapping. Fixture-backed. No runtime. Same assessment. |
| **x402 profile** | Draft | 🟡 YELLOW | 8K+ spec with payment coordination mapping. Fixture-backed. No runtime. Same assessment. |
| **OSP profile** | Draft | 🟡 YELLOW | 8K+ spec with provisioning mapping. Fixture-backed. No runtime. Same assessment. |
| **agent-client profile** | Draft | 🔴 RED | ~2.5K stub. Minimal substance. No runtime. No meaningful fixtures beyond basic schema validation. This is a concept, not a draft. |
| **ACP profile** | Draft | 🔴 RED | ~2.5K stub. Same assessment as agent-client. |
| **AP2 profile** | Draft | 🔴 RED | ~2.9K stub. Same assessment. |
| **MPP profile** | Draft | 🔴 RED | ~3.3K stub. Same assessment. |
| **UCP profile** | Draft | 🔴 RED | ~2.6K stub. Same assessment. |
| **Compatibility declaration examples and review packet scaffolding** | Draft | 🟡 YELLOW | Compatibility declarations are machine-readable and the schema is real. But: all review packets are stubs/placeholders. The review calendar has no dates. The review program has never been executed. The scaffolding is good but the "Draft" claim implies partial operation. |
| **JSON-RPC binding family** | Draft | 🔴 RED | A first draft spec exists. Fixture-only conformance stubs. Zero runtime implementation. No proof the binding works. "Draft" should mean "partially proven" — this is spec-only. Should be Concept. |
| **gRPC binding family** | Draft | 🔴 RED | Draft spec exists, proto file exists (150+ lines), fixture-only stubs. Zero runtime. The spec references the wrong proto filename (documentation bug). Should be Concept. |
| **event/webhook binding family** | Draft | 🔴 RED | Draft spec exists, fixture-only stubs. Zero runtime. Should be Concept. |
| **Commerce and Jobs domain families** | Concept | 🟢 GREEN | Accurately labeled. Commerce has landscape analysis and some schema stubs but nothing implementable. Concept is honest. |
| **Neutral consortium/governance expansion** | Concept | 🟢 GREEN | Accurately labeled. Zero external participants, no legal entity, patent pledge is draft intent. Concept is the right label. |

## Calibration Summary

| Rating | Count | Percentage |
|--------|-------|------------|
| 🟢 GREEN (claim matches reality) | 8 | 35% |
| 🟡 YELLOW (partial, needs work) | 8 | 35% |
| 🔴 RED (aspirational, not there yet) | 7 | 30% |

**Overall calibration:** The repo's self-assessment is **systematically optimistic**. The most common error is labeling Concept-level surfaces as "Draft." The label "Draft" should imply "implementable and partially proven." Several surfaces labeled Draft are spec-only or stub-only with no runtime backing.

The three accurately-rated Stable surfaces (repo execution contract, TypeScript reference, Python tools) are genuinely stable and well-exercised. The two accurately-rated Concept surfaces are honestly labeled.

**The single most overrated surface is the core foundation draft.** It is the centerpiece of the standard and is labeled "Draft" but lacks the normative language (RFC 2119 keywords) that would make it a specification rather than a narrative description. This is the highest-priority fix.

**Surfaces that could defensibly be upgraded:** None. No surface is underrated. Every label either matches or exceeds reality.
