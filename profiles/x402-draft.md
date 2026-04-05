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
- distinguishing payment discovery-only support from fuller challenge/retry/settlement support

This profile is informative for:

- rail-specific settlement mechanics
- merchant implementation details
- facilitator-specific transport choices

## Relationship To The Suite

This profile sits above the OAPS core semantics and below any payment rail implementation.

It composes cleanly with:

- HTTP binding surfaces
- auth profiles that identify the caller or paying actor
- MCP or A2A flows that need paid execution
- commerce or provisioning profiles that need payment gating

The profile does not force x402 transport or settlement details back into the OAPS core.

## Mapping Notes

A conforming implementation SHOULD be able to map:

- OAPS payment requirement objects to x402-style challenge material
- payment authorization references to settlement outcomes
- payment retries to preserved OAPS interaction lineage
- payment failure to stable OAPS error categories
- payment discovery-only support into honest partial compatibility declarations

The profile is intended to support paid agent actions, not only human checkout flows.

## Current Challenge And Retry Mapping Matrix

The current draft should be read as a semantic mapping matrix rather than as a claim that the suite already runs an x402 facilitator:

| x402-style concern | OAPS anchor | Current fixture/runtime anchor | Current claim level |
| --- | --- | --- | --- |
| payment discovery | discovery metadata advertising a payable surface | `x402.payment.discovery` via shared HTTP discovery runtime | runtime-backed through shared HTTP discovery only |
| payment requirement challenge | pre-execution gate that explains what authorization is needed before side effects | `x402.payment.requirement.challenge` fixture plus shared HTTP/auth surfaces | fixture-backed only |
| payment authorization intent | payment-aware execution request before settlement | `x402.payment.authorization.intent` via shared MCP policy/approval runtime | runtime-backed through shared MCP gating only |
| retry after challenge | same interaction lineage plus idempotent replay semantics | `x402.challenge.retry-lineage` plus shared HTTP idempotency across create/message/approve/reject/revoke mutations | partial; no dedicated payment challenge round-trip yet |
| settlement or paid completion | `ExecutionResult` plus canonical terminal state | `x402.settlement.execution-result` via shared HTTP completion runtime | runtime-backed through shared completion surfaces only |
| authorization-intent versus settlement-result metadata | portable record distinguishing requested authorization from final settlement | `x402.settlement.metadata-alignment` fixture | fixture-backed only |
| payment failure mapping | stable OAPS error category instead of rail-specific failure text | `x402.payment.challenge.invalid-context` plus shared MCP/HTTP error translation surfaces | partial; no rail-specific error catalog yet |

The current reference slice therefore proves that OAPS can carry payment-gating semantics across challenge, retry, and completion boundaries without claiming a real payment rail or x402 facilitator implementation.

## Challenge, Retry, And HTTP 402 Alignment Notes

The key rule is that x402 challenge/retry behavior should preserve one OAPS-governed authorization story, not split the payment step from the governed action that it unlocks.

In practice, the interaction identifier, idempotent intent, payment authorization reference, and evidence continuity MUST remain stable across challenge/retry loops.

The shared HTTP binding slice already treats idempotent replay as a full mutation-surface rule, so later x402-specific retries can build on the same message, approval, rejection, and revoke retry semantics rather than special-casing only initial interaction creation.

Where an implementation uses HTTP status `402 Payment Required`, this profile treats the 402 response as the transport-visible form of a portable OAPS payment requirement challenge. The current repository does **not** yet implement a dedicated 402 challenge handler; the mapping remains draft-track and example-backed. The important rule is semantic continuity:

- the challenge explains the payment requirement
- the retry preserves the same portable interaction lineage
- settlement or failure is reflected in portable execution or error objects

## Payment Requirement And Authorization Semantics

A payment requirement challenge SHOULD make clear:

- what action is being gated
- whether the challenge is only discovery-level or actionable authorization material
- which payer or actor identity is expected
- whether the interaction can be retried as-is after authorization

An authorization-intent record SHOULD remain distinct from the later settlement result. Authorization explains what was requested or approved; settlement explains what actually completed.

## Partial Compatibility Notes

Partial x402 implementations are expected.

An implementation MAY therefore declare:

- **compatible** support when it preserves payment discovery, challenge, retry lineage, authorization intent, and settlement/result continuity
- **partial** support when it only advertises payment discovery or requirement metadata but does not preserve challenge/retry lineage through execution
- **incompatible** support when it exposes payment-specific transport details without portable authorization or settlement semantics

The example pack now includes a discovery-only partial compatibility declaration for implementations that are not yet full x402 coordinators.

## Conformance

A conforming `oaps-x402-v1` implementation:

- MUST preserve the OAPS identity and authorization context across payment challenge and settlement
- MUST fail closed when the payment requirement cannot be satisfied
- MUST emit evidence for the payment-related state changes that matter to execution
- SHOULD support paid execution for agent-to-tool and agent-to-agent flows
- SHOULD remain rail-neutral at the OAPS semantic layer

The current conformance pack groups this profile into payment discovery, payment requirement challenge, authorization intent, retry lineage, settlement, metadata alignment, and invalid-context anchors. The runtime references are adjacent HTTP and MCP surfaces that already exist in the reference suite, including binding-level idempotent retry behavior on the shared HTTP mutation surface; they are not a claim of full x402 facilitator coverage.

## Current Runtime Boundary

The current repository does **not** yet claim:

- a live x402 facilitator
- settlement-rail integration
- automatic HTTP 402 challenge emission from the TypeScript reference line
- cryptographic payment authorization verification
- a canonical settlement metadata schema across rails

What the repository now does claim is that the OAPS semantic seams for discovery, requirement challenges, authorization intent, retry lineage, and settlement/result alignment are explicit enough to support later x402-native execution honestly.

## Implementation Notes

Implementations should treat this profile as the default payment coordination bridge when:

- the HTTP surface is already the natural integration point
- the action can be retried safely after a challenge
- the execution result depends on payment confirmation
- the caller needs a compact and interoperable payment path
