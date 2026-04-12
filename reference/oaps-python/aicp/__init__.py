"""AICP core runtime — stdlib-only Python implementation of OAPS foundation primitives."""

from .types import (
    Actor,
    ApprovalDecision,
    ApprovalRequest,
    Capability,
    Delegation,
    ErrorObject,
    EvidenceEvent,
    ExecutionResult,
    Intent,
    Mandate,
    Task,
)
from .evidence import build_evidence_event, verify_chain
from .validation import (
    assert_actor,
    assert_interaction_transition,
    assert_mandate_authorizes,
    assert_task_transition,
)

__all__ = [
    "Actor",
    "ApprovalDecision",
    "ApprovalRequest",
    "Capability",
    "Delegation",
    "ErrorObject",
    "EvidenceEvent",
    "ExecutionResult",
    "Intent",
    "Mandate",
    "Task",
    "assert_actor",
    "assert_interaction_transition",
    "assert_mandate_authorizes",
    "assert_task_transition",
    "build_evidence_event",
    "verify_chain",
]
