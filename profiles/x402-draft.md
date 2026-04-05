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

## Current Challenge And Retry Mapping Matrix

The current draft should be read as a semantic mapping matrix rather than as a claim that the suite already runs an x402 facilitator:

| x402-style concern | OAPS anchor | Current fixture/runtime anchor | Current claim level |
| --- | --- | --- | --- |
| payment discovery | discovery metadata advertising a payable surface | `x402.payment.discovery` via shared HTTP discovery runtime | runtime-backed through shared HTTP discovery only |
| payment authorization challenge | pre-execution gate before side effects | `x402.payment.authorization.intent` via shared MCP policy/approval runtime | runtime-backed through shared MCP gating only |
| retry after challenge | same interaction lineage plus idempotent replay semantics | shared HTTP idempotency across create/message/approve/reject/revoke mutations plus message/evidence continuity | partial; no dedicated payment challenge round-trip yet |
| settlement or paid completion | `ExecutionResult` plus canonical terminal state | `x402.settlement.execution-result` via shared HTTP completion runtime | runtime-backed through shared completion surfaces only |
| payment failure mapping | stable OAPS error category instead of rail-specific failure text | shared MCP/HTTP error translation surfaces | partial; no rail-specific error catalog yet |

The current reference slice therefore proves that OAPS can carry payment-gating semantics across challenge, retry, and completion boundaries without claiming a real payment rail or x402 facilitator implementation.

The key rule is that x402 challenge/retry behavior should preserve one OAPS-governed authorization story, not split the payment step from the governed action that it unlocks. In practice, the interaction identifier, idempotent intent, payment authorization reference, and evidence continuity must remain stable across challenge/retry loops. The shared HTTP binding slice now treats idempotent replay as a full mutation-surface rule, so later x402-specific retries can build on the same message, approval, rejection, and revoke retry semantics rather than special-casing only initial interaction creation.

## Conformance

A conforming `oaps-x402-v1` implementation:

- MUST preserve the OAPS identity and authorization context across payment challenge and settlement
- MUST fail closed when the payment requirement cannot be satisfied
- MUST emit evidence for the payment-related state changes that matter to execution
- SHOULD support paid execution for agent-to-tool and agent-to-agent flows
- SHOULD remain rail-neutral at the OAPS semantic layer

The current conformance pack groups this profile as static payment discovery, authorization intent, settlement, and evidence anchors.
The runtime references are adjacent HTTP and MCP surfaces that already exist in the reference suite, including binding-level idempotent retry behavior on the shared HTTP mutation surface; they are not a claim of full x402 facilitator coverage.

## Implementation Notes

Implementations should treat this profile as the default payment coordination bridge when:

- the HTTP surface is already the natural integration point
- the action can be retried safely after a challenge
- the execution result depends on payment confirmation
- the caller needs a compact and interoperable payment path
