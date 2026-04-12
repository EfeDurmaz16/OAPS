# OAPS gRPC Binding Draft

## Status

Draft binding specification for transporting OAPS semantics over gRPC.

This is the third binding-track draft after HTTP and JSON-RPC.

**Version:** `0.1.0-draft`

## Purpose

The gRPC binding defines how OAPS discovery, interaction lifecycle,
message append, approval, revocation, evidence, and replay semantics can be
carried over strongly typed RPC services without collapsing them into
transport-specific product APIs.

## Binding Principles

The gRPC binding must:

- preserve OAPS core semantics rather than redefining them as vendor RPC names
- remain compatible with the HTTP and JSON-RPC bindings' lifecycle, replay, and error rules
- make unary versus streaming behavior explicit instead of implicit
- keep metadata, authentication, and idempotency visible at the binding layer
- preserve stable OAPS error objects even when gRPC status codes vary by runtime

## Package And Service Layout

The draft package root is:

- `oaps.bindings.grpc.v1`

The repository's initial package layout now lives under:

- `reference/proto/oaps/bindings/grpc/v1/oaps_bindings_grpc.proto`

The current draft service split is:

- `DiscoveryService`
- `InteractionsService`
- `ReplayService`

Bindings MAY add namespaced extension services, but they SHOULD NOT redefine the
meaning of the canonical OAPS service and method families below.

## Canonical Method Families

The current draft method mapping is:

- discovery
  - `GetWellKnown`
  - `GetActorCard`
  - `ListCapabilities`
- interactions
  - `CreateInteraction`
  - `GetInteraction`
  - `AppendMessage`
- approvals and authority changes
  - `ApproveInteraction`
  - `RejectInteraction`
  - `RevokeInteraction`
- replay and follow
  - `ListEvents`
  - `ListEvidence`
  - `WatchEvents`
  - `WatchEvidence`

These methods are transport-specific names for the same semantic families already
present in the HTTP and JSON-RPC drafts.

## Unary Versus Streaming Mapping

The draft binding separates authoritative unary mutation calls from optional
server-streaming follow surfaces.

### Unary Methods

The following methods are unary in the current draft:

- `GetWellKnown`
- `GetActorCard`
- `ListCapabilities`
- `CreateInteraction`
- `GetInteraction`
- `AppendMessage`
- `ApproveInteraction`
- `RejectInteraction`
- `RevokeInteraction`
- `ListEvents`
- `ListEvidence`

Unary remains the authoritative surface for:

- discovery
- interaction creation and retrieval
- append-only message mutation
- approval, rejection, and revocation
- replay-window pagination using `after` and `limit`

### Streaming Methods

The current draft uses server streaming only for follow-style replay tails:

- `WatchEvents`
- `WatchEvidence`

Streaming methods are optional draft-track additions for receivers that want a
push-like continuation after an initial replay position is established.

They MUST NOT replace the authoritative unary replay methods. A conforming
implementation that offers streaming follow should still expose unary replay so a
client can recover from disconnects by replaying from the last durable event id.

## Interaction And Mutation Mapping

`CreateInteraction` is the gRPC equivalent of `POST /interactions` and
`oaps.interactions.create`.

`AppendMessage` is the append-only follow-on mutation for interaction progress or
message continuation.

`ApproveInteraction`, `RejectInteraction`, and `RevokeInteraction` are the
canonical authority-changing mutations for the existing lifecycle.

The binding SHOULD keep `interaction_id` explicit in request messages even when a
nested envelope also contains it.

## Replay Mapping

`ListEvents` and `ListEvidence` are the authoritative replay methods.

They reuse the same minimal replay-window concepts as HTTP and JSON-RPC:

- `after`
- `limit`
- oldest-to-newest append-order replay semantics

`WatchEvents` and `WatchEvidence` may continue from the same replay position, but
they remain draft-track follow surfaces rather than the only recovery mechanism.

## Metadata And Header Mapping

The current draft maps binding metadata into gRPC metadata headers and trailers.

Recommended request metadata keys include:

- `authorization`
- `x-oaps-spec-version`
- `x-oaps-min-supported-version`
- `x-oaps-max-supported-version`
- `x-oaps-idempotency-key`
- `x-oaps-correlation-id`
- `x-oaps-actor-id`
- `x-oaps-replay-after`
- `x-oaps-replay-limit`

Recommended response or trailer metadata keys include:

- `x-oaps-interaction-id`
- `x-oaps-next-after`
- `x-oaps-error-code`
- `x-oaps-error-category`
- `x-oaps-retryable`

The binding SHOULD preserve the same idempotency rule as HTTP for unary mutating
methods: the same authenticated caller, method, request body, and idempotency key
should yield the original result rather than duplicate lifecycle transitions.

## Error Mapping Rules

The gRPC transport status code does **not** replace the stable OAPS error object.

The draft mapping is:

- gRPC status code for transport-readable failure class
- an OAPS error detail message for the stable portable `ErrorObject`
- optional trailing metadata for quick classification hints

Recommended transport mappings are:

- authentication failures -> `UNAUTHENTICATED`
- authorization failures -> `PERMISSION_DENIED`
- validation failures -> `INVALID_ARGUMENT`
- missing interactions or discovery targets -> `NOT_FOUND`
- approval state conflicts or idempotency conflicts -> `FAILED_PRECONDITION`
- timeouts -> `DEADLINE_EXCEEDED`
- internal failures -> `INTERNAL`
- transport dependency failure -> `UNAVAILABLE`

When a receiver can provide structured status details, it SHOULD carry the
portable OAPS error object there rather than flattening everything into a string.

## Example Pack And Proto Notes

The repository now includes:

- a first example pack under `examples/grpc/`
- a draft `.proto` package layout under `reference/proto/oaps/bindings/grpc/v1/`
- discovery request/response examples
- a service-map example describing unary versus server-streaming boundaries
- replay request, streaming follow, metadata mapping, and error-detail examples

The example pack covers:

- unary discovery request/response shapes
- interaction create and message append request shapes
- unary approve/reject/revoke mutations
- replay-window list calls
- server-streaming event and evidence follow examples
- metadata/header mapping notes
- gRPC status plus OAPS error-detail mapping

## Conformance Expectations

The current gRPC conformance slice is fixture-only.

It currently expects:

- service and package layout examples
- unary discovery and interaction method examples
- explicit unary-versus-streaming boundary notes
- replay method examples using `after` and `limit`
- metadata/header mapping notes
- gRPC-status-to-OAPS-error mapping example

No in-repo runtime currently claims gRPC support yet.

## Open Questions

The next binding revision should decide:

- whether bidi streaming is ever necessary beyond the current unary plus server-streaming draft
- whether protobuf-native core objects should become first-class contracts or remain binding wrappers around shared semantic payloads
- how much metadata should be standardized before it becomes profile-specific
- whether event and evidence watch methods should negotiate resumption tokens beyond `after`
