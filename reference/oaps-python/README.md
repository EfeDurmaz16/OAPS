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
python3 -m oaps_python inventory --scope profile:mcp --scope profile:x402
```

Emit a schema-shaped dry-run result:

```bash
python3 -m oaps_python inventory --json
```

Write the inventory payload to a file:

```bash
python3 -m oaps_python inventory --json --output /tmp/oaps-inventory.json
```

Or with an explicit starting directory:

```bash
python3 -m oaps_python validate --repo-root /path/to/OAPS/reference/oaps-python
```

If installed, the console script is:

```bash
oaps-python validate
oaps-python inventory
```

## Scope

This package is not a full protocol implementation.
Its job is to prove that the suite-level manifest can be consumed from a second language stack and that the referenced files are structurally coherent.
The inventory command can also narrow inspection to selected scopes and emit the payload to a file for downstream tooling.
