"""Core AICP foundation primitives as Python dataclasses."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class Actor:
    actor_id: str
    actor_type: str  # human | agent | service
    display_name: str = ""


@dataclass
class Capability:
    capability_id: str  # must be a URI
    action_surface: str
    input_schema_ref: str = ""
    output_schema_ref: str = ""


@dataclass
class Intent:
    intent_id: str
    actor_ref: str
    capability_ref: str
    created_at: str  # RFC 3339
    input: dict[str, Any] = field(default_factory=dict)


@dataclass
class Task:
    task_id: str
    intent_ref: str
    state: str
    created_at: str  # RFC 3339
    updated_at: str = ""


@dataclass
class Delegation:
    delegator: str
    delegatee: str
    scope: list[str] = field(default_factory=list)
    expiry: str = ""  # RFC 3339


@dataclass
class Mandate:
    mandate_id: str
    principal: str
    authorized_actor: str
    scope: list[str] = field(default_factory=list)
    action: str = ""
    expiry: str = ""  # RFC 3339


@dataclass
class ApprovalRequest:
    request_id: str
    target_interaction: str
    requester: str
    approver: str
    reason: str
    created_at: str  # RFC 3339
    timeout: str = ""


@dataclass
class ApprovalDecision:
    decision_id: str
    request_ref: str
    decider: str
    decided_at: str  # RFC 3339
    decision: str  # approved | rejected | modified
    explanation: str = ""


@dataclass
class ExecutionResult:
    result_id: str
    execution_status: str  # success | partial | failed
    task_ref: str = ""
    output: dict[str, Any] = field(default_factory=dict)


@dataclass
class EvidenceEvent:
    event_id: str
    event_type: str
    hash: str
    prev_hash: str
    actor_ref: str
    created_at: str  # RFC 3339
    payload: dict[str, Any] = field(default_factory=dict)


@dataclass
class ErrorObject:
    error_code: str
    category: str
    retryable: bool
    message: str
    details: dict[str, Any] = field(default_factory=dict)
