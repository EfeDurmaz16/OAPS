# MCP + AICP Governance Flow Demo

End-to-end demonstration of AICP governance applied to MCP tool invocations. Shows how risk-classified MCP tools are mapped to AICP CapabilityCards and governed through policy evaluation, approval gates, and tamper-evident evidence chains.

## What it demonstrates

1. **MCP-to-AICP mapping** — Three mock MCP tools (`read_file`, `execute_command`, `delete_file`) are mapped to AICP CapabilityCards with risk classes R1, R4, and R5.

2. **Risk-based governance flow:**
   - **R1 (read_file)** — Policy passes, no approval needed, tool executes directly. Evidence emitted.
   - **R4 (execute_command)** — Policy passes, but risk class triggers an approval gate. Approval is granted, tool executes. Full approval + execution evidence emitted.
   - **R5 (delete_file)** — Policy passes, approval gate triggered. Approval is **rejected**. Tool does NOT execute. `APPROVAL_REJECTED` error with evidence.

3. **Evidence chain** — Every governance decision (policy evaluation, approval request, approval decision, execution) produces an `EvidenceEvent` in a hash-chained, verifiable evidence chain.

## How to run

```bash
# Run the demo
npx tsx src/demo.ts

# Run the tests
npx tsx --test src/demo.test.ts
```

## Architecture

```
MCP Tool → CapabilityCard → Policy Evaluation → Approval Gate (if R4+) → Execution → Evidence
```

The demo uses `@oaps/core` types, `@oaps/evidence` for hash-chained evidence, and `@oaps/policy` for deterministic policy evaluation. No external dependencies or network calls required.
