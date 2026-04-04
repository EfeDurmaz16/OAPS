# OAPS Conformance Runner Contract

## Purpose

This document defines the minimum behavior required from any runner that claims to execute the OAPS suite-level TCK.

It is intentionally small.

The goal is to keep the conformance surface machine-consumable without forcing one implementation language or one harness architecture.

## Required Inputs

A conforming runner MUST accept:

- the suite manifest path
- access to the referenced fixture packs
- access to the referenced normative sources
- an implementation identifier
- an implementation version string

A runner MAY additionally accept:

- a scope filter such as `core` or `profile:mcp`
- a scenario filter
- an implementation metadata file

## Required Execution Model

A conforming runner MUST:

1. load the suite manifest
2. load the scenario taxonomy
3. load the top-level fixture index
4. resolve one or more fixture packs
5. execute the selected scenarios against a target implementation
6. emit a result document that validates against the result schema

The runner MAY execute scenarios through:

- direct library calls
- HTTP requests
- CLI invocations
- subprocess isolation
- containerized adapters

The contract does not force one execution strategy.

## Scenario Semantics

Each scenario execution MUST produce one of these outcomes:

- `pass`
- `fail`
- `skip`
- `error`

The meanings are:

- `pass` means the implementation satisfied the scenario expectation
- `fail` means the implementation was exercised and did not satisfy the scenario expectation
- `skip` means the scenario was intentionally not executed because the implementation did not claim the relevant scope
- `error` means the runner could not complete evaluation due to harness, environment, or target execution failure

## Required Result Fields

A conforming runner result MUST include:

- manifest identifier
- runner identifier
- implementation identifier
- implementation version
- execution timestamp
- selected scopes
- per-scenario outcomes
- aggregate counts

Each scenario record MUST include:

- scenario identifier
- scope
- outcome
- coverage levels asserted by the fixture

Each scenario record SHOULD include:

- duration
- notes
- references to logs or trace artifacts

## Compatibility Claims

A compatibility claim MUST be derivable from result data, not handwritten prose.

The runner should therefore emit enough information to answer:

- which scopes were evaluated
- which scopes fully passed
- which scopes were skipped
- which scopes failed

## Failure Rules

A runner MUST fail the overall execution when:

- the manifest is invalid
- the fixture index is inconsistent with the manifest
- a required fixture file is missing
- the result payload cannot be emitted in schema-valid form

The runner does not need to fail the entire session if an implementation fails one scenario. That should be represented as scenario-level `fail`.

## Versioning

Runner output SHOULD preserve:

- manifest version
- suite version
- result schema version

This is required for stable compatibility declarations over time.
