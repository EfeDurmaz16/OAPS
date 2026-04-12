# AGNTCon + MCPCon 2026 — CFP Proposals

## Proposal 1: Session (25 min)

**Title:** The Missing Governance Layer: How AICP Brings Accountability to Agentic Systems

**Abstract:**
MCP connects agents to tools. A2A coordinates agent tasks. But who authorized the action? What limits applied? What evidence proves what happened? These governance questions are explicitly out of scope for today's agent protocols — and 60% of CEOs cite this gap as the reason they're slowing agent deployment.

AICP (Agent Interaction Control Protocol) is an open protocol that fills this gap with 16 normative primitives: delegation chains, mandate verification, approval gates, and hash-linked evidence trails. It composes with MCP, A2A, and x402 without replacing them — the MCP profile is runtime-backed with 13 adapter tests.

This talk demonstrates the governance flow end-to-end: an MCP tool invocation gated by AICP approval, with delegation chain verification and tamper-evident evidence. Live demo, working code, open spec.

**Topic Track:** Identity & Governance

**Key Takeaways:**
1. Why identity alone isn't enough — the gap between "who is this agent?" and "what is it allowed to do?"
2. How AICP's 16 primitives map onto real agent governance needs
3. Live demo: MCP tool call → AICP approval gate → evidence chain
4. How to adopt AICP incrementally alongside existing agent infrastructure

**Speaker:** Efe Baran Durmaz — Creator of AICP, Founder of Sardis (Payment OS for Agent Economy)

---

## Proposal 2: Session (25 min)

**Title:** Composable Governance: How AICP Complements MCP Without Scope Creep

**Abstract:**
At MCP Dev Summit, MCP's lead maintainer explicitly declared governance out of scope: "Governance belongs to the control plane layers above the protocol." This talk presents AICP as that layer — a semantic governance protocol designed from day one to compose with MCP rather than extend it.

We'll walk through the MCP-AICP integration architecture: how MCP tool discovery maps to AICP CapabilityCards, how risk classification triggers approval gates, how delegation chains authorize tool invocations, and how hash-linked evidence creates an immutable audit trail. The reference implementation has 153 tests and 4 runtime-backed profiles.

This is not a competing standard. It's the answer to a question MCP's own maintainers deliberately left open.

**Topic Track:** MCP & Agent Protocols

**Key Takeaways:**
1. The explicit design boundary: what MCP owns vs what belongs above
2. The MCP-AICP composition pattern (profile mapping, no scope creep)
3. Live demo: delegation → tool discovery → policy → approval → execution → evidence
4. Conformance: 216+ scenarios, how to verify an AICP-MCP integration works

**Speaker:** Efe Baran Durmaz

---

## Proposal 3: Workshop (60 min)

**Title:** Building Governed Agent Systems: Hands-On with AICP + MCP

**Abstract:**
In this workshop, participants build a governed agent system from scratch: MCP tool servers wrapped in AICP governance. By the end, every attendee will have a working system where agent tool calls are gated by approval, authorized by delegation chains, and audited with hash-linked evidence.

Prerequisites: Node.js 22+, basic TypeScript. All code is open source.

Workshop outline:
- 0-10 min: The governance gap (why identity isn't enough)
- 10-25 min: AICP foundation primitives (Actor, Delegation, Mandate, Approval, Evidence)
- 25-40 min: Hands-on — wire MCP tool server + AICP governance (using @oaps/mcp-adapter)
- 40-50 min: Add approval gates and evidence chains
- 50-60 min: Verify with the conformance suite, Q&A

**Topic Track:** MCP & Agent Protocols

**Speaker:** Efe Baran Durmaz

---

## Submission Details

- **Conference (NA):** AGNTCon + MCPCon North America, Oct 22-23, 2026, San Jose
- **Conference (EU):** AGNTCon + MCPCon Europe, Sep 17-18, 2026, Amsterdam
- **CFP Deadline (NA):** June 7, 2026, 11:59 PM PDT
- **CFP Deadline (EU):** June 8, 2026, 11:59 PM CEST
- **Notification:** July 17, 2026

Submit to BOTH conferences. Tailor abstract slightly for EU audience (emphasize GDPR/compliance angle).
