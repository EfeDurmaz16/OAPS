# Vision

## Why this exists

Agent systems are becoming more autonomous. They no longer only generate text. They call tools, browse websites, talk to other agents, request approvals, and increasingly participate in economic activity.

The ecosystem around them is fragmented:

- MCP standardizes tool and context access
- A2A standardizes remote agent collaboration
- ACP standardizes client-to-agent interaction
- AP2, x402, and MPP target pieces of payment and economic action
- DID and related verification systems target identity and trust

Each solves a vertical slice. None defines the horizontal primitive layer needed to make agent actions interoperable, governable, and provable across protocol boundaries.

## The missing layer

The missing layer is not “yet another product protocol.” It is a shared primitive standard for:

- actor identity references
- capability discovery
- structured intent
- scoped delegation
- deterministic policy
- execution lifecycle
- human approval
- economic authorization
- evidence and audit

## What AICP is

AICP is an open protocol suite for agentic primitives and control-plane semantics.

It is deliberately designed as a **composing semantic layer**. It does not attempt to replace MCP, A2A, ACP, AP2, x402, MPP, OSP, or trust systems such as FIDES/TAP-family approaches. Instead, it provides the common governance, accountability, and continuity layer they can share.

## Why the timing matters

The protocol surface around agents is expanding faster than standardization around authority and proof. That creates fragmentation, lock-in, and weak accountability.

If autonomous systems become real economic and operational actors, open primitives will matter as much for agents as TCP, HTTP, TLS, and DNS mattered for the web.

## Long-term scope

The long-term scope of AICP is broad. It is intended to become a foundational open protocol suite for agentic primitives across systems.

The suite shape is:

- core semantics
- bindings
- profiles
- domain protocol families

The current near-term hard focus is narrower:

- a semantic foundation draft
- an HTTP-first binding path
- MCP and A2A as first profile targets
- replayable evidence and approval semantics

That path is concrete enough to implement now and broad enough to support future extension.
