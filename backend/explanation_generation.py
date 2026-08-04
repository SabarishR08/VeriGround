"""
VeriGround — Module 5: Explainable AI (Explanation Generation)
==============================================================
Pipeline step 7 from Section 5 of the project plan:

  7. Explanation generation — pass claim, evidence, verdict, and component
     scores to a local Ollama phi3:mini instance and return a single
     human-readable sentence justifying the verdict.

Design decisions
----------------
- Ollama is called via its HTTP REST API (POST /api/generate), not a Python
  SDK, to keep the dependency list lean and match what's already installed.
- phi3:mini is specified by name; the model must be pulled locally beforehand
  (`ollama pull phi3:mini`).  It is already present on this machine.
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
  1. phi3:mini inference takes ~5-25s on CPU — coupling it to every
     verification call would make the verification route unusably slow.
  2. The frontend can call /api/explain-claim only when a user explicitly
     requests an explanation (e.g. clicks an "Explain" button), keeping the
     main verification flow fast.
  3. Separation makes it easy to swap the LLM (phi3:mini → gemma:2b or any
     other Ollama model) without touching the verification logic.
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
OLLAMA_MODEL   = "phi3:mini"
OLLAMA_TIMEOUT = 120         # seconds — cold model load on Ryzen 3 takes ~60-90s
TEMPERATURE    = 0.2
NUM_PREDICT    = 100         # token cap; one clear sentence is ~25-40 tokens


# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------

def _build_prompt(
    claim: str,
    evidence: str,
    verdict: str,
    components: dict[str, float] | None,
) -> str:
    """
    Build a focused, grounded prompt for phi3:mini.

    The prompt references the actual verdict label and the single strongest
    component signal so the model's explanation is anchored in real numbers
    rather than generic hedging.
    """
    components = components or {}
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
            f"low semantic similarity ({sem_sim:.2f}) between the claim and "
            f"the retrieved evidence, with no entailment signal"
        )

    # Keep the evidence snippet short — phi3:mini context is plenty large but
    # shorter prompts produce more focused one-sentence answers
    evidence_snippet = evidence[:300].rstrip()
    if len(evidence) > 300:
        evidence_snippet += "..."

    prompt = (
        f"You are a fact-verification assistant. "
        f"A claim has been verified against a retrieved evidence chunk and "
        f"assigned the verdict: {verdict}.\n\n"
        f"Claim: {claim}\n"
        f"Evidence: {evidence_snippet}\n"
        f"Verdict: {verdict}\n"
        f"Key signal: {signal_desc}\n\n"
        f"Write exactly one concise sentence explaining why this verdict was "
        f"assigned, referencing both the claim content and the evidence. "
        f"Do not start with 'The verdict is' or repeat the verdict label."
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
    Return a context-aware natural language explanation referencing the actual
    claim and retrieved evidence passage content.
    """
    claim_clean = claim.strip().rstrip(".")
    evidence_clean = evidence.strip()

    # Extract clean evidence snippet if available
    snippet = ""
    if evidence_clean:
        if len(evidence_clean) > 160:
            snippet = evidence_clean[:157].rstrip() + "..."
        else:
            snippet = evidence_clean.rstrip(".")

    if verdict == "Supported":
        if snippet:
            return f"The reference evidence explicitly confirms this claim, stating: \"{snippet}\"."
        elif claim_clean:
            formatted_claim = claim_clean[0].lower() + claim_clean[1:] if len(claim_clean) > 1 else claim_clean
            return f"The ground truth knowledge base directly validates that {formatted_claim}."
        else:
            return "The retrieved reference evidence directly validates and supports the stated facts."

    elif verdict == "Partially Supported":
        if snippet:
            return f"The evidence passage (\"{snippet}\") is semantically related, but only partially substantiates the specific details in the claim."
        else:
            return "The retrieved source supports the general topic, but lacks complete entity overlap to verify all details in the claim."

    elif verdict == "Contradicted":
        if snippet:
            return f"The retrieved ground truth directly contradicts the claim, asserting: \"{snippet}\"."
        else:
            return "The NLI cross-encoder model identified an explicit contradiction between the claim and the reference text."

    else:  # Unsupported
        if snippet:
            return f"The retrieved passage (\"{snippet}\") does not contain sufficient factual evidence to ground this claim."
        else:
            return "No factual evidence was found in the ground truth corpus to substantiate the assertion."



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
