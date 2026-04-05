# OAPS Profile Map

## Purpose

Profiles map OAPS semantics into existing ecosystems without replacing those ecosystems outright.

This page names the profile families the suite is actively growing.

## Profile Families

| Profile family | Current entry point | Current status | What it maps |
| --- | --- | --- | --- |
| MCP | [`profiles/mcp.md`](../profiles/mcp.md) | Draft | capability discovery, approval gating, and evidence around tool execution |
| A2A | [`profiles/a2a-draft.md`](../profiles/a2a-draft.md) | Draft | agent task/message exchange, delegation, and replayable evidence |
| Auth / web | [`profiles/auth-web.md`](../profiles/auth-web.md) | Draft | baseline subject binding and trust semantics |
| FIDES / TAP | [`profiles/auth-fides-tap-draft.md`](../profiles/auth-fides-tap-draft.md) | Draft | higher-assurance trust and attestation semantics |
| x402 | [`profiles/x402-draft.md`](../profiles/x402-draft.md) | Draft | payment challenge and coordination semantics |
| MPP | [`profiles/mpp-draft.md`](../profiles/mpp-draft.md) | Draft | machine payment session semantics |
| AP2 | [`profiles/ap2-draft.md`](../profiles/ap2-draft.md) | Draft | mandate and payment authorization semantics |
| ACP | [`profiles/acp-draft.md`](../profiles/acp-draft.md) | Draft | agentic commerce alignment semantics |
| UCP | [`profiles/ucp-draft.md`](../profiles/ucp-draft.md) | Draft | universal commerce alignment semantics |
| OSP | [`profiles/osp-draft.md`](../profiles/osp-draft.md) | Draft | provisioning and lifecycle semantics |
| Agent-client | [`spec/profiles/agent-client-draft.md`](../spec/profiles/agent-client-draft.md) | Draft | CLI / SSH / agent-client execution semantics |

## Profile Rules

Every profile should say:

- which ecosystem it maps
- which OAPS primitives it touches
- what remains informative rather than normative
- what conformance evidence exists today
- what is still externally reviewable

## Status Rule

A draft profile can be useful without being final.

The job of the profile map is to make the drafting boundary visible, not to overstate maturity.
