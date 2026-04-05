# OAPS Glossary

## Purpose

This glossary gives short definitions for the terms that recur across the suite.

## Terms

| Term | Meaning |
| --- | --- |
| Actor | a durable identity that can be referenced in OAPS semantics |
| Capability | something an actor or system can do, often discovered through a profile or binding |
| Intent | the desired outcome or request before execution begins |
| Task | the work item or executable unit derived from intent |
| Delegation | authority passed from one actor or system to another |
| Mandate | a bounded authorization or constraint set for an action |
| Approval | an explicit human or higher-authority decision that allows a risky action |
| Execution result | the outcome of a task or invocation |
| Evidence | replayable, hash-linked proof that something happened |
| Binding | a transport or RPC surface that carries OAPS semantics |
| Profile | a mapping of OAPS semantics into an external ecosystem |
| Domain protocol | a larger OAPS-owned family such as commerce or provisioning |
| Companion system | an aligned external system that OAPS can reference without absorbing |
| Review packet | a bounded review bundle for external feedback |
| Cosigner | an external reviewer or organizational supporter who can help validate the suite |
| Design partner | a reviewer focused on fit, friction, and adoption rather than formal endorsement |
| Neutral by design | the posture that OAPS should map to ecosystems without becoming captive to one of them |
| Semantic super-protocol | a protocol above multiple ecosystems that standardizes shared control-plane meaning |

## Usage Rule

If a reader sees two terms that appear similar, prefer the narrower one:

- use *binding* for transport
- use *profile* for ecosystem mapping
- use *domain protocol* for OAPS-native larger families
- use *companion system* for external aligned systems
