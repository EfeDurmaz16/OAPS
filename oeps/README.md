# AICP Open Enhancement Proposals (OEPs)

This directory hosts AICP Open Enhancement Proposals. An OEP is the authoritative change mechanism for the AICP protocol suite, defined formally in `governance/OEP_PROCESS.md`.

## Numbering

OEPs are numbered sequentially starting at `0001`. File names use the format `NNNN-slug.md` where:

- `NNNN` is a four-digit zero-padded sequence number
- `slug` is a short kebab-case identifier (e.g. `oep-process`, `add-payment-primitive`, `deprecate-foo`)

## Lifecycle

- `draft` — initial proposal, open for feedback
- `review` — formally under review by the primary maintainer, collaborators, and invited reviewers
- `accepted` — approved, pending implementation
- `implemented` — normative content merged and conformance-backed
- `superseded` — replaced by a later OEP
- `withdrawn` — abandoned by author

## Template

See `oeps/TEMPLATE.md` for the canonical OEP structure. The required sections come from `governance/OEP_PROCESS.md`:

1. Summary
2. Motivation
3. Scope
4. Specification changes
5. Conformance impact
6. Backward compatibility
7. Alternatives considered
8. Open questions

## Index

| OEP | Title | Type | Status | Author |
|---|---|---|---|---|
| [0001](./0001-oep-process.md) | Ratification of the OEP Process | governance | accepted | Efe Baran Durmaz |

## How to Submit an OEP

1. Copy `TEMPLATE.md` to `oeps/NNNN-slug.md` with the next available number.
2. Fill in all required sections.
3. Open a pull request against `main` with the OEP file.
4. The primary maintainer will transition the status from `draft` → `review` → `accepted`.
5. Implementation work (schemas, examples, conformance fixtures, reference code) is tracked in a separate implementation PR that references the accepted OEP.
