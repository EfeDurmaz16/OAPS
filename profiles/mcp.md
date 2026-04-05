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
- evidence emission for MCP-driven execution

This profile remains informative for:

- resource mappings
- prompt mappings
- subscription-like surfaces

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
3. preserve the MCP input schema fidelity
4. derive or assign a risk class
5. expose capabilities through the OAPS-facing surface

The profile should keep capability mapping stable enough for conformance tests to compare tool identity, schema fidelity, and risk assignment.

## Invocation Mapping

An OAPS invoke intent MUST be mappable to MCP `tools/call`.

For invoke flows:

- the target tool name must resolve from the OAPS object reference
- arguments must be carried through without lossy schema translation
- the adapter must reject malformed invoke intents before tool execution

The profile should allow implementation-specific routing, but not implementation-specific semantic drift.

## Policy And Authority

A conforming `oaps-mcp-v1` adapter MUST evaluate OAPS policy before execution.

The adapter MUST:

1. resolve the capability
2. construct the canonical policy context
3. evaluate policy
4. halt on denial
5. proceed only when allowed or explicitly approved

If authenticated subject binding is available through `oaps-auth-web-v1` or a stronger trust profile, it MUST be checked before the tool call proceeds.

## Evidence Requirements

Every MCP tool call under `oaps-mcp-v1` MUST produce hash-linked evidence events.

At minimum, the profile should preserve:

- start and completion events
- input and output hashes
- policy decision metadata
- approval references when relevant
- delegation references when relevant
- authenticated subject binding outcome

For higher-risk actions, the evidence chain SHOULD be rich enough to support replay and audit without requiring the original MCP exchange to be re-created manually.

## Current Reference Slice Compatibility Notes

The current reference-backed slice supports the following profile-specific compatibility claims:

- policy denial happens before MCP tool execution and is surfaced as an OAPS authorization failure
- high-risk denial and approval-request paths carry an evaluated policy-context hash in emitted evidence
- approval rejection is preserved as an explicit OAPS authorization failure plus `approval.rejected` evidence
- capability lookup failure, authenticated-subject mismatch, approval-modification mismatch, upstream timeout, upstream auth failure, and validation failure are translated into stable OAPS error categories

The current slice does **not** yet claim runtime-backed interop for MCP resources, prompts, subscriptions, or MCP-native transport bindings outside the existing adapter path.

## Error Mapping

`oaps-mcp-v1` MUST translate common MCP failures into portable OAPS errors.

Expected mappings include:

- missing tool -> capability error
- invalid arguments -> validation error
- upstream unavailable -> transport error
- upstream timeout -> timeout error
- upstream auth failure -> authentication error

Implementations may carry upstream details in error metadata, but the portable error category must remain stable.

## Informative Extensions

The following are informative in the current draft:

- resource mapping
- prompt mapping
- subscription-like surfaces

They should be documented for future profiles, but they are not normative requirements of this draft.

## Conformance

A conforming `oaps-mcp-v1` implementation:

- MUST map MCP tools to OAPS capabilities
- MUST preserve input schema fidelity
- MUST derive or assign a risk class
- MUST enforce OAPS policy before execution
- MUST emit evidence events
- MUST map common MCP failures to OAPS errors
- SHOULD support sidecar, gateway, or embedded deployment

The current fixture pack now makes the runtime-backed high-risk paths more explicit without overclaiming unsupported MCP interop. In particular, the reference runtime exercises policy denial before tool execution, approval insertion for high-risk calls, approval rejection handling, explicit error translation for capability lookup failure, authenticated-subject mismatch, approval-modification mismatch, upstream timeout, upstream auth failure, and validation failure, plus evidence emission that carries evaluated policy-context hashes on high-risk denial/request paths.

## Open Questions

The draft still needs formal answers for:

- how much of MCP resource/prompt semantics should eventually be normative
- how deeply MCP auth should be bridged into the OAPS identity profiles
- whether an MCP-native JSON-RPC binding should be a first-class binding draft or remain profile-specific
