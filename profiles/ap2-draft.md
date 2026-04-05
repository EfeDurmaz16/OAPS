# oaps-ap2-v1

## Status

Draft payment authorization profile for the OAPS suite.

This profile maps OAPS mandates and approval boundaries into AP2-like
payment authorization flows.

## Purpose

`oaps-ap2-v1` defines how OAPS expresses payment authorization when the
payment act is tightly coupled to a mandate chain.

It exists so OAPS can describe stronger authorization semantics without
collapsing the suite into a merchant or wallet-specific model.

## Normative Scope

This profile is normative for:

- mapping OAPS mandates into payment authorization references
- preserving approval boundaries when authorization is handed off
- recording who approved the commercial action and why
- keeping payment authorization and fulfillment evidence linked

This profile is informative for:

- AP2 transport or wallet internals
- rail-specific settlement mechanics
- vendor-specific dispute workflows

## Relationship To The Suite

`oaps-ap2-v1` sits above the AP2-style payment authorization surface and
below the concrete wallet, rail, or merchant implementation.

It should compose cleanly with:

- the baseline auth-web profile
- the higher-assurance trust profile
- commerce and provisioning workflows that need payment authorization
- the MPP and x402 payment coordination tracks

## Mapping Notes

A conforming implementation SHOULD preserve:

- the principal that created the mandate
- the delegatee that may act on the mandate
- the commercial action or payment target
- the authorization boundary that must be approved
- the resulting evidence trail

## Current Mapping Matrix

| AP2 concern | OAPS anchor | Example anchor | Claim level |
| --- | --- | --- | --- |
| mandate chain | `Mandate` plus delegation semantics | `examples/ap2/mandate-chain.v1.json` | example-only |
| approval handoff | `ApprovalRequest` / `ApprovalDecision` | `examples/ap2/approval-handoff.v1.json` | example-only |
| payment authorization result | payment authorization metadata on the commercial action | `examples/ap2/payment-authorization.v1.json` | example-only |
| draft support declaration | profile-support example | `examples/ap2/profile-support.partial.v1.json` | draft-only |

The repository does not claim a dedicated AP2 verifier or runtime.

## Evidence And Audit

AP2-like workflows should preserve evidence for:

- mandate creation
- mandate delegation
- payment authorization approval
- settlement or cancellation outcome

## Conformance

`oaps-ap2-v1` will eventually need fixture coverage for:

- mandate-chain examples
- approval-handoff examples
- authorization-boundary scenarios
- partial support declarations

The current draft remains example-backed only.

## Open Questions

- Is AP2 better represented as a payment profile or as a commerce-side
  mandate bridge?
- Which evidence fields are essential for authorization auditability?
- How should stronger trust profiles upgrade the AP2 mapping?
