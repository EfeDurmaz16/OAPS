# AICP Review Cadence (Planned)

## Purpose

This document describes the **intended** review cadence for when AICP has more than one active maintainer. No cadence is currently in effect — see the Current State section below.

Formerly titled "Review Calendar." Renamed 2026-04-11 to stop implying a scheduled calendar that does not exist.

## Current State (2026-04-11)

- **Zero active working groups.** See `governance/WORKING_GROUPS.md`.
- **Zero scheduled review meetings.** No calendar, no notes, no cadence notes to point to.
- **One active maintainer.** Efe Baran Durmaz (see `MAINTAINERS.md`).
- **Review happens asynchronously via GitHub.** Issues, Discussions (pending enablement), and OEPs are the current review surface.

The planned cadence below will become effective when co-stewards join and working groups become live (see `governance/WORKING_GROUPS.md` §"Planned Areas of Work").

## Planned Standing Cadence (Not Yet Active)

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

## Planned Quarterly Milestones (No Dates)

These milestones describe the *order* of program work, not a calendar. Specific dates will be added when the project has the stakeholder commitments that make date-level commitments credible.

- **Phase Q1:** suite framing, core foundation, HTTP binding, MCP/A2A profile scaffolding (largely done, see STATUS.md)
- **Phase Q2:** conformance runner contract, first profile hardening, second implementation line
- **Phase Q3:** trust/payment profile drafts, external review packets, interoperability demos
- **Phase Q4:** candidate stable profiles, external review cycle, neutrality/governance refinement

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
