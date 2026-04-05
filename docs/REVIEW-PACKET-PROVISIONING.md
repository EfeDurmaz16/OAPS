# Provisioning Review Packet

## Artifact

- name: `oaps-osp-v1`
- location: [`profiles/osp-draft.md`](../profiles/osp-draft.md)
- status: draft provisioning profile with fixture-backed conformance

## Review Question

Should provisioning remain a domain-family profile rather than being pushed into core?

## Why This Reviewer

OSP and provisioning reviewers can judge whether the lifecycle, credential delivery, and approval boundaries are portable enough to review on their own.

## What Is Already True

- implementation: the profile has deeper lifecycle mapping notes and example material
- conformance: provisioning fixture coverage exists in the suite-level conformance index
- examples: the repo contains provisioning lifecycle and approval-gated examples
- docs: the review matrices already describe the bounded review ask

## What Is Still Open

- how much provisioning detail should stay in the profile versus a later domain-family spec
- whether the approval and evidence boundaries are specific enough for external review

## Decision Requested

Choose one:

- comment-only review
- implementation feedback
- profile mapping feedback
- conformance feedback
- cosigner consideration

## Follow-Up

- next owner: protocol maintainers
- next artifact: refined provisioning profile notes or follow-up packet
- expected window: after bounded review feedback is collected
