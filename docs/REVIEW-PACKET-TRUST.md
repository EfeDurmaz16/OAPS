# Trust Review Packet

## Artifact

- name: `oaps-auth-web-v1` and `oaps-fides-tap-v1`
- location: [`profiles/auth-web.md`](../profiles/auth-web.md) and [`profiles/auth-fides-tap-draft.md`](../profiles/auth-fides-tap-draft.md)
- status: baseline draft plus high-assurance draft

## Review Question

Do the baseline and high-assurance trust profiles keep subject binding, delegation proof, and trust upgrade semantics explicit?

## Why This Reviewer

Identity, signing, and attestation reviewers can judge whether the trust boundary is defensible without fragmenting the core.

## What Is Already True

- implementation: the TypeScript reference line already contains fail-closed subject-binding and trust seams
- conformance: auth-web and auth-fides-tap fixture coverage exists in the suite-level conformance index
- examples: the repo contains trust examples and helper schemas
- docs: the review packets and readiness checklists already describe the review shape

## What Is Still Open

- how much of the high-assurance profile should remain an explicit upgrade path
- where the trust boundary should draw the line between baseline and premium assurance

## Decision Requested

Choose one:

- comment-only review
- implementation feedback
- profile mapping feedback
- conformance feedback
- cosigner consideration

## Follow-Up

- next owner: protocol maintainers
- next artifact: refined trust profile notes or follow-up OEP
- expected window: after bounded review feedback is collected
