# OAPS Execution Plan

## Purpose

This file is the durable tranche queue for long-running Codex execution.

Execution rule:

- always start from the first unfinished tranche
- complete it end-to-end if feasible
- validate it
- atomically commit each small completed step
- update `docs/STATUS.md`
- then move to the next unfinished tranche in the same run

## Tranche Queue

### 0. Execution Harness

- [x] Add repository-scoped `AGENTS.md`
- [x] Add project-scoped `.codex/config.toml`
- [x] Add harness instructions and loop scripts
- [x] Add `docs/STATUS.md` and `docs/RUNBOOK.md`
- [x] Add explicit atomic-commit rules
- [ ] Exercise the harness on at least one multi-tranche unattended run and record the behavior
- [ ] Add a cloud-task variant or SDK supervisor variant if local loop usage proves insufficient

### 1. Core Semantics and Evidence

- [x] Stabilize schema-derived core constants
- [x] Add version negotiation coverage
- [x] Add delegation fail-closed coverage
- [x] Add evidence tamper detection coverage
- [x] Add evidence hash stability coverage
- [ ] Add core runtime-backed conformance scenarios for delegation expiry and replay-related failures
- [ ] Add compatibility declaration examples for core scope

### 2. HTTP Binding

- [x] Implement `POST /interactions/{id}/messages`
- [x] Persist message history in the reference server
- [x] Add HTTP negative-path coverage for auth, versioning, idempotency, and approval-not-pending
- [x] Expand HTTP conformance metadata
- [ ] Add stronger binding-level compatibility declarations and example result payloads
- [ ] Decide whether to formalize event replay semantics further in the binding draft

### 3. MCP Profile

- [x] Map capability discovery and invoke paths
- [x] Add negative-path runtime tests for missing capability, approval mismatch, auth mismatch, and upstream error translation
- [x] Expand MCP conformance fixtures and runtime-case metadata
- [ ] Add more explicit approval-rejected and policy-context-hash compatibility notes
- [ ] Add profile-specific compatibility declaration examples

### 4. A2A Profile

- [x] Establish draft profile and basic fixture pack
- [x] Expand fixture coverage for lifecycle preservation, delegation carryover, approval interposition, and evidence carryover
- [ ] Add stronger mapping matrices between A2A task/message surfaces and OAPS task/interaction semantics
- [ ] Add compatibility declaration examples for `profile:a2a`

### 5. Auth and Trust Profiles

- [x] Add `oaps-auth-web-v1` draft and conformance pack
- [x] Add `oaps-auth-fides-tap-v1` draft and conformance pack
- [x] Deepen metadata with `notes`, `related_examples`, and bounded runtime-case references
- [ ] Add stronger explicit mappings from current core/runtime behavior into trust-upgrade semantics
- [ ] Add compatibility declaration examples for auth scopes

### 6. Payment and Provisioning Profiles

- [x] Add `oaps-x402-v1` draft and conformance pack
- [x] Add `oaps-osp-v1` draft and conformance pack
- [x] Deepen metadata with bounded runtime-case references
- [ ] Add stronger mapping notes for payment challenge/retry and provisioning lifecycle transitions
- [ ] Add compatibility declaration examples for payment and provisioning scopes

### 7. Conformance and TCK

- [x] Add suite manifest, taxonomy, fixture index, runner contract, and result schema
- [x] Add fixture packs across core, HTTP, MCP, A2A, auth, x402, and OSP
- [x] Add Python static `inventory` and `check` commands
- [x] Add Python `validate-result`
- [ ] Expand `conformance/results/example-result.v1.json` to reflect modern scope and runner usage
- [ ] Add compatibility declaration documents and examples
- [ ] Add more runtime-backed scenarios where the reference implementation already supports them

### 8. Second Implementation

- [x] Bootstrap Python interoperability line
- [x] Add manifest validation
- [x] Add inventory with scope filtering
- [x] Add static fixture checking
- [x] Add result validation
- [ ] Add scope-level compatibility summary output
- [ ] Add a small machine-readable compatibility declaration export

### 9. Docs, Governance, and Outreach

- [x] Add charter, architecture, ecosystem mapping, standards landscape, review calendar, and review packet docs
- [x] Add OEP process and RF patent pledge drafts
- [x] Add review target matrix and packet index
- [ ] Add compatibility declaration documentation
- [ ] Add a clearer “what is stable vs draft vs concept” matrix to top-level docs
- [ ] Add a public-facing “how to review OAPS” short packet

## Stop Conditions

The loop should stop only with:

- `DONE: <summary>` when all currently reachable tranches are complete
- `BLOCKED: <precise blocker>` when a real blocker prevents safe continuation
