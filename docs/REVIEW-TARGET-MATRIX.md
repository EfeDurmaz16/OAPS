# OAPS Review Target Matrix

## Purpose

This matrix turns the long-term outreach plan into bounded review asks that can be scheduled, tracked, and closed.

Each row is one review target family, one concrete artifact, and one requested decision.

## Target Matrix

| Target family | Example targets | Review artifact | Requested decision | Why now |
| --- | --- | --- | --- | --- |
| MCP protocol community | MCP maintainers, adjacent tool-runtime implementers | `oaps-mcp-v1` profile draft + capability mapping note | Confirm that OAPS capability/approval/evidence mapping preserves MCP utility without forcing a wrapper model | MCP is the current tool interop anchor and must stay aligned with the suite early |
| A2A protocol community | A2A maintainers, task/workflow implementers | `oaps-a2a-v1` profile draft + task lifecycle mapping note | Validate task, delegation, approval, and evidence mappings | A2A is the closest task-layer neighbor and should be stable before payment work expands |
| Identity and trust community | FIDES/TAP-adjacent reviewers, signing and attestation maintainers | `oaps-auth-web-v1` baseline + `oaps-fides-tap-v1` draft | Validate subject binding, trust upgrade, and delegation proof boundaries | Trust semantics need a defensible baseline before higher-risk payment profiles land |
| Payment protocol community | x402, MPP, AP2 reviewers | `oaps-x402-v1` draft + payment coordination note | Validate payment coordination, mandate, and settlement reference semantics | Payments should be second-wave, but the target shape should be reviewed before hardening |
| Commerce ecosystem | ACP/UCP-aligned reviewers, checkout and merchant workflow teams | OAPS Commerce concept note | Confirm that commerce semantics live above checkout-specific workflows | Commerce is a large domain family and should stay bounded by protocol mapping, not product logic |
| Provisioning ecosystem | OSP reviewers, credentials and lifecycle implementers | `oaps-osp-v1` draft + provisioning mapping note | Validate resource lifecycle, credential delivery, and approval boundaries | Provisioning is a natural OAPS domain family and can be reviewed once task/trust are stable |
| Payment governance proving ground | Sardis maintainers and pilot customers | Sardis-aligned payment governance review packet | Confirm that OAPS payment primitives fit real mandate and approval flows | Sardis already has live traction and can expose real failure modes early |
| Enterprise design partners | Payments, commerce, cloud, and infra design partners such as Stripe, Visa, Shopify, Cloudflare, Supabase, Vercel | Narrow packet by target family, not the full suite | Comment on implementation fit and deployment friction for one artifact at a time | Design partners should validate adoption friction, not debate the entire suite |

## Sequencing

1. Start with MCP and A2A review packets.
2. Follow with auth/trust and payment coordination packets.
3. Then open provisioning and commerce packets.
4. Use Sardis and selected enterprise partners as proving-ground reviewers in parallel.

## Operating Rule

No review target should receive a packet for the whole suite.

Every ask must map to exactly one bounded artifact family and one requested decision.
