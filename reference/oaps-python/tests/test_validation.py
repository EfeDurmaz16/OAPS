"""Tests for AICP validation helpers."""

import unittest

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from aicp.types import Actor, Mandate
from aicp.validation import (
    INTERACTION_TRANSITIONS,
    TASK_TRANSITIONS,
    ValidationError,
    assert_actor,
    assert_interaction_transition,
    assert_mandate_authorizes,
    assert_task_transition,
)


class TestAssertActor(unittest.TestCase):
    def test_valid_actor(self):
        a = Actor(actor_id="a1", actor_type="human", display_name="Alice")
        assert_actor(a)

    def test_missing_actor_id(self):
        a = Actor(actor_id="", actor_type="agent")
        with self.assertRaises(ValidationError) as ctx:
            assert_actor(a)
        self.assertEqual(ctx.exception.code, "VALIDATION_FAILED")

    def test_invalid_actor_type(self):
        a = Actor(actor_id="a1", actor_type="robot")
        with self.assertRaises(ValidationError):
            assert_actor(a)

    def test_not_an_actor_instance(self):
        with self.assertRaises(ValidationError):
            assert_actor({"actor_id": "x", "actor_type": "human"})

    def test_all_valid_actor_types(self):
        for t in ("human", "agent", "service"):
            a = Actor(actor_id="x", actor_type=t)
            assert_actor(a)


class TestAssertMandateAuthorizes(unittest.TestCase):
    def _make_mandate(self, expiry="2099-12-31T23:59:59Z", action="transfer"):
        return Mandate(
            mandate_id="m1",
            principal="owner",
            authorized_actor="bot",
            scope=["pay"],
            action=action,
            expiry=expiry,
        )

    def test_valid_mandate(self):
        m = self._make_mandate()
        assert_mandate_authorizes(m, "transfer")

    def test_expired_mandate(self):
        m = self._make_mandate(expiry="2020-01-01T00:00:00Z")
        with self.assertRaises(ValidationError) as ctx:
            assert_mandate_authorizes(m, "transfer")
        self.assertEqual(ctx.exception.code, "MANDATE_EXPIRED")

    def test_scope_mismatch(self):
        m = self._make_mandate(action="transfer")
        with self.assertRaises(ValidationError) as ctx:
            assert_mandate_authorizes(m, "delete")
        self.assertEqual(ctx.exception.code, "MANDATE_SCOPE_MISMATCH")

    def test_not_a_mandate_instance(self):
        with self.assertRaises(ValidationError):
            assert_mandate_authorizes({}, "transfer")

    def test_empty_action_matches_anything(self):
        m = self._make_mandate(action="")
        assert_mandate_authorizes(m, "anything")

    def test_expired_category_is_authorization(self):
        m = self._make_mandate(expiry="2020-01-01T00:00:00Z")
        with self.assertRaises(ValidationError) as ctx:
            assert_mandate_authorizes(m, "transfer")
        self.assertEqual(ctx.exception.category, "authorization")


class TestInteractionTransitions(unittest.TestCase):
    def test_valid_discovered_to_authenticated(self):
        assert_interaction_transition("discovered", "authenticated")

    def test_valid_executing_to_completed(self):
        assert_interaction_transition("executing", "completed")

    def test_illegal_completed_to_executing(self):
        with self.assertRaises(ValidationError) as ctx:
            assert_interaction_transition("completed", "executing")
        self.assertEqual(ctx.exception.code, "ILLEGAL_STATE_TRANSITION")

    def test_illegal_archived_to_any(self):
        with self.assertRaises(ValidationError):
            assert_interaction_transition("archived", "discovered")

    def test_unknown_from_state(self):
        with self.assertRaises(ValidationError):
            assert_interaction_transition("nonexistent", "authenticated")

    def test_all_canonical_transitions_accepted(self):
        for from_s, targets in INTERACTION_TRANSITIONS.items():
            for to_s in targets:
                assert_interaction_transition(from_s, to_s)


class TestTaskTransitions(unittest.TestCase):
    def test_valid_created_to_running(self):
        assert_task_transition("created", "running")

    def test_valid_running_to_completed(self):
        assert_task_transition("running", "completed")

    def test_illegal_completed_to_running(self):
        with self.assertRaises(ValidationError) as ctx:
            assert_task_transition("completed", "running")
        self.assertEqual(ctx.exception.code, "ILLEGAL_STATE_TRANSITION")

    def test_illegal_cancelled_to_running(self):
        with self.assertRaises(ValidationError):
            assert_task_transition("cancelled", "running")

    def test_unknown_task_state(self):
        with self.assertRaises(ValidationError):
            assert_task_transition("invented", "running")

    def test_all_canonical_task_transitions_accepted(self):
        for from_s, targets in TASK_TRANSITIONS.items():
            for to_s in targets:
                assert_task_transition(from_s, to_s)


if __name__ == "__main__":
    unittest.main()
