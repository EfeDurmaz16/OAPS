# AICP Implementation Map

## Purpose

This page names the currently credible implementation surfaces and how they relate to the suite documents.

It is intentionally more operational than the architecture docs and less normative than the specs.

## Current Implementation Surfaces

| Surface | Location | Current status | What it proves |
| --- | --- | --- | --- |
| TypeScript reference line | [`reference/oaps-monorepo`](../reference/oaps-monorepo) | Stable | core, evidence, policy, MCP, and HTTP reference behavior |
| Python interoperability line | [`reference/oaps-python`](../reference/oaps-python) | Stable | manifest and result inspection, compatibility comparison, and validation tooling |
| Suite conformance artifacts | [`conformance/`](../conformance/) | Draft but machine-readable | fixture packs, taxonomy, result schema, and compatibility declarations |
| Harness and execution contract | [`scripts/`](../scripts/) | Stable | long-run execution, loop, and detached supervisor behavior |
| Repository status log | [`docs/STATUS.md`](./STATUS.md) | Stable | durable tranche memory and progress reporting |

## What The Implementation Map Is For

Use it when you want to know:

- which surface is real enough to run today
- which surfaces are still mostly draft language
- where to find the reference path for a given protocol family
- which parts of the repo are supporting evidence versus aspirational structure

## Boundary Rule

Implementation maps should not imply that the whole suite is already runtime-backed.

They should name the honest baseline and stop there.
