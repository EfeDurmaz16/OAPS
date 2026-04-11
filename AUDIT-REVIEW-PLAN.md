# Pact (OAPS) External Review Readiness Plan

**Date:** 2026-04-11
**Scope:** 2-week sprint to move from "insider project" to "document a standards-body reviewer would take seriously"
**Author context:** Solo author (Efe Baran Durmaz, 20, Bilkent University). All time estimates assume one person working intensively.
**Current readiness score:** 4/10

---

## Executive Summary

Pact has real working code, a well-structured conformance system, and refreshingly honest self-assessment documents. But its core spec document is prose, not specification; its governance apparatus is scaffolding; and it has zero external participants. The gap between the infrastructure quality and the spec quality is the central problem. This plan closes that gap in two weeks by focusing on the single highest-leverage change — making the foundation draft normative — and surrounding it with the minimum governance and documentation fixes needed to survive a skeptical external read.

---

## Current State

**Strongest assets:**
- TypeScript reference implementation builds, tests pass, and actually demonstrates the claimed MCP-to-evidence flow
- 167 conformance scenarios across 17 packs, validated by scripts
- Python conformance tooling works independently
- Maturity matrix and coverage map are unusually honest for a pre-standard project
- HOW-TO-REVIEW-OAPS.md is better than most

**Critical liabilities:**
- Foundation draft has zero MUST keywords — it's a narrative, not a spec
- Patent pledge is explicitly "draft intent, not final legal language"
- Zero external participants, cosigners, or co-authors
- "Pact" name conflicts with pact.io
- Governance structures (WGs, OEPs, review calendar) are theoretical
- Scope claims far exceed implementation backing

---

## MUST Tier — Blocks External Review

These items, if not addressed, would cause a competent standards reviewer to stop reading or refuse to engage. Complete in Week 1.

### M1. Add RFC 2119 normative language to the foundation draft
**Why it blocks:** A reviewer opening the "hard-normative semantic core" and finding zero MUST keywords will close the document. This is the single most important fix.
**Work:**
- Add RFC 2119 boilerplate reference to the document header
- For each of the 15 primitives: write explicit MUST (required fields, invariants, validation rules), SHOULD (recommended behavior), and MAY (optional extensions) requirements
- Cross-reference the STATE-MACHINE-DRAFT (which already has good normative language) and ensure consistency
- Ensure every normative requirement is testable — if you can't test it, don't use MUST
**Files:** `spec/core/FOUNDATION-DRAFT.md`
**Estimated hours:** 12-16h

### M2. Resolve the "Pact" trademark question
**Why it blocks:** Launching a public standard with a name that conflicts with an established project in the same space is a legal and credibility risk.
**Work:**
- Research pact.io's trademark registrations (USPTO, EU IPO)
- Assess likelihood of confusion
- Decision: keep "Pact" with disambiguation, or choose a different public name
- If keeping: add a clear "not affiliated with pact.io" notice to the landing page and README
- If renaming: update landing page, README, and any other public-facing references
**Files:** `site/src/pages/index.astro`, `README.md`
**Estimated hours:** 2-4h (research + decision), potentially more if renaming

### M3. Create Interaction foundation schema
**Why it blocks:** The central protocol concept is undefined at the foundation schema level. A reviewer tracing the spec will hit this gap immediately.
**Work:**
- Define `schemas/foundation/interaction.json` with canonical shape
- Create `examples/foundation/interaction.json`
- Register in conformance fixture index
**Files:** `schemas/foundation/interaction.json`, `examples/foundation/interaction.json`
**Estimated hours:** 3-4h

### M4. Add honest IP posture statement
**Why it blocks:** A corporate reviewer needs to know the IP situation before reading further.
**Work:**
- Add a brief "Current IP Posture" section to README or CHARTER: "This project is currently authored by a single individual. The patent pledge is a statement of intent pending legal review. No CLA is in place yet. Contributions are welcomed under [license]."
- This is NOT a substitute for legal review (that's a SHOULD) — it's an honesty signal
**Files:** `README.md` or `CHARTER.md`
**Estimated hours:** 1h

### M5. Downgrade overrated maturity claims
**Why it blocks:** If a reviewer checks the maturity matrix against reality and finds inflation, they lose trust in all claims.
**Work:**
- Foundation draft: Draft → Concept (or keep Draft only after M1 is complete)
- agent-client, ACP, AP2, MPP, UCP profiles: Draft → Concept
- JSON-RPC, gRPC, events/webhooks bindings: Draft → Concept
- Update `docs/MATURITY-MATRIX.md` with honest labels
**Files:** `docs/MATURITY-MATRIX.md`
**Estimated hours:** 1-2h

### M6. Name yourself as steward
**Why it blocks:** "Who maintains this?" must have an answer.
**Work:**
- Create `MAINTAINERS.md` with your name, affiliation, and contact
- Add `.github/CODEOWNERS` pointing to your GitHub handle
- In CHARTER.md, add a "Current Stewardship" section naming yourself as the founding steward
**Files:** `MAINTAINERS.md`, `.github/CODEOWNERS`, `CHARTER.md`
**Estimated hours:** 1h

### M7. Create a feedback channel
**Why it blocks:** A reviewer with no way to submit feedback won't bother reading.
**Work:**
- Enable GitHub Discussions on the repo
- Add the feedback channel URL to HOW-TO-REVIEW-OAPS.md and README
**Files:** GitHub repo settings, `docs/HOW-TO-REVIEW-OAPS.md`, `README.md`
**Estimated hours:** 0.5h

**MUST tier total: ~22-30 hours**

---

## SHOULD Tier — First Review Round

These items would be noticed in a first review but wouldn't prevent engagement. Complete in Week 2.

### S1. Write OEP-0001 (bootstrap OEP)
**Why it matters:** Proves the OEP process works. Gives external contributors a real example.
**Work:**
- Create `oeps/` directory with `TEMPLATE.md`
- Write OEP-0001: "Ratification of the OEP Process" — a short OEP that formally adopts the process described in `governance/OEP_PROCESS.md`
- This demonstrates the process end-to-end
**Files:** `oeps/0001-oep-process.md`, `oeps/TEMPLATE.md`
**Estimated hours:** 2-3h

### S2. Complete the glossary
**Why it matters:** An incomplete glossary signals incomplete thinking.
**Work:**
- Add all missing normative terms: Challenge, InteractionTransition, TaskTransition, ErrorObject, ExtensionDescriptor, Interaction, Message
- Ensure PascalCase consistency with schema names
**File:** `docs/GLOSSARY.md`
**Estimated hours:** 1-2h

### S3. Fix conformance coverage gaps
**Why it matters:** The conformance system is one of the project's strengths. Closing gaps preserves that advantage.
**Work:**
- Register 3 orphaned invalid examples in the conformance fixture index
- Create fixture-backed scenarios for 3 missing error codes
- Create mandate negative fixtures (expired, empty scope)
**Files:** `conformance/fixtures/core/`, `examples/foundation/invalid/`
**Estimated hours:** 4-6h

### S4. Complete the MCP review packet
**Why it matters:** MCP is the most implementation-backed profile. Having one complete review packet shows what the review program looks like.
**Work:**
- Fill in `docs/REVIEW-PACKET-MCP.md` with real content: scope, what to review, key claims, how to verify, known limitations
- Remove or clearly label the other stub packets
**File:** `docs/REVIEW-PACKET-MCP.md`
**Estimated hours:** 2-3h

### S5. Reframe fictional governance structures
**Why it matters:** Claiming 5 active working groups when none have met is a credibility risk.
**Work:**
- Reframe WGs as "planned areas of work" rather than active groups
- Remove cadence claims from WORKING_GROUPS.md
- Rename REVIEW-CALENDAR.md to REVIEW-CADENCE.md and remove scheduling language
**Files:** `governance/WORKING_GROUPS.md`, `docs/REVIEW-CALENDAR.md`
**Estimated hours:** 1-2h

### S6. Strengthen NEUTRAL-BY-DESIGN.md
**Why it matters:** A skeptical reviewer will notice every "aligned system" is the author's own project.
**Work:**
- Expand from 5 bullets to a substantive document
- Address the bootstrap-phase honesty question directly
- Define concrete neutrality mechanisms (open conformance, open profiles, designed for multi-stakeholder governance)
**File:** `docs/NEUTRAL-BY-DESIGN.md`
**Estimated hours:** 2-3h

### S7. Add semver to the spec
**Why it matters:** Version numbering is basic standards hygiene.
**Work:**
- Adopt `0.1.0-draft` as the initial version
- Create `VERSIONING.md` with the policy
- Update TCK manifest, spec document headers
**Files:** `VERSIONING.md`, `conformance/manifest/`, `spec/core/FOUNDATION-DRAFT.md`
**Estimated hours:** 1-2h

### S8. Clean up aspirational company references
**Why it matters:** Listing Stripe, Visa, Shopify as "targets" without their knowledge is a credibility risk.
**Work:**
- Remove specific company names from DESIGN-PARTNERS.md
- Reframe as categories ("payment processors," "cloud infrastructure providers")
- Ensure COSIGNERS.md reads as "how to become one," not "who we have"
**Files:** `docs/DESIGN-PARTNERS.md`, `docs/COSIGNERS.md`
**Estimated hours:** 1h

### S9. Add deprecation header to SPEC.md
**Why it matters:** Two competing spec documents confuses readers.
**Work:**
- Add clear deprecation header to SPEC.md pointing to `spec/` tree
**File:** `SPEC.md`
**Estimated hours:** 0.5h

### S10. Fix the OAPS/Pact naming
**Why it matters:** A reader shouldn't have to guess the relationship between two names.
**Work:**
- Add a clear "OAPS is publicly known as Pact" (or vice versa) statement to README
- Ensure consistency or explain the duality
**File:** `README.md`
**Estimated hours:** 0.5h

**SHOULD tier total: ~16-24 hours**

---

## COULD Tier — Second Round Polish

These items would polish the presentation for a follow-up review. Stretch goals.

### C1. Add runtime-backed conformance for mandate and approval primitives
**Estimated hours:** 8-12h

### C2. Add tests for in-tree Hono shims
**Estimated hours:** 2-3h

### C3. Add crash recovery tests for file-backed state store
**Estimated hours:** 2-3h

### C4. Create a version negotiation foundation schema
**Estimated hours:** 3-4h

### C5. Create examples for all 12 unmapped schema files
**Estimated hours:** 4-6h

### C6. Fix gRPC binding spec proto filename reference
**Estimated hours:** 0.5h

### C7. Qualify landing page conformance claims
**Estimated hours:** 1h

### C8. Fix review guide timing estimates
**Estimated hours:** 0.5h

**COULD tier total: ~22-30 hours**

---

## Week-by-Week Schedule

### Week 1: Make the Spec Real (MUST tier)

| Day | Focus | Tasks | Hours |
|-----|-------|-------|-------|
| Mon | Foundation draft rewrite (Part 1) | M1: Primitives 1-5 (Actor, Capability, Intent, Task, Delegation) — add MUST/SHOULD/MAY | 6h |
| Tue | Foundation draft rewrite (Part 2) | M1: Primitives 6-10 (Mandate, ApprovalRequest/Decision, ExecutionResult, EvidenceEvent) | 6h |
| Wed | Foundation draft rewrite (Part 3) + Schema | M1: Primitives 11-15 + cross-cutting requirements + review pass. M3: Interaction schema | 6h |
| Thu | Trademark + Governance | M2: Pact trademark research + decision. M4: IP posture statement. M6: Steward naming. M7: Feedback channel | 4-5h |
| Fri | Maturity + Review | M5: Downgrade overrated claims. Full read-through as an external reviewer. Fix anything that reads wrong. | 4-5h |

### Week 2: Governance and Polish (SHOULD tier)

| Day | Focus | Tasks | Hours |
|-----|-------|-------|-------|
| Mon | OEP + Conformance | S1: Write OEP-0001. S3: Fix conformance gaps (orphaned examples, missing error codes) | 5-6h |
| Tue | Conformance + Documentation | S3: Mandate negative fixtures. S2: Complete glossary. S9: SPEC.md deprecation. S10: Naming fix | 4-5h |
| Wed | Review Packet + Governance | S4: Complete MCP review packet. S5: Reframe WGs. S8: Remove company names | 4-5h |
| Thu | Neutrality + Versioning | S6: Strengthen NEUTRAL-BY-DESIGN.md. S7: Add semver | 4-5h |
| Fri | Final review + COULD stretch | Full external-reader walkthrough. Pick highest-value COULD items if time permits (C6, C8 are quick wins) | 4-5h |

---

## Expected Readiness Score After Completion

| Scenario | Score | What Changed |
|----------|-------|-------------|
| Current state | 4/10 | — |
| After MUST tier only | 6/10 | Spec becomes normative, maturity claims are honest, stewardship is named, trademark is addressed |
| After MUST + SHOULD | 7.5/10 | Governance is credible-for-stage, conformance gaps closed, documentation is substantive |
| After MUST + SHOULD + COULD | 8/10 | Implementation backing deepened, schemas complete, polish applied |

**To reach 9+/10 would require:** at least one independent external review completed, patent pledge legally finalized, and ideally a second independent implementation started.

---

## The Strongest Argument for Review

After completing this plan, a reviewer should walk away thinking:

> "This is a serious protocol design by a technically competent author who understands what standards discipline looks like. The foundation draft is normative and testable. The reference implementation is clean, well-tested, and demonstrates the core flow end-to-end. The conformance system is unusually mature for a pre-standard project. The maturity claims are honest — nothing is oversold. The governance is lightweight but appropriate for a single-author bootstrap phase, and there is a clear path to broader participation. The scope is ambitious but the author knows what is real today and what is planned. I want to see where this goes."

The key differentiator: **OAPS does not pretend to be further along than it is.** In a landscape of agent protocol announcements that are mostly press releases, this repo has working code, tested schemas, and a foundation draft that says exactly what an implementation MUST do. That's the credibility moat.

---

## What This Plan Does Not Address

- **Getting actual external reviewers.** This plan makes the repo *ready* for review. Outreach is a separate workstream.
- **Legal entity formation.** A fiscal sponsor or foundation is a multi-month process.
- **Patent pledge finalization.** Requires legal counsel, which is outside a 2-week sprint.
- **Second independent implementation.** Essential for long-term credibility but not achievable in 2 weeks.
- **Non-HTTP binding runtime implementations.** Correctly deferred — better to have one binding done well than four done poorly.
