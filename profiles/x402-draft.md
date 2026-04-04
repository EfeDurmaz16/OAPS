# oaps-x402-v1

## Status

Draft payment coordination profile for the OAPS suite.

This profile maps OAPS payment semantics onto x402-style HTTP-native payment challenges and settlement flows.

## Purpose

`oaps-x402-v1` defines how OAPS represents payment requirements, payment authorization, and settlement references when HTTP-native payment coordination is used.

It exists so OAPS can coordinate paid actions without turning the suite into a payment rail.

## Normative Scope

This profile is normative for:

- mapping OAPS payment requirements to x402-style payment challenges
- preserving authorization intent across retry and settlement flows
- recording payment-related approval or authorization boundaries in OAPS evidence
- translating x402-style outcomes into portable OAPS payment coordination objects

This profile is informative for:

- rail-specific settlement mechanics
- merchant implementation details
- facilitator-specific transport choices

## Relationship To The Suite

This profile sits above the OAPS core semantics and below any payment rail implementation.

It should compose cleanly with:

- HTTP binding surfaces
- auth profiles that identify the caller or paying actor
- MCP or A2A flows that need paid execution
- commerce or provisioning profiles that need payment gating

The profile should not force x402 transport or settlement details back into the OAPS core.

## Mapping Notes

A conforming implementation SHOULD be able to map:

- OAPS payment requirement objects to x402-style challenge material
- payment authorization references to settlement outcomes
- payment retries to preserved OAPS interaction lineage
- payment failure to stable OAPS error categories

The profile is intended to support paid agent actions, not only human checkout flows.

## Conformance

A conforming `oaps-x402-v1` implementation:

- MUST preserve the OAPS identity and authorization context across payment challenge and settlement
- MUST fail closed when the payment requirement cannot be satisfied
- MUST emit evidence for the payment-related state changes that matter to execution
- SHOULD support paid execution for agent-to-tool and agent-to-agent flows
- SHOULD remain rail-neutral at the OAPS semantic layer

The current conformance pack groups this profile as static payment discovery, authorization intent, settlement, and evidence anchors.
The runtime references are adjacent HTTP and MCP surfaces that already exist in the reference suite; they are not a claim of full x402 facilitator coverage.

## Implementation Notes

Implementations should treat this profile as the default payment coordination bridge when:

- the HTTP surface is already the natural integration point
- the action can be retried safely after a challenge
- the execution result depends on payment confirmation
- the caller needs a compact and interoperable payment path
