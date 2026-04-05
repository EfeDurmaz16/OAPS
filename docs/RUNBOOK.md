# Codex Harness Runbook

## Purpose

This repository is set up for long-horizon Codex execution.

The goal is to reduce interactive check-ins and move repeat execution into non-interactive loops.

## Primary Files

- `AGENTS.md` — execution contract
- `PLANS.md` — durable tranche queue
- `docs/NEXT-STEPS.md` — short-horizon priority override
- `docs/STATUS.md` — live progress and tranche log
- `CHARTER.md`, `VISION.md`, `ROADMAP.md`, `SPEC.md`, `spec/`, and suite docs — durable protocol context
- `.codex/config.toml` — project-scoped Codex defaults
- `codex/instructions/harness.txt` — injected harness instructions
- `codex/prompts/full-oaps-implementation.txt` — default long-run prompt
- `scripts/codex-harness.sh` — single non-interactive tranche runner
- `scripts/codex-tranche-loop.sh` — auto-resume tranche loop

## Recommended Usage

Single tranche:

```bash
scripts/codex-harness.sh
```

Loop until `DONE:` or `BLOCKED:`:

```bash
scripts/codex-tranche-loop.sh
```

## Expectations

- update `docs/STATUS.md`
- load the durable protocol context before deep implementation work
- follow `PLANS.md` and `docs/NEXT-STEPS.md`
- use objective validators and tests
- commit atomically
- stop only on real completion or real blockers

## Notes

- Interactive Codex remains useful for steering and review.
- Non-interactive Codex is the preferred surface for long runs.
