# AICP Design Partners

## Purpose

Design partners are review participants who help test whether AICP is useful to real adopters.

They are not asked to sign off on every normative detail.
They are asked to comment on fit, friction, and the adoption path.

## What A Design Partner Helps With

A design partner can tell us:

- whether the positioning is understandable
- whether the scope feels too broad or too narrow
- whether the review packet is small enough to be actionable
- whether the proposed semantics are likely to be adopted in practice

## Good Design Partner Categories

The categories below describe the *types* of organizations that would make strong design partners. No specific company has been approached or agreed to participate — these are the target categories the project intends to pursue once a bounded review packet is ready. Named companies are deliberately avoided to prevent implying relationships that do not exist.

| Category | Target organization shape | What to ask |
| --- | --- | --- |
| Payments and infra | Payment processors, authorization networks, edge infrastructure providers | whether the payment and authorization boundary is adoption-friendly |
| Commerce and checkout | Commerce platforms and checkout-adjacent ecosystem participants | whether order/authorization/fulfillment mapping stays above product-specific checkout logic |
| Trust and identity | Trust framework implementers, signing and verification teams, DID-adjacent projects | whether the trust model is usable and upgradeable |
| Platform and devtools | Agent platform teams, developer-tooling vendors, serverless/edge compute platforms | whether the execution model and docs are understandable to implementers |
| Provenance and replay | Lineage, audit, workflow, and observability teams | whether evidence and replay semantics are sufficient for durable review |

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
