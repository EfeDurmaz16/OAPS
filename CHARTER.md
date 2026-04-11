# AICP Charter

## Status

Draft charter for the AICP (Agent Interaction Control Protocol) suite. The repository slug remains `OAPS`; the protocol is named AICP.

## Current Stewardship

AICP is currently maintained by a single founding steward, Efe Baran Durmaz ([@EfeDurmaz16](https://github.com/EfeDurmaz16)). This is the honest bootstrap posture — no foundation, no consortium, no co-stewards yet. See `MAINTAINERS.md` for the full stewardship model and `governance/GOVERNANCE.md` for the governance posture. The intended trajectory is solo steward → co-stewards from aligned ecosystems → neutral consortium or fiscal sponsor.

The royalty-free patent pledge in `governance/RF_PATENT_PLEDGE.md` is draft intent pending legal counsel review. No Contributor License Agreement is in place yet.

## Mission

AICP is an open protocol suite for autonomous agent semantics across protocol boundaries.

Its purpose is to standardize the missing shared primitives that existing ecosystems do not define consistently:

- identity references
- delegation and mandates
- intents and tasks
- approvals and challenges
- execution outcomes
- evidence and replayable lineage
- payment coordination
- extension and profile interoperability

## What AICP Is

AICP is a semantic and control-plane standard for agent systems.

It is intended to sit above and compose with ecosystem protocols such as:

- MCP
- A2A
- x402
- MPP
- AP2
- ACP
- UCP
- OSP

AICP defines shared meanings, state models, and interoperability rules that can be carried across multiple bindings and profiles.

## What AICP Is Not

AICP is not:

- a replacement for MCP, A2A, x402, MPP, or OSP
- a payment rail
- a provisioning vendor API
- a DID-only identity system
- a single monolithic mega-spec
- a framework product masquerading as a standard

## Architectural Stance

AICP is defined as a protocol suite with four layers:

1. Core semantics
2. Bindings
3. Profiles
4. Domain protocols

Companion protocols and aligned systems may integrate tightly with AICP without becoming mandatory parts of the standard.

## Relationship To Existing Projects

AICP is incubated in an ecosystem that already includes Sardis, FIDES, agit, and OSP.

These projects are not the standard itself. They are aligned systems and proving grounds:

- Sardis: payment governance and payment profile proving ground
- FIDES: high-assurance identity and trust profile family
- agit: lineage, replay, rollback, and audit companion system
- OSP: provisioning domain protocol closely aligned with AICP semantics

AICP must remain neutral by design even if it is initially incubated alongside these projects.

## Initial Strategic Position

AICP should be publicly framed as a semantic super-protocol:

- not a wrapper
- not a replacement
- not a narrow plugin

It should be the common semantic plane that lets heterogeneous agent systems coordinate safely and audibly.

## Governance Commitments

AICP governance should start public and lightweight, then become more formal as adoption grows.

Initial commitments:

- public repository and public spec work
- documented change process through OEPs
- transparent extension and profile review
- conformance-first change discipline
- neutral, non-captive branding and governance posture
- royalty-free contribution intent for required patent claims

## Early Success Criteria

AICP is materially successful when all of the following are true:

- at least two independent implementations exist
- a conformance kit exists and is runnable
- at least one non-founder external party reviews or implements part of the suite
- MCP and A2A can be mapped into the same AICP semantic model
- payment and provisioning can be attached without distorting the core

## Near-Term Deliverables

The first public document set is:

- this charter
- a suite architecture document
- a core foundation draft
- a roadmap and governance plan

The first hard implementation and conformance target remains the existing MCP-backed reference slice, but it must now be positioned as one reference profile path, not the entire protocol.
