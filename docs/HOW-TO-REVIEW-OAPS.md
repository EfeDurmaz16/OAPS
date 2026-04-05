# How To Review OAPS

## Purpose

This is the shortest public-facing review packet for OAPS.

Use it when someone asks:

> What should I read, what is already real, and what kind of feedback is actually useful?

## In One Paragraph

OAPS is an open protocol suite for agentic control-plane primitives: identity references, delegation, intents, tasks, approvals, execution outcomes, evidence, and attached payment/provisioning semantics. It is designed to sit **above** protocols such as MCP, A2A, x402, and OSP rather than replace them. The current repo already includes a real TypeScript reference slice, a Python interoperability line, machine-readable conformance artifacts, and several draft profile tracks.

## What Is Real Today

Start with the [maturity matrix](./MATURITY-MATRIX.md).

The short version is:

- **stable in-repo:** the execution harness, the TypeScript reference slice, the Python interoperability starter, and the current validation/conformance workflow
- **real draft tracks:** the core foundation draft, HTTP binding draft, MCP profile, and the current A2A / trust / payment / provisioning profile drafts
- **still conceptual:** additional binding families, commerce/jobs domain families, and broader external governance structures

## Recommended Reading Order

### If you only have 10 minutes

1. [README.md](../README.md)
2. [docs/MATURITY-MATRIX.md](./MATURITY-MATRIX.md)
3. [CHARTER.md](../CHARTER.md)
4. [docs/PROTOCOL-POSITIONING.md](./PROTOCOL-POSITIONING.md)

### If you are reviewing protocol shape

1. [docs/SUITE-ARCHITECTURE.md](./SUITE-ARCHITECTURE.md)
2. [spec/core/FOUNDATION-DRAFT.md](../spec/core/FOUNDATION-DRAFT.md)
3. [spec/bindings/http-binding-draft.md](../spec/bindings/http-binding-draft.md)
4. the relevant profile draft under [profiles/](../profiles/)
5. [conformance/README.md](../conformance/README.md)

### If you are reviewing one ecosystem mapping

- **MCP:** [profiles/mcp.md](../profiles/mcp.md)
- **A2A:** [profiles/a2a-draft.md](../profiles/a2a-draft.md)
- **Trust:** [profiles/auth-web.md](../profiles/auth-web.md) and [profiles/auth-fides-tap-draft.md](../profiles/auth-fides-tap-draft.md)
- **Payments:** [profiles/x402-draft.md](../profiles/x402-draft.md)
- **Provisioning:** [profiles/osp-draft.md](../profiles/osp-draft.md)

## What Feedback Is Most Valuable

Useful review feedback is:

- whether OAPS is drawing the right boundary between **core**, **binding**, **profile**, and **domain family**
- whether a mapping preserves the adjacent protocol's strengths without turning OAPS into a wrapper
- whether approval, delegation, and evidence semantics are explicit enough to be interoperable
- whether current conformance claims match what the repo actually proves
- whether the current non-claim boundaries are honest

## What OAPS Is Not Asking For Yet

OAPS is **not** asking reviewers to:

- approve the whole suite at once
- bless unfinished transport families that are still conceptual
- treat every draft profile as a stable standard
- assume that current aligned systems are mandatory dependencies

## Reviewer Decision Template

A good review response can be as small as:

1. **scope checked:** which artifact or profile you reviewed
2. **fit:** whether the boundary looks right
3. **risk:** the main semantic ambiguity or interop risk you see
4. **change request:** one concrete edit or unanswered question
5. **status:** acceptable as-is, acceptable with follow-up, or needs revision

## Current Open Review Asks

Today the most useful external questions are:

- does the MCP mapping preserve MCP utility while adding portable governance semantics?
- does the A2A draft preserve task lifecycle meaning without forcing an OAPS transport rewrite?
- are the trust/payment/provisioning drafts honest about what is runtime-backed versus still fixture-backed?
- does the conformance surface match the actual implementation evidence in the repo?

## Follow-Up

If you want the bounded packet for a specific review class, use:

- [docs/REVIEW-TARGET-MATRIX.md](./REVIEW-TARGET-MATRIX.md)
- [docs/REVIEW-PACKET-INDEX.md](./REVIEW-PACKET-INDEX.md)
- [governance/EXTERNAL_REVIEW_PACKET.md](../governance/EXTERNAL_REVIEW_PACKET.md)
