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
- fail-closed handling for mismatched subject, actor, or expired delegated authority

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
- discoverable key material or equivalent trust bootstrap
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

## Current Reference Mapping Notes

The current suite only claims the following baseline auth-web mappings from the shared runtime slice:

| Baseline auth-web concern | OAPS anchor | Current runtime or fixture anchor | Claim boundary |
| --- | --- | --- | --- |
| web discovery of actor identity | discovery document plus actor-facing metadata | `auth-web.discovery.identity` via shared HTTP discovery runtime | runtime-backed through shared HTTP surface |
| subject binding between caller and actor on interaction creation | authenticated subject compared with `Envelope.from.actor_id` on `POST /interactions` | `auth-web.subject-binding.interaction-create` via shared HTTP auth boundary | runtime-backed through shared HTTP surface |
| subject binding on follow-on message mutation | authenticated subject compared with `Envelope.from.actor_id` before append-only message progression is accepted | `auth-web.subject-binding.message-append` via shared HTTP message runtime | runtime-backed through shared HTTP mutation surface |
| actor authority assumption on approval, rejection, and revocation mutations | authenticated subject bound to the same actor or valid delegation chain that already owns the interaction | `auth-web.subject-binding.approve`, `auth-web.subject-binding.reject`, `auth-web.subject-binding.revoke` example-only anchors | fixture-backed only; the current reference slice does not carry a separate follow-on envelope actor on these mutations |
| delegation-aware subject binding | explicit delegation checked before allowing actor mismatch | `auth-web.delegated-actor.baseline` and `auth-web.delegation.expired` | runtime-backed for fail-closed expiry; delegated happy-path remains fixture-backed |
| evidence of trust decisions | evidence metadata on execution boundaries | shared HTTP and MCP evidence surfaces, including incremental replay via binding-level `after`/`limit` windows | partial, because no dedicated auth-web evidence emitter exists yet |

This profile does **not** yet claim a full web-native verifier matrix across bearer, signatures, OIDC, or JWKS discovery combinations. The current reference line proves direct subject binding on interaction creation and message append flows plus fail-closed delegation semantics first.

## HTTP Mutation Surface Binding Notes

For the current HTTP reference slice, subject binding expectations should be read mutation-by-mutation:

| HTTP mutation surface | Current auth-web expectation | Current claim boundary |
| --- | --- | --- |
| `POST /interactions` | bearer or equivalent caller proof MUST bind to `Envelope.from.actor_id` or a valid delegation chain | runtime-backed |
| `POST /interactions/{id}/messages` | authenticated caller MUST match `Envelope.from.actor_id` or a valid delegation chain before the append is accepted | runtime-backed |
| `POST /interactions/{id}/approve` | caller SHOULD be the owning actor or a valid delegated approver for the interaction even though the current reference slice only proves bearer-authenticated mutation semantics | fixture-backed expectation |
| `POST /interactions/{id}/reject` | caller SHOULD be the owning actor or a valid delegated approver for the interaction even though the current reference slice only proves bearer-authenticated mutation semantics | fixture-backed expectation |
| `POST /interactions/{id}/revoke` | caller SHOULD be the owning actor or a valid delegated authority that can withdraw the interaction | fixture-backed expectation |

Implementations that only authenticate the bearer token but cannot explain how that token binds to the actor identity SHOULD treat their posture as incomplete auth-web support.

### Bearer-Token Subject Binding Assumptions

Bearer tokens are acceptable in this baseline profile only when the implementation can still answer the core subject-binding questions.

A bearer token therefore SHOULD be treated as evidence of a subject relationship, not as permission floating free of actor identity. Implementations SHOULD be able to determine:

- which actor the token is bound to
- whether the token represents the actor directly or a delegated subject
- whether the token remains valid for the specific mutation being attempted
- whether the token's scope is narrower than the interaction or delegation scope

If the token subject, token audience, or delegation chain cannot be reconciled with the target actor, the request MUST fail closed.

## Actor-Card Discovery And Identity Assertions

The baseline auth-web profile expects actor discovery to do more than advertise an endpoint. Discovery SHOULD make the identity assertion legible enough for a caller or verifier to understand:

- the actor identifier being asserted
- the canonical discovery document or actor-card location
- the key material, issuer, or verification method used by the deployment
- the profiles that strengthen or specialize the baseline auth story

The example pack includes actor-card discovery assertions that stay web-native without claiming a single mandatory verifier stack.

## Delegated Actor Behavior

A delegated actor operating under the baseline web profile SHOULD remain explicit about:

- the delegator
- the delegate actor or delegated subject
- the scope being exercised
- the expiry or revocation condition
- whether the delegated actor is allowed to create, message, approve, reject, or revoke interactions

The baseline profile therefore allows delegated operation, but it does not allow silent actor substitution.

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

## Conformance

A conforming `oaps-auth-web-v1` implementation:

- MUST bind authenticated subjects to actor references explicitly
- MUST fail closed on mismatched or unverifiable identity claims
- MUST remain compatible with OAPS delegation semantics
- SHOULD interoperate with HTTP binding surfaces and profile mappings
- SHOULD preserve auth decisions in evidence when relevant

The current conformance pack groups this profile into discovery, subject-binding, delegation, invalid-mismatch, and delegation-expiry anchors. Discovery plus interaction-creation and message-append subject binding use the shared HTTP runtime surface. Approval, rejection, and revocation subject-binding expectations are now called out explicitly as fixture-backed profile semantics, while expired-delegation fail-closed continues to reuse the reference core runtime's delegation expiry path.

## Open Questions

This draft still needs formal answers for:

- which web-native auth mechanisms should be considered fully normative
- how much of the proof material should be carried in core versus binding/profile metadata
- how the baseline profile should interoperate with FIDES/TAP without creating redundant trust layers
