# AICP Webhook Binding Draft

## Status

Draft binding specification for asynchronous agent-to-agent communication via HTTP webhook callbacks.

This binding is a concrete specialization of the events binding draft. It inherits the replay-first, push-assisted model and at-least-once delivery guarantees defined there.

**Version:** `0.1.0-draft`

**Requirements notation:** The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174) when, and only when, they appear in all capitals.

## Purpose

The webhook binding enables asynchronous agent-to-agent communication via HTTP POST callbacks. It is designed for long-running tasks (hours or days) where maintaining a persistent connection is impractical.

A webhook registration binds a callback URL to an interaction so that relevant state changes are pushed to the receiver as they occur. The receiver can then act on those changes without polling.

## Relationship To The Events Binding

This binding is a concrete transport instantiation of the events binding draft (`spec/bindings/events-binding-draft.md`). It preserves all events-binding principles:

- push delivery is advisory acceleration, not the authoritative source of truth
- authoritative ordered replay still comes from canonical replay surfaces (HTTP, JSON-RPC, gRPC)
- a receiver that detects a gap, duplicate storm, or signature failure **SHOULD** resume from the last accepted durable `event_id` using replay

The webhook envelope maps the events-binding canonical concerns to HTTP-specific delivery fields. See the envelope section below for the mapping.

## Registration

When Agent A creates an interaction or delegates a task that may involve asynchronous progress, Agent A **MUST** register a webhook to receive state change notifications.

### Registration Requirements

- A registration **MUST** include:
  - `callback_url` — the HTTPS URL to receive webhook deliveries
  - `events` — an array of event types the receiver wants to subscribe to
  - `secret` — a shared secret for HMAC-SHA256 signature verification

- A registration **SHOULD** include:
  - `retry_policy` — override for the default retry behavior
  - `expiry` — RFC 3339 timestamp after which the registration is no longer active

- The `callback_url` **MUST** use the `https` scheme. Registrations with non-HTTPS callback URLs **MUST** be rejected.

- The `secret` **MUST** be exchanged during registration and **MUST NOT** appear in any webhook delivery payload.

- A registration **MAY** include an `interaction_id` to scope the registration to a single interaction. Registrations without an `interaction_id` apply to all interactions between the two agents.

### Registration Lifecycle

- A registration **MUST** be assigned a unique `registration_id` by the sender.
- A registration **MAY** be unregistered by the receiver at any time.
- Expired registrations **MUST** stop receiving webhooks. The sender **MUST NOT** deliver to an expired callback URL.

## Webhook Delivery Envelope

When a relevant state change occurs, the sender **MUST** POST a JSON envelope to the registered callback URL.

### Envelope Shape

```json
{
  "webhook_id": "unique delivery ID",
  "interaction_id": "the interaction this event belongs to",
  "event_type": "task.transition",
  "actor_ref": { "actor_id": "..." },
  "payload": { ... },
  "timestamp": "RFC 3339 timestamp",
  "evidence_hash": "hash of the EvidenceEvent for this delivery",
  "signature": "HMAC-SHA256 of the body using the registered secret"
}
```

### Events Binding Mapping

| Events binding field | Webhook envelope field |
| --- | --- |
| `delivery_id` | `webhook_id` |
| `subscription_id` | `registration_id` (from registration) |
| `dedupe_key` | derived from `registration_id` + `webhook_id` |
| `event_class` | derived from `event_type` prefix |
| `event_id` | `webhook_id` (durable anchor) |
| `interaction_id` | `interaction_id` |
| `event_type` | `event_type` |
| `occurred_at` | `timestamp` |
| `attempt` | tracked by sender, included in `X-AICP-Delivery-Attempt` header |
| `source` | `actor_ref` |
| `payload` | `payload` |

## Event Types

The webhook binding supports the following event types:

| Event type | Trigger |
| --- | --- |
| `task.transition` | A `TaskTransition` occurred (task state changed) |
| `message.appended` | A new message was added to the interaction |
| `approval.requested` | An `ApprovalRequest` needs a decision |
| `approval.decided` | An `ApprovalDecision` was made |
| `challenge.raised` | A `Challenge` blocks progress |
| `evidence.emitted` | A new `EvidenceEvent` was appended to the chain |
| `interaction.completed` | The interaction reached terminal success |
| `interaction.failed` | The interaction reached terminal failure |

Senders **MUST** only deliver events whose `event_type` matches the `events` array in the registration. Senders **MUST NOT** deliver unsubscribed event types.

## Delivery Guarantees

### At-Least-Once Delivery

The baseline delivery guarantee is **at least once**, consistent with the events binding.

- The sender **MUST** retry delivery when the receiver returns a non-2xx HTTP response.
- The receiver **MUST** be idempotent. The receiver **SHOULD** use `webhook_id` for deduplication.
- The sender **MUST** preserve the same `webhook_id` across retries for the same logical event.

### Default Retry Policy

When no `retry_policy` is specified in the registration, the sender **MUST** use the following default:

- Maximum attempts: 3
- Backoff intervals: 1 second, 5 seconds, 30 seconds (exponential)

Senders **MAY** support custom retry policies via the `retry_policy` registration field, which includes `max_attempts` and `backoff_seconds` (array of intervals).

### HTTP Delivery Requirements

- The sender **MUST** use HTTP POST to deliver webhooks.
- The `Content-Type` header **MUST** be `application/json`.
- The sender **MUST** include the `X-AICP-Signature` header containing the HMAC-SHA256 hex digest of the raw request body using the registered secret.
- The sender **SHOULD** include the `X-AICP-Delivery-Attempt` header with the 1-based attempt number.
- A 2xx response from the receiver indicates successful delivery.
- A non-2xx response or connection failure indicates delivery failure and triggers retry.

## Security

### Transport Security

- Callback URLs **MUST** use HTTPS. The sender **MUST NOT** deliver to plain HTTP endpoints.

### Signature Verification

- The sender **MUST** compute HMAC-SHA256 over the raw JSON request body using the shared secret from registration.
- The sender **MUST** include this signature in the `X-AICP-Signature` header as a hex-encoded string.
- The receiver **MUST** verify the `X-AICP-Signature` header before processing the webhook payload.
- The receiver **SHOULD** reject webhooks with missing or invalid signatures with HTTP 401.

### Secret Management

- The HMAC secret **MUST** be exchanged during registration, not in webhook payloads.
- The secret **SHOULD** be at least 32 bytes of entropy.
- Implementations **SHOULD** support secret rotation via re-registration.

### Registration Expiry

- Expired registrations **MUST** stop receiving webhooks.
- The sender **MUST** check registration expiry before each delivery attempt.
- The receiver **MAY** set a short expiry and periodically re-register to limit the window of exposure.

## Evidence Integration

### Evidence Hash Linkage

- Every webhook delivery **MUST** include an `evidence_hash` field that references the `EvidenceEvent` that triggered it.
- The `evidence_hash` **MUST** match the `event_hash` of the corresponding event in the interaction's evidence chain.
- The receiver **MAY** use evidence replay to verify that no events were missed between webhook deliveries.

### Replay-First Verification

Consistent with the events binding, the webhook binding is **replay-first and push-assisted**:

- The receiver **SHOULD** periodically verify its local state against the authoritative evidence chain via replay (HTTP `GET /interactions/{id}/evidence`).
- If the receiver detects a gap between successive `evidence_hash` values in webhook deliveries, it **SHOULD** fall back to replay rather than trusting push continuity.

## Conformance Expectations

A conforming webhook binding implementation:

- Registers webhooks with HTTPS callback URLs and shared secrets
- Delivers at-least-once with HMAC-SHA256 signature
- Retries on non-2xx with exponential backoff
- Verifies signatures on the receiver side
- Deduplicates by `webhook_id`
- References evidence hashes in every delivery
- Respects registration expiry
- Supports all defined event types

## Open Questions

The next revision should decide:

- Whether webhook registrations should be discoverable via the HTTP binding's discovery surface
- Whether group/fan-out registrations should be supported natively or deferred to the brokered events binding
- Whether delivery receipts should be formalized as evidence events on the sender side
