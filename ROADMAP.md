# Roadmap

## Program shape

OAPS is now planned as a protocol suite, not just a single MCP-oriented draft or reference server.

The roadmap is split into:

- suite framing and governance
- hard semantic core
- bindings
- profiles
- domain protocol families
- conformance and external legitimacy

## Phase A: Reframing

- publish the OAPS charter
- publish the suite architecture
- position the current monorepo as a reference slice, not the entire protocol
- define the OAPS Enhancement Proposal process
- establish neutrality and RF patent posture drafts

## Phase B: Foundation Draft

- define the first hard-normative semantic core
- keep the core narrower than the long-term suite vision
- lock the initial object family around actors, capabilities, intents, tasks, delegation, mandates, approvals, execution results, evidence, errors, and extensions
- begin schema alignment for the foundation draft

## Phase C: Bindings

- standardize HTTP first as the first hard binding
- design JSON-RPC, gRPC, and events/webhooks as official binding tracks
- define version negotiation, discovery, idempotency, and long-running interaction behavior in binding form

## Phase D: Profiles

- harden `oaps-mcp-v1`
- draft `oaps-a2a-v1`
- develop auth and trust profiles, starting with generic web auth and higher-assurance FIDES/TAP-family alignment
- continue payment profiles such as x402, MPP, AP2, and Sardis-aligned references as later hardening tracks

## Phase E: Domain Families

- define provisioning as an OAPS-aligned domain family alongside OSP
- define commerce as an OAPS-aligned domain family alongside ACP and UCP style systems
- define jobs as an OAPS-aligned domain family for long-running delegated work

## Phase F: Conformance

- build a layered TCK for core, bindings, and profiles
- add replay and evidence-specific conformance fixtures
- require schema, fixture, and example updates for normative changes
- target at least two independent implementations

## Phase G: Ecosystem and Cosigners

- incubate OAPS publicly but neutrally
- use existing aligned systems such as Sardis, FIDES, agit, and OSP as proving grounds
- prepare profile-specific review asks for external protocol and infrastructure companies
- grow toward a neutral consortium and stronger external governance

## Parallel Workstreams

The expected operating model is founder-led and agent-amplified.

The roadmap assumes parallel lanes for:

- spec and semantic design
- external protocol research and mapping
- reference implementation work
- conformance and fixtures
- outreach, governance, and cosigner preparation
