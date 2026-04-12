# AICP Commerce Landscape

## Purpose

This document maps the commerce side of the AICP suite into a bounded
draft surface.

Commerce is intentionally treated as a domain family, not as a checkout
product spec and not as a replacement for ACP, UCP, or merchant-native
flows.

## What Commerce Means Here

In AICP terms, commerce is the semantic plane for:

- order intent
- cart or quote state
- merchant authorization
- delegated checkout or purchase authority
- fulfillment and delivery commitments
- cancellation, refund, and compensation boundaries
- evidence that can replay the commercial decision path

The suite should capture those semantics once and then map them into
commerce ecosystems such as ACP and UCP.

## What Commerce Is Not

AICP commerce is not:

- a merchant UI design system
- a hosted checkout product
- a payments rail
- a replacement for vendor cart or fulfillment APIs
- a narrow wrapper around a single commerce ecosystem

## Relationship To Adjacent Systems

### ACP

ACP is best treated as an agentic commerce workflow target.

AICP should map:

- order intent to agent-facing commerce tasks
- merchant authorization to approval or mandate gates
- fulfillment commitments to execution results and evidence

### UCP

UCP is best treated as a universal commerce or checkout alignment target.

AICP should map:

- checkout-like user journeys to AICP interactions
- payment or authorization handoff to explicit approval or mandate objects
- order confirmation and fulfillment to portable execution outcomes

### AP2 And MPP

AP2 and MPP provide payment-side inputs that commerce workflows can reuse.
They do not own the commerce domain, but they can supply authority and
payment coordination references for commerce actions.

### x402 And OSP

x402 can supply payment coordination for commerce actions.
OSP can supply provisioning semantics when commerce produces or changes a
provisioned service.

## Core Commerce Primitives

The draft commerce family should keep the following abstractions stable:

- `OrderIntent` — the requested commercial outcome
- `Cart` or `Quote` — a pre-order commercial state
- `MerchantAuthorization` — who may commit the order
- `FulfillmentCommitment` — what will be delivered and when
- `CommercialEvidence` — the lineage of approval, order, and fulfillment

## Current Draft Boundary

The current repository only claims example-level and concept-level support
for commerce mapping.

That means:

- examples may show how a commercial flow could be represented in AICP
- profile drafts may map ACP or UCP semantics into AICP primitives
- no runtime-backed commerce implementation is claimed yet
- no conformance pack is claimed yet

## Review Questions

This landscape exists to answer a small number of review questions:

1. Are the commerce primitives abstract enough to cover both ACP-like and
   UCP-like workflows?
2. Do the commerce semantics stay above checkout-specific details?
3. Can approval, mandate, and payment handoff be represented without
   collapsing into a merchant API clone?
4. Are fulfillment and compensation boundaries replayable in evidence?

## Related Artifacts

- `spec/domain/commerce-draft.md`
- `profiles/acp-draft.md`
- `profiles/ucp-draft.md`
- `examples/commerce/`
- the payment profile drafts in `profiles/mpp-draft.md` and `profiles/ap2-draft.md`
