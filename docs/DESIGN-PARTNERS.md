# OAPS Design Partners

## Purpose

Design partners are review participants who help test whether OAPS is useful to real adopters.

They are not asked to sign off on every normative detail.
They are asked to comment on fit, friction, and the adoption path.

## What A Design Partner Helps With

A design partner can tell us:

- whether the positioning is understandable
- whether the scope feels too broad or too narrow
- whether the review packet is small enough to be actionable
- whether the proposed semantics are likely to be adopted in practice

## Good Design Partner Categories

| Category | Example targets | What to ask |
| --- | --- | --- |
| Payments and infra | Stripe, Visa, Cloudflare | whether the payment and authorization boundary is adoption-friendly |
| Commerce and checkout | Shopify and adjacent ecosystem participants | whether order/authorization/fulfillment mapping stays above product-specific checkout logic |
| Trust and identity | FIDES-adjacent reviewers, signing and verification teams | whether the trust model is usable and upgradeable |
| Platform and devtools | Supabase, Vercel, agent-platform teams | whether the execution model and docs are understandable to implementers |
| Provenance and replay | lineage, audit, and workflow teams | whether evidence and replay semantics are sufficient for durable review |

## Design Partner Packet Shape

A good design-partner packet should include:

- one artifact
- one target audience
- one adoption question
- one concrete friction question
- one path to follow-up

For the bounded packet shape, see [`docs/REVIEW-PACKET-TEMPLATE.md`](./REVIEW-PACKET-TEMPLATE.md).

## What Design Partners Should Not Be Asked To Do

- review the whole suite at once
- validate every future binding
- decide governance structure
- bless implementation details that are still only draft
