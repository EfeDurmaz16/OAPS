# OAPS Events / Webhooks Binding Draft

## Status

Draft binding specification for transporting OAPS lifecycle and evidence updates over push delivery channels.

This is the fourth binding-track draft after HTTP, JSON-RPC, and gRPC.

## Purpose

The events binding defines how OAPS lifecycle events, approval notices, and
hash-linked evidence updates can be pushed to interested receivers without
making push delivery the authoritative source of record.

The current draft is intentionally broad enough to cover:

- webhook-style HTTP callbacks
- brokered event buses
- managed event fan-out services

while preserving the same replayable OAPS semantics defined by the core and the
other bindings.

## Binding Principles

The events binding must:

- preserve OAPS event and evidence semantics rather than inventing push-only lifecycle meaning
- remain replay-first even when push delivery is available
- tolerate duplicate delivery and transport retry without losing durable event identity
- make dedupe, retry, and resume behavior explicit
- stay compatible with profile-specific auth or signing layers without forcing one webhook product shape into the suite

## Push Event Envelope Shape

The current draft push envelope is a JSON object with these canonical concerns:

- `delivery_id` — unique identifier for this delivery attempt
- `subscription_id` — receiver-specific delivery channel identifier when one exists
- `dedupe_key` — stable receiver-local dedupe key for the durable event
- `event_class` — one of `interaction_event`, `evidence_event`, `approval_event`, or a future extension class
- `event_id` — the durable OAPS event identifier
- `interaction_id` — the durable interaction anchor
- `event_type` — lifecycle or evidence event type such as `interaction.updated` or `approval.requested`
- `occurred_at` — event occurrence timestamp
- `attempt` — monotonically increasing delivery-attempt counter for retries
- `cursor_hint` — optional replay hint, usually the last durable event id now available to resume from
- `source` — sender metadata such as actor id, binding family, or delivery channel
- `payload` — the canonical event body or evidence payload

The current draft examples treat `event_id` as the durable cross-binding anchor,
`delivery_id` as the per-attempt transport identifier, and `dedupe_key` as the
stable receiver-side retry filter.

## Replay-First Relationship

The events binding is **replay-first and push-assisted**.

That means:

- push delivery is advisory acceleration, not the only source of truth
- authoritative ordered replay still comes from the canonical replay surfaces exposed by another binding such as HTTP, JSON-RPC, or gRPC
- a receiver that detects a gap, duplicate storm, or signature/auth failure should resume from the last accepted durable `event_id` using replay rather than trusting push continuity alone

Push-first-only designs SHOULD NOT claim full OAPS events-binding conformance in
this draft.

## Delivery Guarantees, Dedupe Keys, And Retry Semantics

The baseline delivery guarantee is **at least once**.

A conforming sender therefore MAY redeliver the same durable event to the same
subscription when:

- acknowledgement was missing or ambiguous
- transport connectivity failed
- the receiver returned a retryable failure
- the sender is recovering from an outage and is replaying a safe suffix

The draft binding distinguishes:

- `event_id` — durable semantic identity across bindings
- `delivery_id` — unique attempt identity
- `dedupe_key` — receiver-local stable retry filter, typically derived from `subscription_id` plus `event_id`

Receivers SHOULD dedupe on `dedupe_key` or an equivalent stable receiver-local
mapping rather than on `delivery_id`.

Retries SHOULD preserve the same `dedupe_key` and increment `attempt`.
Backoff policy is transport-specific, but the draft expects exponential or
bounded progressive retry rather than tight retry loops.

## Replay Resumption Concepts

Replay resumption remains draft, but the core concepts are already defined.

A receiver SHOULD record at least:

- the last durable `event_id` it accepted per subscription or interaction
- whether the event was processed successfully or only received transiently

When recovery is needed, the receiver SHOULD use that last durable `event_id`
as the resume anchor against the authoritative replay surface.

The push envelope MAY carry a `cursor_hint`, but the receiver's own durable
checkpoint remains authoritative for resume decisions.

## Auth, Signatures, And Profile Layering

The events binding does not force one signing or webhook-auth scheme.

The current draft expects implementations to compose with profile layers such as:

- `oaps-auth-web-v1` for baseline web-native sender binding
- stronger trust or signing profiles later

Webhook-specific headers, shared-secret HMACs, or broker-native credentials MAY
be used, but they SHOULD be described as profile or deployment details layered
on top of the canonical push envelope and replay rules.

## Example Pack

The repository now includes first events-binding examples under `examples/events/`, including:

- canonical interaction-update webhook payload
- approval-requested webhook payload
- retry/redelivery payload showing stable dedupe semantics across attempts
- replay-resumption note and checkpoint example

## Conformance Expectations

The current events-binding conformance slice is fixture-only.

It currently expects:

- push envelope examples
- replay-first versus push-assisted relationship notes
- at-least-once delivery and dedupe-key examples
- retry/redelivery examples
- replay-resumption examples

No in-repo runtime currently claims live webhook or broker fan-out support yet.
