# Commerce Review Packet

## Artifact

- name: `oaps-acp-v1`, `oaps-ucp-v1`, and the commerce domain draft
- location: [`profiles/acp-draft.md`](../profiles/acp-draft.md), [`profiles/ucp-draft.md`](../profiles/ucp-draft.md), [`spec/domain/commerce-draft.md`](../spec/domain/commerce-draft.md)
- status: draft commerce alignment family with fixture-backed conformance

## Review Question

Does the commerce semantics stay above checkout-specific behavior while still mapping order, authorization, and fulfillment clearly?

## Why This Reviewer

ACP/UCP-adjacent reviewers and commerce design partners can tell whether AICP is staying abstract enough to align across ecosystems without recreating a checkout spec.

## What Is Already True

- implementation: the commerce-alignment drafts exist with examples and schemas
- conformance: ACP, UCP, and commerce-domain fixture coverage exists in the suite-level conformance index
- examples: the repo contains merchant authorization and commercial evidence examples
- docs: the commerce landscape and review packets already explain the boundary

## What Is Still Open

- how much commerce vocabulary should be domain-family versus ecosystem-alignment language
- whether the commerce family should remain a concept-level alignment or become a normative AICP domain later

## Decision Requested

Choose one:

- comment-only review
- implementation feedback
- profile mapping feedback
- conformance feedback
- cosigner consideration

## Follow-Up

- next owner: protocol maintainers
- next artifact: refined commerce draft notes or follow-up packet
- expected window: after bounded review feedback is collected
