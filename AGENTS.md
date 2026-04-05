# OAPS Agent Execution Policy

## Scope

When work references any of the following, treat it as long-horizon execution scope:

- `CHARTER.md`
- `ROADMAP.md`
- `SPEC.md`
- `VISION.md`
- `spec/`
- `schemas/`
- `examples/`
- `profiles/`
- `conformance/`
- `reference/`
- `docs/STATUS.md`

## Autonomy

- Work autonomously until the assigned tranche is fully completed.
- Do not stop merely to summarize progress.
- Do not ask whether to continue.
- Continue through research, implementation, validation, documentation, and commits in the same run whenever feasible.
- Use parallel agent lanes when the work cleanly decomposes into disjoint scopes.

## Allowed Stop Conditions

Stop only when one of these is true:

1. The assigned tranche is fully complete and validated.
2. A real blocker exists: missing credentials, missing artifacts, contradictory requirements, or a tool/runtime failure that cannot be routed around safely.
3. The remaining work is outside the assigned tranche.
4. A destructive or irreversible action requires explicit human confirmation.

## Working Rules

- Update `docs/STATUS.md` as the live execution log.
- Make atomic commits for each coherent unit of work.
- Prefer many small atomic commits over one large mixed commit.
- When a small step is complete and validated, commit it before moving to the next step.
- Prefer objective completion criteria:
  - tests pass
  - validators pass
  - conformance packs validate
  - the working tree is clean
- If the tranche naturally splits, use parallel agents for:
  - spec and profile edits
  - conformance packs
  - runtime implementation
  - second-implementation work

## Reporting

At the end of a run, print exactly one terminal status line:

- `DONE: <short summary>`
- `BLOCKED: <precise blocker>`

The final line is the machine-readable stop signal for harness scripts.
