# Backend Implementation Plan

## Priority 1: MCP Adapter Production-Grade Deepening

~400 lines of new tests + ~55 lines of source changes.

### Test-only additions (can run in parallel)
- 1.1: Input validation edge-case tests (undefined/null/wrong-type arguments)
- 1.2: Modified-approval argument passthrough test
- 1.3: Custom risk threshold tests (R3 vs R4 boundary)
- 1.6: Evidence chain completeness assertions across all invoke paths
- 1.7: defaultRiskClassResolver comprehensive tests (export + test all patterns)
- 1.8: Fixture-aligned conformance test annotations (map to scenario_ids)

### Source changes
- 1.4: Approval handler error isolation (wrap callback in try/catch, emit evidence)
- 1.5: Delegation scope enforcement (validate scope covers target tool)

### Files
- `reference/oaps-monorepo/packages/mcp-adapter/src/index.ts`
- `reference/oaps-monorepo/packages/mcp-adapter/src/index.test.ts`

## Priority 2: Core + HTTP Test Hardening

~480 lines of new tests across 4 packages.

- 2.1: Core package — test generateId, buildEnvelope, capabilityIdFromName, parseBearerToken, state transitions (~150 lines)
- 2.2: Policy package — test operators, combinators, first-match, fail-closed, hashPolicyContext (~120 lines)
- 2.3: Evidence package — test appendEvidenceEvent fields, genesis hash, empty chain edge case (~60 lines)
- 2.4: HTTP server — test 404 paths, state guards, evidence chain verification, message 404 (~150 lines)

### Files
- `reference/oaps-monorepo/packages/core/src/index.test.ts`
- `reference/oaps-monorepo/packages/policy/src/index.test.ts`
- `reference/oaps-monorepo/packages/evidence/src/index.test.ts`
- `reference/oaps-monorepo/packages/http/src/index.test.ts`

## Priority 3: A2A Reference Runtime

~1,000 lines of new code (types + implementation + tests).

- 3.1: Package scaffold (package.json, tsconfig, workspace wiring)
- 3.2: A2A client interface and core types (~100 lines)
- 3.3: Status-to-AICP lifecycle mapper (~60 lines)
- 3.4: OapsA2aAdapter class — createTask, getTaskStatus, updateTask, cancelTask, sendMessage, insertApproval (~350 lines)
- 3.5: Delegation carryover (~60 lines)
- 3.6: Fixture-aligned tests for all 8 A2A fixture scenarios (~400 lines)
- 3.7: Update conformance fixture pack to reference runtime tests

### Files
- `reference/oaps-monorepo/packages/a2a-adapter/` (new package)
- `conformance/fixtures/profiles/a2a/index.v1.json`

## Total: ~1,900 lines of new code

## Execution Order

1. MCP test-only additions (1.1-1.3, 1.6-1.8) → commit
2. MCP source changes (1.4, 1.5) → commit
3. Core/Policy/Evidence/HTTP test expansions (2.1-2.4) → commit
4. A2A scaffold + types + implementation (3.1-3.5) → commit
5. A2A tests + conformance updates (3.6, 3.7) → commit
