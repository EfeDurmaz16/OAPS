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

Emit a schema-shaped dry-run result:

```bash
python3 -m oaps_python inventory --json
```

Or with an explicit starting directory:

```bash
python3 -m oaps_python validate --repo-root /path/to/OAPS/reference/oaps-python
```

If installed, the console script is:

```bash
oaps-python validate
```

## Scope

This package is not a full protocol implementation.
Its job is to prove that the suite-level manifest can be consumed from a second language stack and that the referenced files are structurally coherent.
