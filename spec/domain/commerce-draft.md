# OAPS Commerce Draft

## Status

Draft domain-family specification for commerce alignment in the OAPS suite.

This is a domain draft, not the full normative suite core.

## Purpose

OAPS Commerce defines the shared semantics needed to represent order,
authorization, and fulfillment behavior across commerce ecosystems.

The draft exists so OAPS can describe commercial activity without
becoming a merchant checkout product or a payment rail.

## Normative Scope

This draft is normative for:

- representing order intent as an OAPS task or interaction
- preserving authorization boundaries for merchant or delegate approval
- recording fulfillment commitments and outcomes in portable evidence
- distinguishing cancellation, rejection, refund, and compensation paths
- mapping commerce workflows into ACP- or UCP-style ecosystems

This draft remains informative for:

- merchant UI layout
- checkout widget design
- vendor-specific catalog models
- rail-specific payment settlement behavior

## Commerce Object Model

The draft assumes a small semantic family:

- `OrderIntent`
- `Cart` or `Quote`
- `MerchantAuthorization`
- `FulfillmentCommitment`
- `CommercialEvidence`

These are mapping primitives. Implementations may realize them with the
existing OAPS core object families where that is the most honest fit.

## Lifecycle Mapping

A conforming mapping SHOULD be able to preserve the following phases:

| Commerce phase | OAPS anchor | Notes |
| --- | --- | --- |
| browse or discover | `discovered` | the merchant or catalog is known, but no commitment exists |
| cart or quote prepared | `intent_received` | the desired commercial outcome has been registered |
| checkout pending approval | `pending_approval` | merchant, user, policy, or delegate approval is required |
| order authorized | `approved` | the commerce action may now proceed |
| fulfillment in progress | `executing` | the commercial action is active |
| partial fulfillment | `partially_completed` | some deliverables exist, but the order is not final |
| fulfilled | `completed` | the order or service delivery has finished |
| cancelled or revoked | `revoked` | authority or commitment was withdrawn |
| compensated or refunded | `compensated` | the workflow restored balance after side effects |
| settled and archived | `settled` or `archived` | the commercial record is closed and retained |

## Relationship To ACP And UCP

ACP and UCP are treated as alignment targets, not as the definition of the
commerce domain.

The draft should support:

- agentic commerce workflows in ACP-like systems
- checkout-style interaction flows in UCP-like systems
- explicit merchant authority and approval gating
- replayable evidence for order and fulfillment decisions

## Relationship To Payment Profiles

Commerce may depend on payment profiles such as MPP, AP2, or x402, but
payment coordination does not replace commerce semantics.

A commerce workflow SHOULD keep the payment handoff explicit so that:

- authorization can be reviewed independently
- settlement can be recorded without losing order context
- fulfillment can be audited separately from payment completion

## Relationship To Provisioning

Some commerce outcomes provision services or credentials.
In those cases, the commerce draft SHOULD preserve a clean handoff into
provisioning semantics such as OSP.

## Conformance Notes

This draft is not yet backed by a commerce conformance pack.

The current repository instead provides:

- the domain framing in this document
- profile-alignment drafts for ACP and UCP
- draft examples under `examples/commerce/`

## Open Questions

- Which commerce primitives should become stable OAPS domain objects?
- How far should cart and quote semantics be standardized before
  implementation diversity is lost?
- Should refunds and compensation be separate domain concepts or mapped
  entirely through execution and evidence semantics?
