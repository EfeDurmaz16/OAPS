# OAPS Conformance

## Purpose

This directory will hold the protocol conformance material for OAPS.

The goal is to make it possible for an implementation to answer a concrete question:

> Does this implementation actually conform to the OAPS core, binding, and profile behavior it claims?

## Conformance Layers

Planned conformance layers:

- core semantics
- HTTP binding
- profile mappings
- domain protocol families

## What Conformance Must Check

At minimum, conformance should verify:

- schema validity
- version negotiation
- identity and delegation semantics
- approval and task lifecycle semantics
- idempotency behavior
- evidence hash chaining
- error translation
- binding-to-core equivalence

## Expected Artifact Types

This directory is expected to grow into:

- fixture packs
- TCK-style runners
- negative-path examples
- profile mapping tests
- binding equivalence tests
- evidence replay vectors
- implementation badges or status markers

## Initial Conformance Scope

The first practical conformance target should track the current reference slice:

- HTTP discovery
- interaction creation
- approval and rejection flows
- evidence retrieval
- policy gating
- idempotency

As the suite grows, the conformance surface should expand to include the new binding and profile drafts without breaking older fixtures unnecessarily.

## Conformance Rules

- Every normative spec change should have a corresponding test update.
- Every new binding should ship with fixtures before it claims support.
- Every profile should define how it translates or preserves OAPS core semantics.
- Every error code that becomes normative should have a stable conformance expectation.

## Status

This is a scaffold, not the final conformance system.

The current repository already has reference tests in the TypeScript workspace. This directory is intended to become the suite-level home for shared fixtures and conformance definitions over time.
