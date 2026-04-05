# OAPS Python Interoperability Starter

This is the second implementation line for the OAPS suite.

It is intentionally small and dependency-free:

- loads the suite conformance manifest from the repo root
- resolves the referenced conformance packs, schemas, examples, and source docs
- validates the manifest's runner contract and result schema references
- validates that referenced files exist
- inventories fixture scopes and scenarios
- exposes a minimal CLI for conformance-pack inspection

## Usage

From the repository root or anywhere inside the repository:

```bash
python3 -m oaps_python validate
```

Inventory the suite packs and scenarios:

```bash
python3 -m oaps_python inventory
```

Limit inventory output to one or more scopes:

```bash
python3 -m oaps_python inventory --scope binding:events --scope profile:agent-client --scope profile:mcp
python3 -m oaps_python inventory --scope profile:agent-client
```

Emit a schema-shaped dry-run result:

```bash
python3 -m oaps_python inventory --json
```

Write the inventory payload to a file:

```bash
python3 -m oaps_python inventory --json --output /tmp/oaps-inventory.json
```

Run a static fixture check over selected scopes or scenarios:

```bash
python3 -m oaps_python check --scope profile:mcp --scope profile:a2a
python3 -m oaps_python check --scope profile:agent-client
python3 -m oaps_python check --scenario mcp.intent.execution
```

Emit a schema-shaped conformance result:

```bash
python3 -m oaps_python check --json
```

Write the fixture-check payload to a file:

```bash
python3 -m oaps_python check --json --output /tmp/oaps-fixture-check.json
```

Validate a result file emitted by `check`:

```bash
python3 -m oaps_python validate-result --result /tmp/oaps-fixture-check.json
```

Use JSON output for machine-readable validation reports:

```bash
python3 -m oaps_python validate-result --result /tmp/oaps-fixture-check.json --json
```

Summarize scope-level compatibility from a result file:

```bash
python3 -m oaps_python compatibility --result /tmp/oaps-fixture-check.json
```

Emit a machine-readable compatibility declaration:

```bash
python3 -m oaps_python compatibility --result /tmp/oaps-fixture-check.json --json
```

Write the compatibility declaration to a file:

```bash
python3 -m oaps_python compatibility --result /tmp/oaps-fixture-check.json --json --output /tmp/oaps-compatibility.json
```

Or with an explicit starting directory:

```bash
python3 -m oaps_python validate --repo-root /path/to/OAPS/reference/oaps-python
```

If installed, the console script is:

```bash
oaps-python validate
oaps-python inventory
oaps-python check
oaps-python validate-result
oaps-python compatibility
```

## Scope

This package is not a full protocol implementation.
Its job is to prove that the suite-level manifest can be consumed from a second language stack and that the referenced files are structurally coherent.
The inventory command can also narrow inspection to selected scopes and emit the payload to a file for downstream tooling.
The `check` command performs honest static fixture checks, including manifest consistency and JSON fixture file parsing where applicable, and emits a conformance-result-shaped payload without pretending to execute runtime scenarios.
The `validate-result` command checks a conformance result file against the suite's pragmatic result shape and is intended for outputs emitted by `check`.
The `compatibility` command derives a scope-level declaration from a result file so compatibility statements stay machine-derived rather than handwritten.
