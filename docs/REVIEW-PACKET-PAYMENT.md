# Payment Review Packet

## Artifact

- name: `oaps-x402-v1`, `oaps-mpp-v1`, and `oaps-ap2-v1`
- location: [`profiles/x402-draft.md`](../profiles/x402-draft.md), [`profiles/mpp-draft.md`](../profiles/mpp-draft.md), [`profiles/ap2-draft.md`](../profiles/ap2-draft.md)
- status: draft payment coordination family with fixture-backed conformance

## Review Question

Are the payment coordination semantics narrow enough to interop and broad enough to stay rail-agnostic?

## Why This Reviewer

x402, MPP, AP2, and payment-infrastructure reviewers can tell whether AICP is keeping the payment boundary abstract rather than turning into a rail-specific product spec.

## What Is Already True

- implementation: the payment-related slices are present as profile and schema drafts with example objects
- conformance: x402, MPP, and AP2 fixture coverage exists in the suite-level conformance index
- examples: the repo contains payment-session, mandate-chain, and payment-challenge examples
- docs: the review matrices already explain why this packet is bounded

## What Is Still Open

- how much rail-specific vocabulary should stay informative rather than normative
- whether the profile family should split into narrower review packets later

## Decision Requested

Choose one:

- comment-only review
- implementation feedback
- profile mapping feedback
- conformance feedback
- cosigner consideration

## Follow-Up

- next owner: protocol maintainers
- next artifact: refined payment profile notes or follow-up packet
- expected window: after bounded review feedback is collected
