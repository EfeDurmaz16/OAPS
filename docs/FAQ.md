# OAPS FAQ

## What is OAPS?

OAPS is an open protocol suite for agentic control-plane primitives: who is acting, what they are allowed to do, who approved it, what happened, and what proof exists afterward.

## Is OAPS replacing MCP or A2A?

No. OAPS is designed to sit above protocols like MCP and A2A and standardize the shared semantics they do not define consistently.

## Is OAPS a payment protocol?

No. OAPS includes payment coordination semantics, but it is not a payments rail.

## Is OAPS a commerce checkout spec?

No. OAPS commerce is meant to stay above checkout-specific product behavior.

## Is OAPS a provisioning platform?

No. OAPS can map to provisioning systems such as OSP, but it is not itself a provisioning backend.

## Why does OAPS care about evidence?

Because autonomous actions need replayable proof, not just success/failure output.

## Why does OAPS care about approvals?

Because many important actions should fail closed until a human or trusted authority explicitly allows them.

## What is the current concrete proof that OAPS is real?

The repo currently includes a reference TypeScript line, a Python interoperability line, conformance fixtures, and a growing set of draft profile and binding documents.

## Where should new reviewers start?

Start with [`README.md`](../README.md), [`docs/WHY-OAPS.md`](./WHY-OAPS.md), and [`docs/WHAT-WE-WANT-REVIEWED.md`](./WHAT-WE-WANT-REVIEWED.md).
