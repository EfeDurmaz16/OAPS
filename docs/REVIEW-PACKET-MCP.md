# MCP Review Packet

## Artifact

- name: `oaps-mcp-v1`
- location: [`profiles/mcp.md`](../profiles/mcp.md)
- status: draft profile with runtime-backed reference slices

## Review Question

Does the MCP profile preserve MCP utility while adding portable governance semantics for capability, approval, and evidence?

## Why This Reviewer

MCP maintainers and adjacent tool-runtime reviewers can judge whether the profile still feels like MCP on the wire while adding the cross-ecosystem control-plane layer OAPS needs.

## What Is Already True

- implementation: the TypeScript reference line already exercises MCP discovery, capability mapping, policy gating, approval insertion, and evidence emission
- conformance: MCP fixture coverage exists in the suite-level conformance index
- examples: the repo contains MCP-adjacent profile and reference slices
- docs: the profile and review-matrix docs already explain the mapping boundary

## What Is Still Open

- how much of the mapping should remain informative versus normative
- whether the profile boundary should stay MCP-first or become more OAPS-first over time

## Decision Requested

Choose one:

- comment-only review
- implementation feedback
- profile mapping feedback
- conformance feedback
- cosigner consideration

## Follow-Up

- next owner: protocol maintainers
- next artifact: updated MCP profile draft or follow-up OEP
- expected window: after bounded review feedback is collected
