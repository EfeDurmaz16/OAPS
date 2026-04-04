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

This profile is informative for:

- provider-specific resource catalogs
- vendor-specific control surfaces
- billing or marketplace mechanics beyond provisioning semantics

## Relationship To The Suite

This profile sits above the OAPS core semantics and below the actual provisioning system used in deployment.

It should compose cleanly with:

- auth profiles for verifying the caller
- payment profiles when provisioning is billable
- evidence and lineage systems for auditing lifecycle changes
- commerce or jobs profiles when provisioning is nested in larger workflows

The profile should not push provisioning vendor details back into the OAPS core object model.

## Mapping Notes

A conforming implementation SHOULD be able to map:

- OAPS task records to provisioning jobs or operations
- approval requirements to resource creation gates
- delegation records to authorized operators or service principals
- provisioning outcomes to stable lifecycle states and evidence events

The intended alignment is consistent with OSP-style provisioning semantics, but the profile remains OAPS-native at the semantic layer.

## Conformance

A conforming `oaps-osp-v1` implementation:

- MUST preserve the OAPS actor, approval, and delegation context through provisioning
- MUST fail closed when a provisioning step lacks authority
- MUST emit evidence for lifecycle transitions that matter to auditability
- SHOULD support credential delivery and rotation as first-class outcomes
- SHOULD preserve the distinction between provisioning semantics and vendor API details

The current conformance pack treats this profile as grouped provisioning anchors: actor bootstrap, approval gating, and lifecycle completion.
Runtime references are the shared HTTP approval and actor-card surfaces plus the core execution result shape, not a dedicated provisioning runtime.

## Implementation Notes

Implementations should treat this profile as the preferred bridge when:

- the agent is provisioning infrastructure or credentials
- lifecycle changes must be auditable
- the action can be partially or fully reversed
- the request needs approval before mutation
