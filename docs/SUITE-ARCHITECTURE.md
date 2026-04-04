# OAPS Suite Architecture

## Purpose

This document defines the intended long-term shape of OAPS as a protocol suite.

It is an architecture document, not the full normative spec.

## Layer Model

### 1. Core Semantics

The core layer defines the protocol's shared semantic primitives.

Long-term object families include:

- actors and identity references
- capabilities
- intents
- tasks and workflows
- delegations and mandates
- approvals and challenges
- execution requests and results
- interactions and lifecycle states
- evidence events
- payment coordination objects
- errors
- extensions

The initial hard-normative subset is smaller and is documented separately in the core foundation draft.

### 2. Bindings

Bindings define how OAPS semantics are carried over transport or RPC surfaces.

Planned binding families:

- HTTP/JSON
- JSON-RPC
- gRPC
- events/webhooks

Initial hard standardization should start with HTTP. The remaining bindings can be architecture-track and draft-track until the semantic core stabilizes.

### 3. Profiles

Profiles map OAPS semantics into external ecosystems.

Planned profile families:

- auth and trust profiles
- MCP profile
- A2A profile
- payment profiles
- commerce profiles
- provisioning profiles

Profiles define:

- object mapping
- lifecycle mapping
- auth and delegation rules
- error translation
- evidence minimums
- conformance expectations

### 4. Domain Protocols

Domain protocols are larger OAPS-family specifications built on top of the core.

Planned domain families:

- OAPS Commerce
- OAPS Provisioning
- OAPS Jobs

These should not be collapsed into the core.

### 5. Companion Systems

Some systems remain aligned but separate.

Examples:

- lineage and replay systems such as agit
- trust and attestation systems such as FIDES
- payment governance systems such as Sardis
- provisioning systems such as OSP

Companion systems can be first-class reference integrations without becoming mandatory standard components.

## Default Positioning

OAPS should be described as:

- a protocol suite
- a semantic super-protocol
- a control plane for agent systems

It should not be described as:

- a replacement protocol
- a mega-framework
- an MCP wrapper

## Current To Target Transition

The repository currently contains:

- a consolidated draft spec pack
- schemas and examples
- an MCP profile draft
- a TypeScript reference implementation centered on the MCP wedge

The target repository shape is:

- `spec/` for suite and normative drafts
- `schemas/` for machine-readable contracts
- `profiles/` for profile documents
- `governance/` for process and policy
- `reference/` for implementations
- `conformance/` for the suite-level TCK, taxonomy, and fixture indexes

The repository now includes the first machine-readable conformance manifest and fixture index alongside the narrative suite documents.

## Operating Principle

The suite can be broad.

The hard-normative surface cannot be broad all at once.

Every major expansion must pass three checks:

1. Does it belong in core, profile, domain protocol, or companion system?
2. Can it be tested through conformance?
3. Does it improve interop without capturing an ecosystem-specific implementation detail?
