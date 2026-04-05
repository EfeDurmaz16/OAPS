# OAPS Status

## Current Objective

Implement the OAPS protocol suite as far as the current repo, tooling, and specifications can credibly support.

## Active Tranche

- scope: long-horizon protocol, conformance, and reference implementation work
- execution mode: founder-led, agent-amplified, atomic commits
- stop rule: only `DONE:` or `BLOCKED:`

## Program Wave

- `PLANS.md` is the completed first execution wave
- `PLANS-V2.md` is the active long-horizon master program

## V2 Status Convention

Use these labels inside each V2 tranche entry to show what kind of completion happened:

- `drafted` — spec text, schemas, examples, or docs now exist, but runtime and fixture coverage may still be partial
- `implemented` — reference code or tooling behavior now exists and is locally validated
- `conformance-backed` — the work is covered by fixture metadata, validators, runtime tests, or result artifacts
- `externally-blocked` — the next honest completion step requires an outside reviewer, co-signer, or independent implementation

## V2 Tranche Entry Template

Append one entry per tranche using this shape:

### YYYY-MM-DD

- tranche:
- tranche status:
  - drafted:
  - implemented:
  - conformance-backed:
  - externally-blocked:
- changes:
- validation:
- commits:
- next unfinished work:
- status: `DONE` or `BLOCKED`

## Latest Known Baseline

- suite charter, architecture, and roadmap docs exist
- conformance manifest and fixture packs exist
- TypeScript reference line exists
- Python interoperability line exists

## Execution Log

Append one entry per tranche using the V2 template above:

### 2026-04-05

- tranche: HTTP conformance and ordering hardening
- tranche status:
  - drafted:
    - documented default oldest-to-newest replay ordering in both `SPEC.md` and the HTTP binding draft
    - tightened `profiles/auth-web.md` with a stronger note about follow-on message subject binding on `POST /interactions/{id}/messages`
  - implemented:
    - expanded the HTTP reference tests to cover `GET /actor-card`, `GET /capabilities`, replay-window edge cases, and explicit interaction-state assertions after create/approve/reject/revoke flows
  - conformance-backed:
    - added HTTP fixture-backed error-shape examples for authentication-required, interaction-not-found, approval-not-pending, idempotency-conflict, and replay-cursor-not-found payloads
    - added conformance scenarios for reject/revoke retrieval after mutation, replay-window edge cases, and replay after approve/reject/revoke terminal events
    - marked the remaining HTTP Binding Candidate Hardening items complete in `PLANS-V2.md`
  - externally-blocked:
    - none
- changes:
  - expanded the HTTP binding conformance pack with new discovery, error-mapping, retrieval, replay, and terminal-event scenarios
  - strengthened the HTTP reference tests to match the documented normative endpoint surface and lifecycle expectations more explicitly
  - aligned binding/profile prose with the now-explicit replay ordering and follow-on message authentication semantics
- validation:
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/http build`
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/http test`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope binding:http --output /tmp/oaps-http-fixture-check-v2.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/oaps-http-fixture-check-v2.json --json`
- commits:
  - `http: tighten endpoint and replay coverage`
- next unfinished work:
  - start V2 tranche 3 by adding the JSON-RPC binding draft and its first fixture stubs
- status: `DONE`

### 2026-04-05

- tranche: HTTP contract and response example pack
- tranche status:
  - drafted:
    - added `examples/http/discovery-contract.v1.json` with explicit request/response anchors for every normative HTTP endpoint
    - added canonical HTTP response examples, request examples, error examples, and media-type examples under `examples/http/`
    - tightened the HTTP binding draft with an explicit example-pack section and clearer content-negotiation fallback notes
  - implemented:
    - packaged the current HTTP reference slice into stable example artifacts that match the implemented endpoint shapes and error payloads
  - conformance-backed:
    - marked the HTTP discovery-example, response-example, content-negotiation-note, canonical-media example, and compatibility-fallback example items complete in `PLANS-V2.md`
  - externally-blocked:
    - none
- changes:
  - added a reader-facing HTTP example pack with endpoint contract metadata, request bodies, response bodies, error payloads, and media-type notes
  - documented the example-pack entry points directly in `spec/bindings/http-binding-draft.md`
  - advanced the HTTP hardening tranche past the example-and-documentation sub-slice before the remaining runtime/conformance follow-ons
- validation:
  - `python3 - <<'PY' ... parse every JSON file under examples/http and verify discovery-contract.v1.json references only existing example files ... PY`
  - `git diff --check`
- commits:
  - `docs: add http contract examples`
- next unfinished work:
  - add explicit response-shape fixtures for HTTP error objects
  - add conformance scenarios for reject / revoke retrieval after mutation
  - add conformance scenarios for replay-window pagination edge cases
  - decide and document default ordering semantics for events and evidence retrieval
  - add stronger auth-web notes for follow-on message authentication semantics
  - expand HTTP reference tests to cover every documented normative endpoint path and state-transition assertions
- status: `DONE`

### 2026-04-05

- tranche: core lifecycle conformance follow-through
- tranche status:
  - drafted:
    - added `schemas/foundation/interaction-transition.json` and `examples/foundation/interaction-transition.json` so interaction lifecycle movement is no longer prose-only
    - added core negative fixtures for invalid invoke intents and illegal completed-to-active lifecycle regressions
    - added replay-reconstruction notes to `spec/core/STATE-MACHINE-DRAFT.md` and a core error-taxonomy appendix to `spec/core/FOUNDATION-DRAFT.md`
  - implemented:
    - added reference-core lifecycle helpers for task promotion plus task/interaction transition validation in `@oaps/core`
  - conformance-backed:
    - expanded the core conformance taxonomy and fixture pack to cover interaction transitions, invalid negative fixtures, intent-to-task promotion, and reject-versus-revoke distinction
    - marked the remaining Core Semantics Deepening items complete in `PLANS-V2.md`
  - externally-blocked:
    - none
- changes:
  - added the missing interaction-transition schema/example and wired them into schema-pack validation
  - added negative-path core fixtures and runtime-backed lifecycle tests for promotion and terminal-state distinction
  - aligned core lifecycle docs, conformance metadata, and runtime terminology around replay reconstruction and error-code/category mapping
- validation:
  - `pnpm --dir reference/oaps-monorepo generate:core-contracts`
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/core test`
  - `pnpm --dir reference/oaps-monorepo validate:spec-pack`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope core --output /tmp/oaps-core-fixture-check-v2.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/oaps-core-fixture-check-v2.json --json`
- commits:
  - `core: add lifecycle transition helpers`
- next unfinished work:
  - begin V2 tranche 2: add explicit HTTP discovery and endpoint response examples
- status: `DONE`

### 2026-04-05

- tranche: core lifecycle support schemas
- tranche status:
  - drafted:
    - added foundation schemas and examples for `Challenge` and `TaskTransition` so the lifecycle draft no longer depends on prose alone for those support objects
    - updated the foundation/core spec text to describe the new lifecycle support objects and how they relate to task promotion and challenge handling
  - implemented:
    - extended the spec-pack validator mapping so the new lifecycle examples are schema-validated with the rest of the foundation examples
  - conformance-backed:
    - extended the core taxonomy and fixture pack with `core.challenge.valid` and `core.task-transition.valid`
    - marked the schema-growth item complete in `PLANS-V2.md`
  - externally-blocked:
    - none
- changes:
  - added `schemas/foundation/challenge.json` and `schemas/foundation/task-transition.json`
  - added `examples/foundation/challenge.json` and `examples/foundation/task-transition.json`
  - aligned the schema indexes, foundation draft, state-machine draft, spec index, conformance taxonomy, and core fixture pack with the new lifecycle support objects
- validation:
  - `pnpm --dir reference/oaps-monorepo validate:spec-pack`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope core --output /tmp/oaps-core-schema-growth-check.json`
- commits:
  - `spec: add core lifecycle support schemas`
- next unfinished work:
  - add invalid example fixtures for core negative-path testing
  - add runtime-backed core scenarios for intent-to-task promotion
  - add runtime-backed core scenarios for revoke / reject distinction
  - add replay semantics notes for evidence chain reconstruction from core events
  - add a core error taxonomy appendix that aligns schema, docs, and runtime terminology
- status: `DONE`

### 2026-04-05

- tranche: core lifecycle state-machine draft
- tranche status:
  - drafted:
    - added `spec/core/STATE-MACHINE-DRAFT.md` as the dedicated lifecycle companion to the core foundation draft
    - defined canonical task states, permitted transitions, illegal transitions, intent-to-task promotion rules, approval-versus-challenge semantics, revoke/reject/cancel/fail distinctions, and mandate-versus-delegation boundaries
  - implemented:
    - linked the new lifecycle draft from the spec tree entry points so it is part of the canonical reading order
  - conformance-backed:
    - marked the first six Core Semantics Deepening plan items complete in `PLANS-V2.md`
  - externally-blocked:
    - none
- changes:
  - added the first dedicated lifecycle/state-machine draft under `spec/core/`
  - aligned `spec/README.md`, `spec/INDEX.md`, and `spec/core/FOUNDATION-DRAFT.md` so the lifecycle draft is a first-class normative companion
  - advanced the V2 core-semantics checklist past the prose-only lifecycle clarification items
- validation:
  - `python3 - <<'PY' ... verify spec navigation now references STATE-MACHINE-DRAFT.md and PLANS-V2.md marks the first six core-semantics items complete ... PY`
  - `git diff --check`
- commits:
  - `spec: add core lifecycle state machine draft`
- next unfinished work:
  - add core schemas for any still-prose-only objects needed by the foundation draft
  - add invalid example fixtures for core negative-path testing
  - add runtime-backed core scenarios for intent-to-task promotion and revoke/reject distinction
  - add replay semantics notes for evidence chain reconstruction from core events
  - add a core error taxonomy appendix that aligns schema, docs, and runtime terminology
- status: `DONE`

### 2026-04-05

- tranche: V2 status convention and tranche template
- tranche status:
  - drafted:
    - `docs/STATUS.md` now defines the V2 execution-status vocabulary used to describe tranche outcomes
  - implemented:
    - `docs/STATUS.md` now includes a standard V2 tranche entry template for future long-horizon execution logs
  - conformance-backed:
    - `PLANS-V2.md` now marks the V2 control-plane status-convention/template tranche complete
  - externally-blocked:
    - none
- changes:
  - added a V2 status convention section to distinguish `drafted`, `implemented`, `conformance-backed`, and `externally-blocked`
  - added a standard V2 tranche entry template so future execution-log entries use a consistent shape
  - recorded this tranche and aligned the active V2 plan queue with the completed control-plane work
- validation:
  - `python3 - <<'PY' ... verify docs/STATUS.md contains the four V2 status labels and template headings, and PLANS-V2.md marks both control-plane checkboxes complete ... PY`
- commits:
  - `docs: add v2 status conventions`
- next unfinished work:
  - begin V2 tranche 1: add the dedicated core state-machine draft and related lifecycle semantics
- status: `DONE`

### 2026-04-05

- tranche: V2 master program bootstrap
- changes:
  - added `PLANS-V2.md` as the new active long-horizon execution program after the original `PLANS.md` wave reached completion
  - moved the active queue pointer in `docs/NEXT-STEPS.md` from the completed V1 plan to the new V2 program
  - updated this status file to record the program-wave transition from the completed first execution wave to the new larger implementation wave
- validation:
  - `git diff --check`
- commits:
  - `a67456a` `docs: add OAPS v2 execution program`
- next unfinished work:
  - begin the first unfinished V2 tranche from `PLANS-V2.md`
- status: `DONE`

### 2026-04-05

- tranche: core runtime-backed conformance scenarios
- changes:
  - added core conformance scenarios for delegation expiry, verifiable evidence chains, tamper detection, previous-hash mismatch detection, and stable evidence hashing
  - marked the core runtime-backed conformance tranche complete in `PLANS.md`
- validation:
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/core test`
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/evidence test`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope core --output /tmp/oaps-core-fixture-check.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/oaps-core-fixture-check.json --json`
- commits:
  - `conformance: add core runtime-backed scenarios`
- next unfinished work:
  - add HTTP runtime-backed conformance scenarios for discovery, evidence/event retrieval, rejection, and revoke flows
  - add explicit MCP runtime-backed scenarios for policy denial and approval rejection paths
- status: `DONE`

### 2026-04-05

- tranche: HTTP runtime-backed conformance scenarios
- changes:
  - added HTTP runtime-backed conformance scenarios for discovery, message interaction-id mismatch rejection, approval rejection, revocation, and evidence/event retrieval
  - expanded the HTTP reference tests to exercise the newly declared binding scenarios
  - tightened the HTTP binding draft to describe the current runtime-backed conformance slice more explicitly
- validation:
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/http test`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope binding:http --output /tmp/oaps-http-fixture-check.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/oaps-http-fixture-check.json --json`
- commits:
  - `conformance: add http runtime-backed scenarios`
- next unfinished work:
  - add explicit MCP runtime-backed scenarios for policy denial, approval rejection, and policy-context-hash evidence notes
  - regenerate suite example result artifacts after the remaining runtime-backed scenario updates land
- status: `DONE`

### 2026-04-05

- tranche: runtime-backed conformance artifact refresh and profile mapping tightening
- changes:
  - refreshed `conformance/results/example-result.v1.json` and derived compatibility declaration examples so the checked artifacts match the expanded runtime-backed core, HTTP, MCP, and auth-web fixture packs
  - tightened `conformance/README.md` to describe the current runtime-backed HTTP, MCP, and auth-web conformance surfaces more explicitly
  - added explicit mapping matrices and boundary notes to `profiles/a2a-draft.md`, `profiles/auth-web.md`, `profiles/auth-fides-tap-draft.md`, `profiles/x402-draft.md`, and `profiles/osp-draft.md`
  - clarified the MCP profile's current compatibility notes without overclaiming unsupported runtime coverage
  - marked the remaining runtime-backed conformance and profile-mapping plan items complete in `PLANS.md`
  - advanced `docs/NEXT-STEPS.md` to the next unfinished priorities after the runtime-backed and profile-mapping tranche
- validation:
  - `pnpm --dir reference/oaps-monorepo build`
  - `pnpm --dir reference/oaps-monorepo validate:spec-pack`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/mcp-adapter test`
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/http test`
  - `python3 -m unittest reference/oaps-python/tests/test_manifest.py`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --output conformance/results/example-result.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --output conformance/results/examples/fixture-check-all-scopes.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope profile:mcp --scenario mcp.intent.execution --output conformance/results/examples/fixture-check-profile-mcp-partial.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result conformance/results/example-result.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result conformance/results/examples/fixture-check-all-scopes.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result conformance/results/examples/fixture-check-profile-mcp-partial.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result conformance/results/examples/fixture-check-core-incompatible.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compatibility --repo-root . --result conformance/results/example-result.v1.json --json --output conformance/results/examples/compatibility-declaration-all-scopes.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compatibility --repo-root . --result conformance/results/examples/fixture-check-profile-mcp-partial.v1.json --json --output conformance/results/examples/compatibility-declaration-profile-mcp-partial.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compatibility --repo-root . --result conformance/results/examples/fixture-check-core-incompatible.v1.json --json --output conformance/results/examples/compatibility-declaration-core-incompatible.v1.json`
- commits:
  - `conformance: refresh runtime-backed result artifacts`
  - `docs: tighten profile mapping matrices`
- next unfinished work:
  - exercise the local Codex harness on a real unattended multi-tranche run and capture findings in `docs/STATUS.md`
  - add a clearer stable-vs-draft-vs-concept matrix to top-level docs
  - add a public-facing “how to review OAPS” short packet
  - decide whether to formalize event replay semantics further in the HTTP binding draft
- status: `DONE`


### 2026-04-05

- tranche: HTTP binding hardening follow-ons
- changes:
  - enforced authenticated-subject binding on `POST /interactions/{id}/messages` so a bearer-authenticated caller cannot append a message envelope that claims a different `from.actor_id`
  - extended binding-level idempotency coverage across `POST /interactions/{id}/messages`, `/approve`, `/reject`, and `/revoke`, using stable replay fingerprints so identical retries do not duplicate lifecycle transitions or evidence
  - added auth-web/profile conformance coverage for follow-on message subject binding so the shared HTTP runtime now proves fail-closed sender checks beyond initial interaction creation
  - switched the reference HTTP responses onto the canonical `application/oaps+json` media type while still advertising `application/json` as a compatibility allowance in discovery
  - formalized minimal `after`/`limit` replay-window semantics for HTTP event and evidence retrieval in `SPEC.md`, the HTTP binding draft, the conformance fixture pack, and the profile/doc set that reuses the shared HTTP audit surface
  - refreshed the example result artifacts and compatibility declarations to reflect the expanded HTTP runtime-backed scenario count and marked the new HTTP binding hardening follow-ons complete in `PLANS.md`
- validation:
  - `pnpm --dir reference/oaps-monorepo validate:spec-pack`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `pnpm --dir reference/oaps-monorepo build`
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/http test`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --output conformance/results/example-result.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --output conformance/results/examples/fixture-check-all-scopes.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope profile:mcp --scenario mcp.intent.execution --output conformance/results/examples/fixture-check-profile-mcp-partial.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result conformance/results/example-result.v1.json --json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result conformance/results/examples/fixture-check-all-scopes.v1.json --json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result conformance/results/examples/fixture-check-profile-mcp-partial.v1.json --json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compatibility --repo-root . --result conformance/results/example-result.v1.json --json --output conformance/results/examples/compatibility-declaration-all-scopes.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compatibility --repo-root . --result conformance/results/examples/fixture-check-profile-mcp-partial.v1.json --json --output conformance/results/examples/compatibility-declaration-profile-mcp-partial.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compatibility --repo-root . --result conformance/results/examples/fixture-check-core-incompatible.v1.json --json --output conformance/results/examples/compatibility-declaration-core-incompatible.v1.json`
- commits:
  - `http: extend idempotent mutation coverage`
  - `http: add replay window support`
  - `http: align replay windows and canonical media type`
  - `http: cover canonical media type responses`
  - `docs: record http binding hardening tranche`
- next unfinished work:
  - none currently queued in `PLANS.md`
- status: `DONE`

### 2026-04-05

- tranche: profile mapping note hardening
- changes:
  - added an explicit A2A mapping matrix and lifecycle mapping notes without claiming end-to-end A2A runtime support
  - added a FIDES/TAP trust-upgrade mapping matrix that distinguishes reusable runtime seams from non-claimed verifier behavior
  - added x402 challenge/retry and OSP provisioning lifecycle mapping matrices tied to current shared runtime anchors and explicit non-claim boundaries
  - confirmed the A2A, trust-upgrade, and payment/provisioning profile-mapping tranches are now marked complete in `PLANS.md`
  - advanced `docs/NEXT-STEPS.md` to the harness-execution priority after profile-note completion
- validation:
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `python3 - <<'PY' ... verify referenced profile scenario ids exist in the conformance packs ... PY`
- commits:
  - `docs: harden profile mapping notes`
- next unfinished work:
  - exercise the local Codex harness on a real unattended multi-tranche run and record the behavior
  - add a clearer stable versus draft versus concept matrix to top-level docs
  - add a public-facing how-to-review packet
- status: `DONE`

### 2026-04-05

- tranche: top-level maturity matrix
- changes:
  - added `docs/MATURITY-MATRIX.md` to distinguish stable, draft, and concept surfaces across the suite
  - linked the new maturity matrix from the top-level `README.md` and `docs/README.md`
  - marked the top-level maturity-matrix tranche complete in `PLANS.md`
- validation:
  - `rg -n "MATURITY-MATRIX" README.md docs/README.md docs/MATURITY-MATRIX.md`
- commits:
  - `docs: add top-level maturity matrix`
- next unfinished work:
  - add a public-facing how-to-review packet
  - exercise the local Codex harness on a real unattended multi-tranche run and record the behavior
- status: `DONE`

### 2026-04-05

- tranche: public review entry packet
- changes:
  - added `docs/HOW-TO-REVIEW-OAPS.md` as the short public-facing review packet
  - linked the new entry packet from `README.md`, `docs/README.md`, and `docs/REVIEW-PACKET-INDEX.md`
  - marked the public review-packet tranche complete in `PLANS.md`
- validation:
  - `rg -n "HOW-TO-REVIEW-OAPS" README.md docs/README.md docs/REVIEW-PACKET-INDEX.md docs/HOW-TO-REVIEW-OAPS.md`
- commits:
  - `docs: add public OAPS review packet`
- next unfinished work:
  - exercise the local Codex harness on a real unattended multi-tranche run and record the behavior
- status: `DONE`

### 2026-04-05

- tranche: harness exercise and supervisor fallback
- changes:
  - ran `scripts/codex-tranche-loop.sh` as a real unattended local harness exercise with a prompt that explicitly avoided recursive harness invocation
  - confirmed the nested `codex exec` process loaded the required OAPS context and began tranche selection before failing on `.git/index.lock` writes inside the nested session
  - documented the observed nested-Codex Git-write limitation and the `CODEX_HARNESS_BYPASS_SANDBOX=1` workaround in `README.md` and `docs/RUNBOOK.md`
  - aligned both harness scripts on explicit sandbox flag plumbing and added `scripts/codex-supervisor.sh` as a detached top-level supervisor workaround, with `.codex/supervisor-runs/` ignored in `.gitignore`
  - marked the harness exercise and supervisor-variant tranches complete in `PLANS.md`
  - advanced `docs/NEXT-STEPS.md` to indicate there is no short-horizon override while `PLANS.md` remains fully complete
- validation:
  - `bash -n scripts/codex-harness.sh scripts/codex-tranche-loop.sh scripts/codex-supervisor.sh`
  - `MAX_ROUNDS=3 scripts/codex-tranche-loop.sh "<non-recursive harness exercise prompt>"`
  - `tail -n 40 .codex/state/last-message.txt`
  - `git status --short --branch`
- commits:
  - `fix: add codex harness bypass and supervisor fallback`
- next unfinished work:
  - none currently queued in `PLANS.md`
- status: `DONE`
