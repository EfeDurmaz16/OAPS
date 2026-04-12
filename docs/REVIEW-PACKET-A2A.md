# A2A Review Packet

## Artifact

- name: `oaps-a2a-v1`
- location: [`profiles/a2a-draft.md`](../profiles/a2a-draft.md)
- status: draft profile with fixture-backed conformance

## Review Question

Does the A2A profile preserve task and message meaning while adding delegation, approval, and replayable evidence overlays?

## Why This Reviewer

A2A maintainers and task/workflow reviewers can tell whether AICP is aligning to A2A semantics or drifting into a separate task system.

## What Is Already True

- implementation: the profile now has deeper lifecycle mapping notes and example material
- conformance: A2A fixture coverage exists in the suite-level conformance index
- examples: the repo includes A2A example lifecycle and evidence artifacts
- docs: the review matrices already describe the bounded review ask

## What Is Still Open

- how much task lifecycle detail should be inherited from A2A versus defined by AICP
- whether approval and evidence overlays remain sufficiently portable

## Decision Requested

Choose one:

- comment-only review
- implementation feedback
- profile mapping feedback
- conformance feedback
- cosigner consideration

## Follow-Up

- next owner: protocol maintainers
- next artifact: refined A2A profile notes or follow-up packet
- expected window: after bounded review feedback is collected
