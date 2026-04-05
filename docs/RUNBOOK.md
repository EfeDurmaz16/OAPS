# Codex Harness Runbook

## Purpose

This repository is set up for long-horizon Codex execution.

The goal is to reduce interactive check-ins and move repeat execution into non-interactive loops.

## Primary Files

- `AGENTS.md` — execution contract
- `PLANS.md` — completed first execution-wave queue
- `PLANS-V2.md` — active durable tranche queue
- `docs/NEXT-STEPS.md` — short-horizon priority override
- `docs/STATUS.md` — live progress and tranche log
- `CHARTER.md`, `VISION.md`, `ROADMAP.md`, `SPEC.md`, `spec/`, and suite docs — durable protocol context
- `.codex/config.toml` — project-scoped Codex defaults
- `codex/config/runtime-home.toml` — clean runtime-home template used by harness scripts
- `codex/instructions/harness.txt` — injected harness instructions
- `codex/prompts/full-oaps-implementation.txt` — default long-run prompt
- `scripts/codex-harness.sh` — single non-interactive tranche runner
- `scripts/codex-tranche-loop.sh` — auto-resume tranche loop
- `scripts/codex-supervisor.sh` — detached top-level supervisor for host-shell tranche runs
- `scripts/claude-design-worker.sh` — optional design-only Claude worker

## Recommended Usage

Single tranche:

```bash
scripts/codex-harness.sh
```

Loop until `DONE:` or `BLOCKED:`:

```bash
scripts/codex-tranche-loop.sh
```

Detached top-level supervisor:

```bash
scripts/codex-supervisor.sh
```

If the local Codex CLI still denies `.git/index.lock` writes even under `danger-full-access`, rerun with an explicit bypass in this externally sandboxed repo:

```bash
CODEX_HARNESS_BYPASS_SANDBOX=1 scripts/codex-tranche-loop.sh
```

Design lane:

```bash
scripts/claude-design-worker.sh "Design and implement a landing page for OAPS."
```

## Expectations

- update `docs/STATUS.md`
- load the durable protocol context before deep implementation work
- follow `PLANS-V2.md` and `docs/NEXT-STEPS.md`
- use objective validators and tests
- commit atomically
- stop only on real completion or real blockers
- keep protocol execution and design execution in separate lanes

## Notes

- Interactive Codex remains useful for steering and review.
- Non-interactive Codex is the preferred surface for long runs.
- The Codex harness now runs with a repo-local clean `CODEX_HOME` so broken global MCP servers do not contaminate protocol execution.
- The harness mirrors `~/.codex/auth.json` into the repo-local runtime home before each run so ChatGPT login state is preserved.
- The default protocol harness uses `danger-full-access` because atomic Git commits require writes under `.git/`, including `index.lock`.
- `CODEX_HARNESS_BYPASS_SANDBOX=1` adds `--dangerously-bypass-approvals-and-sandbox` for environments where the CLI still blocks Git writes despite the configured sandbox mode.
- The default prompt and execution contract now target `PLANS-V2.md` as the active queue.
- When the harness is invoked from inside another Codex session, the nested `codex exec` process may still be unable to create `.git/index.lock` even though the outer run has full write access. If that happens, re-run the harness from a top-level shell or supervisor process that grants the nested Codex process direct Git write access.
- `scripts/codex-supervisor.sh` is the repo-local workaround for that limitation: it launches the tranche loop as a detached host-shell process, writes run metadata under `.codex/supervisor-runs/`, and refuses to start when it detects an existing `CODEX_THREAD_ID`.
