# oaps-mcp-v1

## 1. Purpose

The OAPS MCP Profile defines how OAPS actors expose and consume MCP servers with delegation, policy, evidence, and error semantics attached.

This profile is intentionally incremental. It standardizes MCP **tool** interop first. Resource and prompt mappings are included as informative guidance, not normative v1 requirements.

## 2. Deployment models

A conforming `oaps-mcp-v1` implementation MAY be deployed as:

- a **sidecar proxy** in front of an existing MCP server
- a **gateway** speaking OAPS HTTP on one side and MCP transport on the other
- an **embedded library** wrapping an MCP client or host

The deployment model MUST NOT change the normative behavior defined below.

## 3. Discovery mapping

An actor exposing MCP support MUST include an endpoint like:

```json
{
  "kind": "mcp",
  "profile": "oaps-mcp-v1",
  "url": "https://tools.example/mcp"
}
```

A conforming adapter MUST support:

- `GET /capabilities` on the OAPS side
- `tools/list` on the MCP side

The adapter:
1. calls `tools/list`
2. maps each MCP tool to a `CapabilityCard`
3. assigns `kind = "tool"`
4. preserves the input schema
5. assigns or derives a risk class

## 4. Capability mapping

| OAPS field | MCP field | Rule |
|---|---|---|
| `name` | `tool.name` | MUST map directly |
| `description` | `tool.description` | SHOULD map directly |
| `input_schema` | `tool.inputSchema` | MUST preserve fidelity |
| `kind` | n/a | MUST be `tool` |
| `risk_class` | n/a | MUST be preserved or derived by adapter |
| `output_schema` | n/a | OAPS-side metadata only unless server provides equivalent metadata |

## 5. Invocation mapping

An OAPS invoke intent:

```json
{
  "intent_id": "int_1",
  "verb": "invoke",
  "object": "tool:read_repo",
  "constraints": {
    "arguments": {
      "path": "README.md"
    }
  }
}
```

maps to MCP:

- method: `tools/call`
- params:
  - `name`: `read_repo`
  - `arguments`: `{ "path": "README.md" }`

For `verb = "invoke"`, `constraints.arguments` MUST be present.

## 6. Policy enforcement

A conforming adapter MUST evaluate OAPS policy before invoking the MCP tool.

The adapter MUST:
1. resolve the target capability
2. construct canonical `ctx`
3. evaluate policy
4. stop execution and return `POLICY_DENIED` if denied
5. proceed only if allowed or approved

The adapter MUST NOT treat policy as post-hoc audit-only metadata.

## 7. Evidence sidecar

For every MCP tool call, the adapter MUST emit at least two evidence events.

### 7.1 Start event

```json
{
  "event_id": "evt_1",
  "interaction_id": "ix_1",
  "event_type": "mcp.tool_call.started",
  "actor": "urn:oaps:actor:agent:builder",
  "timestamp": "2026-04-03T10:00:00Z",
  "prev_event_hash": "sha256:0",
  "event_hash": "sha256:...",
  "input_hash": "sha256:..."
}
```

### 7.2 Completion event

```json
{
  "event_id": "evt_2",
  "interaction_id": "ix_1",
  "event_type": "mcp.tool_call.completed",
  "actor": "urn:oaps:actor:agent:builder",
  "timestamp": "2026-04-03T10:00:01Z",
  "prev_event_hash": "sha256:...",
  "event_hash": "sha256:...",
  "output_hash": "sha256:..."
}
```

For `R4` and `R5`, the adapter MUST also record:
- policy decision identifier
- delegation reference
- approval reference if present
- authenticated subject binding result

## 8. Error mapping

A conforming adapter MUST translate common MCP failure modes into OAPS error codes.

| MCP condition | OAPS code |
|---|---|
| tool missing | `CAPABILITY_NOT_FOUND` |
| invalid arguments | `VALIDATION_FAILED` |
| upstream unavailable | `UPSTREAM_UNAVAILABLE` |
| upstream timeout | `EXECUTION_TIMEOUT` |
| upstream auth failure | `UPSTREAM_AUTH_FAILED` |

## 9. Authentication

If the upstream MCP server requires auth, the adapter MAY use its configured auth method. Upstream auth outcome SHOULD be captured in evidence metadata.

## 10. Informative resource mapping

Resources are not normative in `oaps-mcp-v1`, but an expected future mapping would be:

- `CapabilityCard.kind = "resource"`
- `name`
- `resource_uri`
- `mime_type`

## 11. Informative prompt mapping

Prompts are also not normative in `oaps-mcp-v1`, but an expected future mapping would be:

- `CapabilityCard.kind = "prompt"`
- `name`
- `description`
- input slots as structured schema metadata

## 12. Conformance

A conforming `oaps-mcp-v1` implementation:

- MUST map MCP tools to `CapabilityCard`
- MUST preserve input schema fidelity
- MUST derive or assign `risk_class`
- MUST enforce OAPS policy before tool execution
- MUST emit evidence events
- MUST map errors into OAPS errors
- SHOULD support sidecar, gateway, or embedded deployment
- MAY add informative support for resources and prompts
