# oaps-acp-v1

## Status

Draft commerce-alignment profile for the OAPS suite.

This profile maps OAPS primitives into ACP-like agentic commerce workflows.

## Purpose

`oaps-acp-v1` defines how OAPS represents commerce workflows where the
agent coordinates order creation, merchant approval, and fulfillment.

It exists to keep commerce semantics explicit without forcing ACP into a
generic task protocol or a checkout-only model.

## Normative Scope

This profile is normative for:

- mapping OAPS order intent to ACP-style commerce tasks
- preserving merchant authorization boundaries
- attaching approval, mandate, and evidence semantics to commerce flows
- carrying fulfillment outcomes into portable OAPS lifecycle states

This profile is informative for:

- ACP transport details
- merchant-specific catalog structures
- UI and checkout presentation rules

## Relationship To The Suite

`oaps-acp-v1` sits above ACP-style commerce behavior and below the concrete
merchant or agent transport.

It should compose cleanly with:

- the commerce domain draft
- the payment profiles
- the baseline auth profile
- the higher-assurance trust profile when commerce actions are sensitive

## Commerce Mapping Notes

A conforming mapping SHOULD preserve:

- order intent
- cart or quote state
- merchant authorization
- fulfillment commitment
- cancellation or compensation events
- replayable commercial evidence

## Current Mapping Matrix

| ACP concern | OAPS anchor | Example anchor | Claim level |
| --- | --- | --- | --- |
| order intent | `OrderIntent` / `Intent` | `examples/commerce/order-intent.v1.json` | example-only |
| delegated checkout | `Delegation` plus merchant approval | `examples/commerce/delegated-checkout.v1.json` | example-only |
| fulfillment outcome | `ExecutionResult` plus evidence | `examples/commerce/fulfillment-outcome.v1.json` | example-only |
| profile support declaration | draft-only profile support | `examples/commerce/profile-support.partial.v1.json` | draft-only |

## Conformance

`oaps-acp-v1` will eventually need fixture coverage for:

- order intent mapping
- delegated checkout mapping
- fulfillment outcome mapping
- cancellation and compensation mapping

The current draft is example-backed only.

## Open Questions

- Which ACP concepts belong in the domain draft versus this profile?
- How much checkout detail should remain informative only?
- Should commerce approvals be represented as a distinct OAPS boundary or
  reuse the general approval model alone?
