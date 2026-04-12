# AICP Suite Map

## Purpose

This page is the top-level map of the suite-level document set.

It is intended to help readers decide where to start without pretending that every surface has the same maturity.

## Read This First

1. [`CHARTER.md`](../CHARTER.md)
2. [`README.md`](../README.md)
3. [`docs/SUITE-ARCHITECTURE.md`](./SUITE-ARCHITECTURE.md)
4. [`docs/PROTOCOL-POSITIONING.md`](./PROTOCOL-POSITIONING.md)
5. [`docs/MATURITY-MATRIX.md`](./MATURITY-MATRIX.md)
6. [`docs/WHY-OAPS.md`](./WHY-OAPS.md)

## Suite Layers

| Layer | What it covers | Current maturity |
| --- | --- | --- |
| Core semantics | shared actor, capability, intent, task, approval, execution, evidence, and error primitives | Draft |
| Bindings | HTTP, JSON-RPC, gRPC, and events/webhooks transport surfaces | Draft / concept depending on binding |
| Profiles | MCP, A2A, auth/trust, payment, provisioning, and commerce mappings | Draft |
| Domain protocols | larger AICP-native families such as commerce and provisioning | Draft |
| Companion systems | aligned systems such as Sardis, FIDES, agit, and OSP | Reference relationships only |

## Where To Go Next

- Core and semantics: [`spec/`](../spec/) and [`SPEC.md`](../SPEC.md)
- Binding entry points: [`docs/BINDING-MAP.md`](./BINDING-MAP.md)
- Profile entry points: [`docs/PROFILE-MAP.md`](./PROFILE-MAP.md)
- Domain families: [`docs/DOMAIN-PROTOCOL-MAP.md`](./DOMAIN-PROTOCOL-MAP.md)
- Implementation status: [`docs/IMPLEMENTATION-MAP.md`](./IMPLEMENTATION-MAP.md)
- Review packets: [`docs/REVIEW-PACKET-INDEX.md`](./REVIEW-PACKET-INDEX.md)

## Navigational Rule

The suite map is a guide, not a normative source.

If this page and a normative spec disagree, the spec or profile file wins.
