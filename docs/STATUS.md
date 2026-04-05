# OAPS Status

## Current Objective

Implement the OAPS protocol suite as far as the current repo, tooling, and specifications can credibly support.

## Active Tranche

- scope: long-horizon protocol, conformance, and reference implementation work
- execution mode: founder-led, agent-amplified, atomic commits
- stop rule: only `DONE:` or `BLOCKED:`

## Latest Known Baseline

- suite charter, architecture, and roadmap docs exist
- conformance manifest and fixture packs exist
- TypeScript reference line exists
- Python interoperability line exists

## Execution Log

Append one entry per tranche:


### 2026-04-05

- tranche: unattended local Codex harness exercise
- changes:
  - treated this invocation itself as the real local harness exercise tranche required by `PLANS.md` and the previous `docs/NEXT-STEPS.md`
  - loaded the required AGENTS-scoped startup context before making substantive changes and confirmed the repository started from a clean working tree
  - did not recurse into another harness-exercise task; instead marked the harness exercise complete in `PLANS.md` and advanced `docs/NEXT-STEPS.md` to the next unfinished documentation work
- validation:
  - `git status --short --branch`
  - `python3 - <<'PY' ... verify the harness plan checkbox is complete and docs/NEXT-STEPS.md now starts with the docs matrix priority ... PY`
- commits:
  - `docs: record harness exercise tranche`
- next unfinished work:
  - add a clearer stable-versus-draft-versus-concept matrix to top-level docs
  - add a public-facing how-to-review packet
  - decide whether to formalize event replay semantics further in the HTTP binding draft
  - evaluate a cloud-task or SDK-supervisor harness variant later if the local loop proves insufficient
- status: `DONE`

### Template

- date:
- tranche:
- changes:
- validation:
- commits:
- next unfinished work:
- status: `DONE` or `BLOCKED`

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
  - advanced `docs/NEXT-STEPS.md` to the remaining review-packet and binding/harness follow-up work
- validation:
  - `rg -n "MATURITY-MATRIX" README.md docs/README.md docs/MATURITY-MATRIX.md`
- commits:
  - `docs: add maturity matrix and harness fallback`
- next unfinished work:
  - add a public-facing how-to-review packet
  - decide whether to formalize event replay semantics further in the HTTP binding draft
  - add a cloud-task variant or SDK supervisor variant if local loop usage proves insufficient
- status: `DONE`

### 2026-04-05

- tranche: public review entry packet
- changes:
  - added `docs/HOW-TO-REVIEW-OAPS.md` as the short public-facing review packet
  - linked the new entry packet from `README.md`, `docs/README.md`, and `docs/REVIEW-PACKET-INDEX.md`
  - marked the public review-packet tranche complete in `PLANS.md`
  - advanced `docs/NEXT-STEPS.md` to the remaining HTTP binding and harness follow-on work
- validation:
  - `rg -n "HOW-TO-REVIEW-OAPS" README.md docs/README.md docs/REVIEW-PACKET-INDEX.md docs/HOW-TO-REVIEW-OAPS.md`
- commits:
  - `docs: add public OAPS review packet`
- next unfinished work:
  - decide whether to formalize event replay semantics further in the HTTP binding draft
  - add a cloud-task variant or SDK supervisor variant if local loop usage proves insufficient
- status: `DONE`

### 2026-04-05

- tranche: unattended harness exercise attempt
- changes:
  - ran `scripts/codex-tranche-loop.sh` as a real unattended local harness exercise with a prompt that explicitly avoided recursive harness invocation
  - confirmed the nested `codex exec` process loaded the required OAPS context and began tranche selection
  - captured the concrete failure mode in `.codex/state/last-message.txt`: nested Codex could not create `/Users/efebarandurmaz/OAPS/.git/index.lock`, so it could not satisfy the required atomic-commit rule
  - updated `docs/RUNBOOK.md` with the observed limitation and the recommended operator workaround
- validation:
  - `MAX_ROUNDS=4 scripts/codex-tranche-loop.sh "<non-recursive harness exercise prompt>"`
  - `tail -n 40 .codex/state/last-message.txt`
  - `git status --short --branch`
- commits:
  - `docs: record harness execution blocker`
- next unfinished work:
  - run the harness from a top-level shell or supervisor that allows the nested `codex exec` process to create `.git/index.lock`
  - once that blocker is cleared, resume the stable-vs-draft-vs-concept docs matrix tranche
- status: `BLOCKED`


### 2026-04-05

- tranche: harness sandbox flag alignment
- changes:
  - added explicit sandbox-argument plumbing to `scripts/codex-harness.sh` so the single-tranche runner matches the tranche-loop runner
  - kept `CODEX_HARNESS_BYPASS_SANDBOX=1` as the documented workaround when nested Codex still blocks `.git/index.lock`
- validation:
  - `bash -n scripts/codex-harness.sh scripts/codex-tranche-loop.sh`
- commits:
  - `docs: add maturity matrix and harness fallback`
- next unfinished work:
  - rerun the harness from a top-level shell once account usage resets or with the documented bypass if the CLI still blocks Git writes
  - add a clearer stable-vs-draft-vs-concept matrix to top-level docs
  - add a public-facing how-to-review packet
- status: `DONE`


### 2026-04-05

- tranche: detached top-level Codex supervisor
- changes:
  - added `scripts/codex-supervisor.sh` as a detached host-shell supervisor entry point for tranche-loop runs
  - made the supervisor fail fast inside an existing Codex thread so the known nested `.git/index.lock` limitation is surfaced immediately
  - documented the supervisor workflow in `README.md` and `docs/RUNBOOK.md`, ignored `.codex/supervisor-runs/`, and marked the execution-harness follow-up complete in `PLANS.md`
  - advanced `docs/NEXT-STEPS.md` back to the remaining protocol-document priorities after landing the supervisor workaround
- validation:
  - `bash -n scripts/codex-harness.sh scripts/codex-tranche-loop.sh scripts/codex-supervisor.sh`
  - `scripts/codex-supervisor.sh`
  - `git diff --check`
- commits:
  - `feat: add codex detached supervisor`
- next unfinished work:
  - add a clearer stable-vs-draft-vs-concept matrix to top-level docs
  - add a public-facing how-to-review packet
  - decide whether to formalize event replay semantics further in the HTTP binding draft
- status: `DONE`


### 2026-04-05

- tranche: HTTP event replay semantics decision
- changes:
  - formalized the current HTTP binding posture as replay-first and pull-based for event/evidence retrieval
  - clarified that `GET /interactions/{id}/events` and `GET /interactions/{id}/evidence` are the canonical replay surfaces for the current draft
  - replaced the older open question with a narrower follow-up on future pagination/cursor semantics and marked the replay-semantics plan item complete in `PLANS.md`
- validation:
  - `pnpm --dir reference/oaps-monorepo validate:spec-pack`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `git diff --check`
- commits:
  - `docs: formalize http event replay semantics`
- next unfinished work:
  - add a clearer stable-vs-draft-vs-concept matrix to top-level docs
  - add a public-facing how-to-review packet
- status: `DONE`
