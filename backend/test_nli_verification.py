"""
VeriGround — Module 4 smoke test
==================================
Four test cases, one per verdict category:
    Supported / Partially Supported / Unsupported / Contradicted

For each case we print every component score so you can see exactly why
the verdict was assigned — this is the transparency the project plan calls
for in step 6 (per-claim explanation).

Run from the backend/ directory:
    python test_nli_verification.py

First run downloads cross-encoder/nli-deberta-v3-base (~370 MB).
Subsequent runs load from the HuggingFace cache (~2-3 min on Ryzen 3 CPU).
Per-pair inference is ~3 s on CPU; 4 cases total ≈ 12-15 s after load.
"""

import json
import time
from nli_verification import (
    verify_claim_evidence,
    fuse_score,
    classify_verdict,
    ALPHA, BETA, GAMMA, DELTA,
    THRESHOLD_SUPPORTED, THRESHOLD_PARTIAL_LO,
    THRESHOLD_UNSUPPORTED, CONTRADICT_DOMINANCE,
)

# ─────────────────────────────────────────────────────────────────────────────
# Test cases
# Each dict specifies: label (expected verdict category), claim, evidence, and
# the sem_sim value that Module 3 (FAISS) would have produced for this pair.
# ─────────────────────────────────────────────────────────────────────────────

TEST_CASES = [
    # ── CASE 1: SUPPORTED ────────────────────────────────────────────────────
    # Evidence directly states the same facts as the claim.
    # Expect: high P(entail) → fused_score well above 0.70.
    {
        "expected_verdict": "Supported",
        "claim": (
            "The Eiffel Tower was constructed in 1889 and is located in Paris, France."
        ),
        "evidence": (
            "The Eiffel Tower was built between 1887 and 1889 and stands on the "
            "Champ de Mars in Paris, France, where it was the centerpiece of the "
            "1889 World's Fair."
        ),
        "sem_sim": 0.82,
    },

    # ── CASE 2: PARTIALLY SUPPORTED ──────────────────────────────────────────
    # Evidence strongly entails the claim's core assertion but the claim has
    # no named entities or numbers for the entity-overlap component to fire on.
    # Result: high P(entail) but entity_overlap=0, and sem_sim just below the
    # Supported floor — the fusion formula lands in 0.40–0.69.
    #
    # Real-world analogue: an LLM claims "Exercise reduces heart disease risk."
    # The retrieved evidence chunk confirms it via clinical studies but is a
    # longer, indirect paraphrase — no entities to cross-match.
    {
        "expected_verdict": "Partially Supported",
        "claim": (
            "Exercise reduces the risk of heart disease."
        ),
        "evidence": (
            "Regular physical exercise has been shown to improve cardiovascular "
            "health and reduce the risk of heart disease in multiple large-scale "
            "clinical studies."
        ),
        # FAISS would return ~0.76 for this near-paraphrase (same topic, indirect)
        "sem_sim": 0.76,
    },

    # ── CASE 3: UNSUPPORTED ──────────────────────────────────────────────────
    # Evidence is on a completely different topic; no entailment signal at all.
    # sem_sim is near zero, which keeps the fused score in the Unsupported band
    # even if NLI happens to assign contradiction (off-topic contradiction
    # doesn't make a claim unsupported about a different subject).
    {
        "expected_verdict": "Unsupported",
        "claim": (
            "The Amazon rainforest produces 20 percent of the world's oxygen."
        ),
        "evidence": (
            "Water boils at 100 degrees Celsius under standard atmospheric "
            "pressure of 101.325 kPa. At higher altitudes the boiling point "
            "decreases due to lower atmospheric pressure."
        ),
        "sem_sim": 0.03,
    },

    # ── CASE 4: CONTRADICTED ─────────────────────────────────────────────────
    # Claim directly inverts the stated fact; high P(contradict) from NLI
    # triggers the dominance override (p_contradict > 0.60).
    # sem_sim is high because it's the same topic.
    {
        "expected_verdict": "Contradicted",
        "claim": (
            "Water always boils at exactly 100 degrees Celsius regardless of "
            "altitude; elevation has no effect on its boiling point."
        ),
        "evidence": (
            "At higher altitudes, atmospheric pressure decreases, which lowers "
            "the boiling point of water. At the summit of Mount Everest water "
            "boils at approximately 70 degrees Celsius, not 100 degrees Celsius."
        ),
        "sem_sim": 0.73,
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Runner
# ─────────────────────────────────────────────────────────────────────────────

VERDICT_ICON = {
    "Supported":           "[+] ",
    "Partially Supported": "[~] ",
    "Unsupported":         "[?] ",
    "Contradicted":        "[x] ",
}

COMPONENT_BAR_WIDTH = 36


def bar(value: float, width: int = COMPONENT_BAR_WIDTH) -> str:
    filled = int(value * width)
    return "#" * filled + "-" * (width - filled)


def run_tests() -> None:
    print("=" * 72)
    print("VeriGround -- Module 4: NLI + Fusion Verification Test")
    print(f"Fusion weights: alpha={ALPHA} beta={BETA} gamma={GAMMA} delta={DELTA}")
    print(
        f"Thresholds: Supported>={THRESHOLD_SUPPORTED}  "
        f"Partial>={THRESHOLD_PARTIAL_LO}  "
        f"Unsupported>={THRESHOLD_UNSUPPORTED}  "
        f"Contradict-dominance>{CONTRADICT_DOMINANCE}"
    )
    print("=" * 72)

    passed = 0
    all_results = []
    total_inference_s = 0.0

    for i, tc in enumerate(TEST_CASES, start=1):
        expected = tc["expected_verdict"]
        claim    = tc["claim"]
        evidence = tc["evidence"]
        sem_sim  = tc["sem_sim"]

        print(f"\n[Case {i}/4] Expected verdict: {expected}")
        print(f"  CLAIM    : {claim}")
        print(f"  EVIDENCE : {evidence[:100]}{'...' if len(evidence) > 100 else ''}")
        print(f"  SemSim   : {sem_sim:.4f}  (from Module 3 FAISS)")
        print()

        t_start = time.time()
        result = verify_claim_evidence(
            claim=claim,
            evidence_text=evidence,
            sem_sim=sem_sim,
            chunk_id=f"test_chunk_{i}",
            source_id=f"test_doc_{i}",
        )
        elapsed = time.time() - t_start
        total_inference_s += elapsed

        c = result["components"]
        fused = result["fused_score"]
        verdict = result["verdict"]
        icon = VERDICT_ICON.get(verdict, "?")
        ok = "PASS" if verdict == expected else f"FAIL (expected {expected})"

        # Component breakdown
        print(f"  {'Component':<18} {'Score':>7}  Visual")
        print(f"  {'-'*18}  {'-'*7}  {'-'*COMPONENT_BAR_WIDTH}")
        print(f"  {'SemSim (alpha='+str(ALPHA)+')':<18}  {c['sem_sim']:>6.4f}  {bar(c['sem_sim'])}")
        print(f"  {'P(entail) (beta='+str(BETA)+')':<18}  {c['p_entail']:>6.4f}  {bar(c['p_entail'])}")
        print(f"  {'P(neutral)':<18}  {c['p_neutral']:>6.4f}  {bar(c['p_neutral'])}")
        print(f"  {'P(contradict)(gamma)':<18}  {c['p_contradict']:>6.4f}  {bar(c['p_contradict'])}")
        print(f"  {'EntityOverlap(delta)':<18}  {c['entity_overlap']:>6.4f}  {bar(c['entity_overlap'])}")
        print()

        # Formula trace
        weighted = (
            f"  {ALPHA}*{c['sem_sim']:.4f}"
            f" + {BETA}*{c['p_entail']:.4f}"
            f" - {GAMMA}*{c['p_contradict']:.4f}"
            f" + {DELTA}*{c['entity_overlap']:.4f}"
        )
        print(f"  Fusion formula:")
        print(f"    {weighted}")
        print(f"    = {fused:.6f}")

        if c["p_contradict"] > CONTRADICT_DOMINANCE:
            print(
                f"    [!] Contradiction dominance triggered: "
                f"P(contradict)={c['p_contradict']:.4f} > {CONTRADICT_DOMINANCE}"
            )
        if c["sem_sim"] < 0.15:
            print(
                f"    [!] Off-topic gate triggered: "
                f"SemSim={c['sem_sim']:.4f} < 0.15 -> forced Unsupported"
            )

        print()
        print(f"  Verdict  : {icon} {verdict}   [{ok}]   (inference: {elapsed:.2f}s)")
        print("-" * 72)

        if verdict == expected:
            passed += 1

        all_results.append({
            "case": i,
            "expected": expected,
            "actual": verdict,
            "fused_score": fused,
            "pass": verdict == expected,
            "components": c,
            "inference_s": round(elapsed, 2),
        })

    # Summary
    print(f"\n{'='*72}")
    print(f"RESULTS: {passed}/{len(TEST_CASES)} passed  |  "
          f"Total inference time: {total_inference_s:.1f}s  |  "
          f"Avg per pair: {total_inference_s/len(TEST_CASES):.2f}s")
    print(f"{'='*72}")

    print("\nJSON summary:")
    print(json.dumps(all_results, indent=2))


if __name__ == "__main__":
    run_tests()
