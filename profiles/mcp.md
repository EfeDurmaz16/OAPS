# oaps-mcp-v1

## Status

Draft profile for OAPS composition with MCP.

This is a profile document, not the full OAPS core specification.

## Purpose

`oaps-mcp-v1` defines how MCP tool ecosystems participate in OAPS semantics.

It standardizes how OAPS actors expose, consume, and govern MCP tool access while preserving MCP's own transport and discovery semantics.

The profile is intentionally incremental:

- tool interop is normative
- resource and prompt mappings are informative for now
- the goal is OAPS-governed interop, not a replacement for MCP

## Normative Scope

This profile is normative for:

- mapping MCP tools to OAPS capabilities
- mapping OAPS intents to MCP tool calls
- policy gating before execution
- approval insertion and rejection handling for high-risk calls
- evidence emission for MCP-driven execution
- stable translation of common MCP failures into portable OAPS errors

This profile remains informative for:

- resource mappings
- prompt mappings
- subscription-like surfaces
- MCP-native transport bindings outside the existing adapter path

## Relationship To The Suite

`oaps-mcp-v1` sits above MCP and below the OAPS core semantics.

It maps:

- MCP tools to OAPS capabilities
- OAPS intents to MCP tool calls
- OAPS policy decisions to pre-execution gating
- OAPS evidence events to hash-linked lineage

It must not introduce MCP-specific transport behavior into the OAPS core.

## Deployment Models

A conforming implementation MAY be deployed as:

- a sidecar proxy in front of an existing MCP server
- a gateway speaking OAPS on one side and MCP on the other
- an embedded library wrapping an MCP client or host

The deployment model MUST NOT change the normative mapping behavior defined by the profile.

## Discovery And Capability Mapping

A conforming adapter MUST:

1. discover MCP tools
2. map each tool to an OAPS `Capability`
3. preserve tool metadata only as faithfully as the current runtime can honestly support
4. derive or assign a risk class
5. expose capabilities through the OAPS-facing surface

### Capability Metadata Fidelity Limits

The current capability metadata fidelity matrix is captured in `examples/mcp/capability-metadata-fidelity.v1.json`.

| MCP surface | OAPS anchor | Current claim | Fidelity limit now |
| --- | --- | --- | --- |
| `tool.name` | `Capability.name` | preserved exactly | none in the current runtime-backed slice |
| `tool.description` | `Capability.description` | preserved when present | absent descriptions remain absent |
| `tool.inputSchema` | `Capability.input_schema` | required and preserved | missing or non-object schemas fail closed as invalid upstream metadata |
| `tool.outputSchema` | `Capability.output_schema` | preserved when present | no runtime-backed output validation guarantee is claimed |
| annotations / vendor metadata | `Capability.metadata` | draft-track only | no stable interoperable mapping claim yet |
| risk semantics | `Capability.risk_class` | derived or assigned by adapter | MCP does not define a native portable risk class |

The current reference line now treats missing required schema metadata or malformed tool metadata as explicit validation failures rather than silently projecting malformed capabilities.

## Invocation Mapping

An OAPS invoke intent MUST be mappable to MCP `tools/call`.

For invoke flows:

- the target tool name must resolve from the OAPS object reference
- arguments must be carried through without lossy schema translation
- the adapter must reject malformed invoke intents before tool execution
- policy denial must happen before the MCP tool call executes
- approval rejection must remain visible as a distinct authorization outcome rather than collapsing into generic failure

## Policy, Approval, And Authority

A conforming `oaps-mcp-v1` adapter MUST evaluate OAPS policy before execution.

The adapter MUST:

1. resolve the capability
2. construct the canonical policy context
3. evaluate policy
4. halt on denial
5. insert approval when risk policy requires it
6. halt on approval rejection
7. proceed only when allowed or explicitly approved

If authenticated subject binding is available through `oaps-auth-web-v1` or a stronger trust profile, it MUST be checked before the tool call proceeds.

### Evidence Notes For Policy-Context-Hash Expectations

The current runtime-backed slice now makes the policy-context-hash expectations explicit:

- high-risk policy denial emits `mcp.tool_call.denied` evidence with `evaluated_context_hash`
- high-risk approval-required paths emit `approval.requested` evidence with `evaluated_context_hash`
- started execution for the accepted call path carries `evaluated_context_hash` on `mcp.tool_call.started`
- the current runtime does **not** yet claim that every later evidence event (`approval.rejected`, `mcp.tool_call.completed`, or `mcp.tool_call.failed`) always repeats that hash

That boundary is intentional: the profile claims the hash where policy or approval context must be reconstructed, not as a blanket guarantee on every downstream event yet.

## Resources And Prompts Mapping Notes

Resources and prompts remain informative only in the current draft.

The current mapping posture is:

- MCP tools are normative and runtime-backed
- MCP resources are informative only and may later map to OAPS context/resource descriptors
- MCP prompts are informative only and may later map to intent templates or profile metadata

See `examples/mcp/resources-prompts.mapping.md` for the current draft-only mapping notes.

## Current Runtime-Backed Slice Versus Draft-Track Surface

The current reference-backed slice supports the following runtime-backed profile-specific claims:

- tool capability mapping with schema preservation for valid input/output schema objects
- policy denial before tool execution
- approval insertion for high-risk calls
- approval rejection as an explicit OAPS authorization outcome
- evidence emission with high-risk policy-context hashes on denial/requested/start boundaries
- translation of capability lookup failure, upstream timeout, upstream auth failure, validation failure, and authenticated-subject mismatch into stable OAPS errors
- fail-closed handling for missing required tool schema or malformed tool metadata

The current slice does **not** yet claim runtime-backed interop for:

- MCP resources
- MCP prompts
- subscription-like surfaces
- MCP-native transport bindings outside the existing adapter path

## Compatibility Declaration Examples

Illustrative profile-support declarations now exist under `examples/mcp/`:

- `profile-support.partial.v1.json` — partial `oaps-mcp-v1` support where only a subset of the current known surfaces is claimed
- `profile-support.compatible.v1.json` — compatible support for the current runtime-backed MCP scope

These are reader-facing examples. The machine-derived compatibility declarations remain under `conformance/results/examples/`.

## Error Mapping

`oaps-mcp-v1` MUST translate common MCP failures into portable OAPS errors.

Expected mappings include:

- missing tool -> capability error
- invalid arguments or malformed tool metadata -> validation error
- upstream unavailable -> transport error
- upstream timeout -> timeout error
- upstream auth failure -> authentication error

Implementations may carry upstream details in error metadata, but the portable error category must remain stable.

## Conformance

A conforming `oaps-mcp-v1` implementation:

- MUST map MCP tools to OAPS capabilities
- MUST preserve required input schema fidelity for valid tool metadata
- MUST derive or assign a risk class
- MUST enforce OAPS policy before execution
- MUST surface approval rejection distinctly when approval is denied
- MUST emit evidence events
- MUST map common MCP failures to OAPS errors
- SHOULD support sidecar, gateway, or embedded deployment

The current conformance pack makes the runtime-backed high-risk paths more explicit via dedicated policy-denial, approval-rejection, and invalid-upstream-metadata scenarios without overclaiming unsupported MCP interop.

## Open Questions

The draft still needs formal answers for:

- how much of MCP resource semantics should eventually be normative
- how much of MCP prompt semantics should eventually be normative
- how deeply MCP auth should be bridged into the OAPS identity profiles
- whether an MCP-native JSON-RPC binding should be a first-class binding draft or remain profile-specific
