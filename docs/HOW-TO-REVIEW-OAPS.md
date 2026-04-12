# How To Review AICP

## Purpose

This is the shortest public-facing review packet for AICP (Agent Interaction Control Protocol), hosted in the OAPS repository.

Use it when someone asks:

> What should I read, what is already real, and what kind of feedback is actually useful?

## In One Paragraph

AICP is an open protocol suite for agentic control-plane primitives: identity references, delegation, mandates, intents, tasks, approvals, execution outcomes, evidence, and payment coordination. It is designed to sit **above** protocols such as MCP, A2A, x402, and OSP rather than replace them. The current repo already includes a real TypeScript reference slice, a Python interoperability line, machine-readable conformance artifacts, and several draft profile tracks.

## Feedback Channel

The primary feedback surface is **GitHub Discussions** on this repository (pending enablement). Until Discussions is live, use [GitHub Issues](https://github.com/EfeDurmaz16/OAPS/issues) with the `review-feedback` label. For bounded review packets, see `docs/REVIEW-PACKET-INDEX.md`.

## What Is Real Today

Start with the [maturity matrix](./MATURITY-MATRIX.md).

The short version is:

- **stable in-repo:** the execution harness, the TypeScript reference slice, the Python interoperability starter, and the current validation/conformance workflow
- **real draft tracks:** the core foundation draft, HTTP binding draft, MCP profile, and the current A2A / trust / payment / provisioning profile drafts
- **still conceptual:** additional binding families, commerce/jobs domain families, and broader external governance structures

## Recommended Reading Order

Estimated reading times are based on the actual document lengths and assume careful reading, not skimming.

### If you only have 10 minutes (quick positioning)

1. [README.md](../README.md)
2. [docs/MATURITY-MATRIX.md](./MATURITY-MATRIX.md)
3. [CHARTER.md](../CHARTER.md)
4. [docs/PROTOCOL-POSITIONING.md](./PROTOCOL-POSITIONING.md)

### If you are reviewing protocol shape (45-60 minutes)

1. [docs/SUITE-ARCHITECTURE.md](./SUITE-ARCHITECTURE.md)
2. [spec/core/FOUNDATION-DRAFT.md](../spec/core/FOUNDATION-DRAFT.md) (~15 min for the normative core)
3. [spec/core/STATE-MACHINE-DRAFT.md](../spec/core/STATE-MACHINE-DRAFT.md) (~10 min for the lifecycle model)
4. [spec/bindings/http-binding-draft.md](../spec/bindings/http-binding-draft.md)
5. the relevant profile draft under [profiles/](../profiles/)
6. [conformance/README.md](../conformance/README.md)

### If you are reviewing one ecosystem mapping

- **MCP:** [profiles/mcp.md](../profiles/mcp.md)
- **A2A:** [profiles/a2a-draft.md](../profiles/a2a-draft.md)
- **Trust:** [profiles/auth-web.md](../profiles/auth-web.md) and [profiles/auth-fides-tap-draft.md](../profiles/auth-fides-tap-draft.md)
- **Payments:** [profiles/x402-draft.md](../profiles/x402-draft.md)
- **Provisioning:** [profiles/osp-draft.md](../profiles/osp-draft.md)

## What Feedback Is Most Valuable

Useful review feedback is:

- whether AICP is drawing the right boundary between **core**, **binding**, **profile**, and **domain family**
- whether a mapping preserves the adjacent protocol's strengths without turning AICP into a wrapper
- whether approval, delegation, and evidence semantics are explicit enough to be interoperable
- whether current conformance claims match what the repo actually proves
- whether the current non-claim boundaries are honest

## What AICP Is Not Asking For Yet

AICP is **not** asking reviewers to:

- approve the whole suite at once
- bless unfinished transport families that are still conceptual
- treat every draft profile as a stable standard
- assume that current aligned systems are mandatory dependencies

## Useful Review Support Pages

- [`docs/WHAT-WE-WANT-REVIEWED.md`](./WHAT-WE-WANT-REVIEWED.md) — bounded review asks by area
- [`docs/REVIEW-READINESS-CHECKLISTS.md`](./REVIEW-READINESS-CHECKLISTS.md) — packet readiness checks
- [`docs/REVIEW-PACKET-TEMPLATE.md`](./REVIEW-PACKET-TEMPLATE.md) — reusable packet shape
- [`docs/COSIGNERS.md`](./COSIGNERS.md) — cosigner guidance
- [`docs/DESIGN-PARTNERS.md`](./DESIGN-PARTNERS.md) — design-partner guidance

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
- does the A2A draft preserve task lifecycle meaning without forcing an AICP transport rewrite?
- are the trust/payment/provisioning drafts honest about what is runtime-backed versus still fixture-backed?
- does the conformance surface match the actual implementation evidence in the repo?

## Follow-Up

If you want the bounded packet for a specific review class, use:

- [docs/REVIEW-TARGET-MATRIX.md](./REVIEW-TARGET-MATRIX.md)
- [docs/REVIEW-PACKET-INDEX.md](./REVIEW-PACKET-INDEX.md)
- [governance/EXTERNAL_REVIEW_PACKET.md](../governance/EXTERNAL_REVIEW_PACKET.md)
