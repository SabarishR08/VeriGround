"""
VeriGround — Module 3: Evidence Retrieval
==========================================
Pipeline step 2 from Section 5 of the project plan:
  - Embed claims and evidence chunks with all-MiniLM-L6-v2
  - Build an in-process FAISS flat index (cosine similarity via normalized
    inner product)
  - Retrieve the top-k evidence chunks per claim, returning similarity scores
    and source document ids

The embedding model is loaded once at import time to avoid per-call overhead.
All computation is CPU-only; no GPU dependencies.
"""

from __future__ import annotations

import re
from typing import Any

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------------------------
# Retrieval configuration
# ---------------------------------------------------------------------------
_MODEL_NAME = "all-MiniLM-L6-v2"
_RERANKER_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"
_MAX_CHUNK_WORDS = 50
_CHUNK_OVERLAP_SENTENCES = 1
_RERANK_CANDIDATES = 50
_RETRIEVAL_CONFIDENCE_THRESHOLD = 0.15  # gate below which we retry or reject

_STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "if", "in", "on", "at", "by", "for",
    "with", "about", "against", "between", "into", "through", "during", "before",
    "after", "above", "below", "to", "from", "up", "down", "of", "off", "over",
    "under", "again", "further", "then", "once", "here", "there", "when", "where",
    "why", "how", "is", "are", "was", "were", "be", "been", "being", "have",
    "has", "had", "do", "does", "did", "will", "would", "should", "can", "could",
    "may", "might", "must", "shall", "not", "than", "also",
}

# ---------------------------------------------------------------------------
# Model — loaded once at module import time
# ---------------------------------------------------------------------------
_model: SentenceTransformer = SentenceTransformer(_MODEL_NAME)
_reranker = None


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

def _load_reranker():
    global _reranker
    if _reranker is not None:
        return _reranker

    try:
        from sentence_transformers import CrossEncoder
        _reranker = CrossEncoder(_RERANKER_NAME)
    except Exception:
        _reranker = None
    return _reranker


def _split_into_sentences(text: str) -> list[str]:
    text = text.replace('\r\n', ' ').replace('\n', ' ').strip()
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
    return sentences or [text] if text else []


def _tokenize_text(text: str) -> set[str]:
    tokens = {t for t in re.findall(r"\b\w+\b", text.lower()) if t not in _STOPWORDS}
    return tokens


def _lexical_top_chunks(claim: str, chunks: list[dict[str, str]], topk: int = 20) -> list[dict[str, Any]]:
    claim_tokens = _tokenize_text(claim)
    if not claim_tokens:
        return []

    scores = []
    for chunk in chunks:
        chunk_tokens = _tokenize_text(chunk["text"])
        if not chunk_tokens:
            continue

        overlap = claim_tokens & chunk_tokens
        score = len(overlap) / max(len(claim_tokens), 1)
        if score <= 0:
            continue
        scores.append((score, chunk))

    scores.sort(key=lambda item: item[0], reverse=True)
    return [chunk for _, chunk in scores[:topk]]


# Lightweight BM25 implementation for lexical scoring without extra deps
def _bm25_scores_for_chunks(claim: str, chunks: list[dict[str, str]]) -> dict[str, float]:
    """
    Compute BM25-like scores of *claim* against each chunk text.
    Returns a mapping chunk_id -> bm25_score in [0, ~].

    This is a minimal implementation (no external dependency) tuned for
    short texts and retrieval re-ranking.
    """
    # Parameters tuned for short chunks
    k1 = 1.5
    b = 0.75

    claim_tokens = [t for t in re.findall(r"\b\w+\b", claim.lower()) if t not in _STOPWORDS]
    if not claim_tokens:
        return {}

    # document frequencies
    df: dict[str, int] = {}
    doc_freqs: dict[str, dict[str, int]] = {}
    lens: list[int] = []
    for c in chunks:
        tokens = [t for t in re.findall(r"\b\w+\b", c["text"].lower()) if t not in _STOPWORDS]
        freqs: dict[str, int] = {}
        for t in set(tokens):
            freqs[t] = tokens.count(t)
        doc_freqs[c["chunk_id"]] = freqs
        for t in freqs.keys():
            df[t] = df.get(t, 0) + 1
        lens.append(len(tokens))

    avgdl = sum(lens) / max(len(lens), 1)
    N = max(len(chunks), 1)

    scores: dict[str, float] = {}
    for c in chunks:
        score = 0.0
        freqs = doc_freqs.get(c["chunk_id"], {})
        dl = sum(freqs.values()) or 1
        for term in claim_tokens:
            if term not in freqs:
                continue
            # idf with smoothing
            idf = max(0.0, (N - df.get(term, 0) + 0.5) / (df.get(term, 0) + 0.5))
            idf = np.log(1 + idf)
            f = freqs.get(term, 0)
            denom = f + k1 * (1 - b + b * (dl / avgdl))
            score += idf * ((f * (k1 + 1)) / denom)
        scores[c["chunk_id"]] = round(float(score), 6)

    return scores


def _bm25_top_chunks(claim: str, chunks: list[dict[str, str]], topk: int = 20) -> list[dict[str, Any]]:
    bm25 = _bm25_scores_for_chunks(claim, chunks)
    scored = []
    for c in chunks:
        s = bm25.get(c["chunk_id"], 0.0)
        if s > 0:
            scored.append((s, c))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored[:topk]]


def embed_texts(texts: list[str]) -> np.ndarray:
    """
    Embed a list of strings with all-MiniLM-L6-v2 and return an
    (N, D) float32 numpy array of L2-normalised vectors.

    Normalising before storing in IndexFlatIP turns inner-product search into
    cosine-similarity search without any extra overhead.
    """
    if not texts:
        return np.empty((0, 384), dtype=np.float32)

    vecs: np.ndarray = _model.encode(
        texts,
        convert_to_numpy=True,
        normalize_embeddings=True,  # L2-normalise so IP == cosine
        batch_size=32,
        show_progress_bar=False,
    ).astype(np.float32)
    return vecs


def chunk_document(text: str, doc_id: str) -> list[dict[str, str]]:
    """
    Split a plain-text document into smaller, sentence-aware chunks.

    Returns a list of dicts:
        [{"chunk_id": "<doc_id>_<n>", "source_id": "<doc_id>", "text": "..."}, ...]

    This improves retrieval quality by keeping chunks short and focused,
    which helps downstream NLI and reranking to identify the exact fact.
    """
    sentences = _split_into_sentences(text)
    chunks: list[dict[str, str]] = []
    current_chunk: list[str] = []
    current_words = 0
    idx = 0

    def flush_chunk():
        nonlocal idx, current_chunk, current_words
        chunk_text = " ".join(current_chunk).strip()
        if chunk_text:
            chunks.append(
                {
                    "chunk_id": f"{doc_id}_{idx}",
                    "source_id": doc_id,
                    "text": chunk_text,
                }
            )
            idx += 1
        current_chunk = []
        current_words = 0

    for sentence in sentences:
        words = sentence.split()
        if not words:
            continue

        if current_chunk and current_words + len(words) > _MAX_CHUNK_WORDS:
            overlap = current_chunk[-_CHUNK_OVERLAP_SENTENCES:] if _CHUNK_OVERLAP_SENTENCES > 0 else []
            flush_chunk()
            current_chunk = overlap.copy()
            current_words = sum(len(s.split()) for s in current_chunk)

        current_chunk.append(sentence)
        current_words += len(words)

        if len(current_chunk) == 1 and current_words > _MAX_CHUNK_WORDS:
            flush_chunk()

    if current_chunk:
        flush_chunk()

    if not chunks and text.strip():
        chunks.append(
            {
                "chunk_id": f"{doc_id}_0",
                "source_id": doc_id,
                "text": text.strip(),
            }
        )

    return chunks


def build_faiss_index(
    source_documents: list[dict[str, str]],
) -> tuple[faiss.IndexFlatIP, list[dict[str, str]]]:
    """
    Accept a list of source-document dicts:
        [{"id": "<doc_id>", "text": "<full document text>"}, ...]

    1. Chunk each document into short, sentence-aware spans.
    2. Embed all chunks.
    3. Build an in-process FAISS IndexFlatIP (exact cosine search on
       L2-normalised vectors; best choice for CPU at prototype scale).

    Returns:
        index   — the populated FAISS index
        chunks  — ordered list of chunk dicts (same order as index rows)
    """
    all_chunks: list[dict[str, str]] = []
    for doc in source_documents:
        doc_id = doc.get("id", "doc")
        doc_text = doc.get("text", "")
        all_chunks.extend(chunk_document(doc_text, doc_id))

    if not all_chunks:
        # Return an empty index so callers don't crash
        index = faiss.IndexFlatIP(384)
        return index, []

    texts = [c["text"] for c in all_chunks]
    vecs = embed_texts(texts)  # (N, 384), already normalised

    dimension = vecs.shape[1]
    index = faiss.IndexFlatIP(dimension)
    index.add(vecs)

    return index, all_chunks


def select_most_similar_sentence(claim: str, text: str) -> tuple[str, float]:
    """
    Split *text* into sentences and return the single sentence most
    semantically similar to *claim*, plus the cosine similarity score.

    Returns (best_sentence, similarity) where similarity is in [0,1].
    If text is empty, returns ("", 0.0).
    """
    sentences = _split_into_sentences(text)
    if not sentences:
        return "", 0.0

    # Embed claim and sentences together to compute cosine similarity
    texts = [claim] + sentences
    vecs = embed_texts(texts)  # (1 + N, D)
    if vecs.shape[0] <= 1:
        return sentences[0], 0.0

    q = vecs[0:1]
    sents = vecs[1:]
    # cosine similarity == dot product because embeddings are L2-normalised
    sims = (sents @ q.T).reshape(-1)
    best_idx = int(np.argmax(sims))
    best_sim = float(sims[best_idx])
    return sentences[best_idx], round(best_sim, 6)


def retrieve_evidence(
    claim: str,
    index: faiss.IndexFlatIP,
    chunks: list[dict[str, str]],
    k: int = 3,
) -> list[dict[str, Any]]:
    """
    Embed *claim*, search *index* for the most relevant evidence chunks,
    optionally reranking top candidates with a cross-encoder.

    Returns a ranked list of evidence dicts.
    """
    if index.ntotal == 0 or not chunks:
        return []

    query_vec = embed_texts([claim])  # (1, 384)

    # Retrieve a larger set of candidate chunks for reranking if possible.
    k_search = min(max(k * 4, _RERANK_CANDIDATES), index.ntotal)
    similarities, indices = index.search(query_vec, k_search)

    candidates: list[dict[str, Any]] = []
    seen_chunk_ids = set()
    for idx, sim in zip(indices[0], similarities[0]):
        if idx == -1:
            continue
        chunk = chunks[idx]
        seen_chunk_ids.add(chunk["chunk_id"])
        candidates.append(
            {
                "chunk_id": chunk["chunk_id"],
                "source_id": chunk["source_id"],
                "text": chunk["text"],
                "similarity_score": round(float(sim), 6),
            }
        )

    # Add lexical and BM25 candidates to increase robustness
    lexical_candidates = _lexical_top_chunks(claim, chunks, topk=_RERANK_CANDIDATES)
    for chunk in lexical_candidates:
        if chunk["chunk_id"] in seen_chunk_ids:
            continue
        seen_chunk_ids.add(chunk["chunk_id"])
        candidates.append(
            {
                "chunk_id": chunk["chunk_id"],
                "source_id": chunk["source_id"],
                "text": chunk["text"],
                "similarity_score": 0.0,
                "lexical_score": round(len(_tokenize_text(claim) & _tokenize_text(chunk["text"])) / max(len(_tokenize_text(claim)), 1), 6),
            }
        )

    bm25_candidates = _bm25_top_chunks(claim, chunks, topk=_RERANK_CANDIDATES)
    bm25_map = _bm25_scores_for_chunks(claim, chunks)
    for chunk in bm25_candidates:
        if chunk["chunk_id"] in seen_chunk_ids:
            continue
        seen_chunk_ids.add(chunk["chunk_id"])
        candidates.append(
            {
                "chunk_id": chunk["chunk_id"],
                "source_id": chunk["source_id"],
                "text": chunk["text"],
                "similarity_score": 0.0,
                "bm25_score": bm25_map.get(chunk["chunk_id"], 0.0),
            }
        )

    reranker = _load_reranker()
    if reranker is not None and len(candidates) > 1:
        try:
            pairs = [[claim, c["text"]] for c in candidates]
            scores = reranker.predict(pairs, show_progress_bar=False)
            for candidate, score in zip(candidates, scores):
                candidate["rerank_score"] = round(float(score), 6)
            candidates.sort(key=lambda item: item["rerank_score"], reverse=True)
        except Exception:
            pass
    else:
        # Fallback hybrid ordering using semantic similarity, BM25 and lexical overlap.
        claim_tokens = _tokenize_text(claim)
        for candidate in candidates:
            chunk_tokens = _tokenize_text(candidate["text"])
            lexical_overlap = len(claim_tokens & chunk_tokens) / max(len(claim_tokens), 1)
            bm25 = candidate.get("bm25_score", 0.0)
            candidate["hybrid_score"] = round(
                0.6 * candidate.get("similarity_score", 0.0) + 0.3 * bm25 + 0.1 * lexical_overlap,
                6,
            )
        candidates.sort(key=lambda item: item.get("hybrid_score", item.get("similarity_score", 0.0)), reverse=True)

    # Extract the single best sentence from each top candidate to improve NLI input
    for candidate in candidates:
        try:
            best_sent, best_sent_sim = select_most_similar_sentence(claim, candidate["text"])
            candidate["best_sentence"] = best_sent
            candidate["best_sentence_sim"] = round(float(best_sent_sim), 6)
        except Exception:
            candidate["best_sentence"] = ""
            candidate["best_sentence_sim"] = 0.0

    # Retrieval confidence gate: if top candidate is weak, try a larger search or bail out
    if candidates:
        top = candidates[0]
        if (
            top.get("similarity_score", 0.0) < _RETRIEVAL_CONFIDENCE_THRESHOLD
            and top.get("best_sentence_sim", 0.0) < _RETRIEVAL_CONFIDENCE_THRESHOLD
        ):
            # Retry with a wider search window
            k_search2 = min(index.ntotal, max(k * 10, _RERANK_CANDIDATES))
            similarities2, indices2 = index.search(query_vec, k_search2)
            fallback_candidates: list[dict[str, Any]] = []
            seen = set()
            for idx, sim in zip(indices2[0], similarities2[0]):
                if idx == -1:
                    continue
                c = chunks[idx]
                if c["chunk_id"] in seen:
                    continue
                seen.add(c["chunk_id"])
                fallback_candidates.append({
                    "chunk_id": c["chunk_id"],
                    "source_id": c["source_id"],
                    "text": c["text"],
                    "similarity_score": round(float(sim), 6),
                })

            # Merge BM25/lexical into fallback as well
            lex2 = _lexical_top_chunks(claim, chunks, topk=_RERANK_CANDIDATES)
            for c in lex2:
                if c["chunk_id"] in seen:
                    continue
                seen.add(c["chunk_id"])
                fallback_candidates.append({
                    "chunk_id": c["chunk_id"],
                    "source_id": c["source_id"],
                    "text": c["text"],
                    "similarity_score": 0.0,
                    "lexical_score": round(len(_tokenize_text(claim) & _tokenize_text(c["text"])) / max(len(_tokenize_text(claim)), 1), 6),
                })

            bm25_map2 = _bm25_scores_for_chunks(claim, chunks)
            bm25_top2 = _bm25_top_chunks(claim, chunks, topk=_RERANK_CANDIDATES)
            for c in bm25_top2:
                if c["chunk_id"] in seen:
                    continue
                seen.add(c["chunk_id"])
                fallback_candidates.append({
                    "chunk_id": c["chunk_id"],
                    "source_id": c["source_id"],
                    "text": c["text"],
                    "similarity_score": 0.0,
                    "bm25_score": bm25_map2.get(c["chunk_id"], 0.0),
                })

            # Hybrid sort of fallback
            claim_tokens = _tokenize_text(claim)
            for candidate in fallback_candidates:
                chunk_tokens = _tokenize_text(candidate["text"])
                lexical_overlap = len(claim_tokens & chunk_tokens) / max(len(claim_tokens), 1)
                bm25 = candidate.get("bm25_score", 0.0)
                candidate["hybrid_score"] = round(
                    0.6 * candidate.get("similarity_score", 0.0) + 0.3 * bm25 + 0.1 * lexical_overlap,
                    6,
                )
            fallback_candidates.sort(key=lambda item: item.get("hybrid_score", item.get("similarity_score", 0.0)), reverse=True)

            # Extract best sentences for fallback
            for candidate in fallback_candidates:
                try:
                    best_sent, best_sent_sim = select_most_similar_sentence(claim, candidate["text"])
                    candidate["best_sentence"] = best_sent
                    candidate["best_sentence_sim"] = round(float(best_sent_sim), 6)
                except Exception:
                    candidate["best_sentence"] = ""
                    candidate["best_sentence_sim"] = 0.0

            # If still weak, return no evidence
            if not fallback_candidates:
                return []
            top2 = fallback_candidates[0]
            if (
                top2.get("similarity_score", 0.0) < _RETRIEVAL_CONFIDENCE_THRESHOLD
                and top2.get("best_sentence_sim", 0.0) < _RETRIEVAL_CONFIDENCE_THRESHOLD
            ):
                return []

            candidates = fallback_candidates

    results: list[dict[str, Any]] = []
    for rank, candidate in enumerate(candidates[:k], start=1):
        results.append(
            {
                "rank": rank,
                "chunk_id": candidate["chunk_id"],
                "source_id": candidate["source_id"],
                "text": candidate["text"],
                "best_sentence": candidate.get("best_sentence", ""),
                "best_sentence_sim": candidate.get("best_sentence_sim", 0.0),
                "similarity_score": candidate.get("similarity_score", 0.0),
                **({"rerank_score": candidate["rerank_score"]} if "rerank_score" in candidate else {}),
                **({"hybrid_score": candidate["hybrid_score"]} if "hybrid_score" in candidate else {}),
                **({"bm25_score": candidate["bm25_score"]} if "bm25_score" in candidate else {}),
            }
        )

    return results


def retrieve_evidence_batch(
    claims: list[str],
    source_documents: list[dict[str, str]],
    k: int = 3,
) -> list[dict[str, Any]]:
    """
    Convenience wrapper used by the Flask route.

    Builds a fresh FAISS index from *source_documents*, then runs
    retrieve_evidence() for every claim.

    Returns:
        [
          {
            "claim": "...",
            "evidence": [ { rank, chunk_id, source_id, text,
                             similarity_score }, ... ]
          },
          ...
        ]
    """
    index, chunks = build_faiss_index(source_documents)

    output: list[dict[str, Any]] = []
    for claim in claims:
        evidence = retrieve_evidence(claim, index, chunks, k=k)
        output.append({"claim": claim, "evidence": evidence})

    return output
