# OAPS Reference Monorepo

This is the reference TypeScript implementation workspace for the OAPS `v0.4-draft` stack.

At the repository level, OAPS is now being repositioned as a broader protocol suite. This workspace should therefore be read as:

- a real MCP-oriented reference slice
- a proving ground for the suite's core, evidence, policy, and HTTP ideas
- not the full implementation of the long-term OAPS suite

For the suite-level direction, see the repo root documents:

- `CHARTER.md`
- `docs/SUITE-ARCHITECTURE.md`
- `spec/core/FOUNDATION-DRAFT.md`
- `spec/bindings/http-binding-draft.md`

The workspace is intentionally centered on one real vertical slice first:

1. discover MCP tools
2. map them into OAPS capabilities
3. accept an OAPS intent
4. enforce policy before execution
5. require approval for high-risk actions
6. execute the MCP tool call
7. emit evidence and expose the interaction over HTTP

## Packages

- `@oaps/core`: core protocol types, IDs, envelope builder, canonical JSON serializer
- `@oaps/evidence`: SHA-256 evidence hasher, chain builder, verifier
- `@oaps/policy`: `oaps-policy-v1` evaluator and policy context helpers
- `@oaps/mcp-adapter`: MCP adapter with discovery, risk handling, approval gating, and evidence emission
- `@oaps/http`: reference HTTP server exposing OAPS discovery, interaction, approval, revoke, events, and evidence endpoints
- `hono` and `@hono/node-server`: lightweight local workspace shims used by the reference HTTP server

## Commands

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm test
```

`pnpm test` does three things:

1. checks that schema-derived core constants are up to date
2. validates the spec pack examples, including the new foundation draft schema pack, against `schemas/`
3. runs the reference package tests

## Running The Server

```bash
pnpm dev:http
```

The default server listens on `http://localhost:3000`.

Useful endpoints:

- `GET /.well-known/oaps.json`
- `GET /actor-card`
- `GET /capabilities`
- `POST /interactions`
- `GET /interactions/:id`
- `POST /interactions/:id/approve`
- `POST /interactions/:id/reject`
- `POST /interactions/:id/revoke`
- `GET /interactions/:id/evidence`
- `GET /interactions/:id/events`

The reference server expects Bearer auth. The default development token is:

```text
dev-token
```

## Quickstart Flow

Start the server:

```bash
pnpm dev:http
```

Inspect discovery and capabilities:

```bash
curl -s http://localhost:3000/.well-known/oaps.json | jq
curl -s http://localhost:3000/actor-card | jq
curl -s http://localhost:3000/capabilities | jq
```

Create a low-risk interaction that completes immediately:

```bash
curl -s \
  -X POST http://localhost:3000/interactions \
  -H 'Authorization: Bearer dev-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "spec_version": "0.4-draft",
    "min_supported_version": "0.4",
    "max_supported_version": "0.4",
    "message_id": "msg_demo_1",
    "interaction_id": "ix_demo_1",
    "from": { "actor_id": "urn:oaps:actor:agent:builder" },
    "to": { "actor_id": "urn:oaps:actor:server:reference" },
    "channel": "mcp",
    "message_type": "intent.request",
    "timestamp": "2026-04-04T10:00:00Z",
    "payload": {
      "intent_id": "int_demo_1",
      "verb": "invoke",
      "object": "tool:read_repo",
      "constraints": {
        "arguments": {
          "path": "README.md"
        }
      }
    }
  }' | jq
```

Inspect the resulting interaction and evidence:

```bash
curl -s http://localhost:3000/interactions/ix_demo_1 | jq
curl -s http://localhost:3000/interactions/ix_demo_1/evidence | jq
curl -s http://localhost:3000/interactions/ix_demo_1/events | jq
```

Force the approval path by using a high-risk tool name:

```bash
curl -s \
  -X POST http://localhost:3000/interactions \
  -H 'Authorization: Bearer dev-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "spec_version": "0.4-draft",
    "min_supported_version": "0.4",
    "max_supported_version": "0.4",
    "message_id": "msg_demo_2",
    "interaction_id": "ix_demo_2",
    "from": { "actor_id": "urn:oaps:actor:agent:builder" },
    "to": { "actor_id": "urn:oaps:actor:server:reference" },
    "channel": "mcp",
    "message_type": "intent.request",
    "timestamp": "2026-04-04T10:01:00Z",
    "payload": {
      "intent_id": "int_demo_2",
      "verb": "invoke",
      "object": "tool:pay_invoice",
      "constraints": {
        "arguments": {
          "amount": "25.00"
        }
      }
    }
  }' | jq
```

Approve that interaction:

```bash
curl -s \
  -X POST http://localhost:3000/interactions/ix_demo_2/approve \
  -H 'Authorization: Bearer dev-token' \
  -H 'Content-Type: application/json' \
  -d '{ "reason": "Approved for demo" }' | jq
```

## Storage

The HTTP server now supports persistent state through a file-backed store.

- default persistence file: `.oaps-reference-state.json` in the current working directory
- test suites use an in-memory store for isolation
- the storage abstraction lives in `packages/http/src/storage.ts`

## Server Layer Decision

The workspace currently keeps small local `hono` and `@hono/node-server` compatibility packages instead of depending on the upstream packages directly.

This is intentional for now:

- the reference server only needs a very small HTTP surface
- the local layer keeps the runtime deterministic for the spec-focused workspace
- it avoids turning the reference implementation into a framework integration exercise

If the HTTP server grows beyond this thin surface, switching back to the upstream packages is reasonable. Right now the simpler choice is to keep the local layer.

## Scope Boundaries

This workspace is not trying to be a production gateway yet.

Explicitly out of scope here:

- A2A support
- economic authorization
- registry services
- Rust implementation
- multi-profile routing
