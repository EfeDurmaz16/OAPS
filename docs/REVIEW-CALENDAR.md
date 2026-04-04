# OAPS Review Calendar

## Purpose

This calendar makes review cadence explicit so the suite can move in parallel without losing decision trail.

## Standing Cadence

- Weekly Core Semantics review
- Weekly Bindings review
- Weekly Profiles review
- Weekly Conformance review
- Biweekly Governance and Outreach review
- Monthly cross-stream synthesis review
- Biweekly review-target matrix refresh
- Monthly external review packet scheduling review

## Monthly Review Windows

### Week 1

- close edits for core or binding changes
- publish fixture/schema deltas for anything normative

### Week 2

- review profile mappings
- confirm conformance coverage for newly claimed behavior

### Week 3

- prepare external review packets
- collect partner feedback on one bounded artifact at a time
- select the next packet family from `REVIEW-TARGET-MATRIX.md`
- confirm the packet shape from `REVIEW-PACKET-INDEX.md`

### Week 4

- decide what advances to OEP or draft status
- update roadmap and public positioning if the program boundary changed
- close or defer any outgoing review packets with explicit follow-up owners

## Quarterly Milestones

- Q1: suite framing, core foundation, HTTP binding, MCP/A2A profile scaffolding
- Q2: conformance runner contract, first profile hardening, second implementation line
- Q3: trust/payment profile drafts, external review packets, interoperability demos
- Q4: candidate stable profiles, external review cycle, neutrality/governance refinement

## Review Packet Rule

Any external ask should ship with:

- the bounded artifact
- the decision requested
- the current implementation status
- the conformance status
- the open questions
- the follow-up owner
- the packet type from `REVIEW-PACKET-INDEX.md`
- the target family from `REVIEW-TARGET-MATRIX.md`

## Practical Default

If a change cannot be reviewed in the current cycle, it stays in draft and does not become hard-normative by accident.
