---
oep: 0001
title: "Ratification of the OEP Process"
type: governance
status: accepted
author: "Efe Baran Durmaz"
created: 2026-04-11
---

# OEP-0001: Ratification of the OEP Process

## Summary

This OEP formally ratifies the Open Enhancement Proposal process described in `governance/OEP_PROCESS.md` as the authoritative change mechanism for AICP. It bootstraps the process by being the first OEP ever written and accepted, proving the process end-to-end.

## Motivation

Before this OEP, the OEP process existed in prose (`governance/OEP_PROCESS.md`) but had never been exercised. An independent external-readiness audit on 2026-04-11 flagged this as a credibility risk:

> "OEP process has never been exercised. Zero OEPs exist. No OEP template file. No numbering scheme. No directory for OEPs. The process has never been tested."
> — `AUDIT-FIX-LIST.md` item #22

A governance process that has never been exercised is indistinguishable from an aspirational document. External contributors and cosigners need a real example of the process working before they can follow it. This OEP provides that example by being the process's own first use.

Self-ratification is not circular. The OEP process document already describes the rules; this OEP observes those rules, demonstrates the artifact structure, and publicly commits the project to using the process going forward. Subsequent OEPs can reference this one as precedent.

## Scope

- [x] Governance (`governance/`, `oeps/`)

Out of scope:

- changes to `governance/OEP_PROCESS.md` itself (this OEP adopts it as-is)
- creation of a working group structure beyond what `governance/WORKING_GROUPS.md` already describes
- legal entity formation or fiscal sponsorship (explicitly deferred per `CHARTER.md` §"Current Stewardship")

## Specification Changes

This OEP introduces structural artifacts rather than normative prose changes:

1. **Create `oeps/` directory** at repo root.
2. **Add `oeps/README.md`** describing the numbering scheme, lifecycle, and index of known OEPs.
3. **Add `oeps/TEMPLATE.md`** as the canonical shape for future OEPs. Required sections match `governance/OEP_PROCESS.md` §"Required Sections".
4. **Add `oeps/0001-oep-process.md`** (this file) as the bootstrap OEP that formally adopts the process.

No changes to `governance/OEP_PROCESS.md` itself.

## Conformance Impact

None. This OEP does not introduce, change, or remove any normative requirement on an AICP implementation. It is purely a governance-layer ratification.

No conformance fixtures are added or modified.

## Backward Compatibility

- [x] MINOR (additive)

Classified MINOR per `VERSIONING.md`. No existing implementation is affected. No schema changes. No normative requirements added or removed.

## Alternatives Considered

### Alternative 1: Do nothing (leave the OEP process unexercised)

Leaves the credibility gap flagged by the audit unresolved. An external reviewer encountering `governance/OEP_PROCESS.md` has no evidence the process can actually produce an OEP. Rejected.

### Alternative 2: Ratify the process with a substantive normative change bundled in

Bundling a real normative change (e.g. the RFC 2119 rewrite of the foundation draft) into OEP-0001 would demonstrate both the process and a meaningful change simultaneously. Rejected because:

- it couples two independent concerns (process ratification + normative change) in one OEP, which contradicts the "one-proposal-per-OEP" guidance
- the RFC 2119 rewrite landed as a direct atomic commit per the audit remediation sprint's execution model, not via OEP
- a bootstrap OEP is cleanest when it only ratifies the process, so future OEPs can reference it as pure precedent without inheriting a substantive change

### Alternative 3: Start the OEP numbering at a higher number to reserve OEP-0001 for "something important"

Reserving `0001` for a more significant future proposal is a common anti-pattern in standards bodies. It leaves the process looking aspirational while waiting for a "worthy" first use. Rejected.

## Open Questions

- **Q1**: How should OEPs be reviewed once there are multiple active maintainers? Currently the primary maintainer is the sole reviewer. The answer is deferred to a later governance OEP when the maintainer set grows beyond one person.
- **Q2**: Should OEPs be numbered globally or per-type (separate sequences for core / binding / profile / conformance / governance)? Decision: **globally** for now. Simpler, and the type metadata in each OEP's frontmatter is sufficient for filtering.
- **Q3**: What is the minimum quorum for accepting an OEP? Decision: **sole maintainer approves** while stewardship is solo; this will be revisited when co-stewards are added.

None of these block acceptance of OEP-0001 itself. They are recorded for future resolution.

## References

- `governance/OEP_PROCESS.md` — the process being ratified
- `governance/GOVERNANCE.md` — broader governance posture
- `MAINTAINERS.md` — current stewardship
- `CHARTER.md` — mission and neutrality posture
- `AUDIT-FIX-LIST.md` item #22 — the audit finding that prompted this bootstrap
- `AUDIT-REVIEW-PLAN.md` item S1 — the remediation plan step

## Acceptance Record

- **Drafted:** 2026-04-11
- **Reviewed:** 2026-04-11 (sole maintainer)
- **Accepted:** 2026-04-11
- **Implemented:** 2026-04-11 (the oeps/ directory and supporting files land in the same commit as this OEP)
