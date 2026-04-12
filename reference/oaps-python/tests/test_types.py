"""Tests for AICP core type dataclasses."""

import unittest
from dataclasses import asdict

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from aicp.types import (
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


class TestActor(unittest.TestCase):
    def test_create_actor(self):
        a = Actor(actor_id="actor_1", actor_type="agent", display_name="Bot")
        self.assertEqual(a.actor_id, "actor_1")
        self.assertEqual(a.actor_type, "agent")
        self.assertEqual(a.display_name, "Bot")

    def test_actor_default_display_name(self):
        a = Actor(actor_id="a", actor_type="human")
        self.assertEqual(a.display_name, "")

    def test_actor_serializable(self):
        a = Actor(actor_id="a", actor_type="service", display_name="Svc")
        d = asdict(a)
        self.assertIn("actor_id", d)
        self.assertEqual(d["actor_type"], "service")


class TestCapability(unittest.TestCase):
    def test_create_capability(self):
        c = Capability(capability_id="urn:cap:echo", action_surface="echo")
        self.assertEqual(c.capability_id, "urn:cap:echo")
        self.assertEqual(c.input_schema_ref, "")

    def test_capability_with_schemas(self):
        c = Capability(
            capability_id="urn:cap:x",
            action_surface="x",
            input_schema_ref="schemas/input.json",
            output_schema_ref="schemas/output.json",
        )
        self.assertEqual(c.input_schema_ref, "schemas/input.json")


class TestIntent(unittest.TestCase):
    def test_create_intent(self):
        i = Intent(
            intent_id="int_1",
            actor_ref="actor_1",
            capability_ref="cap_1",
            created_at="2026-01-01T00:00:00Z",
        )
        self.assertEqual(i.intent_id, "int_1")
        self.assertIsInstance(i.input, dict)

    def test_intent_with_input(self):
        i = Intent(
            intent_id="int_2",
            actor_ref="a",
            capability_ref="c",
            created_at="2026-01-01T00:00:00Z",
            input={"key": "value"},
        )
        self.assertEqual(i.input["key"], "value")


class TestTask(unittest.TestCase):
    def test_create_task(self):
        t = Task(
            task_id="task_1",
            intent_ref="int_1",
            state="created",
            created_at="2026-01-01T00:00:00Z",
        )
        self.assertEqual(t.state, "created")


class TestDelegation(unittest.TestCase):
    def test_create_delegation(self):
        d = Delegation(delegator="a", delegatee="b", scope=["read"], expiry="2026-12-31T23:59:59Z")
        self.assertEqual(d.scope, ["read"])


class TestMandate(unittest.TestCase):
    def test_create_mandate(self):
        m = Mandate(
            mandate_id="m_1",
            principal="owner",
            authorized_actor="agent",
            scope=["pay"],
            action="transfer",
            expiry="2026-06-01T00:00:00Z",
        )
        self.assertEqual(m.mandate_id, "m_1")
        self.assertEqual(m.action, "transfer")


class TestApprovalPair(unittest.TestCase):
    def test_approval_request(self):
        r = ApprovalRequest(
            request_id="req_1",
            target_interaction="ix_1",
            requester="agent",
            approver="human",
            reason="high-risk",
            created_at="2026-01-01T00:00:00Z",
        )
        self.assertEqual(r.reason, "high-risk")

    def test_approval_decision(self):
        d = ApprovalDecision(
            decision_id="dec_1",
            request_ref="req_1",
            decider="human",
            decided_at="2026-01-01T00:01:00Z",
            decision="approved",
        )
        self.assertEqual(d.decision, "approved")


class TestExecutionResult(unittest.TestCase):
    def test_create_result(self):
        r = ExecutionResult(result_id="r_1", execution_status="success")
        self.assertEqual(r.execution_status, "success")
        self.assertEqual(r.output, {})


class TestEvidenceEvent(unittest.TestCase):
    def test_create_event(self):
        e = EvidenceEvent(
            event_id="ev_1",
            event_type="state_change",
            hash="sha256:abc",
            prev_hash="",
            actor_ref="a",
            created_at="2026-01-01T00:00:00Z",
        )
        self.assertEqual(e.event_type, "state_change")


class TestErrorObject(unittest.TestCase):
    def test_create_error(self):
        e = ErrorObject(
            error_code="VALIDATION_FAILED",
            category="validation",
            retryable=False,
            message="bad input",
        )
        self.assertFalse(e.retryable)
        self.assertEqual(e.details, {})


if __name__ == "__main__":
    unittest.main()
