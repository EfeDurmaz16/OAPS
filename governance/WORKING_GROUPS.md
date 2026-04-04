# Working Groups

## Purpose

OAPS moves too broadly for a single linear review queue. Working groups are the default parallel execution unit for governance, review, and external coordination.

They are not separate projects. They are disciplined review lanes with explicit outputs.

## Operating Model

Each working group should have:

- a clear charter
- one or more maintainers
- a public issue label or tracker tag
- a predictable review cadence
- explicit artifact ownership

Working groups may draft, review, and recommend changes. They do not silently finalize normative changes outside the OEP process.

## Initial Working Groups

### Core Semantics WG

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

### Bindings WG

Owns:

- HTTP binding details
- JSON-RPC binding drafts
- gRPC binding drafts
- event and webhook binding drafts

Typical outputs:

- binding drafts
- transport mapping notes
- compatibility matrices

### Profiles WG

Owns:

- MCP profile mapping
- A2A profile mapping
- payment profile drafts
- provisioning and commerce profile drafts

Typical outputs:

- profile drafts
- adapter guidance
- ecosystem mapping notes

### Conformance WG

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

### Governance and Outreach WG

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

Recommended cadence:

- Core Semantics WG: weekly
- Bindings WG: weekly or biweekly
- Profiles WG: weekly or biweekly
- Conformance WG: weekly
- Governance and Outreach WG: biweekly

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
