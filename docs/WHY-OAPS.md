# Why OAPS Exists

## The Short Answer

OAPS exists because autonomous systems keep needing the same control-plane primitives across many different protocols, and those primitives are still handled inconsistently.

Those primitives include:

- identity references
- delegation and mandates
- intents and tasks
- approvals
- execution outcomes
- replayable evidence
- payment coordination
- provisioning and lifecycle hooks

## Why Existing Protocols Are Not Enough By Themselves

- **MCP** is excellent for tool and context access, but it does not by itself standardize portable approval or evidence semantics.
- **A2A** is close to the task layer, but it still needs a broader semantic control plane when tasks cross ecosystem boundaries.
- **x402**, **MPP**, and **AP2** are important payment-side inputs, but none of them alone define the full action lifecycle for autonomous agents.
- **ACP** and **UCP** are valuable commerce ecosystems, but OAPS should not turn into a checkout product spec.
- **OSP** is a strong provisioning alignment target, but provisioning semantics should still be expressed in OAPS terms.

## What OAPS Adds

OAPS adds a common semantic layer for things multiple ecosystems keep re-inventing:

- who is acting
- who authorized it
- what limits applied
- whether those limits were checked before the side effect
- what proof exists afterward
- how the action relates to payment or lifecycle state

## Why The Suite Is Not A Wrapper

OAPS should not be described as a wrapper around MCP, A2A, x402, ACP, UCP, or OSP.

It is a semantic super-protocol: a layer above those ecosystems that preserves their strengths while standardizing the cross-ecosystem primitives they do not define consistently.

## Why Neutrality Matters

OAPS is intended to stay neutral by design.

That means it can be incubated alongside aligned systems such as Sardis, FIDES, agit, and OSP without becoming captive to any one of them.

## When To Use OAPS

Use OAPS when the question is:

> how should authority, approval, evidence, and portable execution semantics work across ecosystems?

Use the underlying protocol when the question is:

> how does this one ecosystem speak on the wire?

That division is the point of the suite.

## Related Pages

- [`docs/NEUTRAL-BY-DESIGN.md`](./NEUTRAL-BY-DESIGN.md)
- [`docs/NARRATIVE-BLOCKS.md`](./NARRATIVE-BLOCKS.md)
- [`docs/HOMEPAGE-CONTENT-MAP.md`](./HOMEPAGE-CONTENT-MAP.md)
