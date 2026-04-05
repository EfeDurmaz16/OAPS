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
- trust-tier signaling that explains why a higher-assurance path was required

This profile does not define a new OAPS identity substrate.

It upgrades or replaces the proof method used by `oaps-auth-web-v1` without changing the surrounding OAPS semantics.

## Relationship To The Suite

This profile sits above the OAPS core semantics and above the baseline auth profile.

It composes cleanly with:

- HTTP binding surfaces
- MCP profile mappings
- A2A profile mappings
- payment profiles that require stronger actor assurance
- provisioning flows that need attestable caller identity

The profile does not force high-assurance proofs into the OAPS core object model.

## Trust-Tier Semantics

This draft now uses a simple trust-tier ladder to explain when the baseline auth-web profile is sufficient and when a FIDES/TAP-style upgrade should apply.

| Trust tier | Meaning | Typical posture |
| --- | --- | --- |
| `T0` | baseline discovery only | public actor identity and capability discovery with no stronger assurance claim |
| `T1` | baseline authenticated web subject binding | `oaps-auth-web-v1` bearer, signature, or equivalent caller proof bound to the actor |
| `T2` | attested actor or delegated subject | actor identity and caller proof are accompanied by attestable identity or signed authority material |
| `T3` | high-assurance action gate | the requested action requires attested identity plus explicit approval, policy, or mandate evidence before execution |

The trust tier does not change the OAPS object family. It changes the assurance level attached to actor binding, delegated authority, and execution readiness.

## Attestation Semantics

A conforming higher-assurance deployment SHOULD be able to attach or reference attestation material for:

- the actor identity being asserted
- the software or service principal making the request
- the delegated authority chain, if delegation is present
- the trust policy or approval requirement that raised the tier requirement

This profile intentionally leaves the exact attestation format open. FIDES-style attestations, TAP-family trust assertions, or equivalent signed proof chains are all acceptable, provided the resulting semantics remain portable:

- who is being attested
- what authority is being attested
- when the attestation was valid
- which trust tier the attestation satisfied

## Mapping Notes

A conforming implementation SHOULD be able to map:

- actor references to verified trust identities
- delegation chains to signed or attested authority records
- request proofs to the OAPS actor binding outcome
- trust-tier outcomes to evidence records
- high-assurance approval boundaries to portable approval objects rather than opaque gateway-specific checks

The intended trust family is compatible with FIDES-style attestations and TAP-family style agent trust coordination.

## Auth-Web Upgrade Mapping

The higher-assurance profile should be read as an upgrade path, not a fork of the semantic model.

| Baseline auth-web concern | Stronger-trust upgrade | Portable OAPS anchor |
| --- | --- | --- |
| bearer- or signature-bound subject | attested caller identity or signed proof chain | `Actor` / `actorRef` binding outcome |
| delegated subject with baseline scope proof | attested or signed delegation chain | `Delegation` and `Mandate` semantics |
| mutation accepted under normal risk rules | execution gated because trust tier `T2` or `T3` is required | `ApprovalRequest`, policy context, and interaction state |
| trust result recorded loosely in metadata | trust tier and attestation references recorded explicitly for audit | `EvidenceEvent.metadata` |

This mapping keeps the profile honest: stronger trust changes the proof and assurance level, not the surrounding OAPS object family or lifecycle semantics.

## Trust Upgrade Mapping Matrix

The current reference slice does not implement a dedicated FIDES/TAP verifier, but the trust-upgrade seams are concrete enough to map explicitly:

| Stronger-trust concern | OAPS semantic anchor | Current runtime or fixture anchor | Non-claim boundary |
| --- | --- | --- | --- |
| attested actor identity | `Actor` / `actorRef` bound to stronger proof material | `auth-fides-tap.attestation.actor-card` fixture anchored on attested actor examples | does not claim a production attestation verifier |
| trust-tier requirement before high-risk execution | policy or profile requirement that raises the assurance bar | `auth-fides-tap.trust-tier.required` fixture | does not claim a runtime trust-tier policy engine |
| signed or attested delegation chain | `Delegation` plus fail-closed authority checks | `auth-fides-tap.trust-upgrade.delegation` fixture plus the shared core expired-delegation logic | does not claim FIDES/TAP-specific signature validation |
| trust-upgraded approval boundary | `ApprovalRequest`, `ApprovalDecision`, and evidence at the execution seam | `auth-fides-tap.approval.high-assurance-boundary` plus shared HTTP approval runtime cases | does not claim that approval alone is the full trust protocol |
| attestation-required path | fail-closed refusal when the stronger proof is absent or insufficient | `auth-fides-tap.attestation.required-path` fixture | does not claim a dedicated attestation oracle or policy service |
| trust result recorded for audit | `EvidenceEvent.metadata` carrying trust outcome references | evidence examples and approval-boundary fixture grouping | does not freeze a FIDES/TAP metadata schema yet |

## Approval Boundaries For High-Assurance Actions

High-assurance deployments SHOULD treat approval and trust as complementary, not interchangeable.

Typical `T3` boundaries include:

- irreversible or high-value payment authorization
- credential delivery or rotation across trust domains
- delegated execution on sensitive infrastructure
- recovery or override actions that require elevated assurance

In these cases, the approval object SHOULD remain portable and the trust evidence SHOULD explain why the stronger tier was required.

## Conformance

A conforming `oaps-auth-fides-tap-v1` implementation:

- MUST bind authenticated subjects to actor references with stronger proof material than the baseline profile
- MUST fail closed on unverifiable or expired authority chains
- MUST remain compatible with OAPS delegation semantics
- SHOULD preserve trust outcomes in evidence when they affect execution
- SHOULD be usable as a drop-in upgrade from `oaps-auth-web-v1`

The current conformance pack treats this profile as a grouped trust-upgrade track: attested actor identity, trust-tier requirements, delegation upgrade, approval-boundary gating, and attestation-required refusal paths are fixture-backed. The approval-boundary seam reuses the shared HTTP approval runtime as the observable place where stronger trust would affect execution. There is not yet a dedicated FIDES/TAP runtime verifier in the reference line.

## Current Runtime Boundary

The current repository does **not** yet claim:

- a dedicated FIDES verifier
- a TAP attestation exchange
- cryptographic attestation validation in the TypeScript reference line
- a trust-tier policy engine that automatically raises actions into `T2` or `T3`
- a canonical metadata schema for every attestation proof family

What the current repository does claim is that the OAPS semantic seams are now explicit enough to express those future trust upgrades without rewriting the core lifecycle, approval, delegation, or evidence model.

## Implementation Notes

Implementations should treat this profile as the first option when:

- the action is high value
- the side effect is hard to reverse
- the actor relationship crosses trust domains
- the deployment already relies on cryptographic attestation or signed agent identities
