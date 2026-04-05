# OAPS HTTP Binding Draft

## Status

Draft binding specification for transporting OAPS semantics over HTTP.

This document is the first binding-track draft for the OAPS suite.

## Purpose

The HTTP binding defines how OAPS semantics are carried over HTTP without baking transport details into the core semantic model.

It is intended to support:

- discovery
- interaction exchange
- long-running task progression
- approval and rejection flows
- message append/progress flows
- evidence retrieval
- idempotent mutation behavior
- version negotiation

## Binding Principles

The HTTP binding must:

- preserve OAPS core semantics without translating them into a vendor-specific API shape
- remain compatible with future JSON-RPC, gRPC, and event/webhook bindings
- support both synchronous and asynchronous interaction flows
- keep discovery and versioning explicit
- treat identity, delegation, and evidence as first-class transport concerns

## Canonical HTTP Surface

The canonical HTTP surface should expose:

- `GET /.well-known/oaps.json`
- `GET /actor-card`
- `GET /capabilities`
- `POST /interactions`
- `GET /interactions/{id}`
- `POST /interactions/{id}/messages`
- `POST /interactions/{id}/approve`
- `POST /interactions/{id}/reject`
- `POST /interactions/{id}/revoke`
- `GET /interactions/{id}/evidence`
- `GET /interactions/{id}/events`

These endpoints are the current reference shape for the suite. Later bindings may use different wire shapes while preserving the same semantics.

## Example Contract Pack

The current repository now ships a concrete HTTP example pack under
`examples/http/`.

Key entry points:

- `examples/http/discovery-contract.v1.json` — maps every normative endpoint to representative request/response examples
- `examples/http/*.response.json` — canonical response-body examples for the current reference slice
- `examples/http/requests/` — representative mutation request bodies
- `examples/http/errors/` — stable error-payload examples reused across the binding draft
- `examples/http/media-type.canonical-response.v1.json` — canonical `application/oaps+json` response examples
- `examples/http/media-type.compatibility-fallback.v1.json` — draft compatibility example for `application/json` fallback where still permitted

## Messages

`POST /interactions/{id}/messages` is the canonical HTTP mutation for appending a new message or progress update to an existing interaction.

The endpoint should be treated as an append-only lifecycle step, not as a replacement for `POST /interactions`.

A conforming implementation should:

- require the target interaction to exist
- preserve the authenticated actor context
- fail closed if the authenticated subject does not match the message envelope sender for direct subject-bound append flows
- append the incoming message to the interaction history
- update `updated_at`
- emit a corresponding evidence event
- return the updated interaction state in a stable response shape

The endpoint may accept an OAPS envelope or a binding-specific message wrapper, but it must not collapse the interaction history into an ad hoc transport payload.

If the interaction does not exist, the endpoint must fail with a stable OAPS discovery error rather than inventing a new interaction.

If an implementation does not yet support message append flows, it should not claim conformance to this portion of the binding.

## Discovery

`GET /.well-known/oaps.json` should provide at least:

- `oaps_version`
- `actor_card_url`
- `capabilities_url`
- `interactions_url`
- supported auth schemes
- supported profiles

Discovery is not optional for a conformant HTTP binding.

## Content Type

The canonical media type for OAPS HTTP payloads should be `application/oaps+json`.

If an implementation also accepts or emits `application/json`, that should be treated as a compatibility allowance rather than the normative target.

The current example pack therefore distinguishes:

- canonical response examples that assume `application/oaps+json`
- a separate draft compatibility-fallback example that shows how `application/json` may still be described without treating it as the normative target

## Version Negotiation

The HTTP binding should carry protocol version information explicitly.

The binding must define:

- current version
- minimum supported version
- maximum supported version
- failure behavior when versions are incompatible

Version negotiation failures should surface as a stable OAPS error category rather than generic HTTP failure alone.

## Interaction Semantics

The HTTP binding should support both:

- immediate completion
- pending approval or long-running progress

An interaction response may therefore be:

- completed
- pending_approval
- failed
- revoked

The binding must preserve the OAPS interaction lifecycle rather than collapsing it into a single request-response shape.

## Idempotency

Mutating HTTP endpoints should accept `Idempotency-Key`.

The binding must preserve the following semantics:

- same authenticated actor
- same endpoint
- same request body
- same idempotency key

must yield the original result.

If the same key is reused with a different payload, the binding must surface a deterministic conflict error.

For the current draft, this rule applies to the full canonical mutation surface, not only initial interaction creation. In particular:

- `POST /interactions`
- `POST /interactions/{id}/messages`
- `POST /interactions/{id}/approve`
- `POST /interactions/{id}/reject`
- `POST /interactions/{id}/revoke`

should all preserve idempotent replay for identical retries by the same authenticated actor. That keeps approval, rejection, revocation, and follow-on message flows safe to retry without duplicating lifecycle transitions or evidence events.

## Authentication

The HTTP binding must support at least one authentication family.

The default suite posture is:

- `oaps-auth-web-v1` as the baseline profile
- `oaps-fides-tap-v1` as a high-assurance profile

Authentication must remain compatible with profile-based identity upgrades.

## Evidence

The HTTP binding must not treat evidence as optional metadata.

It should support:

- evidence retrieval
- event retrieval
- replayable hash-linked lineage
- input/output references where available

The binding should remain compatible with replayable cryptographic lineage requirements in the core foundation draft.

## Event Replay Semantics

For the current HTTP draft, event replay is **replay-first and pull-based**.

That means:

- `GET /interactions/{id}/events` is the canonical replay surface for ordered lifecycle events
- `GET /interactions/{id}/evidence` is the canonical replay surface for the hash-linked evidence chain
- the event order returned by replay endpoints should match the append order preserved by the interaction's evidence lineage
- repeated replay of the same interaction should return a stable ordered prefix plus any newer appended events

Push delivery, webhooks, or streaming subscriptions may be added later, but they are not required for the current draft and must not replace the pull-based replay semantics that the reference slice already implements.

## Replay Windows

The current HTTP draft now defines a minimal replay-window contract for both replay endpoints:

- `after=<event_id>` means replay starts strictly **after** the identified event
- `limit=<positive integer>` bounds the number of returned events in the ordered replay window

These parameters apply to both:

- `GET /interactions/{id}/events`
- `GET /interactions/{id}/evidence`

A conforming implementation that supports replay windows MUST:

- preserve append order when slicing the replay stream
- treat `after` as interaction-local rather than global across interactions
- fail with a stable validation error if `after` does not match any event in the addressed interaction
- fail with a stable validation error if `limit` is not a positive integer

Repeated replay with the same `after` and `limit` inputs SHOULD return the same ordered window unless newer events have been appended ahead of the requested suffix. Clients can resume incremental replay by using the last returned `event_id` as the next `after` cursor.

## Default Ordering Semantics

Unless a future binding revision explicitly negotiates otherwise, both replay
endpoints use the same default ordering rule:

- results are returned in append order
- append order means oldest-to-newest within the addressed interaction lineage
- replay windows preserve that same oldest-to-newest order after applying the
  `after` cursor and `limit` bound

This rule applies equally to:

- `GET /interactions/{id}/events`
- `GET /interactions/{id}/evidence`

## Error Handling

The HTTP binding should preserve stable OAPS error objects.

Transport status codes may vary by endpoint, but the OAPS error payload should remain portable across bindings.

## Relationship To Profiles

This binding is not MCP-specific.

The HTTP binding must be able to carry:

- MCP profile mappings
- A2A profile mappings
- payment profile mappings
- provisioning and commerce mappings later

## Relationship To The Reference Implementation

The current TypeScript reference server is the first concrete HTTP binding reference.

It should be treated as:

- a reference slice
- not the final word on all future binding behavior

## Conformance Expectations

A conforming HTTP binding implementation should:

- expose discovery
- expose actor and capability surfaces
- support interaction creation and retrieval
- support approval, rejection, and revoke flows
- support message append/progress flows
- expose evidence and event retrieval
- enforce idempotency
- honor version negotiation
- preserve OAPS error semantics

The current reference conformance pack exercises discovery, interaction creation, message append, message subject-binding rejection, message interaction-id mismatch rejection, approval completion, approval rejection, revocation, evidence retrieval, event retrieval, idempotent replay for create/message/approve/reject/revoke mutations, idempotency conflict handling for create and message-append retries, authentication failure, version negotiation failure, missing interactions, and approval-not-pending behavior against the reference runtime.

## Open Questions

The next binding revision should decide:

- whether gRPC is intended as normative or optional binding family
- how much transport-specific metadata can appear in binding envelopes before it becomes profile-specific
- whether the canonical HTTP media type should be required for all responses or only normative endpoints
- whether replay windows should eventually grow from simple `after`/`limit` semantics into opaque cursors or resumption tokens
