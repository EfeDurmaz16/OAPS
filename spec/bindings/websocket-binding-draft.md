# OAPS WebSocket Binding Draft

## Status

Draft binding specification for real-time bidirectional OAPS messaging over WebSocket.

This is the fourth binding-track draft after HTTP, JSON-RPC, and gRPC.

**Version:** `0.1.0-draft`

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be
interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

## Purpose

The WebSocket binding enables real-time bidirectional agent-to-agent messaging
over WebSocket, with AICP governance (delegation, approval, evidence) on every
message. It is designed for scenarios that require low-latency, persistent
channels between actors participating in an OAPS interaction.

## Binding Principles

The WebSocket binding MUST:

- preserve OAPS core semantics without translating them into a vendor-specific API shape
- remain compatible with the HTTP, JSON-RPC, and gRPC bindings' lifecycle, replay, and error rules
- carry delegation, approval, and evidence as first-class concerns on every frame
- keep connection identity, interaction binding, and evidence chaining explicit at the binding layer
- treat every WebSocket frame as an auditable event in the interaction's evidence chain

## Connection Lifecycle

### Endpoint

A conforming server MUST expose a WebSocket upgrade endpoint at:

```
{interaction_endpoint}/ws?interaction_id={id}
```

### Connection Establishment

1. The client MUST initiate a WebSocket upgrade request to the endpoint above.
2. The server MUST verify the connecting actor's identity before accepting the upgrade. Authentication MUST use Bearer token or session-based authentication transmitted during the HTTP upgrade handshake.
3. A WebSocket connection MUST be bound to exactly one Interaction. The `interaction_id` query parameter is REQUIRED.
4. The server MUST reject the upgrade if the interaction does not exist or the actor is not authorized to participate.

### Handshake

1. After the WebSocket connection is established, the server MUST send an initial `handshake` frame containing version negotiation information.
2. The client MUST respond with a `handshake` frame confirming the negotiated version.
3. The handshake MUST include AICP version negotiation using the same semantics defined in the core specification (`spec_version`, `min_supported_version`, `max_supported_version`).
4. If version negotiation fails, the server MUST send an `error` frame and close the connection with status code 1008 (Policy Violation).

### Evidence on Connect/Disconnect

- The server MUST emit an EvidenceEvent of type `ws.connection.opened` when a connection is accepted.
- The server MUST emit an EvidenceEvent of type `ws.connection.closed` when a connection terminates, whether cleanly or due to error.
- Both events MUST be hash-chained with the interaction's evidence chain.

### Keepalive

- Both client and server SHOULD send `ping` frames at a configurable interval (RECOMMENDED default: 30 seconds).
- The receiving side MUST respond to a `ping` with a `pong` within the keepalive timeout.
- If no `pong` is received within the keepalive timeout (RECOMMENDED default: 10 seconds), the sender SHOULD close the connection.

## Message Format

All WebSocket text frames MUST contain a single JSON object conforming to the following structure:

```json
{
  "type": "handshake" | "message" | "transition" | "approval_request" | "approval_decision" | "evidence" | "challenge" | "replay" | "error" | "ping" | "pong",
  "interaction_id": "string (REQUIRED)",
  "message_id": "string (REQUIRED, unique per frame)",
  "actor_ref": {
    "actor_id": "string (REQUIRED)"
  },
  "payload": { },
  "timestamp": "RFC 3339 date-time (REQUIRED)"
}
```

Binary WebSocket frames MUST NOT be used for OAPS protocol messages. An implementation that receives a binary frame MUST respond with an `error` frame with code `INVALID_FRAME_TYPE`.

## Message Types

### `handshake`

Exchanged during connection establishment. The payload MUST contain:

```json
{
  "spec_version": "0.4-draft",
  "min_supported_version": "0.4",
  "max_supported_version": "0.4",
  "role": "server" | "client"
}
```

### `message`

Carries a regular OAPS Message append. The payload MUST be a valid OAPS Envelope. This is semantically equivalent to `POST /interactions/{id}/messages` in the HTTP binding.

### `transition`

Notifies connected actors of an InteractionTransition. The payload MUST be a valid InteractionTransition object.

### `approval_request`

Delivers a real-time approval gate. The payload MUST be a valid ApprovalRequest object.

### `approval_decision`

Carries an approval response. The payload MUST be a valid ApprovalDecision object.

### `evidence`

Broadcasts an EvidenceEvent. The payload MUST be a valid EvidenceEvent object. Servers MUST broadcast evidence events to all connected actors on the same interaction.

### `challenge`

Delivers a Challenge notification. The payload MUST be a valid Challenge object.

### `replay`

Requests evidence replay. The payload MUST contain:

```json
{
  "after": "event_id (OPTIONAL — start after this event)",
  "limit": "number (OPTIONAL — max events to return)"
}
```

The server MUST respond with one or more `evidence` frames containing the requested events, followed by a final `evidence` frame with `"replay_complete": true` in its payload metadata.

### `error`

Delivers an ErrorObject. The payload MUST be a valid OAPS ErrorObject.

### `ping` / `pong`

Keepalive frames. The payload MAY be empty or contain an opaque token that MUST be echoed back in the corresponding `pong`.

## Evidence Requirements

1. Every message sent over the WebSocket MUST produce an EvidenceEvent appended to the interaction's evidence chain.
2. Evidence MUST be hash-chained using the same `prev_event_hash` / `event_hash` mechanism defined in the core specification.
3. Both sides MUST be able to request evidence replay via a `replay` message type.
4. The evidence event type SHOULD follow the pattern `ws.{message_type}` (e.g., `ws.message`, `ws.transition`, `ws.approval_request`).

## Interaction Binding

1. Every frame MUST include an `interaction_id` field.
2. The `interaction_id` in every frame MUST match the interaction bound during connection establishment.
3. A frame with a mismatched `interaction_id` MUST be rejected with an `error` frame containing code `INTERACTION_ID_MISMATCH`.

## Security

1. WebSocket connections MUST use WSS (WebSocket Secure over TLS). Implementations MUST NOT accept unencrypted `ws://` connections for OAPS protocol traffic.
2. Bearer token or session authentication MUST be verified during the HTTP upgrade handshake, before the WebSocket connection is established.
3. If the connecting actor is acting on behalf of another actor via delegation, the delegation MUST be verified before the connection is accepted. The delegation token SHOULD be passed as a query parameter or during the handshake phase.
4. A server MUST close the connection with status code 1008 (Policy Violation) if authentication or delegation verification fails after connection establishment.

## Error Handling

1. Transport-level errors (malformed JSON, binary frames, oversized messages) MUST result in an `error` frame followed by connection closure.
2. Protocol-level errors (invalid message type, missing required fields, interaction mismatch) MUST result in an `error` frame. The connection MAY remain open at the server's discretion.
3. All error frames MUST contain a valid OAPS ErrorObject in the payload.

## Close Semantics

1. Either side MAY initiate a clean close using the WebSocket close handshake.
2. The closing party SHOULD send a close frame with an appropriate status code:
   - 1000 (Normal Closure) — interaction completed or actor disconnecting
   - 1008 (Policy Violation) — authentication/authorization failure
   - 1011 (Unexpected Condition) — internal server error
3. The server MUST emit a `ws.connection.closed` evidence event regardless of how the connection terminates.
