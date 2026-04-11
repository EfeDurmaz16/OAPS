# AICP Glossary

## Purpose

This glossary gives short definitions for the terms that recur across the suite. Formal PascalCase primitive names (e.g. `Actor`, `EvidenceEvent`) are defined normatively in `spec/core/FOUNDATION-DRAFT.md` — this glossary is a quick-reference companion.

## Core Primitives

| Term | Meaning |
| --- | --- |
| Actor | A durable identity that can be referenced in AICP semantics. Method-agnostic, supports both web-native and DID-style identifiers. |
| Capability | An action surface exposed by an actor or system, independent of ecosystem-specific method families. |
| Intent | The compact semantic unit for a single requested action or outcome. |
| Task | A durable, longer-lived work instance, often promoted from an intent when execution becomes asynchronous, queued, or delegated. |
| Interaction | The durable protocol envelope for exchange, approval, replay, and evidence. Anchored by `interaction_id`. |
| Message | A first-class object appended to an interaction via HTTP, JSON-RPC, gRPC, or events bindings. |
| Delegation | Scoped authority passed from one actor to another, with explicit expiry and revocation. |
| Mandate | A stronger authorization chain than delegation, designed for economic or higher-risk actions. |
| PaymentCoordination | The foundation-level binding of a payment session to an interaction, including mandate chain verification and settlement evidence. |
| ApprovalRequest | A first-class gate requesting human or higher-authority approval of a known action. |
| ApprovalDecision | The record of an approver's response to an ApprovalRequest (approved, rejected, or modified). |
| Challenge | A new blocking condition discovered during or after execution progress. Distinct from ApprovalRequest per `STATE-MACHINE-DRAFT.md` §"Approval Versus Challenge". |
| ExecutionResult | The canonical outcome of work: terminal status, reference to produced artifacts, execution metadata. |
| EvidenceEvent | The core lineage primitive. Hash-chained, replayable, actor-attributed proof of state transitions. |
| ErrorObject | Portable failure semantics: code, category, retryability, machine-readable details. |
| ExtensionDescriptor | The controlled escape hatch that lets the suite evolve without forcing ecosystem details into the core. |
| InteractionTransition | The serialized record of an interaction moving between canonical states per the state machine draft. |
| TaskTransition | The serialized record of a task moving between canonical states per the state machine draft. |

## Structural Terms

| Term | Meaning |
| --- | --- |
| Binding | A transport or RPC surface that carries AICP semantics (HTTP, JSON-RPC, gRPC, events). |
| Profile | A mapping of AICP semantics into an external ecosystem (MCP, A2A, x402, OSP, etc.). |
| Domain protocol | A larger AICP-owned family such as commerce, provisioning, or jobs. |
| Companion system | An aligned external system that AICP can reference without absorbing. |

## Process Terms

| Term | Meaning |
| --- | --- |
| Review packet | A bounded review bundle for external feedback on one artifact family. |
| Cosigner | An external reviewer or organizational supporter who can help validate the suite. |
| Design partner | A reviewer focused on fit, friction, and adoption rather than formal endorsement. |
| Neutral by design | The posture that AICP should map to ecosystems without becoming captive to one of them. |
| Semantic super-protocol | A protocol above multiple ecosystems that standardizes shared control-plane meaning. |
| OEP | AICP Open Enhancement Proposal — the authoritative change mechanism, defined in `governance/OEP_PROCESS.md`. |

## Usage Rule

If a reader sees two terms that appear similar, prefer the narrower one:

- use *binding* for transport
- use *profile* for ecosystem mapping
- use *domain protocol* for OAPS-native larger families
- use *companion system* for external aligned systems
