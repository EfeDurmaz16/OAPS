---
oep: NNNN
title: "<Short Title>"
type: core | binding | profile | conformance | governance
status: draft
author: "<Name>"
created: YYYY-MM-DD
---

# OEP-NNNN: <Title>

## Summary

One or two sentences describing what this proposal changes.

## Motivation

Why this change is worth making. Reference:
- the specific pain point or gap
- any prior discussion or audit finding that prompted it
- what becomes possible once this is accepted

## Scope

What layer this proposal targets:

- [ ] Core semantics (`spec/core/`)
- [ ] Binding (`spec/bindings/<binding>.md`)
- [ ] Profile (`profiles/<profile>.md` or `spec/profiles/<profile>-draft.md`)
- [ ] Conformance (`conformance/`)
- [ ] Governance (`governance/`, `oeps/`)
- [ ] Reference implementation (`reference/oaps-monorepo/`)

State what is *not* in scope to prevent scope creep.

## Specification Changes

Exact prose, schema, and example changes proposed. Use diff-style fragments when possible:

```diff
- old normative text
+ new normative text
```

Point to concrete files:

- `spec/core/FOUNDATION-DRAFT.md` §"<section>"
- `schemas/foundation/<schema>.json`
- `examples/foundation/<example>.json`

## Conformance Impact

- New conformance scenarios introduced
- Scenarios that require migration
- Whether this is a schema-only change, fixture-backed change, or requires runtime-backed conformance
- Which packs are affected (`conformance/fixtures/core/`, binding packs, profile packs)

## Backward Compatibility

Classify the change per `VERSIONING.md`:

- [ ] PATCH (editorial only)
- [ ] MINOR (additive, backward-compatible)
- [ ] MAJOR (breaking)

If MAJOR: describe the migration path for existing implementations.

If MINOR: confirm no existing MUST is tightened and no existing field is renamed/removed.

## Alternatives Considered

Other ways this problem could be solved, and why they were rejected. At least one alternative should be listed; "we could do nothing" is always a valid alternative to compare against.

## Open Questions

Unresolved design questions that reviewers should weigh in on. It is acceptable to accept an OEP with open questions listed, provided they do not block the normative core of the proposal.

## References

- Related OEPs
- External specs, RFCs, or prior art
- Audit findings or issues this resolves
