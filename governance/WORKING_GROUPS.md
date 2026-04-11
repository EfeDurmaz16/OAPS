# Planned Areas of Work

## Purpose

AICP moves too broadly for a single linear review queue. This document describes **planned areas of work** that will eventually become formal working groups once the project has more than one active maintainer.

**Current status (2026-04-11):** None of the groups below are active. There are no working-group maintainers, no meeting notes, no issue labels, and no cadenced reviews. The project currently operates under a single founding steward (see `MAINTAINERS.md`). When co-stewards join, the areas below will become live working groups with the operating model described in the following section.

Treat this document as a forward-looking organizational map, not a description of current state.

## Intended Operating Model (When Active)

When a working group becomes active, it will have:

- a clear charter
- one or more maintainers
- a public issue label or tracker tag
- a predictable review cadence
- explicit artifact ownership

Working groups will draft, review, and recommend changes. They will not silently finalize normative changes outside the OEP process.

## Planned Areas of Work

### Core Semantics (planned)

Owns:

- core primitive definitions
- state machines
- versioning rules
- error taxonomy
- cross-cutting semantic consistency

Typical outputs:

- foundation draft updates
- semantic clarifications
- core OEPs

### Bindings (planned)

Owns:

- HTTP binding details
- JSON-RPC binding drafts
- gRPC binding drafts
- event and webhook binding drafts

Typical outputs:

- binding drafts
- transport mapping notes
- compatibility matrices

### Profiles (planned)

Owns:

- MCP profile mapping
- A2A profile mapping
- payment profile drafts
- provisioning and commerce profile drafts

Typical outputs:

- profile drafts
- adapter guidance
- ecosystem mapping notes

### Conformance (planned)

Owns:

- fixtures
- TCK design
- negative-path cases
- evidence and replay tests
- compatibility declarations

Typical outputs:

- conformance packs
- test vectors
- implementation checklists

### Governance and Outreach (planned)

Owns:

- OEP process maintenance
- review packaging
- cosigner outreach prep
- public positioning
- working group coordination

Typical outputs:

- governance updates
- review packets
- outreach briefs
- meeting notes

## Review Cadence

No cadence is currently in effect — no working group is active. When working groups become active, the intended initial cadences are:

- Core Semantics: weekly
- Bindings: weekly or biweekly
- Profiles: weekly or biweekly
- Conformance: weekly
- Governance and Outreach: biweekly

The cadence matters less than whether decisions are written down and linked to a durable artifact.

## Decision Rules

- A working group can recommend a change.
- An OEP or formal governance decision is required for material normative changes.
- WG notes are not normative unless explicitly promoted through the OEP process.
- No group should force ecosystem-specific details into the core without a written justification.

## Parallel Execution

OAPS should assume parallel workstreams, not serial handoffs.

The practical operating model is:

- spec drafting in one lane
- implementation in another lane
- conformance in another lane
- outreach and review packaging in another lane

That keeps the suite moving without making the founder or maintainers the bottleneck for every artifact.
