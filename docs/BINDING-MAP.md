# OAPS Binding Map

## Purpose

Bindings describe how OAPS semantics travel over concrete transport surfaces.

The binding map names the currently planned families so readers can tell the difference between the semantic layer and the transport layer.

## Binding Families

| Binding family | Current entry point | Current status | What it solves |
| --- | --- | --- | --- |
| HTTP / JSON | [`spec/bindings/http-binding-draft.md`](../spec/bindings/http-binding-draft.md) | Draft | the primary reference transport for the current suite slice |
| JSON-RPC | [`spec/bindings/jsonrpc-binding-draft.md`](../spec/bindings/jsonrpc-binding-draft.md) | Draft | request/response RPC mapping above OAPS semantics |
| gRPC | [`spec/bindings/grpc-binding-draft.md`](../spec/bindings/grpc-binding-draft.md) | Draft | strongly typed RPC mapping for transport-heavy environments |
| Events / webhooks | [`spec/bindings/events-binding-draft.md`](../spec/bindings/events-binding-draft.md) | Draft | push-style change and evidence delivery |

## How To Read The Binding Layer

A binding answers questions such as:

- how an OAPS object is encoded
- how request/response or event envelopes are carried
- how errors and replay windows are represented
- how evidence retrieval behaves over time

A binding does **not** answer questions about the semantic meaning of the primitives themselves.

## Current Boundary

The current repository treats HTTP as the reference binding slice.

The other binding families are present as architecture-track drafts so that the suite can grow without recasting the core semantics every time a new transport appears.

## Review Rule

When reviewing a binding draft, ask whether it preserves the semantic contract while staying honest about transport-specific behavior.
