# MCP Review Packet

**Status:** Active review packet (most implementation-backed profile)
**Last updated:** 2026-04-11

## Artifact

- **Name:** `aicp-mcp-v1`
- **Location:** [`profiles/mcp.md`](../profiles/mcp.md)
- **Status:** Draft profile with runtime-backed reference slice. The most credible profile in the repo today.
- **Spec length:** ~8.3 KB, 202 lines

## Review Question

> Does the MCP profile preserve MCP's native utility (tool discovery, tool invocation, session semantics) while adding portable AICP governance semantics for capability description, approval gating, evidence emission, and error translation — and does the current reference implementation actually prove it end-to-end?

## Who Should Review

Primary target reviewers:

- **MCP maintainers** — can judge whether the profile still "feels like MCP on the wire" or whether it distorts MCP semantics
- **Agent tool runtime builders** — can judge whether the capability mapping is useful in practice, not just on paper
- **Security reviewers** — can judge whether the approval gating and evidence emission are actually enforceable

## What Is Already True (Runtime-Backed)

These claims are currently backed by runtime tests in the TypeScript reference line (`reference/oaps-monorepo/packages/mcp-adapter/`). A reviewer can verify each one by running `pnpm -r test` from the monorepo root.

| Claim | Anchor |
|---|---|
| MCP tool discovery maps to AICP `CapabilityCard` | `@oaps/mcp-adapter` tests + `profiles/mcp.md` §"Capability Mapping" |
| MCP tool invocation accepts an AICP `intent.request` | `@oaps/mcp-adapter` invocation tests |
| Policy evaluation runs before tool execution | `@oaps/policy` integration with `@oaps/mcp-adapter` |
| High-risk tools require explicit approval | `@oaps/mcp-adapter` approval-gating tests |
| Every invocation emits a hash-linked `EvidenceEvent` | `@oaps/evidence` integration |
| MCP errors translate to AICP `ErrorObject` with canonical category | `@oaps/mcp-adapter` error-mapping tests |

Conformance fixtures exist under `conformance/fixtures/profiles/mcp/` and are registered in the suite-level conformance index.

## What Is Still Open (Feedback Most Valued Here)

The following questions are not yet resolved and are the primary review asks:

### Q1. Normative vs informative mapping boundary

Most of the MCP profile prose currently reads as informative guidance. Should the profile tighten key sections (capability mapping, approval-insertion point, evidence emission) to normative MUST/SHOULD language, following the style now used in `spec/core/FOUNDATION-DRAFT.md`? If yes, which sections should stay informative to avoid over-constraining MCP's evolution?

### Q2. MCP-first vs AICP-first framing

Today the profile reads as "MCP with AICP overlays." An alternative framing is "AICP capabilities whose binding surface happens to be MCP." Which framing better serves MCP maintainers and AICP implementers respectively, and is there a hybrid that satisfies both?

### Q3. Approval insertion point

MCP has no native approval concept. The current profile inserts approval gates between discovery and invocation at the AICP layer. Does this insertion point violate any MCP session invariants? Are there MCP clients or servers where the gate would feel foreign?

### Q4. Evidence emission ordering

`EvidenceEvent` instances are emitted on state transitions. MCP does not have native state machines beyond session connection. Does the current approach of wrapping MCP invocations in AICP interaction lifecycles produce evidence streams that MCP reviewers consider accurate representations of what actually happened?

## How To Verify The Claims

A reviewer with a local clone can:

1. Run `cd reference/oaps-monorepo && pnpm install && pnpm -r test` to verify all claims above are runtime-backed.
2. Read `profiles/mcp.md` alongside `spec/core/FOUNDATION-DRAFT.md` to see how the profile consumes the foundation primitives.
3. Read `conformance/fixtures/profiles/mcp/index.v1.json` to see the fixture-level coverage.
4. Cross-reference `conformance/scopes-status.v1.json` — the MCP profile is one of the two `runtime-backed` scopes in the repo.

Expected runtime verification time: ~10 minutes.

## Known Limitations (Honest Disclaimer)

- The reference slice is the only known implementation. No second independent implementation exists.
- The profile does not yet cover MCP extensions beyond the core MCP tool family.
- Streaming MCP interactions are partially handled but not yet conformance-tested.
- The profile's error-mapping table is not exhaustive; rare MCP error conditions may fall through to a generic `VALIDATION_FAILED` category.

## Decision Requested

Reviewers are asked to pick one of:

- [ ] **Comment-only review** — "here is what I notice, no commitment"
- [ ] **Implementation feedback** — "here is what would break or work well if I implemented it"
- [ ] **Profile mapping feedback** — "here is where the mapping preserves or distorts MCP semantics"
- [ ] **Conformance feedback** — "here is what would need to change in the fixtures to match my reading"
- [ ] **Cosigner consideration** — "I am willing to publicly cosign the profile at its current draft stage, bounded to the MCP slice only"

A cosigner commitment is not required. A comment-only review is valuable even without a formal decision.

## Follow-Up

- **Next owner:** Founding steward (Efe Baran Durmaz) until co-stewards join
- **Next artifact:** Updated `profiles/mcp.md` incorporating feedback, or a new OEP proposing profile changes that exceed minor edits
- **Expected window:** Review feedback is collected on an ongoing basis. Batched incorporation every 2-4 weeks depending on volume.
- **How to submit feedback:** GitHub Issues with label `mcp-profile-review` (Discussions pending enablement).

## References

- `profiles/mcp.md` — the profile under review
- `reference/oaps-monorepo/packages/mcp-adapter/` — runtime-backed reference
- `spec/core/FOUNDATION-DRAFT.md` — AICP foundation primitives the profile consumes
- `conformance/fixtures/profiles/mcp/` — fixture pack
- `docs/MATURITY-MATRIX.md` — current maturity rating (Draft, the most implementation-backed profile)
- `AUDIT-MATURITY-MATRIX.md` — independent audit confirming Draft rating is defensible
