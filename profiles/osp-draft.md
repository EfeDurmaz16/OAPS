# oaps-osp-v1

## Status

Draft provisioning profile for the OAPS suite.

This profile maps OAPS semantics onto service provisioning, credential delivery, and lifecycle management flows.

## Purpose

`oaps-osp-v1` defines how OAPS describes and governs provisioning actions for services, resources, and credentials.

It exists to let OAPS cover provisioning workflows without turning the suite into a vendor-specific provisioning API.

## Normative Scope

This profile is normative for:

- mapping OAPS intents or tasks to provisioning actions
- preserving provisioning lifecycle state in OAPS interactions
- attaching approval and delegation semantics to provisioning steps
- recording credential delivery, rotation, suspension, or deprovisioning outcomes in evidence
- keeping payment handoff explicit when provisioning depends on a payment profile

This profile is informative for:

- provider-specific resource catalogs
- vendor-specific control surfaces
- billing or marketplace mechanics beyond provisioning semantics

## Relationship To The Suite

This profile sits above the OAPS core semantics and below the actual provisioning system used in deployment.

It composes cleanly with:

- auth profiles for verifying the caller
- payment profiles when provisioning is billable
- evidence and lineage systems for auditing lifecycle changes
- commerce or jobs profiles when provisioning is nested in larger workflows

The profile does not push provisioning vendor details back into the OAPS core object model.

## Mapping Notes

A conforming implementation SHOULD be able to map:

- OAPS task records to provisioning jobs or operations
- approval requirements to resource creation gates
- delegation records to authorized operators or service principals
- provisioning outcomes to stable lifecycle states and evidence events
- payment-linked authorization to an explicit handoff rather than a hidden provisioning side effect

The intended alignment is consistent with OSP-style provisioning semantics, but the profile remains OAPS-native at the semantic layer.

## Current Provisioning Lifecycle Matrix

The current draft should be interpreted as a lifecycle mapping matrix, not as a claim that the reference suite already operates a provisioning control plane:

| Provisioning concern | OAPS anchor | Current fixture/runtime anchor | Current claim level |
| --- | --- | --- | --- |
| provider or service bootstrap | actor discovery and authenticated entrypoint | `osp.provisioning.actor-card` via shared HTTP discovery/auth runtime | runtime-backed through shared HTTP surface |
| estimate or quote before mutation | `Intent`, `Task`, or pre-execution metadata | `osp.lifecycle.estimate-to-provision` fixture | fixture-backed only |
| provisioning request creation | `Intent` or `Task` describing the requested resource change | provisioning fixtures plus core task examples | fixture-backed only |
| approval gate before mutation | `ApprovalRequest` / `ApprovalDecision` and `pending_approval` state | `osp.provisioning.approval-gated` via shared HTTP approval runtime and shared HTTP idempotent mutation retries | runtime-backed through shared approval seam |
| credential delivery or fulfilled provisioning output | `ExecutionResult` plus evidence | `osp.credential.delivery` via shared execution-result and HTTP completion runtime | runtime-backed through shared execution/completion surfaces |
| credential rotation | follow-on provisioning mutation plus evidence continuity | `osp.credential.rotate` fixture | fixture-backed only |
| suspension or service pause | `challenged`, `revoked`, or `failed` depending on semantics | `osp.lifecycle.suspend-deprovision` fixture | fixture-backed only |
| deprovisioning | `revoked`, `compensated`, or terminal completion with explicit teardown evidence | `osp.lifecycle.suspend-deprovision` fixture plus shared HTTP revoke seam | partial; no dedicated provisioning state machine yet |
| payment-linked provisioning handoff | explicit cross-profile handoff into a payment session or payment challenge | `osp.payment-linked.handoff` fixture | fixture-backed only |

This profile therefore claims portable provisioning semantics across approval, completion, and audit boundaries first. It does **not** yet claim vendor-specific catalogs, credential transports, or OSP-native runtime execution. The shared HTTP binding slice now also hardens idempotent replay across follow-on message, approval, rejection, and revoke mutations, which is the right portability baseline for retried provisioning approvals, credential-delivery acknowledgements, or later deprovisioning requests.

## Deeper Provisioning Lifecycle Notes

A conforming provisioning mapper SHOULD preserve the distinction between these phases:

1. **estimate** — a resource or service proposal exists, but no side effects are committed yet
2. **provision** — the resource is being created or activated
3. **credential delivery** — the produced credential, access token, or endpoint reference is handed over
4. **rotate** — the credential or access material changes while the service continues to exist
5. **suspend** — the service remains known but cannot currently be used
6. **deprovision** — the resource or service is torn down or permanently withdrawn

These phases SHOULD remain replayable so an auditor can determine whether a later suspension or deprovision was the natural continuation of the original provisioning request or a separate authority decision.

## Approval-Gated Provisioning

Provisioning often needs an approval boundary before mutation, especially when:

- the service has ongoing cost
- the credential grants privileged access
- the resource affects production infrastructure
- the provisioning request crosses operator trust domains

The approval object SHOULD remain tied to the same portable interaction or task that ultimately records provision, rotate, suspend, or deprovision events.

## Payment-Linked Provisioning Handoff

Some provisioning actions are billable or subscription-gated.

In those cases, this profile requires the payment handoff to remain explicit. A provisioning flow SHOULD be able to show:

- which provisioning request is waiting on payment
- which payment profile or payment reference satisfied that gate
- whether provisioning resumed after payment or remained blocked
- whether deprovisioning or suspension was triggered by later payment failure

The payment handoff may use MPP, AP2, x402, or another payment profile, but the provisioning profile should keep the lifecycle legible either way.

## Conformance

A conforming `oaps-osp-v1` implementation:

- MUST preserve the OAPS actor, approval, and delegation context through provisioning
- MUST fail closed when a provisioning step lacks authority
- MUST emit evidence for lifecycle transitions that matter to auditability
- SHOULD support credential delivery and rotation as first-class outcomes
- SHOULD preserve the distinction between provisioning semantics and vendor API details

The current conformance pack treats this profile as grouped provisioning anchors: actor bootstrap, estimate-to-provision, approval gating, credential delivery, rotate, suspend/deprovision, and payment-linked handoff.
Runtime references are the shared HTTP approval/idempotency and actor-card surfaces plus the core execution result shape, not a dedicated provisioning runtime.

## Current Runtime Boundary

The current repository does **not** yet claim:

- a live OSP provisioning backend
- vendor-specific catalog discovery
- credential transport implementation details
- automatic billing suspension integration
- a dedicated provisioning state machine runtime beyond shared HTTP/core seams

What the repository now does claim is that the OAPS lifecycle, approval, credential, suspension, deprovision, and payment-linked handoff seams are explicit enough to guide future OSP-aligned implementations.

## Implementation Notes

Implementations should treat this profile as the preferred bridge when:

- the agent is provisioning infrastructure or credentials
- lifecycle changes must be auditable
- the action can be partially or fully reversed
- the request needs approval before mutation
