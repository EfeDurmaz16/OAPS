"""Tests for AICP evidence chain construction and verification."""

import unittest

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from aicp.evidence import build_evidence_event, verify_chain


class TestBuildEvidenceEvent(unittest.TestCase):
    def test_returns_evidence_event(self):
        ev = build_evidence_event("state_change", "actor_1", {"key": "val"})
        self.assertTrue(ev.event_id.startswith("ev_"))
        self.assertEqual(ev.event_type, "state_change")
        self.assertEqual(ev.actor_ref, "actor_1")
        self.assertEqual(ev.prev_hash, "")
        self.assertTrue(ev.hash.startswith("sha256:"))

    def test_hash_includes_prev_hash(self):
        ev1 = build_evidence_event("a", "x", {})
        ev2 = build_evidence_event("a", "x", {}, prev_hash=ev1.hash)
        self.assertNotEqual(ev1.hash, ev2.hash)
        self.assertEqual(ev2.prev_hash, ev1.hash)

    def test_different_payloads_different_hashes(self):
        ev1 = build_evidence_event("t", "a", {"x": 1})
        ev2 = build_evidence_event("t", "a", {"x": 2})
        self.assertNotEqual(ev1.hash, ev2.hash)

    def test_payload_preserved(self):
        payload = {"action": "transfer", "amount": 100}
        ev = build_evidence_event("payment", "actor_1", payload)
        self.assertEqual(ev.payload, payload)


class TestVerifyChain(unittest.TestCase):
    def test_empty_chain_valid(self):
        self.assertTrue(verify_chain([]))

    def test_single_event_valid(self):
        ev = build_evidence_event("init", "a", {})
        self.assertTrue(verify_chain([ev]))

    def test_two_event_chain_valid(self):
        ev1 = build_evidence_event("init", "a", {"step": 1})
        ev2 = build_evidence_event("next", "a", {"step": 2}, prev_hash=ev1.hash)
        self.assertTrue(verify_chain([ev1, ev2]))

    def test_three_event_chain_valid(self):
        ev1 = build_evidence_event("a", "x", {})
        ev2 = build_evidence_event("b", "x", {}, prev_hash=ev1.hash)
        ev3 = build_evidence_event("c", "x", {}, prev_hash=ev2.hash)
        self.assertTrue(verify_chain([ev1, ev2, ev3]))

    def test_tampered_hash_detected(self):
        ev1 = build_evidence_event("init", "a", {})
        ev2 = build_evidence_event("next", "a", {}, prev_hash=ev1.hash)
        ev2.hash = "sha256:tampered"
        self.assertFalse(verify_chain([ev1, ev2]))

    def test_broken_prev_hash_detected(self):
        ev1 = build_evidence_event("init", "a", {})
        ev2 = build_evidence_event("next", "a", {}, prev_hash=ev1.hash)
        ev2.prev_hash = "sha256:wrong"
        self.assertFalse(verify_chain([ev1, ev2]))

    def test_tampered_payload_detected(self):
        ev1 = build_evidence_event("init", "a", {"original": True})
        ev1.payload = {"original": False}
        self.assertFalse(verify_chain([ev1]))


class TestChainOrdering(unittest.TestCase):
    def test_out_of_order_fails(self):
        ev1 = build_evidence_event("a", "x", {})
        ev2 = build_evidence_event("b", "x", {}, prev_hash=ev1.hash)
        self.assertFalse(verify_chain([ev2, ev1]))


if __name__ == "__main__":
    unittest.main()
