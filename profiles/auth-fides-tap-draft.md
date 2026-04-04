# oaps-auth-fides-tap-v1

## Status

Draft high-assurance trust profile for the OAPS suite.

This profile defines the stronger trust and identity posture that upgrades the baseline web auth profile.

## Purpose

`oaps-auth-fides-tap-v1` defines how OAPS actors prove identity and authority when the baseline web-native trust posture is not sufficient.

It is intended for deployments that need stronger attestation, request signing, and higher-confidence delegation than the default web profile provides.

## Normative Scope

This profile is normative for:

- high-assurance actor binding
- signed request proofs or equivalent attested caller proofs
- delegation-aware authority checks with stronger proof material than the baseline profile
- trust upgrade semantics that preserve OAPS core objects and state transitions

This profile does not define a new OAPS identity substrate.

It upgrades or replaces the proof method used by `oaps-auth-web-v1` without changing the surrounding OAPS semantics.

## Relationship To The Suite

This profile sits above the OAPS core semantics and above the baseline auth profile.

It should compose cleanly with:

- HTTP binding surfaces
- MCP profile mappings
- A2A profile mappings
- payment profiles that require stronger actor assurance
- provisioning flows that need attestable caller identity

The profile should not force high-assurance proofs into the OAPS core object model.

## Mapping Notes

A conforming implementation SHOULD be able to map:

- actor references to verified trust identities
- delegation chains to signed or attested authority records
- request proofs to the OAPS actor binding outcome
- trust tier outcomes to evidence records

The intended trust family is compatible with FIDES-style attestations and TAP-family style agent trust coordination.

## Conformance

A conforming `oaps-auth-fides-tap-v1` implementation:

- MUST bind authenticated subjects to actor references with stronger proof material than the baseline profile
- MUST fail closed on unverifiable or expired authority chains
- MUST remain compatible with OAPS delegation semantics
- SHOULD preserve trust outcomes in evidence when they affect execution
- SHOULD be usable as a drop-in upgrade from `oaps-auth-web-v1`

## Implementation Notes

Implementations should treat this profile as the first option when:

- the action is high value
- the side effect is hard to reverse
- the actor relationship crosses trust domains
- the deployment already relies on cryptographic attestation or signed agent identities
