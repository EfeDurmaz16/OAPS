# AICP Narrative Blocks

## Purpose

These blocks are reusable copy fragments for the homepage, README, review packets, and explainer pages.

## Core Block

AICP is a semantic super-protocol for autonomous agent control planes. It standardizes the primitives that keep reappearing across ecosystems: identity references, delegation, intents, tasks, approvals, execution outcomes, evidence, and payment coordination.

## Not-A-Wrapper Block

AICP is not a wrapper around MCP, A2A, x402, ACP, UCP, or OSP. It sits above those ecosystems and maps the shared semantic layer they do not standardize consistently.

## Not-A-Replacement Block

AICP is not trying to replace adjacent protocols that already solve their own narrow problems well. It maps to them, aligns with them, and standardizes the cross-ecosystem primitives they leave open.

## Agent-to-Tool Block

For tool use, AICP explains who may invoke a tool, under what policy, with what approval boundary, and what evidence should be emitted afterward.

## Agent-to-Agent Block

For inter-agent work, AICP explains how tasks, delegation, approval, lifecycle, and replayable evidence remain portable across protocols.

## Agent-to-Service Block

For provisioning and lifecycle flows, AICP explains how a request becomes a service action, how authority is checked, and how the outcome is recorded.

## Payment Coordination Block

For payments, AICP explains how mandates, authorization, challenges, and settlement references move with the action rather than being implied by one rail-specific implementation.

## Proof-Point Block

The current repo already contains credible anchors for the suite's direction: the TypeScript reference line, the Python interoperability line, machine-readable conformance artifacts, and aligned systems such as Sardis, FIDES, agit, and OSP.
