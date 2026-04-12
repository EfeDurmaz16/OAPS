# AICP Agent Discovery Draft

## Status

Discovery draft for the AICP (Agent Interaction Control Protocol) agent discovery layer.

**Version:** `0.1.0-draft`

**Requirements notation:** The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174) when, and only when, they appear in all capitals.

Companion normative document: `spec/core/FOUNDATION-DRAFT.md`, which defines the Actor primitive and canonical actor types referenced by this document.

## Goal

Agent discovery is the mechanism by which AICP agents locate, identify, and evaluate one another before initiating interactions. A conforming discovery implementation enables agents to find peers, verify their identity, and assess their capabilities without prior out-of-band coordination.

## Actor Card

Every AICP agent **MUST** publish an actor card — a machine-readable discovery document that describes the agent's identity, capabilities, and interaction endpoints.

### Well-Known Endpoint

An AICP agent **MUST** make its actor card available at the well-known URI:

```
https://{domain}/.well-known/aicp.json
```

The actor card **MUST** be fetchable via HTTPS GET and **MUST** return `application/json` content type.

### Required Fields

An actor card **MUST** include the following fields:

| Field | Type | Description |
|---|---|---|
| `actor_id` | `string` | Stable, globally unique identifier for the agent. |
| `actor_type` | `string` | One of the canonical actor types defined in FOUNDATION-DRAFT. |
| `aicp_version` | `string` | The AICP protocol version this agent implements. |
| `interaction_endpoint` | `string` (URI) | The primary endpoint for AICP interactions. |
| `capabilities` | `array` of `string` (URI) | Capability URIs the agent offers. |

### Optional Fields

An actor card **MAY** include the following fields:

| Field | Type | Description |
|---|---|---|
| `display_name` | `string` | Human-readable name for the agent. |
| `supported_bindings` | `array` of `string` | Transport bindings: `http`, `websocket`, `jsonrpc`. |
| `supported_profiles` | `array` of `string` | Profile identifiers: `mcp`, `a2a`, `x402`, etc. |
| `delegation_endpoint` | `string` (URI) | Endpoint for delegation token exchange. |
| `evidence_endpoint` | `string` (URI) | Endpoint for evidence chain queries. |
| `public_key` | `object` | Public key for signature verification (JWK format). |
| `metadata` | `object` | Implementation-specific extensions. |

### Schema Validation

An actor card **MUST** validate against the canonical schema at `schemas/foundation/actor-card-discovery.json`. Implementations **MUST** reject actor cards that fail schema validation.

## Discovery Methods

A conforming implementation **MUST** support at least one of the following discovery methods.

### D1. Direct URL

The caller knows the full URL to the agent's actor card and fetches it directly via HTTPS GET.

This method **MUST** always be supported as a fallback. Given a valid HTTPS URL, the implementation **MUST** attempt to fetch and validate the actor card at that URL.

### D2. Well-Known URI

Given a domain name, the implementation constructs the well-known URL:

```
https://{domain}/.well-known/aicp.json
```

The implementation **MUST** issue an HTTPS GET to this URL. If the response is a valid actor card, discovery succeeds. If the response is not 2xx or fails validation, the implementation **SHOULD** attempt the next discovery method.

### D3. DNS TXT Record

The implementation **MAY** support DNS-based discovery by querying the TXT record at:

```
_aicp.{domain}
```

The TXT record value **MUST** be a valid HTTPS URL pointing to an actor card. The implementation **MUST** then fetch and validate the actor card at the resolved URL.

If the DNS TXT record is not present or does not contain a valid URL, discovery **MUST** fail for this method.

### D4. Registry

An implementation **MAY** support centralized or federated registry lookup. Registry semantics are outside the scope of this draft. A registry-based implementation **MUST** still return actor cards that validate against the canonical schema.

## Capability Advertisement

### Listing Capabilities

An actor card **MUST** list capabilities the agent offers in the `capabilities` array. Each entry **MUST** be a URI that uniquely identifies the capability.

### Capability Schema Reference

Each capability **SHOULD** reference its schema through the canonical capability schema defined in `schemas/foundation/capability.json`. Capability schemas enable callers to understand the input and output contract of each capability.

### Capability Hints

Capabilities **MAY** include additional hints through the `metadata` field of the actor card:

- Rate limits (requests per second, concurrent request limits)
- Cost hints (estimated cost per invocation, payment requirements)
- Required authentication schemes

## Security

### Transport Security

Actor cards **MUST** be served over HTTPS. Implementations **MUST NOT** accept actor cards served over plain HTTP.

### Signature Verification

An actor card **SHOULD** include a `public_key` field containing a JWK-formatted public key. When present, implementations **SHOULD** verify the actor card's integrity using the published key.

### Fail-Closed Semantics

Discovery **MUST** fail closed on:

- Untrusted or expired TLS certificates
- Actor cards that fail schema validation
- DNS resolution failures when using DNS-based discovery
- Non-2xx HTTP responses

Implementations **MUST NOT** silently fall back to insecure or unvalidated discovery results.

## Conformance

A conforming AICP discovery implementation:

1. **MUST** publish an actor card that validates against `schemas/foundation/actor-card-discovery.json`.
2. **MUST** support at least one discovery method (D1–D4).
3. **MUST** validate fetched actor cards against the schema before use.
4. **MUST** enforce HTTPS-only transport for actor card retrieval.
5. **MUST** fail closed on validation or transport errors.
6. **SHOULD** support well-known URI resolution (D2) as the primary discovery method.
7. **MAY** support DNS TXT resolution (D3) as a secondary method.
