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

### Template

- date:
- tranche:
- changes:
- validation:
- commits:
- next unfinished work:
- status: `DONE` or `BLOCKED`

### 2026-04-05

- tranche: codex harness bootstrap
- changes:
  - added repository-scoped `AGENTS.md`
  - added project-scoped `.codex/config.toml`
  - added `codex/instructions/harness.txt`
  - added `docs/RUNBOOK.md`
  - added `scripts/codex-harness.sh`
  - added `scripts/codex-tranche-loop.sh`
  - updated `README.md` and `.gitignore`
- validation:
  - `bash -n scripts/codex-harness.sh scripts/codex-tranche-loop.sh`
- commits:
  - `07918be` `docs: add codex execution contract and status runbook`
  - `2a1d8d8` `chore: add project codex harness configuration`
  - `69d2cc5` `feat: add codex exec harness scripts`
- next unfinished work:
  - exercise the harness on a real long-running OAPS tranche
  - tune `MAX_ROUNDS`, logging, and prompt shaping from observed runs
  - consider a cloud-task or SDK supervisor variant after local loop usage
- status: `DONE`

### 2026-04-05

- tranche: tranche queue and default prompt bootstrap
- changes:
  - added `PLANS.md` as the durable tranche queue
  - added `docs/NEXT-STEPS.md` as the short-horizon priority override
  - added `codex/prompts/full-oaps-implementation.txt` as the default long-run prompt
  - updated `AGENTS.md`, `README.md`, `docs/RUNBOOK.md`, and harness instructions to require loading vision, mission, scope, spec, and design context
  - updated harness scripts to default to the tracked prompt file
- validation:
  - `bash -n scripts/codex-harness.sh scripts/codex-tranche-loop.sh`
- commits:
  - `88e3212` `docs: add codex tranche plan and default prompt`
- next unfinished work:
  - run the loop against a real unattended OAPS tranche and record the result here
  - add compatibility declaration artifacts and result examples
  - add optional cloud-task or SDK supervisor variants if the local loop still stops too early
- status: `DONE`

### 2026-04-05

- tranche: compatibility declaration surfaces
- changes:
  - added Python `compatibility` / `declare-compatibility` CLI support for scope-level summaries and machine-readable declaration export
  - added `conformance/results/compatibility-declaration-schema.v1.json`
  - expanded `conformance/results/example-result.v1.json` to reflect the current Python fixture-check runner across all suite scopes
  - added `docs/COMPATIBILITY-DECLARATIONS.md`
  - added example result and derived declaration artifacts under `conformance/results/examples/`
  - updated docs, conformance indexes, `PLANS.md`, and `docs/NEXT-STEPS.md` to point at the new declaration surfaces and next tranche
- validation:
  - `python3 -m unittest reference/oaps-python/tests/test_manifest.py`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result conformance/results/example-result.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compatibility --repo-root . --result conformance/results/example-result.v1.json --json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --output conformance/results/examples/fixture-check-all-scopes.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope profile:mcp --scenario mcp.intent.execution --output conformance/results/examples/fixture-check-profile-mcp-partial.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compatibility --repo-root . --result conformance/results/examples/fixture-check-all-scopes.v1.json --json --output conformance/results/examples/compatibility-declaration-all-scopes.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compatibility --repo-root . --result conformance/results/examples/fixture-check-profile-mcp-partial.v1.json --json --output conformance/results/examples/compatibility-declaration-profile-mcp-partial.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result conformance/results/examples/fixture-check-core-incompatible.v1.json`
- commits:
  - `dfbc2f2` `feat: add compatibility declaration reporting`
  - `c584b64` `docs: add compatibility declaration examples`
- next unfinished work:
  - add runtime-backed conformance scenarios where the current reference implementation already supports them
  - tighten profile mapping notes without overclaiming unsupported behavior
  - exercise the local Codex harness on a real unattended multi-tranche run and record the behavior
- status: `DONE`

## Current Open Fronts

- harden bindings and profiles
- expand conformance and compatibility declarations
- deepen the second implementation
- improve execution harness and long-running automation

## Harness Contract

- Read `AGENTS.md` before execution.
- Read this file before execution.
- Continue from the last unfinished tranche instead of restarting planning.
- Do not stop for progress summaries.


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

- tranche: runtime-backed conformance artifact refresh and profile mapping tightening
- changes:
  - refreshed `conformance/results/example-result.v1.json` and derived compatibility declaration examples so the checked artifacts match the expanded runtime-backed core, HTTP, MCP, and auth-web fixture packs
  - tightened `conformance/README.md` to describe the current runtime-backed HTTP, MCP, and auth-web conformance surfaces more explicitly
  - added explicit mapping matrices and boundary notes to `profiles/a2a-draft.md`, `profiles/auth-fides-tap-draft.md`, `profiles/x402-draft.md`, and `profiles/osp-draft.md`
  - marked the remaining runtime-backed conformance and profile-mapping plan items complete in `PLANS.md`
  - advanced `docs/NEXT-STEPS.md` to the next unfinished priorities after the runtime-backed and profile-mapping tranche
- validation:
  - `pnpm --dir reference/oaps-monorepo build`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/mcp-adapter test`
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/http test`
  - `python3 -m unittest reference/oaps-python/tests/test_manifest.py`
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
  - `conformance: refresh runtime-backed result artifacts`
  - `docs: tighten profile mapping matrices`
- next unfinished work:
  - exercise the local Codex harness on a real unattended multi-tranche run and capture findings in `docs/STATUS.md`
  - add a clearer stable-vs-draft-vs-concept matrix to top-level docs
  - add a public-facing “how to review OAPS” short packet
  - decide whether to formalize event replay semantics further in the HTTP binding draft
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

- tranche: runtime-backed conformance artifact refresh
- changes:
  - regenerated suite example result and compatibility declaration artifacts for the expanded core and HTTP runtime-backed scenario sets
  - updated Python manifest tests to derive scenario-count expectations from fixture packs instead of hard-coded totals
  - confirmed the broader runtime-backed conformance tranche and the MCP approval-rejected / policy-context-hash note tranche are now marked complete in `PLANS.md`
  - advanced `docs/NEXT-STEPS.md` to the next priority queue after runtime-backed conformance completion
- validation:
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `python3 -m unittest reference/oaps-python/tests/test_manifest.py`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --output conformance/results/example-result.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --output conformance/results/examples/fixture-check-all-scopes.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope profile:mcp --scenario mcp.intent.execution --output conformance/results/examples/fixture-check-profile-mcp-partial.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compatibility --repo-root . --result conformance/results/example-result.v1.json --json --output conformance/results/examples/compatibility-declaration-all-scopes.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compatibility --repo-root . --result conformance/results/examples/fixture-check-profile-mcp-partial.v1.json --json --output conformance/results/examples/compatibility-declaration-profile-mcp-partial.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compatibility --repo-root . --result conformance/results/examples/fixture-check-core-incompatible.v1.json --json --output conformance/results/examples/compatibility-declaration-core-incompatible.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result conformance/results/example-result.v1.json`
- commits:
  - `chore: refresh runtime-backed conformance artifacts`
- next unfinished work:
  - tighten profile mapping notes without overclaiming unsupported behavior across A2A, trust, payment, and provisioning drafts
  - exercise the local Codex harness on a real unattended multi-tranche run and record the behavior
  - add a clearer stable versus draft versus concept matrix to top-level docs
- status: `DONE`
