# oaps-auth-web-v1

## Status

Draft auth and trust profile for the OAPS suite.

This profile defines the baseline web-native identity and authentication posture for OAPS implementations.

## Purpose

`oaps-auth-web-v1` defines how OAPS actor identity, authentication, and subject binding work over standard web infrastructure.

It exists to provide a practical baseline that can be implemented without requiring specialized identity systems.

## Normative Scope

This profile is normative for:

- actor identity references over HTTPS-compatible URIs
- authentication using web-native key discovery and signed or token-based request proofs
- subject binding between authenticated callers and OAPS actors
- delegation-aware identity checks at the binding or profile layer

This profile does not define a new identity substrate.

It should remain compatible with higher-assurance trust profiles such as FIDES or TAP-family deployments.

## Relationship To The Suite

This profile sits above the OAPS core semantics and below ecosystem-specific auth upgrades.

It should compose cleanly with:

- HTTP binding surfaces
- MCP profile mappings
- A2A profile mappings
- payment profiles that need authenticated actor binding

The profile should not push web-specific auth details back into the OAPS core object model.

## Identity Model

A conforming implementation MUST support actor references that can be resolved in a web-native way.

The intended baseline is:

- a stable actor identifier
- discoverable key material
- a verification method that can validate the caller's identity claim

Implementations MAY use HTTPS, JWKS, OIDC, bearer tokens, request signatures, or equivalent web-native mechanisms, provided the resulting subject binding is explicit and stable.

## Authentication Model

A conforming implementation MUST establish whether the caller is:

- the actor itself
- a delegated subject acting on behalf of the actor
- an unauthenticated or mismatched caller

If the authenticated subject cannot be bound to the target actor or a valid delegation chain, the request MUST fail closed.

## Delegation And Subject Binding

This profile requires subject binding to be explicit.

A conforming implementation SHOULD be able to answer:

- who called
- on whose behalf the call was made
- which authority chain was used
- whether the delegation is still valid

If a higher-assurance delegation profile is present, this profile MUST defer to the stronger proof rules rather than weakening them.

## Trust Upgrades

`oaps-auth-web-v1` is the baseline profile, not the final trust ceiling.

Implementations SHOULD allow higher-assurance trust profiles to upgrade or replace the proof method without changing the OAPS core semantics.

Planned upgrade paths include:

- FIDES-based trust
- TAP-family trust attestation
- future cryptographic trust profiles that preserve the same actor binding semantics

## Evidence And Audit

Authentication decisions SHOULD be visible in evidence when they affect execution.

At minimum, evidence should be able to record:

- the authenticated subject
- the target actor
- whether delegation was used
- whether a trust upgrade was applied
- whether the request was accepted or rejected on trust grounds

## Current Reference Mapping Notes

The current suite only claims the following baseline auth-web mappings from the shared runtime slice:

| Baseline auth-web concern | OAPS anchor | Current runtime or fixture anchor | Claim boundary |
| --- | --- | --- | --- |
| web discovery of actor identity | discovery document plus actor-facing metadata | `auth-web.discovery.identity` via shared HTTP discovery runtime | runtime-backed through shared HTTP surface |
| subject binding between caller and actor | authenticated subject compared with `Envelope.from.actor_id` | `auth-web.subject-binding.actor-card` via shared HTTP auth boundary | runtime-backed through shared HTTP surface |
| delegation-aware subject binding | explicit delegation checked before allowing actor mismatch | `auth-web.delegation.fail-closed` via expired-delegation core runtime | runtime-backed for fail-closed expiry only |
| evidence of trust decisions | evidence metadata on execution boundaries | shared HTTP and MCP evidence surfaces | partial, because no dedicated auth-web evidence emitter exists yet |

This profile does **not** yet claim a full web-native verifier matrix across bearer, signatures, OIDC, or JWKS discovery combinations. The current reference line proves subject binding and fail-closed delegation semantics first.

## Conformance

A conforming `oaps-auth-web-v1` implementation:

- MUST bind authenticated subjects to actor references explicitly
- MUST fail closed on mismatched or unverifiable identity claims
- MUST remain compatible with OAPS delegation semantics
- SHOULD interoperate with HTTP binding surfaces and profile mappings
- SHOULD preserve auth decisions in evidence when relevant

The current conformance pack groups this profile into discovery, subject-binding, and delegation anchors.
Discovery and actor-card subject binding continue to use the shared HTTP runtime surface, and delegation fail-closed is now also tied to the reference core runtime's expired-delegation path. That keeps the pack honest about the current implementation slice without pretending a full auth-web verifier stack already exists.

## Open Questions

This draft still needs formal answers for:

- which web-native auth mechanisms should be considered fully normative
- how much of the proof material should be carried in core versus binding/profile metadata
- how the baseline profile should interoperate with FIDES/TAP without creating redundant trust layers
