"""
VeriGround — Module 6: Provenance Store Test Suite
===================================================
Tests creating, writing, querying, and filtering the SQLite provenance store.
"""

import os
import sys
import unittest

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from provenance_store import (
    log_verification,
    get_provenance_log,
    get_claim_by_id,
    get_provenance_stats,
    update_explanation,
)


class TestProvenanceStore(unittest.TestCase):

    def test_log_and_retrieve_single_claim(self):
        claim = "The Eiffel Tower was constructed in 1889."
        c_id = log_verification(
            claim_text=claim,
            verdict="Supported",
            evidence_chunk_id="doc_eiffel_0",
            source_document_id="doc_eiffel",
            fused_score=0.8039,
            component_scores={
                "sem_sim": 0.82,
                "p_entail": 0.9977,
                "p_contradict": 0.0001,
                "entity_overlap": 1.0,
            },
            explanation="The Eiffel Tower construction date is confirmed by the evidence.",
        )
        self.assertIsNotNone(c_id)

        retrieved = get_claim_by_id(c_id)
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved["claim_text"], claim)
        self.assertEqual(retrieved["verdict"], "Supported")
        self.assertEqual(retrieved["fused_score"], 0.8039)
        self.assertEqual(retrieved["component_scores"]["p_entail"], 0.9977)

    def test_verdict_filter_and_stats(self):
        log_verification(
            claim_text="Water boils at 100 degrees Celsius.",
            verdict="Supported",
            fused_score=0.89,
        )
        log_verification(
            claim_text="The Amazon produces 50% of oxygen.",
            verdict="Unsupported",
            fused_score=0.05,
        )
        log_verification(
            claim_text="Water never boils at 100 degrees.",
            verdict="Contradicted",
            fused_score=0.00,
        )

        all_logs = get_provenance_log()
        self.assertGreaterEqual(len(all_logs), 3)

        supp_logs = get_provenance_log(verdict_filter="Supported")
        self.assertTrue(all(r["verdict"] == "Supported" for r in supp_logs))

        stats = get_provenance_stats()
        self.assertGreaterEqual(stats["total"], 3)
        self.assertIn("Supported", stats["by_verdict"])

    def test_update_explanation_preserves_existing_fields(self):
        claim = "New claim for explanation update."
        claim_id = log_verification(
            claim_text=claim,
            verdict="Unsupported",
            fused_score=0.03,
            explanation="Initial placeholder explanation.",
        )
        update_explanation(claim_id, "Updated explanation text.")

        retrieved = get_claim_by_id(claim_id)
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved["claim_text"], claim)
        self.assertEqual(retrieved["explanation"], "Updated explanation text.")
 
 
if __name__ == "__main__":
    print("=" * 70)
    print("VeriGround — Module 6: Provenance Store Test")
    print("=" * 70)
    unittest.main()
