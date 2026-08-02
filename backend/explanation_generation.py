"""
VeriGround — Module 5: Explainable AI (Explanation Generation)
==============================================================
Pipeline step 7 from Section 5 of the project plan:

  7. Explanation generation — pass claim, evidence, verdict, and component
     scores to a local Ollama qwen2:1.5b instance and return a single
     human-readable sentence justifying the verdict.

Design decisions
----------------
- Ollama is called via its HTTP REST API (POST /api/generate), not a Python
  SDK, to keep the dependency list lean and match what's already installed.
- qwen2:1.5b (934 MB, Q4_0) is used instead of phi3:mini (2.1 GB) because
  warm inference is ~5-8s vs ~29s on a Ryzen 3 CPU — a meaningful difference
  for a live demo.  Both produce accurate one-sentence explanations for this
  constrained generation task.  The model must be pulled beforehand:
  `ollama pull qwen2:1.5b` (already present on this machine).
- If Ollama is unreachable (not running, wrong port, timeout), the function
  falls back to a deterministic template-based explanation built from the
  verdict label and the dominant component score.  The route never crashes.
- Temperature 0.2 keeps outputs factual and consistent across runs.
- num_predict 100 caps the response at roughly 1-2 sentences; we trim to the
  first sentence before returning.

Separation from /api/verify-claims
-----------------------------------
Explanation generation is intentionally a separate route (/api/explain-claim)
rather than folded into /api/verify-claims.  Reasons:
  1. qwen2:1.5b inference is ~5-8s on CPU warm — coupling it to every
     verification call would still slow the verification route unnecessarily.
  2. The frontend can call /api/explain-claim only when a user explicitly
     requests an explanation (e.g. clicks an "Explain" button), keeping the
     main verification flow fast.
  3. Separation makes it trivial to swap the LLM without touching verification
     logic — change OLLAMA_MODEL and nothing else needs updating.
"""

from __future__ import annotations

import re
import socket
from typing import Any

import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
OLLAMA_URL     = "http://localhost:11434/api/generate"
OLLAMA_MODEL   = "qwen2:1.5b"
OLLAMA_TIMEOUT = 60          # seconds — qwen2:1.5b cold load on Ryzen 3 is ~20-30s
TEMPERATURE    = 0.2
NUM_PREDICT    = 60          # token cap; target ≤25 words per explanation


# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------

def _build_prompt(
    claim: str,
    evidence: str,
    verdict: str,
    components: dict[str, float],
) -> str:
    """
    Build a focused, grounded prompt for phi3:mini.

    The prompt references the actual verdict label and the single strongest
    component signal so the model's explanation is anchored in real numbers
    rather than generic hedging.
    """
    # Identify the dominant signal for the prompt context
    sem_sim      = components.get("sem_sim", 0.0)
    p_entail     = components.get("p_entail", 0.0)
    p_contradict = components.get("p_contradict", 0.0)
    ent_overlap  = components.get("entity_overlap", 0.0)

    # Describe the strongest evidence signal in plain language
    if verdict == "Supported":
        signal_desc = (
            f"high semantic similarity ({sem_sim:.2f}) and "
            f"strong entailment probability ({p_entail:.2f})"
        )
    elif verdict == "Partially Supported":
        signal_desc = (
            f"moderate semantic similarity ({sem_sim:.2f}) but "
            f"incomplete entity overlap ({ent_overlap:.2f}), "
            f"so only part of the claim is confirmed"
        )
    elif verdict == "Contradicted":
        signal_desc = (
            f"high contradiction probability ({p_contradict:.2f}) from the "
            f"NLI model, despite semantic similarity ({sem_sim:.2f})"
        )
    else:  # Unsupported
        signal_desc = (
            f"very low semantic similarity ({sem_sim:.2f}) — "
            f"the evidence is unrelated to the claim"
        )

    # Keep the evidence snippet short — phi3:mini context is plenty large but
    # shorter prompts produce more focused one-sentence answers
    evidence_snippet = evidence[:300].rstrip()
    if len(evidence) > 300:
        evidence_snippet += "..."

    prompt = (
        f"You are a fact-verification assistant. "
        f"A claim has been verified against evidence and given this verdict: {verdict}.\n\n"
        f"Claim: {claim}\n"
        f"Evidence: {evidence_snippet}\n"
        f"Key signal: {signal_desc}\n\n"
        f"Write ONE short sentence (under 25 words) explaining why this verdict was assigned. "
        f"Reference the claim and evidence content. "
        f"Do not start with 'The verdict' or repeat the label word."
    )
    return prompt


# ---------------------------------------------------------------------------
# Templated fallback
# ---------------------------------------------------------------------------

def _fallback_explanation(
    claim: str,
    evidence: str,
    verdict: str,
    components: dict[str, float],
) -> str:
    """
    Return a deterministic template-based explanation when Ollama is
    unreachable.  Grounded in actual component scores so it's not generic.
    """
    sem_sim      = components.get("sem_sim", 0.0)
    p_entail     = components.get("p_entail", 0.0)
    p_contradict = components.get("p_contradict", 0.0)
    ent_overlap  = components.get("entity_overlap", 0.0)

    templates: dict[str, str] = {
        "Supported": (
            f"The evidence directly supports this claim, with a semantic "
            f"similarity of {sem_sim:.2f} and entailment probability of "
            f"{p_entail:.2f}, confirming the stated facts."
        ),
        "Partially Supported": (
            f"The evidence is related to this claim (semantic similarity "
            f"{sem_sim:.2f}) but only partially confirms it — entity overlap "
            f"is {ent_overlap:.2f}, suggesting not all claim details appear "
            f"in the retrieved passage."
        ),
        "Unsupported": (
            f"No supporting evidence was found for this claim: semantic "
            f"similarity with the retrieved passage is only {sem_sim:.2f}, "
            f"and the NLI model assigns negligible entailment probability "
            f"({p_entail:.2f})."
        ),
        "Contradicted": (
            f"The evidence directly contradicts this claim: the NLI model "
            f"assigns a contradiction probability of {p_contradict:.2f}, "
            f"indicating the retrieved passage states the opposite of what "
            f"the claim asserts."
        ),
    }
    return templates.get(
        verdict,
        f"Verdict '{verdict}' assigned based on fusion score from semantic "
        f"similarity ({sem_sim:.2f}), entailment ({p_entail:.2f}), and "
        f"entity overlap ({ent_overlap:.2f}).",
    )


# ---------------------------------------------------------------------------
# Ollama availability check
# ---------------------------------------------------------------------------

def _ollama_is_reachable() -> bool:
    """Fast TCP-level check — avoids a full HTTP round-trip for the probe."""
    try:
        with socket.create_connection(("localhost", 11434), timeout=2):
            return True
    except OSError:
        return False


# ---------------------------------------------------------------------------
# Main public function
# ---------------------------------------------------------------------------

def generate_explanation(
    claim: str,
    evidence: str,
    verdict: str,
    components: dict[str, float],
    model: str = OLLAMA_MODEL,
) -> dict[str, Any]:
    """
    Generate a one-sentence human-readable explanation for a verdict.

    Parameters
    ----------
    claim      : The atomic factual claim that was verified.
    evidence   : The best evidence chunk text from Module 3.
    verdict    : One of Supported / Partially Supported / Unsupported /
                 Contradicted — from Module 4.
    components : Component score dict from Module 4:
                 {sem_sim, p_entail, p_neutral, p_contradict, entity_overlap}
    model      : Ollama model name (default: phi3:mini).

    Returns
    -------
    {
        "explanation": str,        # the one-sentence justification
        "source":      str,        # "ollama" or "fallback"
        "model":       str,        # model name used (or "template")
        "ollama_available": bool,  # whether Ollama was reachable
    }
    """
    if not _ollama_is_reachable():
        return {
            "explanation":      _fallback_explanation(claim, evidence, verdict, components),
            "source":           "fallback",
            "model":            "template",
            "ollama_available": False,
        }

    prompt = _build_prompt(claim, evidence, verdict, components)

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model":  model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": TEMPERATURE,
                    "num_predict": NUM_PREDICT,
                },
            },
            timeout=OLLAMA_TIMEOUT,
        )
        response.raise_for_status()
        raw_text: str = response.json().get("response", "").strip()

        # Trim to first sentence — the model sometimes uses semicolons or
        # continues past the first sentence boundary despite prompt instructions.
        # Split on: period/exclamation/question followed by whitespace or EOL,
        # OR a semicolon that joins two independent clauses (common in phi3).
        raw_clean = raw_text.rstrip()

        # Primary split: sentence-ending punctuation
        first_sentence = re.split(r"(?<=[.!?])\s", raw_clean)[0].strip()

        # Secondary: if the result still contains a semicolon joining two
        # complete clauses, keep only the first clause
        if ";" in first_sentence:
            first_sentence = first_sentence.split(";")[0].strip()
            # Re-capitalise first letter if needed (split may cut mid-sentence)
            if first_sentence and not first_sentence[0].isupper():
                first_sentence = first_sentence[0].upper() + first_sentence[1:]

        # Ensure it ends with a period
        if first_sentence and first_sentence[-1] not in ".!?":
            first_sentence += "."

        explanation = first_sentence if first_sentence else raw_clean

        return {
            "explanation":      explanation,
            "source":           "ollama",
            "model":            model,
            "ollama_available": True,
        }

    except requests.exceptions.Timeout:
        fallback = _fallback_explanation(claim, evidence, verdict, components)
        return {
            "explanation":      fallback,
            "source":           "fallback",
            "model":            "template",
            "ollama_available": True,   # reachable but timed out
            "error":            "Ollama request timed out",
        }
    except Exception as exc:
        fallback = _fallback_explanation(claim, evidence, verdict, components)
        return {
            "explanation":      fallback,
            "source":           "fallback",
            "model":            "template",
            "ollama_available": True,
            "error":            str(exc),
        }
