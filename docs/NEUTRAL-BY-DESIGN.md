# Neutral By Design

## Purpose

This page records AICP's public neutrality posture, honestly framed for the bootstrap phase. Neutrality is not something a single-author project can claim by decree — it has to be designed into the project's structure and honestly acknowledged as a goal rather than a finished property.

## The Obvious Critique

Any skeptical reader will notice that every "aligned system" named in this repo (Sardis, FIDES, agit, OSP) is authored or co-authored by the same person as AICP itself. A reasonable first question is:

> How can this project claim to be neutral when every reference integration is the author's own project?

This document answers that question directly.

## What Neutrality Means Here

Neutral by design means AICP:

1. **Maps to adjacent ecosystems without absorbing them.** AICP profiles for MCP, A2A, x402, OSP, and others translate between AICP primitives and the adjacent ecosystem's native objects. A profile does not force the ecosystem to adopt AICP's terminology, transport, or product surface.
2. **Reuses existing protocols where they already solve a narrow problem well.** AICP does not reinvent identity, does not replace transport, does not specify a payment rail. It layers control-plane semantics on top of existing mechanisms.
3. **Avoids turning aligned systems into mandatory dependencies.** An AICP implementation does not need to run Sardis or FIDES or OSP. The aligned systems are proving grounds for AICP's semantics, not required components of the standard.
4. **Avoids framing itself as a replacement for ecosystems that already work.** AICP is positioned as "above MCP / A2A / x402" semantically, not "instead of" them.
5. **Keeps its own primitives portable across implementations.** Any AICP primitive that cannot be implemented by a second independent party is a bug in the primitive, not a feature of the project.

## Concrete Neutrality Mechanisms

Neutrality is enforced through repository and governance structure, not through individual author goodwill.

### Mechanism 1: Open conformance kit

`conformance/` contains a machine-readable TCK manifest, fixture packs, runner contract, and result schema. The kit is open to any implementation. An adversarial implementer who wants to prove AICP can be implemented *without* reference to the author's aligned systems can run the conformance suite against their own runtime and verify independence.

Any primitive or state transition that cannot be exercised without a specific aligned system is a bug in the spec and **MUST** be fixed before the spec freezes at `0.1.0`.

### Mechanism 2: Open profile authorship

Nothing in the AICP charter, OEP process, or governance model reserves profile authorship to the founding steward. Any external party can propose a profile via OEP. Profiles for ecosystems the founding steward has no stake in (e.g. a hypothetical AICP profile for an unrelated agent protocol) are welcomed on the same terms as aligned-system profiles.

### Mechanism 3: Open primitive definition

The foundation draft's primitives are not designed against Sardis-, FIDES-, or agit-specific behaviors. The PaymentCoordination primitive, for example, explicitly excludes rail-specific mechanics from the normative core — rail-specific details belong to profiles (`x402`, `ap2`, `mpp`), none of which the founding steward controls exclusively.

If a primitive can *only* be satisfied by one aligned implementation, that is a red flag that the primitive leaked implementation details. The audit at repo root specifically calls this out as an ongoing discipline requirement.

### Mechanism 4: Designed for multi-stakeholder governance

The governance trajectory is explicit: solo steward → co-stewards from aligned ecosystems → neutral consortium or fiscal sponsor (see `MAINTAINERS.md` §"Path to Broader Governance" and `CHARTER.md` §"Current Stewardship"). The single-steward phase is acknowledged as a bootstrap condition, not a permanent state.

The RF patent pledge draft (`governance/RF_PATENT_PLEDGE.md`) is structured so that a neutral entity can eventually hold patent commitments. Until that entity exists, the pledge is explicitly draft intent.

### Mechanism 5: Honesty about current state

This document, the `MATURITY-MATRIX.md` calibration, the `MAINTAINERS.md` stewardship posture, and the `AUDIT-*` files at repo root together constitute an honest admission of where the bootstrap phase currently is. An honest admission is a neutrality mechanism because it prevents the project from claiming standards-body status it has not earned.

## Bootstrap Phase Acknowledgment

AICP is currently in a single-author bootstrap phase. The founding steward happens to also author several aligned systems. This is a historical accident of who started the project, not a design choice that makes AICP captive to those systems.

The right reading of the current state is:

- **In this phase**, the aligned systems are the easiest reference implementations to build against because the author has direct access to both sides.
- **In the next phase**, co-stewards and external implementers from adjacent ecosystems join, and AICP profiles are authored by parties with no stake in the aligned systems.
- **In the long run**, a conforming AICP implementation should be indistinguishable in quality between authors who use aligned systems and authors who use completely unrelated runtimes.

If AICP ever settles into a state where the founding steward's aligned systems are privileged over external implementations — for example, by introducing primitives that only Sardis can satisfy — that is a governance failure and **SHOULD** be challenged via OEP.

## Aligned Systems (Current)

The repo acknowledges several aligned systems. They are aligned, not captive. They are proving grounds, not dependencies.

- **Sardis** — payment governance, payment profile proving ground
- **FIDES** — trust and attestation profile proving ground
- **agit** — lineage and replay companion system
- **OSP** — provisioning profile proving ground

Any of these can disappear tomorrow and AICP's normative core should remain unchanged. That is the structural test of whether the aligned-system posture is honest.

## Copy Rule

Any public copy about AICP should make the following distinction clear:

- AICP standardizes shared control-plane semantics.
- Adjacent protocols and products continue to own their own transport, product UX, and business logic.
- Aligned systems are named as proving grounds, never as required runtime.

Specifically, public copy **SHOULD NOT**:

- claim AICP "powers" any aligned system
- claim any aligned system is a "reference" AICP runtime in a way that implies other runtimes are non-reference
- name aligned systems in marketing positioning without also naming at least one ecosystem the founding steward has no stake in

## Related Documents

- `MAINTAINERS.md` — current stewardship and governance trajectory
- `CHARTER.md` — mission, neutrality commitment, architectural stance
- `governance/GOVERNANCE.md` — governance principles
- `governance/RF_PATENT_PLEDGE.md` — IP posture (draft intent)
- `AUDIT-MATURITY-MATRIX.md` — independent calibration of what the repo actually proves
