# OAPS JSON-RPC Binding Draft

## Status

Draft binding specification for transporting OAPS semantics over JSON-RPC 2.0.

This is the second binding-track draft after HTTP.

## Purpose

The JSON-RPC binding defines how the same OAPS discovery, interaction,
approval, revocation, evidence, and replay semantics can be carried over a
bidirectional RPC surface without collapsing them into transport-specific
vendor methods.

## Binding Principles

The JSON-RPC binding must:

- preserve OAPS core semantics without replacing them with vendor-only method names
- remain compatible with the HTTP binding's lifecycle, error, and replay rules
- keep correlation, idempotency, and replay explicit
- distinguish authoritative request/response methods from best-effort notifications

## Method Families

The draft method families are:

- `oaps.discover`
- `oaps.actor.get`
- `oaps.capabilities.list`
- `oaps.interactions.create`
- `oaps.interactions.get`
- `oaps.interactions.message.append`
- `oaps.interactions.approve`
- `oaps.interactions.reject`
- `oaps.interactions.revoke`
- `oaps.interactions.events.list`
- `oaps.interactions.evidence.list`

Bindings MAY add namespaced extension methods, but they SHOULD NOT redefine the
meaning of the canonical method families above.

## Discovery

`oaps.discover` is the bootstrap call.

Its result SHOULD advertise:

- current OAPS version
- actor-card and capability methods
- interaction create/get methods
- supported auth schemes
- supported profiles

## Interaction And Mutation Methods

`oaps.interactions.create` is the JSON-RPC equivalent of `POST /interactions`.

`oaps.interactions.message.append`, `approve`, `reject`, and `revoke` are the
canonical mutation methods for the existing interaction lifecycle.

The binding SHOULD keep the addressed `interaction_id` explicit in `params`
even when the nested OAPS envelope also contains it.

## Correlation And Idempotency

JSON-RPC `id` provides transport-level correlation.

It does **not** replace:

- `interaction_id` for durable OAPS lifecycle continuity
- `message_id` for message identity
- `Idempotency-Key`-equivalent semantics for safe retry

For mutating methods, the draft binding therefore carries an explicit
`idempotency_key` inside `params` or via binding metadata. Implementations
SHOULD preserve the same replay rule as HTTP:

- same authenticated actor
- same method
- same request body
- same idempotency key

must yield the original result.

## Error Mapping

The JSON-RPC binding SHOULD carry OAPS errors inside JSON-RPC error data rather
than flattening them into transport-only failures.

Recommended shape:

- JSON-RPC `error.code` for RPC-layer classification
- JSON-RPC `error.message` for RPC-readable summary
- `error.data.oaps_error` for the stable OAPS `ErrorObject`

That keeps portable OAPS categories and codes available to higher layers.

## Replay Methods

`oaps.interactions.events.list` and `oaps.interactions.evidence.list` are the
replay methods for ordered lifecycle events and hash-linked evidence.

They reuse the same minimal replay-window concepts as HTTP:

- `after`
- `limit`
- append-order replay semantics

## Notifications Versus Request/Response

The draft binding distinguishes:

- authoritative request/response methods for discovery, mutations, and replay
- optional notifications for non-authoritative progress fan-out

Notifications MAY be used for progress updates such as
`oaps.interactions.updated`, but they MUST NOT replace the authoritative replay
methods or final mutation acknowledgements.

## Example Pack

The repository now includes first JSON-RPC examples under `examples/jsonrpc/`,
including:

- discovery request/response examples
- interaction create and message append examples
- approve/reject/revoke mutation examples
- replay request/response examples
- notification example
- JSON-RPC error mapping example

## Conformance Expectations

The current JSON-RPC conformance slice is still fixture-only.

It currently expects:

- discovery request/response examples
- interaction and message method examples
- approval and revocation method examples
- replay method examples
- JSON-RPC correlation and idempotency examples
- notification-boundary examples
- JSON-RPC-to-OAPS error mapping example

No in-repo runtime currently claims JSON-RPC support yet.
