"""
VeriGround — Module 4: Claim-Evidence NLI + Fusion Verification
================================================================
Pipeline steps 3-6 from Section 5 of the project plan:

  3. NLI scoring      — cross-encoder/nli-deberta-v3-base → P(entail/neutral/contradict)
  4. Entity overlap   — spaCy en_core_web_sm named-entity/date/number set intersection
  5. Fusion score     — α·SemSim + β·P(entail) − γ·P(contradict) + δ·EntityOverlap
  6. Four-way verdict — Supported / Partially Supported / Unsupported / Contradicted

The NLI model and spaCy pipeline are loaded once at module import time.

Model interface note
---------------------
We use AutoModelForSequenceClassification + AutoTokenizer directly with
cross-encoder/nli-deberta-v3-base.  The model expects (evidence, claim) as a
premise/hypothesis pair and returns logits for (contradiction, entailment, neutral).
We do NOT use the zero-shot-classification pipeline — that interface is designed
for label-set classification, not raw NLI premise/hypothesis scoring.
"""

from __future__ import annotations

import os
import re
import time
from typing import Any

import spacy
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

# ---------------------------------------------------------------------------
# Silence the symlink warning on Windows (cosmetic only, caching still works)
# ---------------------------------------------------------------------------
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

# ---------------------------------------------------------------------------
# Fusion weights — Section 5.2 of the project plan
# ---------------------------------------------------------------------------
ALPHA = 0.25   # semantic similarity weight
BETA  = 0.45   # P(entailment) weight
GAMMA = 0.35   # P(contradiction) weight  (subtracted)
DELTA = 0.15   # entity-overlap weight

# ---------------------------------------------------------------------------
# Four-way verdict thresholds — Section 5.3
# A high P(contradict) can override the fused score into "Contradicted" even
# when the score might otherwise sit in the Partially Supported band.
# ---------------------------------------------------------------------------
THRESHOLD_SUPPORTED   = 0.70
THRESHOLD_PARTIAL_LO  = 0.40
THRESHOLD_UNSUPPORTED = 0.10
CONTRADICT_DOMINANCE  = 0.60   # P(contradict) > this → force "Contradicted"

# ---------------------------------------------------------------------------
# NLI model — loaded once at import time
# ---------------------------------------------------------------------------
_NLI_MODEL_NAME = "cross-encoder/nli-deberta-v3-base"

print(f"[nli_verification] Loading NLI model: {_NLI_MODEL_NAME} ...", flush=True)
_t0 = time.time()

_nli_tokenizer = AutoTokenizer.from_pretrained(_NLI_MODEL_NAME)
_nli_model = AutoModelForSequenceClassification.from_pretrained(_NLI_MODEL_NAME)
_nli_model.eval()  # inference mode — no gradient tracking needed

# Map integer label ids → human-readable names.
# cross-encoder/nli-deberta-v3-base uses id2label: {0: contradiction, 1: entailment, 2: neutral}
_ID2LABEL: dict[int, str] = {
    int(k): v.lower()
    for k, v in _nli_model.config.id2label.items()
}

print(
    f"[nli_verification] NLI model ready in {time.time() - _t0:.1f}s  "
    f"| labels: {_ID2LABEL}",
    flush=True,
)

# ---------------------------------------------------------------------------
# spaCy pipeline — loaded once at import time
# ---------------------------------------------------------------------------
_nlp = spacy.load("en_core_web_sm")


# ---------------------------------------------------------------------------
# 1. NLI scoring
# ---------------------------------------------------------------------------

def get_nli_scores(claim: str, evidence: str) -> dict[str, float]:
    """
    Run the claim/evidence pair through cross-encoder/nli-deberta-v3-base.

    The model is a cross-encoder: it ingests the concatenated
    [CLS] premise [SEP] hypothesis [SEP] sequence and outputs raw logits
    for (contradiction, entailment, neutral).

    Returns:
        {
            "entailment":    float in [0, 1],
            "neutral":       float in [0, 1],
            "contradiction": float in [0, 1]
        }
    Scores sum to 1.0 (softmax over the three classes).
    """
    # NLI framing: evidence is the PREMISE (the grounding text),
    # claim is the HYPOTHESIS (the thing being verified).
    # Order matters — the cross-encoder is not symmetric.
    inputs = _nli_tokenizer(
        evidence,   # premise
        claim,      # hypothesis
        return_tensors="pt",
        truncation=True,
        max_length=512,
        padding=True,
    )

    with torch.no_grad():
        logits = _nli_model(**inputs).logits  # shape (1, 3)

    probs = torch.softmax(logits, dim=-1)[0]  # shape (3,)

    scores: dict[str, float] = {}
    for idx, prob in enumerate(probs.tolist()):
        label = _ID2LABEL.get(idx, f"label_{idx}")
        scores[label] = round(prob, 6)

    # Guarantee all three keys exist even if the model's id2label is unusual
    for key in ("entailment", "neutral", "contradiction"):
        scores.setdefault(key, 0.0)

    return scores


# ---------------------------------------------------------------------------
# 2. Entity overlap scoring
# ---------------------------------------------------------------------------

def _extract_entity_tokens(text: str) -> set[str]:
    """
    Return a lower-cased set of named entities, dates, and numeric tokens
    from *text* using spaCy en_core_web_sm.

    We also add bare numeric tokens (digits) that spaCy may not wrap in
    a named entity, so years/measurements in the claim are never missed.
    """
    doc = _nlp(text)
    tokens: set[str] = set()

    # spaCy named entities (ORG, PERSON, GPE, LOC, DATE, CARDINAL, …)
    for ent in doc.ents:
        tokens.add(ent.text.lower().strip())

    # Raw numeric tokens not already captured as entities
    for token in doc:
        if token.like_num or re.fullmatch(r"\d[\d,\.]*", token.text):
            tokens.add(token.text.lower().strip())

    return tokens


def get_entity_overlap(claim: str, evidence: str) -> float:
    """
    Compute |entities(claim) ∩ entities(evidence)| / |entities(claim)|.

    Returns 0.0 if the claim has no extractable entities (avoids divide-by-zero).
    The score is in [0, 1].
    """
    claim_ents = _extract_entity_tokens(claim)
    if not claim_ents:
        return 0.0

    evidence_ents = _extract_entity_tokens(evidence)
    overlap = claim_ents & evidence_ents
    return round(len(overlap) / len(claim_ents), 6)


# ---------------------------------------------------------------------------
# 3. Fusion score  (Section 5.2)
# ---------------------------------------------------------------------------

def fuse_score(
    sem_sim: float,
    p_entail: float,
    p_contradict: float,
    entity_overlap: float,
) -> float:
    """
    Weighted Evidence-Fusion formula from the project plan Section 5.2:

        score = α·SemSim + β·P(entail) − γ·P(contradict) + δ·EntityOverlap

    Clipped to [0, 1].
    """
    raw = (
        ALPHA * sem_sim
        + BETA  * p_entail
        - GAMMA * p_contradict
        + DELTA * entity_overlap
    )
    return round(max(0.0, min(1.0, raw)), 6)


# ---------------------------------------------------------------------------
# 4. Four-way verdict  (Section 5.3)
# ---------------------------------------------------------------------------

def classify_verdict(fused_score: float, p_contradict: float, sem_sim: float = 1.0) -> str:
    """
    Map the fused score (and raw contradiction probability) to one of:
        "Supported"           fused_score >= 0.70
        "Partially Supported" 0.40 <= fused_score < 0.70
        "Unsupported"         0.10 <= fused_score < 0.40
        "Contradicted"        fused_score < 0.10  OR  p_contradict > 0.60

    The p_contradict dominance check is the novel piece: a claim can score
    moderately on the fused metric (because sem_sim is decent) yet still
    be "Contradicted" if the NLI model is highly confident in contradiction.

    Semantic similarity gate: when sem_sim < 0.15 the claim and evidence are
    about completely different topics.  NLI contradiction on off-topic pairs
    is a technical artifact, not a real contradiction — force "Unsupported"
    in that case regardless of other signals.
    """
    # Off-topic gate: unrelated documents cannot truly contradict
    if sem_sim < 0.15:
        return "Unsupported"

    # Contradiction dominance overrides fused score for on-topic pairs
    if p_contradict > CONTRADICT_DOMINANCE:
        return "Contradicted"

    if fused_score >= THRESHOLD_SUPPORTED:
        return "Supported"
    if fused_score >= THRESHOLD_PARTIAL_LO:
        return "Partially Supported"
    if fused_score >= THRESHOLD_UNSUPPORTED:
        return "Unsupported"
    return "Contradicted"


# ---------------------------------------------------------------------------
# 5. Per-pair verification entry point
# ---------------------------------------------------------------------------

def verify_claim_evidence(
    claim: str,
    evidence_text: str,
    sem_sim: float,
    chunk_id: str = "",
    source_id: str = "",
) -> dict[str, Any]:
    """
    Run the full Module 4 pipeline for a single claim/evidence pair.

    Parameters
    ----------
    claim         : The atomic factual claim.
    evidence_text : The retrieved evidence chunk text.
    sem_sim       : Cosine similarity score from Module 3 (FAISS).
    chunk_id      : Optional chunk identifier for provenance.
    source_id     : Optional source document identifier.

    Returns
    -------
    {
        "claim":           str,
        "chunk_id":        str,
        "source_id":       str,
        "verdict":         "Supported" | "Partially Supported" |
                           "Unsupported" | "Contradicted",
        "fused_score":     float,
        "components": {
            "sem_sim":        float,
            "p_entail":       float,
            "p_neutral":      float,
            "p_contradict":   float,
            "entity_overlap": float,
        }
    }
    """
    nli = get_nli_scores(claim, evidence_text)
    p_entail    = nli["entailment"]
    p_neutral   = nli["neutral"]
    p_contradict = nli["contradiction"]

    entity_overlap = get_entity_overlap(claim, evidence_text)

    score = fuse_score(sem_sim, p_entail, p_contradict, entity_overlap)
    verdict = classify_verdict(score, p_contradict, sem_sim=sem_sim)

    return {
        "claim":       claim,
        "chunk_id":    chunk_id,
        "source_id":   source_id,
        "verdict":     verdict,
        "fused_score": score,
        "components": {
            "sem_sim":        round(sem_sim, 6),
            "p_entail":       p_entail,
            "p_neutral":      p_neutral,
            "p_contradict":   p_contradict,
            "entity_overlap": entity_overlap,
        },
    }


def verify_claim_against_evidence_list(
    claim: str,
    evidence_list: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Run verify_claim_evidence() over every evidence chunk returned by
    Module 3 and select the result with the highest fused_score as the
    claim's final verdict.

    *evidence_list* is the "evidence" array from /api/retrieve-evidence:
        [{"rank":1, "chunk_id":…, "source_id":…, "text":…,
          "similarity_score":…}, …]

    Returns the best-scoring result dict, augmented with:
        "all_evidence_scores": [ {chunk_id, fused_score, verdict}, … ]
    """
    if not evidence_list:
        return {
            "claim":       claim,
            "chunk_id":    "",
            "source_id":   "",
            "verdict":     "Unsupported",
            "fused_score": 0.0,
            "components":  {
                "sem_sim": 0.0, "p_entail": 0.0, "p_neutral": 0.0,
                "p_contradict": 0.0, "entity_overlap": 0.0,
            },
            "all_evidence_scores": [],
        }

    results = []
    for ev in evidence_list:
        res = verify_claim_evidence(
            claim=claim,
            evidence_text=ev.get("text", ""),
            sem_sim=ev.get("similarity_score", 0.0),
            chunk_id=ev.get("chunk_id", ""),
            source_id=ev.get("source_id", ""),
        )
        results.append(res)

    best = max(results, key=lambda r: r["fused_score"])
    best["all_evidence_scores"] = [
        {
            "chunk_id":    r["chunk_id"],
            "fused_score": r["fused_score"],
            "verdict":     r["verdict"],
        }
        for r in results
    ]
    return best
