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
