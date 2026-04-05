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

## Trust Upgrade Mapping Matrix

The current reference slice does not implement a dedicated FIDES/TAP verifier, but the trust-upgrade seams are concrete enough to map explicitly:

| Stronger-trust concern | OAPS semantic anchor | Current runtime or fixture anchor | Non-claim boundary |
| --- | --- | --- | --- |
| attested actor identity | `Actor` / `actorRef` bound to stronger proof material | `auth-fides-tap.attestation.actor-card` fixture anchored on actor-card examples | does not claim a production attestation verifier |
| signed or attested delegation chain | `Delegation` plus fail-closed authority checks | `auth-fides-tap.trust-upgrade.delegation` fixture plus the shared core expired-delegation logic | does not claim FIDES/TAP-specific signature validation |
| trust-upgraded approval boundary | `ApprovalRequest`, `ApprovalDecision`, and evidence at the execution seam | `auth-fides-tap.evidence.approval-boundary` plus shared HTTP approval runtime cases | does not claim that approval alone is the full trust protocol |
| trust result recorded for audit | `EvidenceEvent.metadata` carrying trust outcome references | evidence examples and approval-boundary fixture grouping | does not freeze a FIDES/TAP metadata schema yet |

This mapping keeps the profile honest: stronger trust changes the proof and assurance level, not the surrounding OAPS object family or lifecycle semantics. The current reference line therefore claims reusable semantic seams and one observable shared approval/runtime boundary, not a dedicated FIDES/TAP verifier, attestation exchange, or trust oracle.

## Conformance

A conforming `oaps-auth-fides-tap-v1` implementation:

- MUST bind authenticated subjects to actor references with stronger proof material than the baseline profile
- MUST fail closed on unverifiable or expired authority chains
- MUST remain compatible with OAPS delegation semantics
- SHOULD preserve trust outcomes in evidence when they affect execution
- SHOULD be usable as a drop-in upgrade from `oaps-auth-web-v1`

The current conformance pack treats this profile as a grouped trust-upgrade track: attestation and delegation upgrade remain fixture-backed, while the approval-boundary seam reuses the shared HTTP approval runtime as the observable place where stronger trust would affect execution. There is not yet a dedicated FIDES/TAP runtime verifier in the reference line.

## Implementation Notes

Implementations should treat this profile as the first option when:

- the action is high value
- the side effect is hard to reverse
- the actor relationship crosses trust domains
- the deployment already relies on cryptographic attestation or signed agent identities
