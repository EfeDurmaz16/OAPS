# OAPS Program Plan V2

## Status

This file is the long-horizon execution program that begins after the original
`PLANS.md` tranche set reached completion.

`PLANS.md` remains the historical record of the first execution wave.
This file is the active master program for the next wave.

## Intent

This plan assumes a maximal implementation posture:

- execute everything that is realistically implementable inside this repository
- do not defer major technical work merely because it is large
- treat time as cheap relative to architectural momentum
- stop only where an external party must review, approve, sign, or implement
- otherwise continue until the repo, spec surface, conformance surface, and
  reference implementations are pushed as far as possible

## Execution Rule

- always start from the first unfinished tranche
- complete it end-to-end if feasible
- validate it
- atomically commit every small completed step
- update `docs/STATUS.md`
- then continue to the next unfinished tranche in the same run
- only stop with `DONE:` or `BLOCKED:`

## Program Assumptions

- OAPS remains a protocol suite, not a single narrow spec
- breadth is intentional; the suite should absorb as much executable scope as possible
- "Now" includes anything that can be authored, implemented, tested, scaffolded,
  validated, or simulated within the repo by the current team and agent harness
- "External blocker" means the work cannot be honestly finished without outside review,
  outside signatures, or a second external implementation

## Definition Of Done For Any Tranche

A tranche is done only when:

- spec text exists or is updated
- schemas, examples, or mapping artifacts exist where applicable
- reference code exists where applicable
- conformance artifacts exist where applicable
- docs are aligned
- `docs/STATUS.md` is updated
- the work is atomically committed

## Execution Buckets

### A. Protocol Core

- core semantics
- lifecycle state models
- identity/delegation/mandate semantics
- approval/challenge semantics
- execution/evidence semantics

### B. Bindings

- HTTP
- JSON-RPC
- gRPC
- events/webhooks
- CLI/SSH/remoting surfaces

### C. Profiles

- MCP
- A2A
- auth-web
- FIDES/TAP
- x402
- MPP
- AP2
- ACP / UCP / commerce alignment
- OSP
- agent-client / remote coding-agent surfaces

### D. Conformance

- taxonomy
- fixture packs
- compatibility declarations
- TCK runner contracts
- second implementation growth

### E. Public Standardization Surface

- maturity model
- review packets
- public explainer docs
- co-signer / design partner surfaces
- landing page / ecosystem pages

## NOW

Everything below is in-scope now unless explicitly marked as an external blocker.

### 0. Program Control Plane

- [x] Add `PLANS-V2.md` and make it the active program file
- [x] Update `docs/NEXT-STEPS.md` to point at this file as the active queue
- [x] Add a "program wave" note to `docs/STATUS.md`
- [x] Add a top-level pointer in `README.md` explaining `PLANS.md` vs `PLANS-V2.md`
- [x] Add a status convention for `implemented`, `drafted`, `conformance-backed`, `externally-blocked`
- [x] Add a standard tranche template for V2 work inside `docs/STATUS.md`

### 1. Core Semantics Deepening

- [x] Add a dedicated `spec/core/STATE-MACHINE-DRAFT.md`
- [x] Define canonical task / interaction lifecycle states and illegal transitions
- [x] Define intent-to-task promotion semantics
- [x] Define challenge vs approval semantics explicitly
- [x] Define revoke vs reject vs cancel vs fail semantics explicitly
- [x] Define mandate vs delegation boundaries with examples
- [x] Add core schemas for any still-prose-only objects needed by the foundation draft
- [x] Add invalid example fixtures for core negative-path testing
- [x] Add runtime-backed core scenarios for intent-to-task promotion
- [x] Add runtime-backed core scenarios for revoke / reject distinction
- [x] Add replay semantics notes for evidence chain reconstruction from core events
- [x] Add a core error taxonomy appendix that aligns schema, docs, and runtime terminology

### 2. HTTP Binding Candidate Hardening

- [x] Add explicit HTTP discovery contract examples for every normative endpoint
- [x] Add endpoint-level canonical response examples under `examples/`
- [x] Add explicit response-shape fixtures for error objects
- [x] Add conformance scenarios for reject / revoke retrieval after mutation
- [x] Add conformance scenarios for replay-window pagination edge cases
- [x] Decide and document default ordering semantics for events and evidence retrieval
- [x] Add HTTP compatibility notes for content negotiation and compatibility fallback behavior
- [x] Add stronger auth-web notes for follow-on message authentication semantics
- [x] Add examples showing canonical `application/oaps+json` responses
- [x] Add examples showing compatibility `application/json` fallback where currently permitted
- [x] Expand HTTP reference tests to cover every documented normative endpoint path
- [x] Add explicit state-transition assertions into HTTP reference tests
- [x] Add fixture-backed scenarios for event replay after revoke / reject / approve

### 3. JSON-RPC Binding Draft

- [x] Add `spec/bindings/jsonrpc-binding-draft.md`
- [x] Define method families for discovery, interactions, messages, approvals, revoke, evidence, events
- [x] Map OAPS errors into JSON-RPC errors and transport-neutral error objects
- [x] Define correlation and idempotency semantics for JSON-RPC
- [x] Define notification vs request/response boundaries
- [x] Add first JSON-RPC example messages
- [x] Add first JSON-RPC schema and fixture stubs under `conformance/fixtures/bindings/jsonrpc/`
- [x] Add a draft compatibility scope for `binding:jsonrpc`
- [x] Add Python inventory/check support for the new binding scope

### 4. gRPC Binding Draft

- [x] Add `spec/bindings/grpc-binding-draft.md`
- [x] Add initial `.proto` package layout under `reference/proto/` or `spec/bindings/grpc/`
- [x] Define unary vs streaming method mapping for interactions, messages, approvals, events
- [x] Define gRPC error mapping rules
- [x] Define metadata/header mapping rules
- [x] Add example service definitions and message mapping notes
- [x] Add draft conformance fixture pack for `binding:grpc`
- [x] Add compatibility-scope placeholder rules for `binding:grpc`

### 5. Events / Webhooks Binding Draft

- [x] Add `spec/bindings/events-binding-draft.md`
- [x] Define push event envelope shape
- [x] Define replay-first vs push-first relationship clearly
- [x] Define delivery guarantees, dedupe keys, and retry semantics
- [x] Define replay resumption concepts even if cursors remain draft
- [x] Add example webhook payloads
- [x] Add initial fixture pack for `binding:events`
- [x] Add compatibility scope support in the Python line

### 6. Agent-Client / CLI / SSH Communication Track

- [ ] Add `docs/AGENT-CLIENT-LANDSCAPE.md`
- [ ] Add `spec/profiles/agent-client-draft.md`
- [ ] Define OAPS mapping for CLI-mediated agent sessions
- [ ] Define OAPS mapping for SSH-executed agent tasks
- [ ] Define authenticated operator / agent / remote-host model
- [ ] Define task, evidence, and approval semantics for remote shell execution
- [ ] Add fixture pack for `profile:agent-client`
- [ ] Add examples for CLI-run task initiation and remote execution evidence
- [ ] Add explicit non-goal note distinguishing this from SSH itself

### 7. MCP Profile Expansion

- [ ] Add explicit conformance scenarios for policy denial
- [ ] Add explicit conformance scenarios for approval rejection
- [ ] Add explicit conformance scenarios for missing upstream tool schema or malformed tool metadata
- [ ] Add evidence notes for policy-context-hash expectations
- [ ] Add mapping matrix for capability metadata fidelity limits
- [ ] Add mapping notes for resources and prompts even if not yet runtime-backed
- [ ] Add example profile declarations for partial vs compatible MCP support
- [ ] Tighten MCP profile language around what is actually implemented now vs draft-track

### 8. A2A Profile Expansion

- [ ] Add deeper lifecycle mapping between A2A tasks/messages and OAPS interactions/messages
- [ ] Add explicit message threading / state propagation notes
- [ ] Add examples for approval interposition on A2A task boundaries
- [ ] Add examples for delegation carryover through A2A tasks
- [ ] Add examples for evidence carryover and task replay notes
- [ ] Add fixture scenarios for partial completion / long-running task updates
- [ ] Add fixture scenarios for task cancellation/revocation mapping
- [ ] Add compatibility declaration examples for partial A2A implementations

### 9. Auth-Web Profile Hardening

- [ ] Add explicit subject-binding examples for every HTTP mutation surface
- [ ] Add examples for actor-card discovery and identity assertions
- [ ] Add examples for delegated actor behavior under baseline auth-web rules
- [ ] Add stronger notes on bearer-token subject binding assumptions
- [ ] Add invalid-fixture examples for mismatched subject / actor_id
- [ ] Add conformance scenarios for expired delegation under auth-web profile semantics

### 10. FIDES / TAP Trust Profile Hardening

- [ ] Add `trust-tier` and attestation semantics draft text
- [ ] Add mapping notes from generic auth-web to higher-assurance trust profile
- [ ] Add attested-actor examples
- [ ] Add delegation + attestation combined examples
- [ ] Add approval-boundary examples for high-assurance actions
- [ ] Add conformance fixture scenarios for attestation-required paths
- [ ] Add explicit notes about what remains outside the current runtime

### 11. x402 Profile Expansion

- [ ] Add stronger challenge / retry mapping notes
- [ ] Add payment requirement and authorization examples
- [ ] Add HTTP 402 alignment notes where the current profile is still only conceptual
- [ ] Add partial compatibility examples for implementations that only support payment discovery
- [ ] Add scenario metadata for authorization intent vs settlement result
- [ ] Add invalid example showing payment challenge without compatible authorization context

### 12. MPP Profile Draft

- [ ] Add `profiles/mpp-draft.md`
- [ ] Define mapping from OAPS payment coordination objects into machine payment sessions
- [ ] Add first example session object mappings
- [ ] Add first fixture pack for `profile:mpp`
- [ ] Add compatibility declaration examples for draft-only support

### 13. AP2 Profile Draft

- [ ] Add `profiles/ap2-draft.md`
- [ ] Define mandate and payment authorization mapping
- [ ] Add example mandate-chain objects
- [ ] Add example approval + authorization handoff notes
- [ ] Add first fixture pack for `profile:ap2`

### 14. ACP / UCP / Commerce Alignment Track

- [ ] Add `docs/COMMERCE-LANDSCAPE.md`
- [ ] Add `spec/domain/commerce-draft.md`
- [ ] Add `profiles/acp-draft.md`
- [ ] Add `profiles/ucp-draft.md`
- [ ] Define how cart/order/authorization/fulfillment semantics should relate to OAPS
- [ ] Add examples for delegated checkout / order intent / merchant authorization context
- [ ] Add fixture stubs for commerce-domain conformance

### 15. OSP / Provisioning Track Expansion

- [ ] Deepen provisioning lifecycle mapping notes
- [ ] Add examples for estimate / provision / credential delivery / rotate / suspend / deprovision
- [ ] Add fixture scenarios for provisioning lifecycle transitions
- [ ] Add examples for approval-gated provisioning
- [ ] Add examples for payment-linked provisioning handoff

### 16. Core + Binding + Profile Schema Growth

- [ ] Add any missing schemas required by the new drafts above
- [ ] Add example JSON for each new schema
- [ ] Keep schema and example validation green as new scopes are added
- [ ] Add schema index entries for every new area
- [ ] Add spec/index pointers for every new area

### 17. Conformance System Growth

- [ ] Extend taxonomy for new binding and profile scopes
- [ ] Add fixture packs for JSON-RPC, gRPC, events, agent-client, MPP, AP2, ACP, UCP
- [ ] Add richer negative-path scenario taxonomy
- [ ] Add compatibility examples for partial / incompatible / draft-only implementations
- [ ] Add runner-contract notes for multi-binding runners
- [ ] Add docs explaining compatibility declarations for draft scopes vs stable scopes

### 18. Python Second Implementation Expansion

- [ ] Add fixture support for all new scopes introduced above
- [ ] Add compatibility support for all new scopes introduced above
- [ ] Add richer result validation for new coverage types
- [ ] Add text output for scope summaries grouped by layer
- [ ] Add helper commands for comparing result files or declaration files
- [ ] Add result-schema validation for compatibility declaration outputs directly
- [ ] Add example CLI docs for every major command mode

### 19. TypeScript Reference Line Expansion

- [ ] Add runtime-backed support where feasible for the newly deepened HTTP semantics
- [ ] Add reference test slices for newly specified core/HTTP semantics
- [ ] Add partial runtime anchors for MCP and auth/trust scenarios where already credible
- [ ] Add explicit placeholders only when bounded by honest non-claim docs and conformance metadata

### 20. Detached Supervisor / Long-Run Harness Expansion

- [ ] Add cloud-task wrapper variant
- [ ] Add more explicit checkpointing behavior in `docs/STATUS.md`
- [ ] Add per-run metadata logs under `.codex/state/` or `.codex/supervisor-runs/`
- [ ] Add result capture from unattended runs into structured files
- [ ] Add clearer fallback behavior when Codex websocket / upstream runtime errors occur
- [ ] Add a supervisor note on when to switch to Claude design lane vs Codex protocol lane

### 21. Public Docs Surface

- [ ] Add a top-level "suite map" page
- [ ] Add a top-level "binding map" page
- [ ] Add a top-level "profile map" page
- [ ] Add a top-level "domain protocol map" page
- [ ] Add a top-level "implementation map" page
- [ ] Add glossary page for agentic primitives
- [ ] Add "why OAPS exists" explainer page with direct protocol comparisons

### 22. Co-Signer / Design Partner Surface

- [ ] Add `docs/COSIGNERS.md`
- [ ] Add `docs/DESIGN-PARTNERS.md`
- [ ] Add a clearer review workflow from public landing page to spec packet
- [ ] Add a "what we want reviewed" page grouped by protocol area
- [ ] Add a co-signer readiness checklist
- [ ] Add a design-partner readiness checklist

### 23. Landing Page / Narrative Surface

- [ ] Add homepage content map aligned to the latest protocol positioning
- [ ] Add co-signer page copy
- [ ] Add design-partner page copy
- [ ] Add FAQ for protocol, profile, and governance questions
- [ ] Add "not a wrapper, not a replacement" narrative blocks
- [ ] Add agent-to-tool / agent-to-agent / agent-to-service / payment-coordination framing explicitly
- [ ] Add proof-point section for Sardis / FIDES / agit / OSP as aligned systems
- [ ] Add neutral-by-design positioning notes

### 24. Review Packet System Expansion

- [ ] Add profile-specific review packets for MCP, A2A, auth/trust, x402, provisioning, and commerce
- [ ] Add review packet templates for future profiles
- [ ] Add issue templates for review feedback intake
- [ ] Add a repo issue taxonomy for protocol review comments

### 25. Repository Structure and Navigation Hardening

- [ ] Add index files for every major directory missing one
- [ ] Add explicit stable/draft/concept badges or labels to directory READMEs
- [ ] Add an implementation coverage map across docs, schemas, examples, and reference code
- [ ] Add a generated or maintained index for conformance scopes and status

## EXTERNAL BLOCKERS

These items should be prepared now but can only be honestly completed after outside participation.

### 26. External Review And Co-Signer Work

- [ ] Obtain external technical review on MCP profile
- [ ] Obtain external technical review on A2A profile
- [ ] Obtain external technical review on trust/payment profiles
- [ ] Obtain external technical review on provisioning alignment
- [ ] Obtain one or more public co-signer commitments

### 27. Independent Implementation Beyond First-Party Repos

- [ ] Obtain a non-founder external implementation of part of the suite
- [ ] Obtain an external compatibility declaration generated from the suite artifacts
- [ ] Run at least one cross-organization interoperability exercise

### 28. Formal Standardization Path

- [ ] Decide whether to remain independent or seek foundation affiliation
- [ ] Prepare formal governance transition package if external participation justifies it

## DONE Meaning For V2

`DONE` for this program means:

- every currently implementable item in the `NOW` section is finished and committed
- only items that require outside review, outside signatures, or outside implementations remain

## BLOCKED Meaning For V2

`BLOCKED` means:

- a real technical blocker prevents further implementation inside the repo
- or the next unfinished item genuinely requires outside review or outside execution
