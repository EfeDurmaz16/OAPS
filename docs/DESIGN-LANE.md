# Design Lane

This repository keeps protocol execution and design execution in separate lanes.

## Default rule

Use the Codex harness for protocol work:

```bash
./scripts/codex-tranche-loop.sh
```

That lane is intentionally isolated from global MCP and app configuration so long-running OAPS implementation work is stable.

## Claude design worker

For landing pages, documentation surfaces, and frontend-heavy design tasks, use the local Claude CLI worker:

```bash
./scripts/claude-design-worker.sh "Design and implement a landing page for OAPS."
```

The Claude worker reads:

- `AGENTS.md`
- `CHARTER.md`
- `VISION.md`
- `ROADMAP.md`
- `SPEC.md`
- `docs/SUITE-ARCHITECTURE.md`
- `docs/ECOSYSTEM-MAP.md`
- `docs/STANDARDS-LANDSCAPE.md`
- `docs/STATUS.md`
- `PLANS.md`
- `docs/NEXT-STEPS.md`

and follows the repository design-worker prompt in
[`claude/prompts/frontend-design-worker.txt`](/Users/efebarandurmaz/OAPS/claude/prompts/frontend-design-worker.txt).

## Paper MCP

`paper` should be treated as an optional design and asset lane, not part of the default protocol harness. If it is enabled in your global Codex configuration and misconfigured, it can break long-running protocol execution. Keep the default OAPS Codex lane clean and use Paper only in isolated design sessions.
