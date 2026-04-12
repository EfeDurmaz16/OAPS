# AICP Conformance Scope Index

## Purpose

This index names the current suite scopes that appear in the conformance manifest and fixture index.

It is a maintained navigation aid, not a generated artifact.

## Scope Index

| Scope | Pack | Current status note | Current emphasis |
| --- | --- | --- | --- |
| `core` | `conformance/fixtures/core/index.v1.json` | implementation-backed baseline | core semantic slices and evidence lines |
| `binding:http` | `conformance/fixtures/bindings/http/index.v1.json` | runtime-backed reference binding | HTTP transport, approval, and evidence paths |
| `binding:jsonrpc` | `conformance/fixtures/bindings/jsonrpc/index.v1.json` | draft fixture-backed binding | RPC transport mapping |
| `binding:grpc` | `conformance/fixtures/bindings/grpc/index.v1.json` | draft fixture-backed binding | typed RPC transport mapping |
| `binding:events` | `conformance/fixtures/bindings/events/index.v1.json` | draft fixture-backed binding | event and webhook mapping |
| `profile:mcp` | `conformance/fixtures/profiles/mcp/index.v1.json` | runtime-backed profile slice | tool governance and evidence |
| `profile:a2a` | `conformance/fixtures/profiles/a2a/index.v1.json` | draft fixture-backed profile | task and message lifecycle |
| `profile:auth-web` | `conformance/fixtures/profiles/auth-web/index.v1.json` | runtime-backed baseline trust slice | subject binding and trust boundary |
| `profile:auth-fides-tap` | `conformance/fixtures/profiles/auth-fides-tap/index.v1.json` | draft high-assurance trust slice | stronger attestation and delegation proof |
| `profile:x402` | `conformance/fixtures/profiles/x402/index.v1.json` | draft payment slice | payment challenge and coordination |
| `profile:mpp` | `conformance/fixtures/profiles/mpp/index.v1.json` | draft payment-session slice | machine payment session semantics |
| `profile:ap2` | `conformance/fixtures/profiles/ap2/index.v1.json` | draft payment-authorization slice | mandate and authorization semantics |
| `profile:acp` | `conformance/fixtures/profiles/acp/index.v1.json` | draft commerce alignment slice | agentic commerce semantics |
| `profile:ucp` | `conformance/fixtures/profiles/ucp/index.v1.json` | draft commerce alignment slice | universal commerce semantics |
| `profile:osp` | `conformance/fixtures/profiles/osp/index.v1.json` | draft provisioning slice | lifecycle, credential delivery, and rotation |
| `profile:agent-client` | `conformance/fixtures/profiles/agent-client/index.v1.json` | draft execution profile | CLI / SSH / agent-client execution semantics |
| `domain:commerce` | `conformance/fixtures/domains/commerce/index.v1.json` | draft domain-family slice | commerce intent, authorization, and fulfillment |

## How To Read This Index

- `runtime-backed` means the current reference implementation exercises part of the scope.
- `implementation-backed baseline` means the suite already relies on the surface in-repo.
- `draft fixture-backed` means the scope exists in the conformance pack, but the runtime claim is still limited.
- `draft high-assurance` means the scope is intentionally tighter and more reviewable than the baseline trust slice.

## Update Rule

If a new scope is added to the conformance manifest, add it here in the same change.
