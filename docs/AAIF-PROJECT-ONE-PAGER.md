# AICP as an AAIF Project — One-Pager

## The Gap

AAIF governs three projects: MCP (tool connectivity), Goose (agent runtime), AGENTS.md (agent configuration). None of them standardize **governance**: who authorized the agent action, what limits applied, whether those limits were checked before the side effect, and what tamper-evident proof exists afterward.

AAIF's own TC Chair David Soria Parra stated at MCP Dev Summit 2026: **"Governance belongs to the control plane layers above the protocol."**

60% of CEOs have deliberately slowed AI agent deployment because they cannot resolve questions of accountability (WEF, January 2026).

## What AICP Is

**AICP (Agent Interaction Control Protocol)** is an open protocol suite that standardizes the governance primitives agents need for production deployment:

- **Identity** — method-agnostic Actor references (HTTPS URIs + DIDs)
- **Delegation** — scoped authority transfer with expiry and revocation
- **Mandates** — stronger authorization chains for economic and high-risk actions
- **Approval** — first-class human-in-the-loop gates
- **Evidence** — hash-linked, append-only, tamper-evident audit trails
- **Payment Coordination** — mandate chain verification before payment authorization

## How AICP Composes with AAIF Projects

| AAIF Project | What it does | What AICP adds |
|---|---|---|
| **MCP** | Connects agents to tools | Governance: who authorized the tool call, what risk class, what evidence |
| **Goose** | Runs agents locally | Governance: delegation chains, approval gates, evidence for agent actions |
| **AGENTS.md** | Configures agent behavior | Governance: dynamic policy enforcement, not just static config |

AICP does not compete with any existing AAIF project. It is the missing layer they all need.

## What's Real Today

| Metric | Value |
|---|---|
| Normative spec | RFC 2119 foundation draft (147 MUST/SHOULD/MAY requirements) |
| TypeScript tests | 220+ across 14 packages |
| Python tests | 79 (stdlib-only, independent implementation) |
| Conformance scenarios | 216+ across 17+ packs |
| Runtime-backed profiles | 4 (MCP, A2A, x402, auth-web) |
| Runtime-backed bindings | 3 (HTTP, WebSocket, Webhook) |
| Integration demos | 3 (Stripe payment, MCP governance, multi-agent delegation) |
| Spec drafts | 8 (Foundation, State Machine, Discovery, Handshake, Shared Context, WebSocket, Webhook, HTTP) |

## Architecture

```
Layer 4: Domain Families     (commerce, provisioning, jobs)
Layer 3: Profiles            (MCP, A2A, x402, OSP, auth-web)
Layer 2: Bindings            (HTTP, WebSocket, Webhook, JSON-RPC, gRPC)
Layer 1: Semantic Core       (16 normative primitives + state machine)
         ↕ composes with ↕
         MCP, Goose, AGENTS.md, A2A, x402, OSP
```

## The Ask

We propose AICP as an AAIF project at the **Growth** classification level. AICP fills the governance gap the community has explicitly identified, with working code, a normative spec, and a conformance suite ready for multi-stakeholder review.

## Links

- **Repository:** https://github.com/EfeDurmaz16/OAPS
- **Foundation Draft:** spec/core/FOUNDATION-DRAFT.md
- **MCP Profile:** profiles/mcp.md
- **Conformance Suite:** conformance/
- **Author:** Efe Baran Durmaz (@EfeDurmaz16)

## Contact

- GitHub: https://github.com/EfeDurmaz16/OAPS
- Email: (via GitHub Issues or Discussions)
