# Pact (OAPS) Prioritized Fix List

**Date:** 2026-04-11
**Prioritization:** spec integrity > schema validation > reference implementation correctness > governance rigor > documentation > external review polish

**Effort Key:** S = hours (< 4h), M = days (1-3 days), L = weeks (1-2 weeks)

---

## Tier 1: Spec Integrity (Highest Priority)

### 1. Foundation draft lacks normative language
**What's wrong:** `spec/core/FOUNDATION-DRAFT.md` is titled "first hard-normative OAPS semantic layer" but contains zero MUST keywords, only 5 SHOULD, and 1 MAY. It reads as prose narrative, not specification. An implementer cannot derive conformance requirements from it.
**File:** `spec/core/FOUNDATION-DRAFT.md`
**Effort:** L
**Fix:** Rewrite each primitive's section to include explicit RFC 2119 requirements. For each of the 15 primitives: state what an implementation MUST include (required fields, invariants), SHOULD support (recommended behavior), and MAY optionally provide. Add the RFC 2119 boilerplate reference at the top. The STATE-MACHINE-DRAFT already demonstrates the right style — apply it to the foundation draft.

### 2. No Interaction schema at foundation level
**What's wrong:** `Interaction` is the central protocol concept — referenced by evidence events, transitions, tasks, the HTTP binding, and every profile. Yet there is no `schemas/foundation/interaction.json`. It is defined only implicitly through binding-level endpoints.
**File:** Missing: `schemas/foundation/interaction.json`
**Effort:** M
**Fix:** Create a foundation-level Interaction schema that defines the canonical shape: `interaction_id`, `state`, `actor`, `capability`, `intent`, `created_at`, `updated_at`, and the state machine reference. Add a corresponding example in `examples/foundation/interaction.json`.

### 3. No Message schema at foundation level
**What's wrong:** Message append is a first-class binding operation (HTTP, JSON-RPC, gRPC, events) but there is no foundation-level Message object schema.
**File:** Missing: `schemas/foundation/message.json`
**Effort:** S
**Fix:** Define a minimal Message schema at foundation level. At minimum: `message_id`, `interaction_id`, `role`, `content`, `created_at`.

### 4. No semver discipline
**What's wrong:** The TCK manifest uses `suite_version: "foundation-draft"` — not a semver string. No versioning policy document exists. No semver constraints anywhere in the spec tree. A standards reviewer expects version numbering.
**Files:** `conformance/manifest/`, `spec/core/FOUNDATION-DRAFT.md`
**Effort:** S
**Fix:** (a) Adopt semver for the spec: e.g., `0.1.0-draft`. (b) Create a brief `VERSIONING.md` document stating the versioning policy. (c) Update the TCK manifest to use the semver string. (d) Add version metadata to each spec document header.

### 5. No foundation-level version negotiation protocol
**What's wrong:** Version negotiation is deferred entirely to bindings. There is no foundation-level negotiation schema or protocol. Each binding reinvents version negotiation independently.
**Files:** `spec/core/FOUNDATION-DRAFT.md`, missing: `schemas/foundation/version-negotiation.json`
**Effort:** M
**Fix:** Define a foundation-level version negotiation object (supported versions, minimum version, maximum version) and a normative negotiation procedure that bindings MUST implement. Ensure it is consistent with what the HTTP binding already does.

### 6. "Payment coordination" is claimed but not normatively defined
**What's wrong:** README and landing page claim payment coordination as a core primitive. Payment schemas exist in `schemas/payment/` but the foundation draft says payment is "out of scope." This is a contradiction.
**Files:** `spec/core/FOUNDATION-DRAFT.md`, `schemas/payment/`, README.md
**Effort:** M
**Fix:** Either (a) add a normative payment coordination section to the foundation draft, or (b) remove "payment coordination" from core primitive claims and position it as a domain extension. Option (b) is more honest given current maturity.

### 7. Mandate has zero failure mode coverage
**What's wrong:** Mandate is described as "stronger authorization" but has no expiry conformance test, no invalid fixtures, no runtime assertion. There is no test for what happens when a mandate expires, is revoked, or has conflicting scope.
**Files:** `conformance/fixtures/core/`, `examples/foundation/invalid/`
**Effort:** M
**Fix:** Create negative fixtures for mandate: expired mandate, mandate with empty scope, mandate with overlapping delegation scope. Add runtime-backed conformance scenarios for mandate expiry behavior.

### 8. Error codes without conformance fixtures
**What's wrong:** 3 of 11 error codes defined in the foundation error taxonomy have zero conformance coverage: `APPROVAL_MODIFICATION_TARGET_MISMATCH`, `CAPABILITY_NOT_FOUND`, `EXECUTION_TIMEOUT`.
**Files:** `conformance/fixtures/core/`, `spec/core/FOUNDATION-DRAFT.md`
**Effort:** S
**Fix:** Create fixture-backed conformance scenarios for each missing error code. Ideally runtime-backed, but fixture-only is acceptable as a minimum.

### 9. Invalid examples orphaned from conformance
**What's wrong:** 3 of 5 invalid examples (`delegation-empty-scope.json`, `task-missing-created-at.json`, `interaction-transition-pending-approval-to-completed.json`) exist in `examples/foundation/invalid/` but are not registered in the conformance fixture index.
**Files:** `conformance/fixtures/core/`, `examples/foundation/invalid/`
**Effort:** S
**Fix:** Register all existing invalid examples in the conformance fixture index so they contribute to TCK coverage.

### 10. Schema `$ref` path inconsistency
**What's wrong:** Schemas use `"$ref": "foundation/common.json#/$defs/..."` with a relative path prefix, but `$id` uses `https://oaps.dev/schemas/foundation/...`. This inconsistency may confuse JSON Schema tools that resolve `$ref` relative to `$id`.
**Files:** All files in `schemas/foundation/`
**Effort:** S
**Fix:** Ensure `$ref` paths are consistent with the `$id` base URI, or document the resolution strategy explicitly.

---

## Tier 2: Schema Validation

### 11. 12 unmapped schema files without examples
**What's wrong:** `validate-spec-pack.mjs` warns about 12 schema files in `schemas/domain/`, `schemas/payment/`, and `schemas/profiles/` that have no corresponding example files.
**Files:** `schemas/domain/*`, `schemas/payment/*`, `schemas/profiles/*`
**Effort:** M
**Fix:** Create at least one valid example for each schema file. If a schema is not yet ready for examples, move it to a `schemas/concept/` directory to distinguish it from implementable schemas.

### 12. No version negotiation schema
**What's wrong:** No dedicated schema for version negotiation request/response exists despite version negotiation being defined in multiple binding specs.
**File:** Missing: `schemas/foundation/version-negotiation.json`
**Effort:** S
**Fix:** Create a version negotiation schema that captures the common structure across bindings (supported versions, min/max, failure response).

---

## Tier 3: Reference Implementation Correctness

### 13. In-tree Hono shims have zero tests
**What's wrong:** The `hono` and `@hono/node-server` in-tree packages have no test files. While they are minimal shims (~120 and ~25 LOC), untested code in a reference implementation undermines credibility.
**Files:** `reference/oaps-monorepo/packages/hono/`, `reference/oaps-monorepo/packages/hono-node-server/`
**Effort:** S
**Fix:** Add basic smoke tests for the Hono shim (route matching, path params, 404 handling) and the node-server adapter (request/response translation).

### 14. packageManager version mismatch
**What's wrong:** `package.json` declares `packageManager: pnpm@10.0.0` but the installed version is 10.32.1. While not breaking, this is sloppy for a reference implementation.
**File:** `reference/oaps-monorepo/package.json`
**Effort:** S
**Fix:** Update `packageManager` to match the installed pnpm version, or pin to a specific tested version.

### 15. 8 of 15 primitives lack runtime-backed conformance
**What's wrong:** Actor, Capability, Task (standalone), Mandate, ApprovalRequest, ApprovalDecision, ErrorObject, ExtensionDescriptor, Challenge, and TaskTransition have schema+fixture conformance only. No runtime test proves the implementation handles these correctly.
**Files:** `reference/oaps-monorepo/packages/*/src/__tests__/`
**Effort:** L
**Fix:** Prioritize runtime-backed tests for the most critical primitives: Mandate (authorization), ApprovalRequest/ApprovalDecision (approval flow), and Task (lifecycle). These are the primitives most likely to have implementation bugs that fixture-only testing misses.

### 16. gRPC binding spec references wrong proto filename
**What's wrong:** `spec/bindings/grpc-binding-draft.md` references `oaps_bindings_grpc.proto` but the actual file is `reference/proto/oaps/bindings/grpc/v1/oaps.proto`.
**Files:** `spec/bindings/grpc-binding-draft.md`, `reference/proto/oaps/bindings/grpc/v1/oaps.proto`
**Effort:** S
**Fix:** Correct the filename reference in the binding spec.

### 17. Non-HTTP bindings have zero runtime implementation
**What's wrong:** JSON-RPC, gRPC, and events/webhooks bindings have draft specs and fixture stubs but no runtime code. They cannot be tested end-to-end.
**Files:** `spec/bindings/jsonrpc-binding-draft.md`, `spec/bindings/grpc-binding-draft.md`, `spec/bindings/events-binding-draft.md`
**Effort:** L (per binding)
**Fix:** For the 2-week readiness plan, do NOT attempt to implement all three. Instead: (a) downgrade their maturity claims to Concept, (b) prioritize one binding (JSON-RPC is the most natural next step after HTTP) for future runtime implementation.

### 18. No crash recovery test for file-backed state store
**What's wrong:** `@oaps/http` has a file-backed state store for interaction and idempotency records, but no test verifies recovery after simulated crash (e.g., truncated write, missing file, corrupt JSON).
**Files:** `reference/oaps-monorepo/packages/http/`
**Effort:** S
**Fix:** Add tests that simulate corrupted/missing state files and verify graceful recovery or clear error reporting.

---

## Tier 4: Governance Rigor

### 19. Patent pledge is draft intent, not binding
**What's wrong:** `governance/RF_PATENT_PLEDGE.md` explicitly says "Draft Intent" and "not final legal language." No CLA exists. No entity exists to receive patent commitments. A corporate cosigner cannot safely engage.
**File:** `governance/RF_PATENT_PLEDGE.md`
**Effort:** L (requires legal counsel)
**Fix:** (a) Get the pledge reviewed by counsel and converted to binding language. (b) Create a CLA. (c) Until legal review is complete, add an honest disclaimer to the repo root explaining the current IP posture.

### 20. No named steward organization
**What's wrong:** The repo is under a personal GitHub account. No foundation, company, or legal entity is named. No entity can hold trademarks, accept patent pledges, or enter legal relationships with cosigners.
**File:** CHARTER.md, governance/GOVERNANCE.md
**Effort:** L (requires legal/organizational work)
**Fix:** For immediate credibility: name yourself explicitly as the current sole steward in CHARTER.md with a clear statement about future governance plans. Long-term: establish a fiscal sponsor or lightweight legal entity.

### 21. No CLA or contributor license agreement
**What's wrong:** No CLA exists anywhere in the repo. Without one, contributions have ambiguous IP status.
**File:** Missing: `CLA.md` or `.github/CLA.md`
**Effort:** M
**Fix:** Adopt a standard CLA (Apache ICLA or DCO sign-off) and add it to the contribution workflow.

### 22. OEP process has never been exercised
**What's wrong:** Zero OEPs exist. No OEP template file. No numbering scheme. No directory for OEPs. The process has never been tested.
**Files:** `governance/OEP_PROCESS.md`, missing: `oeps/` directory, `oeps/TEMPLATE.md`
**Effort:** S
**Fix:** (a) Create an `oeps/` directory with a `TEMPLATE.md`. (b) Write OEP-0001 yourself — a bootstrap OEP that ratifies the OEP process. This proves the process works and gives external contributors a real example to follow.

### 23. Working groups are fictional
**What's wrong:** 5 WGs defined with cadences, but no meeting notes, no member lists, no issue labels, no evidence any have ever met.
**File:** `governance/WORKING_GROUPS.md`
**Effort:** S
**Fix:** Either (a) remove WG claims and replace with "future governance structure" language, or (b) reframe as "areas of work" rather than "working groups" (which implies active membership). Do not claim organizational structures that don't exist.

### 24. No MAINTAINERS or CODEOWNERS file
**What's wrong:** The OEP process references "primary maintainer" and "designated collaborators" without naming anyone.
**Files:** Missing: `MAINTAINERS.md`, `.github/CODEOWNERS`
**Effort:** S
**Fix:** Create `MAINTAINERS.md` listing yourself as the sole current maintainer with clear contact information. Add `.github/CODEOWNERS` pointing to your GitHub handle.

### 25. Zero actual cosigners or co-authors
**What's wrong:** `docs/COSIGNERS.md` and `docs/DESIGN-PARTNERS.md` describe what these roles *would* be and list famous company names as aspirational targets. No actual external human has engaged.
**Files:** `docs/COSIGNERS.md`, `docs/DESIGN-PARTNERS.md`
**Effort:** S (document fix) + L (actual outreach)
**Fix:** Immediately: remove aspirational company name-dropping from DESIGN-PARTNERS.md. Reframe COSIGNERS.md as "How to become a cosigner" without implying any exist. Long-term: pursue actual external review engagement.

### 26. "Pact" trademark conflict with pact.io
**What's wrong:** pact.io is an established open-source contract testing framework with thousands of GitHub stars, operating in the same developer tooling space. "Pact" is their primary brand. The OAPS repo contains zero acknowledgment of this conflict.
**Files:** `site/src/pages/index.astro`, README.md
**Effort:** S (research) + potentially L (rebrand)
**Fix:** (a) Research the trademark status of "Pact" in the relevant jurisdictions. (b) If conflicting, choose a different public-facing name or add a clear disambiguation. (c) At minimum, acknowledge the naming overlap in the repo. This is a blocking issue for any public launch.

---

## Tier 5: Documentation

### 27. Glossary is incomplete
**What's wrong:** Glossary covers ~60-70% of normative terms. Missing: Challenge, InteractionTransition, TaskTransition, ErrorObject, ExtensionDescriptor, Interaction (the central concept), Message.
**File:** `docs/GLOSSARY.md`
**Effort:** S
**Fix:** Add all missing normative terms from the foundation draft and state machine draft. Ensure PascalCase consistency with the schema names.

### 28. Review calendar has no dates
**What's wrong:** Describes cadences and quarterly milestones but contains no actual dates, meetings, or deadlines.
**File:** `docs/REVIEW-CALENDAR.md`
**Effort:** S
**Fix:** Either add real target dates or rename to "Review Cadence" and remove the implication of a scheduled calendar.

### 29. Review packets are all stubs
**What's wrong:** 6 review packet files (`REVIEW-PACKET-A2A.md`, `-COMMERCE.md`, `-MCP.md`, `-PAYMENT.md`, `-PROVISIONING.md`, `-TRUST.md`) are placeholder templates.
**Files:** `docs/REVIEW-PACKET-*.md`
**Effort:** M
**Fix:** Complete the MCP review packet first (most implementation-backed). Remove or clearly label the others as "planned." Do not ship empty review packets — they undermine credibility.

### 30. NEUTRAL-BY-DESIGN.md is too thin
**What's wrong:** 5 bullet points with no enforcement mechanism. All "aligned systems" (Sardis, FIDES, agit, OSP) are the author's own projects. Would not survive adversarial reading.
**File:** `docs/NEUTRAL-BY-DESIGN.md`
**Effort:** M
**Fix:** Expand to address the obvious critique: "How is this neutral when every reference integration is your own project?" Add concrete neutrality mechanisms: (a) any ecosystem protocol can become a profile, (b) the conformance kit is open to all implementations, (c) governance is designed for multi-stakeholder evolution. Acknowledge the single-author bootstrap phase honestly.

### 31. Aspirational company name-dropping
**What's wrong:** `docs/DESIGN-PARTNERS.md` lists Stripe, Visa, Shopify, Cloudflare, Supabase, Vercel as "example targets" without any actual relationship. Could be perceived as misleading.
**File:** `docs/DESIGN-PARTNERS.md`
**Effort:** S
**Fix:** Remove specific company names or clearly label as "categories of organizations we intend to approach." Never list a company name without their explicit agreement.

### 32. OAPS vs Pact naming inconsistency
**What's wrong:** The repo uses "OAPS" everywhere. The landing page uses "Pact." No document explains the relationship between the two names.
**Files:** README.md, `site/src/pages/index.astro`
**Effort:** S
**Fix:** Add a clear "OAPS is publicly known as Pact" statement to README.md, or pick one name and use it consistently. If "Pact" is the public brand, the repo should say so upfront.

---

## Tier 6: External Review Polish

### 33. Landing page "conformance tests" claim
**What's wrong:** Landing page implies runtime conformance tests. The actual conformance scenarios are mostly fixture-only (schema validation), not end-to-end behavioral tests.
**File:** `site/src/pages/index.astro`
**Effort:** S
**Fix:** Qualify the claim: "167 conformance scenarios including schema validation and behavioral fixtures" rather than implying full runtime testing.

### 34. "Evidence-bearing" and "developer-legible" are principle claims
**What's wrong:** These terms map to CHARTER design principles, not to normative spec language. The foundation draft doesn't normatively require evidence or define "developer-legible."
**Files:** `site/src/pages/index.astro`, `CHARTER.md`
**Effort:** S
**Fix:** In the foundation draft rewrite (Fix #1), include normative requirements for evidence attachment (MUST produce evidence events for state transitions) and define "developer-legible" as a design principle rather than a testable requirement.

### 35. No feedback channel for reviewers
**What's wrong:** No mailing list, discussion forum, or named contact exists. A reviewer who reads the repo has no one to submit feedback to.
**Files:** `docs/HOW-TO-REVIEW-OAPS.md`
**Effort:** S
**Fix:** Create a GitHub Discussions tab or a public mailing list. Add the feedback channel to HOW-TO-REVIEW-OAPS.md and the repo README.

### 36. Review guide timing claim
**What's wrong:** The "protocol shape review" path takes 45-60 minutes, not the 30 minutes implied.
**File:** `docs/HOW-TO-REVIEW-OAPS.md`
**Effort:** S
**Fix:** Add realistic time estimates for each reading path.

### 37. Smaller profile drafts are stubs
**What's wrong:** ACP, AP2, MPP, UCP profiles are 1.5-3K stubs labeled as "Draft" in the maturity matrix.
**Files:** `profiles/acp-draft.md`, `profiles/ap2-draft.md`, `profiles/mpp-draft.md`, `profiles/ucp-draft.md`
**Effort:** S (relabeling) or L (expanding)
**Fix:** Downgrade to Concept in the maturity matrix, or expand to substantive drafts. Do not label stubs as drafts.

### 38. Legacy SPEC.md coexists with new spec tree
**What's wrong:** `SPEC.md` (the consolidated legacy draft) exists alongside the new `spec/` directory tree. Unclear whether SPEC.md is deprecated. Confusing for new readers.
**File:** `SPEC.md`
**Effort:** S
**Fix:** Add a clear deprecation header to SPEC.md: "This document is superseded by the spec/ directory tree. It is retained for historical reference only." Or move it to `docs/legacy/`.

---

## Summary

| Priority Tier | Items | S | M | L |
|---------------|-------|---|---|---|
| Spec Integrity | 10 | 4 | 4 | 2 |
| Schema Validation | 2 | 1 | 1 | 0 |
| Reference Implementation | 6 | 3 | 0 | 3 |
| Governance Rigor | 8 | 4 | 1 | 3 |
| Documentation | 6 | 4 | 2 | 0 |
| External Review Polish | 6 | 5 | 0 | 1 |
| **Total** | **38** | **21** | **8** | **9** |

## Top 5 Highest-Impact Fixes

1. **#1 — Add RFC 2119 normative language to the foundation draft.** This is the single change that transforms the repo from "narrative description" to "implementable specification." Everything else is secondary until this is done.

2. **#26 — Resolve the "Pact" trademark conflict.** This is a legal risk that could invalidate the public brand before any review happens.

3. **#19 — Get the patent pledge legally reviewed.** No corporate entity will engage without a credible IP posture.

4. **#2 — Create the Interaction foundation schema.** The central protocol concept is undefined at the foundation level. This is a structural gap in the spec.

5. **#22 — Write OEP-0001.** A bootstrap OEP proves the governance process works and gives external contributors a real example. Cheap effort, high credibility signal.
