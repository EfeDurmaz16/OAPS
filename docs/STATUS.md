# OAPS Status

## Current Objective

Implement the OAPS protocol suite as far as the current repo, tooling, and specifications can credibly support.

## Active Tranche

- scope: long-horizon protocol, conformance, and reference implementation work
- execution mode: founder-led, agent-amplified, atomic commits
- stop rule: only `DONE:` or `BLOCKED:`

## Program Wave

- `PLANS.md` is the completed first execution wave
- `PLANS-V2.md` is the active long-horizon master program

## V2 Status Convention

Use these labels inside each V2 tranche entry to show what kind of completion happened:

- `drafted` — spec text, schemas, examples, or docs now exist, but runtime and fixture coverage may still be partial
- `implemented` — reference code or tooling behavior now exists and is locally validated
- `conformance-backed` — the work is covered by fixture metadata, validators, runtime tests, or result artifacts
- `externally-blocked` — the next honest completion step requires an outside reviewer, co-signer, or independent implementation

## V2 Tranche Entry Template

Append one entry per tranche using this shape:

### YYYY-MM-DD

- tranche:
- tranche status:
  - drafted:
  - implemented:
  - conformance-backed:
  - externally-blocked:
- changes:
- validation:
- commits:
- next unfinished work:
- status: `DONE` or `BLOCKED`

## Latest Known Baseline

- suite charter, architecture, and roadmap docs exist
- conformance manifest and fixture packs exist
- TypeScript reference line exists
- Python interoperability line exists

## Execution Log

Append one entry per tranche using the V2 template above:

### 2026-04-05

- tranche: Python second implementation expansion
- tranche status:
  - drafted:
    - expanded `reference/oaps-python/README.md` with example CLI usage for validation, inventory, fixture checks, compatibility declaration validation, and result/declaration comparison flows
  - implemented:
    - added direct compatibility declaration validation plus new `compare-results` and `compare-declarations` helper commands to the Python CLI
    - hardened result validation so coverage labels, scope ids, and scenario ids are checked against the live suite manifest and taxonomy instead of only the loose result shape
    - added layer-grouped scope summaries to text outputs for compatibility and comparison commands
  - conformance-backed:
    - expanded the Python test suite with declaration-validation, comparison-command, and richer result-validation coverage and kept all manifest/CLI tests green across the newly added scopes
  - externally-blocked:
    - none
- changes:
  - turned the Python line into a more useful second-implementation tooling surface for reviewing and comparing conformance evidence
  - made compatibility declaration outputs directly validatable instead of treating them as unchecked derived artifacts
  - improved output ergonomics with grouped layer summaries and comparison helpers for result/declaration diffs
- validation:
  - `python3 -m unittest reference/oaps-python/tests/test_manifest.py`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compare-results --repo-root . --left conformance/results/examples/fixture-check-all-scopes.v1.json --right conformance/results/examples/fixture-check-profile-mcp-partial.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-declaration --repo-root . --declaration conformance/results/examples/compatibility-declaration-all-scopes.v1.json`
- commits:
  - `python: add result and declaration comparison tools`
- next unfinished work:
  - start V2 tranche 19 by expanding the TypeScript reference line around credible auth/trust/runtime anchors and additional core/http test slices
- status: `DONE`

### 2026-04-05

- tranche: core + binding + profile schema growth
- tranche status:
  - drafted:
    - added `schemas/profiles/` draft helper schemas for subject-binding assertions, trust attestation, payment challenges, provisioning operations, and profile support declarations
    - extended the existing payment/domain schema growth with more explicit schema-family readmes, index entries, and spec-tree pointers for the newer draft areas
  - implemented:
    - wired the new helper schemas into auth-web, trust, x402, osp, and compatibility-oriented fixture anchors so draft profile objects are no longer purely prose-only where machine-readable shapes now exist
  - conformance-backed:
    - kept schema/example validation green while the newer draft scopes expanded by validating JSON artifacts plus the suite conformance validator and Python manifest tests
  - externally-blocked:
    - none
- changes:
  - reduced the amount of profile-draft surface that was still only implicit in prose by adding reusable machine-readable helper schemas
  - added schema-family documentation and spec/index pointers for the expanding payment, domain, and profile-helper areas
  - attached new schema refs to profile fixtures where draft objects are now concrete enough to validate statically
- validation:
  - `python3 - <<'PY' ... parse JSON under schemas/profiles and new support examples ... PY`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `python3 -m unittest reference/oaps-python/tests/test_manifest.py`
- commits:
  - `schemas: add draft profile helper families`
- next unfinished work:
  - continue with tranche 17 conformance-system polish across taxonomy, compatibility examples, and runner guidance
- status: `DONE`

### 2026-04-05

- tranche: conformance system growth
- tranche status:
  - drafted:
    - extended `conformance/taxonomy/scenario-taxonomy.v1.json` with the new payment, commerce, and domain scope families plus richer negative-path categories
    - added explicit draft-vs-stable compatibility guidance to `docs/COMPATIBILITY-DECLARATIONS.md` and multi-binding guidance to `conformance/runner-contract.md`
  - implemented:
    - wired fixture-backed payment and commerce draft scopes into the machine-readable conformance system and added incompatible declaration examples alongside the existing partial/draft-only examples
  - conformance-backed:
    - kept the conformance pack validator and Python manifest tests green after the taxonomy, fixture, and documentation expansion
  - externally-blocked:
    - none
- changes:
  - deepened the conformance taxonomy so newer draft scopes and negative-path classes are visible in one machine-readable place
  - added explicit incompatible declaration examples for payment and commerce draft profiles alongside the existing partial/compatible declarations
  - documented how multi-binding runners and draft-scope compatibility declarations should be interpreted honestly
- validation:
  - `python3 - <<'PY' ... parse JSON under schemas/profiles and incompatible support examples ... PY`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `python3 -m unittest reference/oaps-python/tests/test_manifest.py`
- commits:
  - `schemas: add draft profile helper families`
- next unfinished work:
  - start V2 tranche 18 by expanding the Python second implementation around grouped scope summaries, comparison helpers, declaration validation, and richer command docs
- status: `DONE`

### 2026-04-05

- tranche: OSP / provisioning track expansion
- tranche status:
  - drafted:
    - expanded `profiles/osp-draft.md` with deeper estimate/provision/credential/rotate/suspend/deprovision lifecycle notes, explicit approval-gated provisioning guidance, and payment-linked handoff semantics
    - added the first focused OSP example pack under `examples/osp/` for estimate requests, approval-gated provision flows, credential delivery, credential rotation, suspension/deprovision mapping, and payment-linked handoff
  - implemented:
    - rewired the OSP conformance pack to distinguish estimate, approval-gated provisioning, credential delivery, rotate, suspend/deprovision, and payment-linked handoff anchors while reusing only honest shared runtime seams
  - conformance-backed:
    - expanded `conformance/fixtures/profiles/osp/index.v1.json` with explicit lifecycle-transition and payment-handoff scenarios
    - regenerated suite result and compatibility examples after the provisioning-scope expansion and validated `profile:osp` through the suite conformance validator, Python manifest tests, and Python fixture-check/result validation flows
  - externally-blocked:
    - none
- changes:
  - made the provisioning profile more concrete without pretending the repo already ships a live OSP backend or vendor-specific catalog runtime
  - added reader-facing provisioning examples for estimate, approval-gated provisioning, credential delivery, rotation, suspension/deprovision, and payment-linked resumption
  - tightened the OSP conformance pack so lifecycle transitions and payment-linked provisioning are now explicit fixture anchors
- validation:
  - `python3 - <<'PY' ... parse every JSON file under examples/osp ... PY`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `python3 -m unittest reference/oaps-python/tests/test_manifest.py`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope profile:osp --output /tmp/oaps-osp-fixture-check-v2.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/oaps-osp-fixture-check-v2.json --json`
- commits:
  - `osp: deepen provisioning lifecycle profile`
- next unfinished work:
  - start V2 tranche 16 by extending schema coverage and schema/index pointers across the newer draft scopes
- status: `DONE`

### 2026-04-05

- tranche: MPP profile draft
- tranche status:
  - drafted:
    - added `profiles/mpp-draft.md` defining payment-session mapping goals, authorization/evidence expectations, and bounded draft-only claims
    - added the first MPP example pack under `examples/mpp/` for payment sessions, mandate-linked sessions, and partial/compatible support declarations
  - implemented:
    - wired `profile:mpp` into the suite taxonomy, manifest, fixture index, schema index, and spec/conformance navigation surfaces
  - conformance-backed:
    - added `conformance/fixtures/profiles/mpp/index.v1.json` with first payment-session, authorization, settlement-reference, and compatibility fixture anchors
    - added `schemas/payment/payment-session.json` and related payment draft schemas, then validated `profile:mpp` through the suite conformance validator, Python manifest tests, and Python fixture-check/result validation flows
  - externally-blocked:
    - none
- changes:
  - created the first machine-payment-session draft profile without overclaiming any live MPP rail integration
  - added portable examples for session discovery, mandate-linked authorization, settlement references, and draft-only support declarations
  - promoted `profile:mpp` to a first-class draft conformance scope with schema-backed examples
- validation:
  - `python3 - <<'PY' ... parse JSON under examples/mpp and schemas/payment ... PY`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `python3 -m unittest reference/oaps-python/tests/test_manifest.py`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope profile:mpp --output /tmp/profile__mpp.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/profile__mpp.json --json`
- commits:
  - `commerce: add payment and alignment drafts`
  - `conformance: wire payment and commerce draft scopes`
- next unfinished work:
  - continue with tranche 13 AP2 draft wiring and commerce alignment completion
- status: `DONE`

### 2026-04-05

- tranche: AP2 profile draft
- tranche status:
  - drafted:
    - added `profiles/ap2-draft.md` defining mandate-chain and approval-handoff mapping for AP2-like authorization flows
    - added the first AP2 example pack under `examples/ap2/` for mandate chains, approval handoff, payment authorization results, and draft-only support declarations
  - implemented:
    - wired `profile:ap2` into the suite taxonomy, manifest, fixture index, schema index, and spec/conformance navigation surfaces
  - conformance-backed:
    - added `conformance/fixtures/profiles/ap2/index.v1.json` with first mandate-chain, approval-handoff, authorization-reference, and partial-support fixture anchors
    - validated `profile:ap2` through the suite conformance validator, Python manifest tests, and Python fixture-check/result validation flows
  - externally-blocked:
    - none
- changes:
  - created the first AP2-aligned OAPS profile draft without claiming an AP2 verifier or rail runtime
  - added portable examples for mandate chains, approval handoff, and authorization-result linkage
  - promoted `profile:ap2` to a first-class draft conformance scope backed by payment draft schemas
- validation:
  - `python3 - <<'PY' ... parse JSON under examples/ap2 and schemas/payment ... PY`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `python3 -m unittest reference/oaps-python/tests/test_manifest.py`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope profile:ap2 --output /tmp/profile__ap2.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/profile__ap2.json --json`
- commits:
  - `commerce: add payment and alignment drafts`
  - `conformance: wire payment and commerce draft scopes`
- next unfinished work:
  - continue with tranche 14 commerce-domain and ACP/UCP alignment fixture wiring
- status: `DONE`

### 2026-04-05

- tranche: ACP / UCP / commerce alignment track
- tranche status:
  - drafted:
    - added `docs/COMMERCE-LANDSCAPE.md`, `spec/domain/commerce-draft.md`, `profiles/acp-draft.md`, and `profiles/ucp-draft.md` to define the first bounded commerce-domain and profile-alignment surface
    - expanded `examples/commerce/` with order-intent, delegated-checkout, fulfillment-outcome, merchant-authorization, commercial-evidence, and partial/compatible support declaration artifacts
  - implemented:
    - wired `profile:acp`, `profile:ucp`, and `domain:commerce` into the suite taxonomy, manifest, fixture index, schema index, and spec/conformance navigation surfaces
    - added `schemas/domain/` draft schemas for order intent, merchant authorization, fulfillment commitment, and commercial evidence
  - conformance-backed:
    - added `conformance/fixtures/profiles/acp/index.v1.json`, `conformance/fixtures/profiles/ucp/index.v1.json`, and `conformance/fixtures/domains/commerce/index.v1.json` as first draft-only commerce fixture packs
    - regenerated suite result and compatibility examples so the new commerce-domain and commerce-profile scopes are represented coherently in the Python interoperability line
    - validated `profile:acp`, `profile:ucp`, and `domain:commerce` through the suite conformance validator, Python manifest tests, and Python fixture-check/result validation flows
  - externally-blocked:
    - none
- changes:
  - created the first bounded commerce-domain draft and adjacent ACP/UCP alignment profiles without collapsing OAPS into a merchant API or checkout product
  - added explicit examples for order intent, delegated checkout, merchant authorization, payment handoff, fulfillment outcomes, and replayable commercial evidence
  - promoted the commerce-domain and commerce-profile scopes into machine-readable conformance and schema surfaces
- validation:
  - `python3 - <<'PY' ... parse JSON under examples/commerce and schemas/domain ... PY`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `python3 -m unittest reference/oaps-python/tests/test_manifest.py`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope profile:acp --output /tmp/profile__acp.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope profile:ucp --output /tmp/profile__ucp.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope domain:commerce --output /tmp/domain__commerce.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/profile__acp.json --json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/profile__ucp.json --json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/domain__commerce.json --json`
- commits:
  - `commerce: add payment and alignment drafts`
  - `conformance: wire payment and commerce draft scopes`
- next unfinished work:
  - start V2 tranche 15 by deepening OSP lifecycle mappings, provisioning examples, and payment-linked provisioning handoff coverage
- status: `DONE`

### 2026-04-05

- tranche: x402 profile expansion
- tranche status:
  - drafted:
    - expanded `profiles/x402-draft.md` with clearer payment requirement versus authorization intent semantics, challenge/retry lineage rules, HTTP 402 alignment notes, partial compatibility guidance, and explicit runtime non-claims
    - added the first focused x402 example pack under `examples/x402/` for payment requirement challenges, retry lineage, settlement metadata alignment, discovery-only partial support, and invalid challenge-without-authorization-context coverage
  - implemented:
    - rewired the x402 conformance pack to separate payment requirement challenge, retry-lineage, settlement metadata, invalid-context, and partial-compatibility anchors while reusing only honest shared runtime seams
  - conformance-backed:
    - expanded `conformance/fixtures/profiles/x402/index.v1.json` with explicit challenge/retry, metadata-alignment, invalid-context, and discovery-only partial-support scenarios
    - validated `profile:x402` through the suite conformance validator plus Python fixture-check and result validation flows
  - externally-blocked:
    - none
- changes:
  - made the draft x402 mapping more concrete without pretending the repo already runs a live x402 facilitator or automatic HTTP 402 challenge emitter
  - added reader-facing x402 examples for payment requirement challenges, retry continuity, settlement-result alignment, partial support declarations, and invalid authorization-context failures
  - tightened the x402 conformance pack so challenge/retry and authorization-versus-settlement distinctions now have dedicated fixture anchors
- validation:
  - `python3 - <<'PY' ... parse every JSON file under examples/x402 ... PY`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope profile:x402 --output /tmp/oaps-x402-fixture-check-v2.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/oaps-x402-fixture-check-v2.json --json`
- commits:
  - `x402: deepen payment challenge mappings`
- next unfinished work:
  - start V2 tranche 12 by adding MPP draft profile wiring, fixtures, and compatibility scope support
- status: `DONE`

### 2026-04-05

- tranche: FIDES / TAP trust profile hardening
- tranche status:
  - drafted:
    - expanded `profiles/auth-fides-tap-draft.md` with trust-tier semantics, attestation semantics, a clearer auth-web-upgrade matrix, high-assurance approval-boundary guidance, and an explicit current-runtime non-claim section
    - added the first focused FIDES/TAP example pack under `examples/auth-fides-tap/` for attested actors, trust-tier escalation, attested delegation chains, high-assurance approval boundaries, and attestation-required refusal paths
  - implemented:
    - rewired the trust-profile conformance pack to separate attested identity, trust-tier escalation, delegation-upgrade, approval-boundary, and attestation-required scenarios while reusing only the honest shared runtime seams
  - conformance-backed:
    - expanded `conformance/fixtures/profiles/auth-fides-tap/index.v1.json` with explicit trust-tier and attestation-required-path coverage
    - validated `profile:auth-fides-tap` through the suite conformance validator plus Python fixture-check and result validation flows
  - externally-blocked:
    - none
- changes:
  - made the higher-assurance trust upgrade story concrete without pretending the repo already ships a dedicated FIDES/TAP verifier or trust-tier policy engine
  - added reader-facing trust examples for attested actors, delegated attestation chains, trust-tier escalation, and fail-closed attestation-required paths
  - tightened the trust-profile conformance pack so approval-boundary and attestation-required scenarios now have explicit fixture anchors
- validation:
  - `python3 - <<'PY' ... parse every JSON file under examples/auth-fides-tap ... PY`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope profile:auth-fides-tap --output /tmp/oaps-auth-fides-tap-fixture-check-v2.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/oaps-auth-fides-tap-fixture-check-v2.json --json`
- commits:
  - `trust: harden fides tap profile draft`
- next unfinished work:
  - start V2 tranche 11 by deepening x402 challenge/retry notes, payment examples, and invalid authorization-context coverage
- status: `DONE`

### 2026-04-05

- tranche: auth-web profile hardening
- tranche status:
  - drafted:
    - expanded `profiles/auth-web.md` with explicit per-mutation subject-binding guidance for create/message/approve/reject/revoke, actor-card identity assertion notes, delegated-actor behavior expectations, and stronger bearer-token subject-binding assumptions
    - added the first focused auth-web example pack under `examples/auth-web/` for discovery assertions, every HTTP mutation surface, delegated actor behavior, invalid subject mismatch, and expired delegation anchors
  - implemented:
    - rewired the auth-web conformance pack to distinguish runtime-backed create/message binding and expired-delegation behavior from fixture-backed approve/reject/revoke subject-binding expectations
  - conformance-backed:
    - expanded `conformance/fixtures/profiles/auth-web/index.v1.json` with explicit interaction-create, approve, reject, revoke, delegated-actor, invalid-mismatch, and expired-delegation scenarios
    - validated `profile:auth-web` through the suite conformance validator plus Python fixture-check and result validation flows
  - externally-blocked:
    - none
- changes:
  - made the baseline web-auth story explicit for every current HTTP mutation surface without overclaiming runtime enforcement where the reference slice only proves bearer-authenticated semantics today
  - added reader-facing auth-web examples for actor discovery, mutation-surface subject binding, delegated actor behavior, and fail-closed mismatch handling
  - tightened the auth-web conformance pack so expired delegation and invalid mismatched subject/actor semantics now have dedicated fixture anchors
- validation:
  - `python3 - <<'PY' ... parse every JSON file under examples/auth-web ... PY`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope profile:auth-web --output /tmp/oaps-auth-web-fixture-check-v2.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/oaps-auth-web-fixture-check-v2.json --json`
- commits:
  - `auth-web: harden mutation subject binding docs`
- next unfinished work:
  - start V2 tranche 10 by deepening FIDES/TAP trust tiers, attestation examples, and approval-boundary fixture coverage
- status: `DONE`

### 2026-04-05

- tranche: A2A profile expansion
- tranche status:
  - drafted:
    - deepened `profiles/a2a-draft.md` with task/message lifecycle continuity rules, explicit message-threading/state-propagation guidance, approval-boundary mapping, delegation carryover expectations, replay notes, and compatibility declaration guidance for partial versus compatible implementations
    - added the first focused A2A example pack under `examples/a2a/` for approval interposition, delegation carryover, message threading, partial-update replay, cancellation-versus-revocation mapping, and partial/compatible support declarations
  - implemented:
    - wired the expanded A2A profile scenarios into the existing `profile:a2a` conformance pack without overclaiming runtime-backed A2A interoperability
  - conformance-backed:
    - expanded `conformance/fixtures/profiles/a2a/index.v1.json` with message-threading, long-running partial-update, cancellation/revocation-mapping, and partial-compatibility declaration scenarios
    - validated `profile:a2a` through the suite conformance validator plus Python fixture-check and result validation flows
  - externally-blocked:
    - none
- changes:
  - clarified how A2A task identity, message threads, state propagation, approvals, delegation carryover, and replay checkpoints should map into portable OAPS semantics
  - added reader-facing A2A examples for approval gates, delegated handoffs, thread-aware progress updates, long-running replay checkpoints, and cancellation-versus-revocation distinctions
  - tightened the A2A conformance pack so long-running task updates and partial implementation declarations now have explicit fixture anchors
- validation:
  - `python3 - <<'PY' ... parse every JSON file under examples/a2a ... PY`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope profile:a2a --output /tmp/oaps-a2a-fixture-check-v2.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/oaps-a2a-fixture-check-v2.json --json`
- commits:
  - `a2a: deepen lifecycle profile mapping`
- next unfinished work:
  - start V2 tranche 9 by hardening auth-web subject binding examples, delegation-expiry fixtures, and invalid mismatch coverage
- status: `DONE`

### 2026-04-05

- tranche: MCP profile expansion
- tranche status:
  - drafted:
    - expanded `profiles/mcp.md` with a capability-metadata fidelity matrix, explicit policy-context-hash evidence notes, informative-only resources/prompts mapping notes, and a clearer runtime-backed-versus-draft-track boundary
    - added the first focused MCP example pack under `examples/mcp/` for fidelity limits, invalid upstream metadata, informative resources/prompts notes, and partial-versus-compatible profile support declarations
  - implemented:
    - hardened `@oaps/mcp-adapter` capability discovery to fail closed on missing required input schema or malformed upstream tool metadata
    - added reference-runtime tests for invalid tool metadata rejection while keeping the existing policy-denial and approval-rejection runtime paths explicit in the tranche docs and conformance pack
  - conformance-backed:
    - expanded `conformance/fixtures/profiles/mcp/index.v1.json` with explicit policy-denial, approval-rejection, missing-input-schema, malformed-metadata, and richer MCP example anchors
    - validated `profile:mcp` through the adapter build/test path, suite conformance validator, Python manifest tests, and Python fixture-check/result validation flows
  - externally-blocked:
    - none
- changes:
  - clarified exactly which MCP surfaces are normative and runtime-backed today versus still informative or draft-track
  - added reader-facing MCP examples for fidelity limits, invalid upstream metadata, resources/prompts mapping posture, and partial-versus-compatible support declarations
  - tightened the MCP conformance pack and adapter behavior so malformed upstream tool metadata now fails closed instead of silently projecting invalid capabilities
- validation:
  - `python3 - <<'PY' ... parse every JSON file under examples/mcp ... PY`
  - `git diff --check`
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/mcp-adapter build`
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/mcp-adapter test`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `python3 -m unittest reference/oaps-python/tests/test_manifest.py`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope profile:mcp --output /tmp/oaps-mcp-fixture-check-v2.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/oaps-mcp-fixture-check-v2.json --json`
- commits:
  - `mcp: deepen profile conformance notes`
  - `docs: record mcp tranche 7 completion`
- next unfinished work:
  - start V2 tranche 8 by deepening the A2A profile lifecycle mapping, message-threading notes, example pack, and fixture coverage
- status: `DONE`

### 2026-04-05

- tranche: agent-client / CLI / SSH communication track
- tranche status:
  - drafted:
    - added `docs/AGENT-CLIENT-LANDSCAPE.md` to map the emerging agent-client / CLI / SSH surface into OAPS control-plane semantics
    - added `spec/profiles/agent-client-draft.md` defining CLI-mediated session mapping, SSH task mapping, the operator/agent/remote-host model, approval semantics, evidence expectations, and the explicit non-goal boundary that this track is not SSH itself
    - added the first agent-client example pack under `examples/agent-client/`
  - implemented:
    - wired `profile:agent-client` into the fixture index, manifest, taxonomy, profile navigation docs, and Python inventory/check documentation/tests
    - regenerated suite result and compatibility examples so the new agent-client profile scope is represented in the Python interoperability line
  - conformance-backed:
    - added `conformance/fixtures/profiles/agent-client/index.v1.json` with fixture-backed CLI-session, authority-model, approval-boundary, remote-execution-evidence, and non-goal anchors
    - validated `profile:agent-client` through the suite conformance validator plus Python fixture-check and result validation flows
  - externally-blocked:
    - none
- changes:
  - created the first portable OAPS profile draft for CLI-mediated and SSH-executed agent work without overclaiming transport-level SSH standardization
  - added concrete examples for CLI task initiation, remote execution evidence, and approval-gated remote shell execution
  - promoted `profile:agent-client` to a first-class draft scope in repo docs, conformance metadata, and compatibility examples
- validation:
  - `git diff --check`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `python3 -m unittest reference/oaps-python/tests/test_manifest.py`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope profile:agent-client --output /tmp/oaps-agent-client-fixture-check.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/oaps-agent-client-fixture-check.json --json`
- commits:
  - `agent-client: add cli ssh profile draft`
- next unfinished work:
  - start V2 tranche 7 by expanding the MCP profile with finer-grained conformance scenarios, capability-fidelity notes, and compatibility examples
- status: `DONE`

### 2026-04-05

- tranche: events / webhooks binding draft
- tranche status:
  - drafted:
    - added `spec/bindings/events-binding-draft.md` defining the canonical push envelope, replay-first versus push-assisted relationship, delivery guarantees, dedupe keys, retry semantics, and replay resumption concepts
    - added the first events/webhooks example pack under `examples/events/`
  - implemented:
    - wired `binding:events` into the suite fixture index, manifest, taxonomy, spec navigation, maturity docs, and Python inventory/check documentation/tests
    - regenerated suite result and compatibility examples so the events-binding scope now participates in the Python interoperability line
  - conformance-backed:
    - added `conformance/fixtures/bindings/events/index.v1.json` as the first fixture-only events/webhooks binding pack
    - validated `binding:events` through the conformance validator plus Python fixture-check and result validation flows
  - externally-blocked:
    - none
- changes:
  - drafted the first push-delivery binding track while keeping OAPS replay-first across bindings
  - added webhook/event-bus oriented examples for interaction updates, approval requests, retries, dedupe behavior, and replay checkpoints
  - promoted `binding:events` to a first-class draft scope in manifest, taxonomy, docs, and compatibility examples
- validation:
  - `git diff --check`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `python3 -m unittest reference/oaps-python/tests/test_manifest.py`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope binding:events --output /tmp/oaps-events-fixture-check.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/oaps-events-fixture-check.json --json`
- commits:
  - `events: add webhook binding draft`
- next unfinished work:
  - start V2 tranche 6 by adding the agent-client landscape, profile draft, examples, and fixture-backed `profile:agent-client` scope wiring
- status: `DONE`

### 2026-04-05

- tranche: gRPC binding draft
- tranche status:
  - drafted:
    - rewrote `spec/bindings/grpc-binding-draft.md` around the canonical `oaps.bindings.grpc.v1` package, unary-versus-streaming rules, metadata/header conventions, and gRPC-to-OAPS error mapping
    - consolidated the proto surface into `reference/proto/oaps/bindings/grpc/v1/oaps.proto` and refreshed the gRPC example pack under `examples/grpc/`
  - implemented:
    - wired `binding:grpc` into the suite fixture index, manifest, taxonomy, README surfaces, maturity notes, and Python manifest tests/inventory behavior
    - regenerated machine-readable result and compatibility examples so the new gRPC binding scope is represented coherently in the Python interoperability line
  - conformance-backed:
    - added `conformance/fixtures/bindings/grpc/index.v1.json` with fixture-backed discovery, unary mutation, replay, streaming, metadata, and error-mapping anchors
    - validated the gRPC draft scope end-to-end through the suite conformance validator and Python manifest/result tooling
  - externally-blocked:
    - none
- changes:
  - completed the first coherent gRPC binding draft slice with a stable proto package, example service map, replay examples for both events and evidence, and fixture-only conformance coverage
  - aligned repo-wide scope wiring and result examples so `binding:grpc` now behaves like the other draft binding scopes in inventory, checks, and compatibility declarations
- validation:
  - `git diff --check`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `python3 -m unittest reference/oaps-python/tests/test_manifest.py`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope binding:grpc --output /tmp/oaps-grpc-fixture-check.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/oaps-grpc-fixture-check.json --json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compatibility --repo-root . --result conformance/results/example-result.v1.json`
- commits:
  - `grpc: add binding draft pack`
- next unfinished work:
  - start V2 tranche 5 by drafting the events / webhooks binding, its first example pack, and fixture-backed `binding:events` scope wiring
- status: `DONE`

### 2026-04-05

- tranche: JSON-RPC binding draft bootstrap
- tranche status:
  - drafted:
    - added `spec/bindings/jsonrpc-binding-draft.md` covering canonical method families, error mapping, correlation/idempotency, replay methods, and notification boundaries
    - added the first JSON-RPC example pack under `examples/jsonrpc/`
  - implemented:
    - extended the suite manifest/index/taxonomy wiring so `binding:jsonrpc` is now a first-class draft scope in the repo tooling
  - conformance-backed:
    - added `conformance/fixtures/bindings/jsonrpc/index.v1.json` as the first fixture-only JSON-RPC binding pack
    - updated the Python manifest tests so inventory/check flows now include `binding:jsonrpc`
    - marked the full JSON-RPC binding tranche complete in `PLANS-V2.md`
  - externally-blocked:
    - none
- changes:
  - drafted the first non-HTTP binding document for OAPS
  - added request/response, replay, notification, and error examples for the JSON-RPC track
  - wired the new binding scope into manifest/index/taxonomy/docs so the repo now treats JSON-RPC as a real draft surface rather than a pure roadmap placeholder
- validation:
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `python3 -m unittest reference/oaps-python/tests/test_manifest.py`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python inventory --repo-root . --scope binding:jsonrpc --json`
- commits:
  - `spec: add jsonrpc binding draft`
- next unfinished work:
  - start V2 tranche 4 by drafting the gRPC binding and its first fixture pack
- status: `DONE`

### 2026-04-05

- tranche: HTTP conformance and ordering hardening
- tranche status:
  - drafted:
    - documented default oldest-to-newest replay ordering in both `SPEC.md` and the HTTP binding draft
    - tightened `profiles/auth-web.md` with a stronger note about follow-on message subject binding on `POST /interactions/{id}/messages`
  - implemented:
    - expanded the HTTP reference tests to cover `GET /actor-card`, `GET /capabilities`, replay-window edge cases, and explicit interaction-state assertions after create/approve/reject/revoke flows
  - conformance-backed:
    - added HTTP fixture-backed error-shape examples for authentication-required, interaction-not-found, approval-not-pending, idempotency-conflict, and replay-cursor-not-found payloads
    - added conformance scenarios for reject/revoke retrieval after mutation, replay-window edge cases, and replay after approve/reject/revoke terminal events
    - marked the remaining HTTP Binding Candidate Hardening items complete in `PLANS-V2.md`
  - externally-blocked:
    - none
- changes:
  - expanded the HTTP binding conformance pack with new discovery, error-mapping, retrieval, replay, and terminal-event scenarios
  - strengthened the HTTP reference tests to match the documented normative endpoint surface and lifecycle expectations more explicitly
  - aligned binding/profile prose with the now-explicit replay ordering and follow-on message authentication semantics
- validation:
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/http build`
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/http test`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope binding:http --output /tmp/oaps-http-fixture-check-v2.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/oaps-http-fixture-check-v2.json --json`
- commits:
  - `http: tighten endpoint and replay coverage`
- next unfinished work:
  - start V2 tranche 3 by adding the JSON-RPC binding draft and its first fixture stubs
- status: `DONE`

### 2026-04-05

- tranche: HTTP contract and response example pack
- tranche status:
  - drafted:
    - added `examples/http/discovery-contract.v1.json` with explicit request/response anchors for every normative HTTP endpoint
    - added canonical HTTP response examples, request examples, error examples, and media-type examples under `examples/http/`
    - tightened the HTTP binding draft with an explicit example-pack section and clearer content-negotiation fallback notes
  - implemented:
    - packaged the current HTTP reference slice into stable example artifacts that match the implemented endpoint shapes and error payloads
  - conformance-backed:
    - marked the HTTP discovery-example, response-example, content-negotiation-note, canonical-media example, and compatibility-fallback example items complete in `PLANS-V2.md`
  - externally-blocked:
    - none
- changes:
  - added a reader-facing HTTP example pack with endpoint contract metadata, request bodies, response bodies, error payloads, and media-type notes
  - documented the example-pack entry points directly in `spec/bindings/http-binding-draft.md`
  - advanced the HTTP hardening tranche past the example-and-documentation sub-slice before the remaining runtime/conformance follow-ons
- validation:
  - `python3 - <<'PY' ... parse every JSON file under examples/http and verify discovery-contract.v1.json references only existing example files ... PY`
  - `git diff --check`
- commits:
  - `docs: add http contract examples`
- next unfinished work:
  - add explicit response-shape fixtures for HTTP error objects
  - add conformance scenarios for reject / revoke retrieval after mutation
  - add conformance scenarios for replay-window pagination edge cases
  - decide and document default ordering semantics for events and evidence retrieval
  - add stronger auth-web notes for follow-on message authentication semantics
  - expand HTTP reference tests to cover every documented normative endpoint path and state-transition assertions
- status: `DONE`

### 2026-04-05

- tranche: core lifecycle conformance follow-through
- tranche status:
  - drafted:
    - added `schemas/foundation/interaction-transition.json` and `examples/foundation/interaction-transition.json` so interaction lifecycle movement is no longer prose-only
    - added core negative fixtures for invalid invoke intents and illegal completed-to-active lifecycle regressions
    - added replay-reconstruction notes to `spec/core/STATE-MACHINE-DRAFT.md` and a core error-taxonomy appendix to `spec/core/FOUNDATION-DRAFT.md`
  - implemented:
    - added reference-core lifecycle helpers for task promotion plus task/interaction transition validation in `@oaps/core`
  - conformance-backed:
    - expanded the core conformance taxonomy and fixture pack to cover interaction transitions, invalid negative fixtures, intent-to-task promotion, and reject-versus-revoke distinction
    - marked the remaining Core Semantics Deepening items complete in `PLANS-V2.md`
  - externally-blocked:
    - none
- changes:
  - added the missing interaction-transition schema/example and wired them into schema-pack validation
  - added negative-path core fixtures and runtime-backed lifecycle tests for promotion and terminal-state distinction
  - aligned core lifecycle docs, conformance metadata, and runtime terminology around replay reconstruction and error-code/category mapping
- validation:
  - `pnpm --dir reference/oaps-monorepo generate:core-contracts`
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/core test`
  - `pnpm --dir reference/oaps-monorepo validate:spec-pack`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope core --output /tmp/oaps-core-fixture-check-v2.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/oaps-core-fixture-check-v2.json --json`
- commits:
  - `core: add lifecycle transition helpers`
- next unfinished work:
  - begin V2 tranche 2: add explicit HTTP discovery and endpoint response examples
- status: `DONE`

### 2026-04-05

- tranche: core lifecycle support schemas
- tranche status:
  - drafted:
    - added foundation schemas and examples for `Challenge` and `TaskTransition` so the lifecycle draft no longer depends on prose alone for those support objects
    - updated the foundation/core spec text to describe the new lifecycle support objects and how they relate to task promotion and challenge handling
  - implemented:
    - extended the spec-pack validator mapping so the new lifecycle examples are schema-validated with the rest of the foundation examples
  - conformance-backed:
    - extended the core taxonomy and fixture pack with `core.challenge.valid` and `core.task-transition.valid`
    - marked the schema-growth item complete in `PLANS-V2.md`
  - externally-blocked:
    - none
- changes:
  - added `schemas/foundation/challenge.json` and `schemas/foundation/task-transition.json`
  - added `examples/foundation/challenge.json` and `examples/foundation/task-transition.json`
  - aligned the schema indexes, foundation draft, state-machine draft, spec index, conformance taxonomy, and core fixture pack with the new lifecycle support objects
- validation:
  - `pnpm --dir reference/oaps-monorepo validate:spec-pack`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope core --output /tmp/oaps-core-schema-growth-check.json`
- commits:
  - `spec: add core lifecycle support schemas`
- next unfinished work:
  - add invalid example fixtures for core negative-path testing
  - add runtime-backed core scenarios for intent-to-task promotion
  - add runtime-backed core scenarios for revoke / reject distinction
  - add replay semantics notes for evidence chain reconstruction from core events
  - add a core error taxonomy appendix that aligns schema, docs, and runtime terminology
- status: `DONE`

### 2026-04-05

- tranche: core lifecycle state-machine draft
- tranche status:
  - drafted:
    - added `spec/core/STATE-MACHINE-DRAFT.md` as the dedicated lifecycle companion to the core foundation draft
    - defined canonical task states, permitted transitions, illegal transitions, intent-to-task promotion rules, approval-versus-challenge semantics, revoke/reject/cancel/fail distinctions, and mandate-versus-delegation boundaries
  - implemented:
    - linked the new lifecycle draft from the spec tree entry points so it is part of the canonical reading order
  - conformance-backed:
    - marked the first six Core Semantics Deepening plan items complete in `PLANS-V2.md`
  - externally-blocked:
    - none
- changes:
  - added the first dedicated lifecycle/state-machine draft under `spec/core/`
  - aligned `spec/README.md`, `spec/INDEX.md`, and `spec/core/FOUNDATION-DRAFT.md` so the lifecycle draft is a first-class normative companion
  - advanced the V2 core-semantics checklist past the prose-only lifecycle clarification items
- validation:
  - `python3 - <<'PY' ... verify spec navigation now references STATE-MACHINE-DRAFT.md and PLANS-V2.md marks the first six core-semantics items complete ... PY`
  - `git diff --check`
- commits:
  - `spec: add core lifecycle state machine draft`
- next unfinished work:
  - add core schemas for any still-prose-only objects needed by the foundation draft
  - add invalid example fixtures for core negative-path testing
  - add runtime-backed core scenarios for intent-to-task promotion and revoke/reject distinction
  - add replay semantics notes for evidence chain reconstruction from core events
  - add a core error taxonomy appendix that aligns schema, docs, and runtime terminology
- status: `DONE`

### 2026-04-05

- tranche: V2 status convention and tranche template
- tranche status:
  - drafted:
    - `docs/STATUS.md` now defines the V2 execution-status vocabulary used to describe tranche outcomes
  - implemented:
    - `docs/STATUS.md` now includes a standard V2 tranche entry template for future long-horizon execution logs
  - conformance-backed:
    - `PLANS-V2.md` now marks the V2 control-plane status-convention/template tranche complete
  - externally-blocked:
    - none
- changes:
  - added a V2 status convention section to distinguish `drafted`, `implemented`, `conformance-backed`, and `externally-blocked`
  - added a standard V2 tranche entry template so future execution-log entries use a consistent shape
  - recorded this tranche and aligned the active V2 plan queue with the completed control-plane work
- validation:
  - `python3 - <<'PY' ... verify docs/STATUS.md contains the four V2 status labels and template headings, and PLANS-V2.md marks both control-plane checkboxes complete ... PY`
- commits:
  - `docs: add v2 status conventions`
- next unfinished work:
  - begin V2 tranche 1: add the dedicated core state-machine draft and related lifecycle semantics
- status: `DONE`

### 2026-04-05

- tranche: V2 master program bootstrap
- changes:
  - added `PLANS-V2.md` as the new active long-horizon execution program after the original `PLANS.md` wave reached completion
  - moved the active queue pointer in `docs/NEXT-STEPS.md` from the completed V1 plan to the new V2 program
  - updated this status file to record the program-wave transition from the completed first execution wave to the new larger implementation wave
- validation:
  - `git diff --check`
- commits:
  - `a67456a` `docs: add OAPS v2 execution program`
- next unfinished work:
  - begin the first unfinished V2 tranche from `PLANS-V2.md`
- status: `DONE`

### 2026-04-05

- tranche: core runtime-backed conformance scenarios
- changes:
  - added core conformance scenarios for delegation expiry, verifiable evidence chains, tamper detection, previous-hash mismatch detection, and stable evidence hashing
  - marked the core runtime-backed conformance tranche complete in `PLANS.md`
- validation:
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/core test`
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/evidence test`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope core --output /tmp/oaps-core-fixture-check.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/oaps-core-fixture-check.json --json`
- commits:
  - `conformance: add core runtime-backed scenarios`
- next unfinished work:
  - add HTTP runtime-backed conformance scenarios for discovery, evidence/event retrieval, rejection, and revoke flows
  - add explicit MCP runtime-backed scenarios for policy denial and approval rejection paths
- status: `DONE`

### 2026-04-05

- tranche: HTTP runtime-backed conformance scenarios
- changes:
  - added HTTP runtime-backed conformance scenarios for discovery, message interaction-id mismatch rejection, approval rejection, revocation, and evidence/event retrieval
  - expanded the HTTP reference tests to exercise the newly declared binding scenarios
  - tightened the HTTP binding draft to describe the current runtime-backed conformance slice more explicitly
- validation:
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/http test`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope binding:http --output /tmp/oaps-http-fixture-check.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result /tmp/oaps-http-fixture-check.json --json`
- commits:
  - `conformance: add http runtime-backed scenarios`
- next unfinished work:
  - add explicit MCP runtime-backed scenarios for policy denial, approval rejection, and policy-context-hash evidence notes
  - regenerate suite example result artifacts after the remaining runtime-backed scenario updates land
- status: `DONE`

### 2026-04-05

- tranche: runtime-backed conformance artifact refresh and profile mapping tightening
- changes:
  - refreshed `conformance/results/example-result.v1.json` and derived compatibility declaration examples so the checked artifacts match the expanded runtime-backed core, HTTP, MCP, and auth-web fixture packs
  - tightened `conformance/README.md` to describe the current runtime-backed HTTP, MCP, and auth-web conformance surfaces more explicitly
  - added explicit mapping matrices and boundary notes to `profiles/a2a-draft.md`, `profiles/auth-web.md`, `profiles/auth-fides-tap-draft.md`, `profiles/x402-draft.md`, and `profiles/osp-draft.md`
  - clarified the MCP profile's current compatibility notes without overclaiming unsupported runtime coverage
  - marked the remaining runtime-backed conformance and profile-mapping plan items complete in `PLANS.md`
  - advanced `docs/NEXT-STEPS.md` to the next unfinished priorities after the runtime-backed and profile-mapping tranche
- validation:
  - `pnpm --dir reference/oaps-monorepo build`
  - `pnpm --dir reference/oaps-monorepo validate:spec-pack`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/mcp-adapter test`
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/http test`
  - `python3 -m unittest reference/oaps-python/tests/test_manifest.py`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --output conformance/results/example-result.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --output conformance/results/examples/fixture-check-all-scopes.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope profile:mcp --scenario mcp.intent.execution --output conformance/results/examples/fixture-check-profile-mcp-partial.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result conformance/results/example-result.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result conformance/results/examples/fixture-check-all-scopes.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result conformance/results/examples/fixture-check-profile-mcp-partial.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result conformance/results/examples/fixture-check-core-incompatible.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compatibility --repo-root . --result conformance/results/example-result.v1.json --json --output conformance/results/examples/compatibility-declaration-all-scopes.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compatibility --repo-root . --result conformance/results/examples/fixture-check-profile-mcp-partial.v1.json --json --output conformance/results/examples/compatibility-declaration-profile-mcp-partial.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compatibility --repo-root . --result conformance/results/examples/fixture-check-core-incompatible.v1.json --json --output conformance/results/examples/compatibility-declaration-core-incompatible.v1.json`
- commits:
  - `conformance: refresh runtime-backed result artifacts`
  - `docs: tighten profile mapping matrices`
- next unfinished work:
  - exercise the local Codex harness on a real unattended multi-tranche run and capture findings in `docs/STATUS.md`
  - add a clearer stable-vs-draft-vs-concept matrix to top-level docs
  - add a public-facing “how to review OAPS” short packet
  - decide whether to formalize event replay semantics further in the HTTP binding draft
- status: `DONE`


### 2026-04-05

- tranche: HTTP binding hardening follow-ons
- changes:
  - enforced authenticated-subject binding on `POST /interactions/{id}/messages` so a bearer-authenticated caller cannot append a message envelope that claims a different `from.actor_id`
  - extended binding-level idempotency coverage across `POST /interactions/{id}/messages`, `/approve`, `/reject`, and `/revoke`, using stable replay fingerprints so identical retries do not duplicate lifecycle transitions or evidence
  - added auth-web/profile conformance coverage for follow-on message subject binding so the shared HTTP runtime now proves fail-closed sender checks beyond initial interaction creation
  - switched the reference HTTP responses onto the canonical `application/oaps+json` media type while still advertising `application/json` as a compatibility allowance in discovery
  - formalized minimal `after`/`limit` replay-window semantics for HTTP event and evidence retrieval in `SPEC.md`, the HTTP binding draft, the conformance fixture pack, and the profile/doc set that reuses the shared HTTP audit surface
  - refreshed the example result artifacts and compatibility declarations to reflect the expanded HTTP runtime-backed scenario count and marked the new HTTP binding hardening follow-ons complete in `PLANS.md`
- validation:
  - `pnpm --dir reference/oaps-monorepo validate:spec-pack`
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `pnpm --dir reference/oaps-monorepo build`
  - `pnpm --dir reference/oaps-monorepo --filter @oaps/http test`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --output conformance/results/example-result.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --output conformance/results/examples/fixture-check-all-scopes.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python check --repo-root . --json --scope profile:mcp --scenario mcp.intent.execution --output conformance/results/examples/fixture-check-profile-mcp-partial.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result conformance/results/example-result.v1.json --json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result conformance/results/examples/fixture-check-all-scopes.v1.json --json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python validate-result --repo-root . --result conformance/results/examples/fixture-check-profile-mcp-partial.v1.json --json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compatibility --repo-root . --result conformance/results/example-result.v1.json --json --output conformance/results/examples/compatibility-declaration-all-scopes.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compatibility --repo-root . --result conformance/results/examples/fixture-check-profile-mcp-partial.v1.json --json --output conformance/results/examples/compatibility-declaration-profile-mcp-partial.v1.json`
  - `PYTHONPATH=reference/oaps-python/src python3 -m oaps_python compatibility --repo-root . --result conformance/results/examples/fixture-check-core-incompatible.v1.json --json --output conformance/results/examples/compatibility-declaration-core-incompatible.v1.json`
- commits:
  - `http: extend idempotent mutation coverage`
  - `http: add replay window support`
  - `http: align replay windows and canonical media type`
  - `http: cover canonical media type responses`
  - `docs: record http binding hardening tranche`
- next unfinished work:
  - none currently queued in `PLANS.md`
- status: `DONE`

### 2026-04-05

- tranche: profile mapping note hardening
- changes:
  - added an explicit A2A mapping matrix and lifecycle mapping notes without claiming end-to-end A2A runtime support
  - added a FIDES/TAP trust-upgrade mapping matrix that distinguishes reusable runtime seams from non-claimed verifier behavior
  - added x402 challenge/retry and OSP provisioning lifecycle mapping matrices tied to current shared runtime anchors and explicit non-claim boundaries
  - confirmed the A2A, trust-upgrade, and payment/provisioning profile-mapping tranches are now marked complete in `PLANS.md`
  - advanced `docs/NEXT-STEPS.md` to the harness-execution priority after profile-note completion
- validation:
  - `pnpm --dir reference/oaps-monorepo validate:conformance-pack`
  - `python3 - <<'PY' ... verify referenced profile scenario ids exist in the conformance packs ... PY`
- commits:
  - `docs: harden profile mapping notes`
- next unfinished work:
  - exercise the local Codex harness on a real unattended multi-tranche run and record the behavior
  - add a clearer stable versus draft versus concept matrix to top-level docs
  - add a public-facing how-to-review packet
- status: `DONE`

### 2026-04-05

- tranche: top-level maturity matrix
- changes:
  - added `docs/MATURITY-MATRIX.md` to distinguish stable, draft, and concept surfaces across the suite
  - linked the new maturity matrix from the top-level `README.md` and `docs/README.md`
  - marked the top-level maturity-matrix tranche complete in `PLANS.md`
- validation:
  - `rg -n "MATURITY-MATRIX" README.md docs/README.md docs/MATURITY-MATRIX.md`
- commits:
  - `docs: add top-level maturity matrix`
- next unfinished work:
  - add a public-facing how-to-review packet
  - exercise the local Codex harness on a real unattended multi-tranche run and record the behavior
- status: `DONE`

### 2026-04-05

- tranche: public review entry packet
- changes:
  - added `docs/HOW-TO-REVIEW-OAPS.md` as the short public-facing review packet
  - linked the new entry packet from `README.md`, `docs/README.md`, and `docs/REVIEW-PACKET-INDEX.md`
  - marked the public review-packet tranche complete in `PLANS.md`
- validation:
  - `rg -n "HOW-TO-REVIEW-OAPS" README.md docs/README.md docs/REVIEW-PACKET-INDEX.md docs/HOW-TO-REVIEW-OAPS.md`
- commits:
  - `docs: add public OAPS review packet`
- next unfinished work:
  - exercise the local Codex harness on a real unattended multi-tranche run and record the behavior
- status: `DONE`

### 2026-04-05

- tranche: harness exercise and supervisor fallback
- changes:
  - ran `scripts/codex-tranche-loop.sh` as a real unattended local harness exercise with a prompt that explicitly avoided recursive harness invocation
  - confirmed the nested `codex exec` process loaded the required OAPS context and began tranche selection before failing on `.git/index.lock` writes inside the nested session
  - documented the observed nested-Codex Git-write limitation and the `CODEX_HARNESS_BYPASS_SANDBOX=1` workaround in `README.md` and `docs/RUNBOOK.md`
  - aligned both harness scripts on explicit sandbox flag plumbing and added `scripts/codex-supervisor.sh` as a detached top-level supervisor workaround, with `.codex/supervisor-runs/` ignored in `.gitignore`
  - marked the harness exercise and supervisor-variant tranches complete in `PLANS.md`
  - advanced `docs/NEXT-STEPS.md` to indicate there is no short-horizon override while `PLANS.md` remains fully complete
- validation:
  - `bash -n scripts/codex-harness.sh scripts/codex-tranche-loop.sh scripts/codex-supervisor.sh`
  - `MAX_ROUNDS=3 scripts/codex-tranche-loop.sh "<non-recursive harness exercise prompt>"`
  - `tail -n 40 .codex/state/last-message.txt`
  - `git status --short --branch`
- commits:
  - `fix: add codex harness bypass and supervisor fallback`
- next unfinished work:
  - none currently queued in `PLANS.md`
- status: `DONE`
