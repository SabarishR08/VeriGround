"""
VeriGround — Module 5 smoke test
==================================
Runs generate_explanation() against all four verdict categories using the
same claim/evidence/component-score inputs that passed Module 4's test.

Also includes a fifth case that forces the FALLBACK path (by passing a
deliberately wrong port) so you can see both code paths in one run.

Run from the backend/ directory:
    python test_explanation_generation.py

First call to phi3:mini may take 20-30s while the model loads into RAM.
Subsequent calls within the same Ollama session are faster (~5-10s).
"""
import sys
import json
import time
from explanation_generation import generate_explanation, _fallback_explanation

# UTF-8 Output Guard for Windows powershell/cmd terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ─────────────────────────────────────────────────────────────────────────────
# The four verdict cases — identical inputs to Module 4's passing test
# ─────────────────────────────────────────────────────────────────────────────

TEST_CASES = [
    {
        "label": "Supported",
        "claim": "The Eiffel Tower was constructed in 1889 and is located in Paris, France.",
        "evidence": (
            "The Eiffel Tower was built between 1887 and 1889 and stands on the "
            "Champ de Mars in Paris, France, where it was the centerpiece of the "
            "1889 World's Fair."
        ),
        "verdict": "Supported",
        "components": {
            "sem_sim":        0.82,
            "p_entail":       0.9977,
            "p_neutral":      0.0021,
            "p_contradict":   0.0001,
            "entity_overlap": 1.0,
        },
    },
    {
        "label": "Partially Supported",
        "claim": "Exercise reduces the risk of heart disease.",
        "evidence": (
            "Regular physical exercise has been shown to improve cardiovascular "
            "health and reduce the risk of heart disease, stroke, and diabetes."
        ),
        "verdict": "Partially Supported",
        "components": {
            "sem_sim":        0.76,
            "p_entail":       0.9939,
            "p_neutral":      0.0060,
            "p_contradict":   0.0000,
            "entity_overlap": 0.0,
        },
    },
    {
        "label": "Unsupported",
        "claim": "The Amazon rainforest produces 20 percent of the world's oxygen.",
        "evidence": (
            "Water boils at 100 degrees Celsius under standard atmospheric "
            "pressure of 101.325 kPa. At higher altitudes, atmospheric pressure "
            "is lower, which causes water to boil at lower temperatures."
        ),
        "verdict": "Unsupported",
        "components": {
            "sem_sim":        0.03,
            "p_entail":       0.0002,
            "p_neutral":      0.9997,
            "p_contradict":   0.0001,
            "entity_overlap": 0.0,
        },
    },
    {
        "label": "Contradicted",
        "claim": (
            "Water always boils at exactly 100 degrees Celsius regardless of "
            "altitude; elevation has no effect on its boiling point."
        ),
        "evidence": (
            "At higher altitudes, atmospheric pressure decreases, which lowers "
            "the boiling point of water. At the summit of Mount Everest water "
            "boils at approximately 70 degrees Celsius, not 100 degrees Celsius."
        ),
        "verdict": "Contradicted",
        "components": {
            "sem_sim":        0.73,
            "p_entail":       0.0000,
            "p_neutral":      0.0001,
            "p_contradict":   0.9999,
            "entity_overlap": 1.0,
        },
    },
]

VERDICT_ICON = {
    "Supported":           "[+]",
    "Partially Supported": "[~]",
    "Unsupported":         "[?]",
    "Contradicted":        "[x]",
}


def run_tests() -> None:
    print("=" * 72)
    print("VeriGround — Module 5: Explanation Generation Test")
    print(f"Model: phi3:mini via Ollama (localhost:11434)")
    print("=" * 72)

    all_results = []
    total_time = 0.0

    # ── Cases 1-4: live Ollama calls ─────────────────────────────────────────
    for i, tc in enumerate(TEST_CASES, start=1):
        verdict = tc["verdict"]
        icon = VERDICT_ICON.get(verdict, "?")

        print(f"\n[Case {i}/4]  {icon} {verdict}")
        print(f"  Claim    : {tc['claim']}")
        print(f"  Evidence : {tc['evidence'][:80]}...")
        print(f"  Components: sem={tc['components']['sem_sim']:.2f}  "
              f"P(e)={tc['components']['p_entail']:.4f}  "
              f"P(c)={tc['components']['p_contradict']:.4f}  "
              f"ov={tc['components']['entity_overlap']:.2f}")

        t0 = time.time()
        result = generate_explanation(
            claim=tc["claim"],
            evidence=tc["evidence"],
            verdict=verdict,
            components=tc["components"],
        )
        elapsed = round(time.time() - t0, 1)
        total_time += elapsed

        src_tag = f"[{result['source'].upper()}]"
        print(f"\n  Explanation {src_tag}:")
        print(f"  \"{result['explanation']}\"")
        print(f"  (source={result['source']}  model={result['model']}"
              f"  ollama_up={result['ollama_available']}  {elapsed}s)")
        print("-" * 72)

        all_results.append({
            "case":       i,
            "verdict":    verdict,
            "source":     result["source"],
            "model":      result["model"],
            "elapsed_s":  elapsed,
            "explanation": result["explanation"],
        })

    # ── Case 5: forced fallback (template path) ───────────────────────────────
    print(f"\n[Case 5/5]  FALLBACK path (template, no Ollama call)")
    tc = TEST_CASES[0]   # reuse Supported case inputs
    fallback_text = _fallback_explanation(
        tc["claim"], tc["evidence"], tc["verdict"], tc["components"]
    )
    print(f"  Verdict   : {tc['verdict']}")
    print(f"  Fallback  : \"{fallback_text}\"")
    print("-" * 72)

    all_results.append({
        "case":        5,
        "verdict":     "Supported (fallback)",
        "source":      "fallback",
        "model":       "template",
        "elapsed_s":   0.0,
        "explanation": fallback_text,
    })

    # ── Summary ───────────────────────────────────────────────────────────────
    ollama_cases = [r for r in all_results if r["source"] == "ollama"]
    fallback_cases = [r for r in all_results if r["source"] == "fallback"]

    print(f"\n{'='*72}")
    print(f"Ollama calls: {len(ollama_cases)}/4  |  "
          f"Fallbacks: {len(fallback_cases)}  |  "
          f"Total inference time: {total_time:.1f}s  |  "
          f"Avg/call: {total_time/max(len(ollama_cases),1):.1f}s")
    print(f"{'='*72}")

    print("\nJSON summary:")
    print(json.dumps(all_results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    run_tests()
