# AICP Versioning Policy

**Version:** 0.1.0-draft
**Status:** Draft policy, effective for foundation-draft and forward.

## Summary

AICP (Agent Interaction Control Protocol) uses [semantic versioning](https://semver.org/) for the core specification, the TCK suite version, and each binding and profile. The initial spec version is `0.1.0-draft`.

## Scope

This policy covers versioning of:

- the core foundation specification (`spec/core/FOUNDATION-DRAFT.md`, `spec/core/STATE-MACHINE-DRAFT.md`)
- the conformance test suite (`conformance/manifest/oaps-tck.manifest.v1.json` `suite_version` field)
- bindings (`spec/bindings/*.md`)
- profiles (`profiles/*.md`, `spec/profiles/*.md`)
- schemas (`schemas/**/*.json` `$id` URIs)

Reference implementation package versions (`reference/oaps-monorepo/packages/*/package.json`) follow their own npm semver independently of the spec version.

## Version Number Format

AICP uses `MAJOR.MINOR.PATCH[-LABEL]` where:

- **MAJOR** — incremented when normative requirements change in a backward-incompatible way. An implementation conforming to `MAJOR.*` is not required to conform to `(MAJOR+1).*`.
- **MINOR** — incremented when new normative requirements are added in a backward-compatible way. An implementation conforming to `MAJOR.MINOR` continues to conform to `MAJOR.(MINOR+1)` for existing behaviors; new behaviors are additive.
- **PATCH** — incremented for editorial fixes, typo corrections, clarifications that do not change normative intent, and non-normative appendix updates.
- **LABEL** — optional pre-release label. Current labels: `draft` (spec is normative but pre-review), `rc` (release candidate), `final` (no label, stable).

## Component-Level Versioning

| Component | Version discipline | Current |
|---|---|---|
| Core spec | Monotonically advancing across `FOUNDATION-DRAFT.md` + `STATE-MACHINE-DRAFT.md` | `0.1.0-draft` |
| TCK suite | Matches the core spec version that defines conformance | `0.1.0-draft` |
| HTTP binding | Independent semver, constrained by `core >= X.Y.Z` | `draft` |
| JSON-RPC binding | Independent semver | `draft` |
| gRPC binding | Independent semver | `draft` |
| events binding | Independent semver | `draft` |
| MCP profile | Independent semver | `draft` |
| A2A profile | Independent semver | `draft` |
| auth-web profile | Independent semver | `draft` |
| x402 profile | Independent semver | `draft` |
| OSP profile | Independent semver | `draft` |
| Payment coordination schemas | Tied to core spec version | `0.1.0-draft` |

A binding or profile **MUST** declare its minimum required core spec version. A profile **MUST** declare its minimum required binding version when it depends on binding-specific behavior.

## Breaking-Change Policy

The following changes are considered **breaking** and require a MAJOR version bump:

- removing a required field from any core primitive
- removing an error code from the canonical taxonomy
- changing the semantic meaning of a canonical interaction or task state
- removing or renaming a canonical state transition
- tightening a MUST requirement that previously permitted a broader behavior
- changing an existing `$id` URI on a schema
- removing a primitive

The following changes are **not breaking** and ship as MINOR:

- adding a new primitive
- adding optional fields to an existing primitive
- adding new error codes within the canonical category vocabulary
- adding new canonical states or transitions that do not contradict existing semantics
- adding new cross-cutting requirements that can be satisfied by existing implementations without code changes

The following changes ship as PATCH:

- typo fixes
- non-normative clarification
- example updates
- appendix additions that do not introduce new requirements

## Pre-Release Conventions

Until this spec has at least one external review cycle complete, all versions carry the `-draft` label. The first label transition is:

- `0.1.0-draft` → `0.1.0-rc` once external review begins
- `0.1.0-rc` → `0.1.0` once external review is complete and at least one independent implementation exists

## Compatibility Declarations

Bindings, profiles, and implementations **SHOULD** publish a compatibility declaration using the existing `schemas/compatibility-declaration.json` stating which core spec version they target and which binding/profile versions they support.

## Process

Version bumps are gated by the OEP (Open Enhancement Proposal) process. See `governance/OEP_PROCESS.md`. A spec version bump is itself an OEP and **SHOULD** reference the underlying change proposals it bundles.
