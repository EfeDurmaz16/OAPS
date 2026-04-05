# OAPS Compatibility Declarations

## Purpose

Compatibility declarations are machine-readable summaries derived from a conformance result.

They answer a narrower question than the raw result file:

> For each suite scope, what compatibility status can be inferred from the selected scenarios and their outcomes?

They are intentionally derived artifacts, not a separate normative claim surface.

## Source Inputs

A compatibility declaration is derived from:

- the suite conformance manifest
- the fixture index and fixture packs
- a conformance result file that validates against `conformance/results/result-schema.v1.json`

The declaration format itself is described by:

- `conformance/results/compatibility-declaration-schema.v1.json`

## How The Declaration Is Derived

The current Python compatibility command reads a result file and compares it with the suite fixture packs.

For each scope, it inspects:

- the fixture pack's known scenario IDs
- the scenario IDs present in the result
- each scenario outcome
- the coverage labels present in the result

The declaration then classifies each scope as one of:

- `compatible`
- `partial`
- `incompatible`
- `not_evaluated`

This is a derived classification, not a new execution mode.

## Status Semantics

### compatible

Every known scenario for the scope was evaluated in the result and all evaluated scenarios passed.

This does **not** automatically mean the scope was exercised with runtime-backed coverage.
Read the scenario coverage labels separately.

### partial

At least one scenario in the scope was evaluated and passed, but the scope was not fully covered.

This usually means the result selected a subset of the scope or did not evaluate every known scenario.

### incompatible

At least one evaluated scenario failed or errored.

This is the strongest negative compatibility signal in the current declaration model.

### not_evaluated

The scope exists in the suite, but the result did not evaluate any scenario for that scope.

This is useful when a result only covers a narrow slice of the suite.

## Draft Scopes Versus Stable Scopes

The declaration model does not special-case draft scopes out of existence.

That means a draft scope may still be reported as `compatible`, `partial`, `incompatible`, or `not_evaluated` based on the known scenarios in the suite. For draft scopes, the declaration should be read as: "compatible with the currently published draft fixture surface", not as "permanently final or ecosystem-complete".

Stable scopes and draft scopes therefore share one derivation algorithm, but readers should interpret the surrounding maturity and coverage notes honestly.

## Coverage Honesty

Scope status and coverage level are related, but they are not the same thing.

- scope status tells you whether the selected scenarios passed, partially passed, failed, or were not evaluated
- coverage labels tell you whether the result was supported by schema checks, fixture checks, reference-runtime execution, or another coverage level

An implementation can be declared `compatible` for a scope even when the coverage labels show only fixture-level evidence.
That is still an honest declaration as long as the declaration is derived from the result data and does not pretend to represent more runtime proof than actually exists.

Likewise, a result with `reference-runtime` coverage may still be only `partial` if it did not evaluate every known scenario for that scope.

## Current Example Files

The repository includes example result files and derived compatibility declarations under:

- `conformance/results/examples/fixture-check-all-scopes.v1.json`
- `conformance/results/examples/fixture-check-profile-mcp-partial.v1.json`
- `conformance/results/examples/fixture-check-core-incompatible.v1.json`
- `conformance/results/examples/compatibility-declaration-all-scopes.v1.json`
- `conformance/results/examples/compatibility-declaration-profile-mcp-partial.v1.json`
- `conformance/results/examples/compatibility-declaration-core-incompatible.v1.json`

These examples are intentionally small, readable, and honest about what they do and do not prove.

## Practical Usage

Use the compatibility command when you want a compact machine-readable summary for:

- release notes
- scope-by-scope reporting
- compatibility statements
- CI artifact publication

Example:

```bash
PYTHONPATH=src python3 -m oaps_python compatibility \
  --repo-root /Users/efebarandurmaz/OAPS \
  --result conformance/results/examples/fixture-check-all-scopes.v1.json \
  --json
```

The command can also write the declaration to a file with `--output`.

## Guardrails

- Do not treat a declaration as stronger than the source result.
- Do not imply runtime execution if the source result only reports fixture-level evidence.
- Do not use `compatible` to mean "fully implemented forever"; it means the current result satisfied the known scope scenarios.
- Keep the result file and declaration file together when sharing evidence.
