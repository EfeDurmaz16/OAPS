# Multi-Agent Delegation Chain Demo

End-to-end demonstration of A2A-style multi-agent task delegation with AICP governance. Shows how agents can delegate work to each other with scoped authority, scope narrowing, and tamper-evident evidence chains that flow back up the delegation tree.

## What it demonstrates

1. **Three-agent delegation chain:**
   - **Agent A (Planner)** creates a security audit task and delegates to Agent B with scope `[scan, report, remediate]`
   - **Agent B (Executor)** starts work, then delegates a sub-task to Agent C with narrowed scope `[scan]` only
   - **Agent C (Specialist)** completes the vulnerability scan, evidence flows back up through B to A

2. **Scope narrowing** — Each delegation in the chain can only narrow the parent's scope, never widen it. Agent C receives a strict subset of Agent B's delegated authority.

3. **Expiry-based failure cascade** — When a delegation in the chain expires, the failure cascades: Agent C cannot execute, Agent B fails, Agent A fails. The entire chain is governed.

4. **Task state machine** — Tasks follow the OAPS canonical state machine (`created → running → completed`), with `assertTaskTransition` enforcing legal transitions.

5. **Evidence chain** — Every delegation, task transition, and execution result produces hash-chained `EvidenceEvent` entries. The full chain is verifiable with `verifyEvidenceChain`.

## How to run

```bash
# Run the demo
npx tsx src/demo.ts

# Run the tests
npx tsx --test src/demo.test.ts
```

## Architecture

```
Agent A (Planner)
  ├─ creates Task A
  ├─ delegates to Agent B [scan, report, remediate]
  │
  └─ Agent B (Executor)
       ├─ creates Task B (child of A)
       ├─ delegates to Agent C [scan] (narrowed)
       │
       └─ Agent C (Specialist)
            ├─ creates Task C (child of B)
            ├─ completes scan
            └─ evidence flows: C → B → A
```

The demo uses `@oaps/core` for types, state machine, and delegation primitives, and `@oaps/evidence` for the hash-chained evidence trail. No external dependencies or network calls required.
