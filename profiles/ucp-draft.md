# oaps-ucp-v1

## Status

Draft universal-commerce alignment profile for the OAPS suite.

This profile maps OAPS primitives into UCP-like checkout and commerce flows.

## Purpose

`oaps-ucp-v1` defines how OAPS carries universal commerce semantics across
cart, checkout, authorization, and fulfillment boundaries.

It exists so OAPS can describe a checkout-shaped workflow while keeping the
semantic layer vendor-neutral.

## Normative Scope

This profile is normative for:

- mapping OAPS commercial intent into UCP-style checkout flows
- preserving approval or mandate boundaries during checkout
- recording the authoritative fulfillment outcome in evidence
- keeping the checkout story replayable without encoding merchant UI rules

This profile is informative for:

- UCP transport or presentation details
- merchant-specific payment rails
- storefront UX decisions

## Relationship To The Suite

`oaps-ucp-v1` sits above UCP-like commerce behavior and below the concrete
checkout implementation.

It should compose cleanly with:

- the commerce domain draft
- the payment profiles
- the baseline auth profile
- the higher-assurance trust profile

## Checkout Mapping Notes

A conforming mapping SHOULD preserve:

- the shopper or agent identity
- the cart or order intent
- the approval or authorization boundary
- the fulfillment and compensation outcomes
- the evidence trail for review and replay

## Current Mapping Matrix

| UCP concern | OAPS anchor | Example anchor | Claim level |
| --- | --- | --- | --- |
| checkout initiation | `Intent` / `OrderIntent` | `examples/commerce/order-intent.v1.json` | example-only |
| payment or merchant authorization | `ApprovalRequest` / `ApprovalDecision` | `examples/commerce/delegated-checkout.v1.json` | example-only |
| fulfillment confirmation | `ExecutionResult` | `examples/commerce/fulfillment-outcome.v1.json` | example-only |
| compatibility declaration | draft support declaration | `examples/commerce/profile-support.compatible.v1.json` | draft-only |

## Conformance

`oaps-ucp-v1` will eventually need fixture coverage for:

- checkout initiation mapping
- authorization gating
- fulfillment confirmation
- compatibility declarations for partial support

The current draft is example-backed only.

## Open Questions

- Which checkout semantics are universal enough to standardize?
- How should merchants express approval requirements without hiding them in
  opaque UI state?
- Should checkout retries preserve the same OAPS interaction identifier or
  use a derived commerce reference?
