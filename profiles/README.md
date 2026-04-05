# OAPS Profiles

Profiles define how OAPS semantics compose with external ecosystems.

For a compact directory index, see [`INDEX.md`](./INDEX.md).

Status labels:

- stable: `auth-web.md` as the current baseline trust mapping
- draft: the current profile set listed below
- concept: future profile families not yet drafted

They are not the core specification and should not push ecosystem-specific transport details back into the core.

Current profile set:

- `auth-web.md` — draft web auth and trust baseline profile
- `auth-fides-tap-draft.md` — draft high-assurance trust profile
- `mcp.md` — draft MCP profile
- `a2a-draft.md` — draft A2A profile
- `x402-draft.md` — draft payment coordination profile
- `osp-draft.md` — draft provisioning profile
- `../spec/profiles/agent-client-draft.md` — draft agent-client / CLI / SSH execution profile

Planned profile families include:

- high-assurance auth and trust profiles
- MCP and A2A interop profiles
- payment profiles
- provisioning and commerce profiles

Every profile should eventually define:

- status
- purpose
- normative scope
- relationship to the suite
- mapping rules
- auth and delegation expectations
- lifecycle mapping
- evidence minimums
- error translation
- conformance expectations

Profiles that reuse the shared HTTP reference surface should also say whether they depend on the binding's pull-based replay semantics for evidence and event retrieval, including incremental replay windows when those are part of the current binding slice.

Profile drafts should stay readable on their own and make clear whether they are:

- baseline
- high-assurance upgrade
- ecosystem mapping
- domain alignment
