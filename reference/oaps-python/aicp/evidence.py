"""Evidence chain construction and verification using SHA-256."""

from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Any

from .types import EvidenceEvent


def _canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"))


def _sha256_hex(data: str) -> str:
    return "sha256:" + hashlib.sha256(data.encode("utf-8")).hexdigest()


def build_evidence_event(
    event_type: str,
    actor_ref: str,
    payload: dict[str, Any],
    prev_hash: str = "",
) -> EvidenceEvent:
    event_id = f"ev_{uuid.uuid4().hex}"
    created_at = datetime.now(timezone.utc).isoformat()
    hash_input = _canonical_json(
        {
            "event_type": event_type,
            "actor_ref": actor_ref,
            "payload": payload,
            "prev_hash": prev_hash,
            "created_at": created_at,
        }
    )
    event_hash = _sha256_hex(hash_input)
    return EvidenceEvent(
        event_id=event_id,
        event_type=event_type,
        hash=event_hash,
        prev_hash=prev_hash,
        actor_ref=actor_ref,
        created_at=created_at,
        payload=payload,
    )


def _recompute_hash(event: EvidenceEvent) -> str:
    hash_input = _canonical_json(
        {
            "event_type": event.event_type,
            "actor_ref": event.actor_ref,
            "payload": event.payload,
            "prev_hash": event.prev_hash,
            "created_at": event.created_at,
        }
    )
    return _sha256_hex(hash_input)


def verify_chain(events: list[EvidenceEvent]) -> bool:
    for i, event in enumerate(events):
        if _recompute_hash(event) != event.hash:
            return False
        if i == 0:
            continue
        if event.prev_hash != events[i - 1].hash:
            return False
    return True
