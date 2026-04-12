"""Validation helpers for AICP actors, mandates, and state transitions."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from .types import Actor, Mandate

ACTOR_TYPES = {"human", "agent", "service"}

INTERACTION_STATES = {
    "discovered",
    "authenticated",
    "verified",
    "intent_received",
    "quoted",
    "delegated",
    "pending_approval",
    "approved",
    "executing",
    "partially_completed",
    "challenged",
    "failed",
    "compensated",
    "completed",
    "revoked",
    "settled",
    "archived",
}

INTERACTION_TRANSITIONS: dict[str, set[str]] = {
    "discovered": {"authenticated"},
    "authenticated": {"verified", "intent_received"},
    "verified": {"intent_received"},
    "intent_received": {"quoted", "delegated", "pending_approval", "approved", "executing", "completed", "failed"},
    "quoted": {"pending_approval", "approved", "executing", "failed"},
    "delegated": {"pending_approval", "approved", "executing", "failed"},
    "pending_approval": {"approved", "failed", "revoked"},
    "approved": {"executing", "completed", "failed", "revoked"},
    "executing": {"partially_completed", "challenged", "failed", "completed", "revoked"},
    "partially_completed": {"executing", "challenged", "compensated", "completed", "failed", "revoked"},
    "challenged": {"pending_approval", "approved", "executing", "failed", "revoked"},
    "failed": {"archived"},
    "compensated": {"archived"},
    "completed": {"settled", "archived"},
    "revoked": {"archived"},
    "settled": {"archived"},
    "archived": set(),
}

TASK_STATES = {
    "created",
    "queued",
    "running",
    "pending_approval",
    "challenged",
    "blocked",
    "partially_completed",
    "completed",
    "failed",
    "compensated",
    "revoked",
    "cancelled",
}

TASK_TRANSITIONS: dict[str, set[str]] = {
    "created": {"queued", "pending_approval", "running", "revoked"},
    "queued": {"running", "pending_approval", "cancelled", "revoked", "failed"},
    "running": {"blocked", "pending_approval", "challenged", "partially_completed", "completed", "failed", "revoked", "cancelled"},
    "pending_approval": {"queued", "running", "failed", "revoked"},
    "challenged": {"pending_approval", "queued", "running", "failed", "revoked"},
    "blocked": {"queued", "running", "challenged", "failed", "revoked", "cancelled"},
    "partially_completed": {"running", "challenged", "compensated", "completed", "failed", "revoked"},
    "completed": {"compensated"},
    "failed": set(),
    "compensated": set(),
    "revoked": set(),
    "cancelled": set(),
}


class ValidationError(Exception):
    def __init__(self, code: str, category: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.category = category


def assert_actor(actor: Any) -> None:
    if not isinstance(actor, Actor):
        raise ValidationError("VALIDATION_FAILED", "validation", "Expected an Actor instance")
    if not actor.actor_id:
        raise ValidationError("VALIDATION_FAILED", "validation", "Actor must include a non-empty actor_id")
    if actor.actor_type not in ACTOR_TYPES:
        raise ValidationError(
            "VALIDATION_FAILED",
            "validation",
            f"Actor actor_type must be one of {', '.join(sorted(ACTOR_TYPES))}",
        )


def assert_mandate_authorizes(mandate: Any, action: str, now: datetime | None = None) -> None:
    if not isinstance(mandate, Mandate):
        raise ValidationError("VALIDATION_FAILED", "validation", "Expected a Mandate instance")
    if now is None:
        now = datetime.now(timezone.utc)
    if mandate.expiry:
        expiry_dt = datetime.fromisoformat(mandate.expiry)
        if expiry_dt.tzinfo is None:
            expiry_dt = expiry_dt.replace(tzinfo=timezone.utc)
        if now >= expiry_dt:
            raise ValidationError(
                "MANDATE_EXPIRED",
                "authorization",
                f"Mandate {mandate.mandate_id} expired at {mandate.expiry}",
            )
    if mandate.action and mandate.action != action:
        raise ValidationError(
            "MANDATE_SCOPE_MISMATCH",
            "authorization",
            f"Mandate {mandate.mandate_id} does not cover action {action}",
        )


def assert_interaction_transition(from_state: str, to_state: str) -> None:
    if from_state not in INTERACTION_TRANSITIONS:
        raise ValidationError(
            "ILLEGAL_STATE_TRANSITION",
            "validation",
            f"Unknown interaction state: {from_state}",
        )
    if to_state not in INTERACTION_TRANSITIONS[from_state]:
        raise ValidationError(
            "ILLEGAL_STATE_TRANSITION",
            "validation",
            f"Illegal interaction transition: {from_state} -> {to_state}",
        )


def assert_task_transition(from_state: str, to_state: str) -> None:
    if from_state not in TASK_TRANSITIONS:
        raise ValidationError(
            "ILLEGAL_STATE_TRANSITION",
            "validation",
            f"Unknown task state: {from_state}",
        )
    if to_state not in TASK_TRANSITIONS[from_state]:
        raise ValidationError(
            "ILLEGAL_STATE_TRANSITION",
            "validation",
            f"Illegal task transition: {from_state} -> {to_state}",
        )
