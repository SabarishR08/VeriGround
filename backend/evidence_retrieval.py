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
# Model — loaded once at module import time
# ---------------------------------------------------------------------------
_MODEL_NAME = "all-MiniLM-L6-v2"
_model: SentenceTransformer = SentenceTransformer(_MODEL_NAME)


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

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
    Split a plain-text document into paragraph-sized chunks.

    Returns a list of dicts:
        [{"chunk_id": "<doc_id>_<n>", "source_id": "<doc_id>", "text": "..."}, ...]

    Paragraphs are separated by one or more blank lines.  Very short
    paragraphs (< 20 chars) are skipped to avoid noise from headers /
    single-word lines.
    """
    # Split on blank lines; handle Windows and Unix line endings
    raw_paragraphs = re.split(r"\n\s*\n", text.replace("\r\n", "\n"))
    chunks: list[dict[str, str]] = []
    idx = 0
    for para in raw_paragraphs:
        para = para.strip()
        if len(para) < 20:
            continue
        chunks.append(
            {
                "chunk_id": f"{doc_id}_{idx}",
                "source_id": doc_id,
                "text": para,
            }
        )
        idx += 1
    return chunks


def build_faiss_index(
    source_documents: list[dict[str, str]],
) -> tuple[faiss.IndexFlatIP, list[dict[str, str]]]:
    """
    Accept a list of source-document dicts:
        [{"id": "<doc_id>", "text": "<full document text>"}, ...]

    1. Chunk each document by paragraph.
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


def retrieve_evidence(
    claim: str,
    index: faiss.IndexFlatIP,
    chunks: list[dict[str, str]],
    k: int = 3,
) -> list[dict[str, Any]]:
    """
    Embed *claim*, search *index* for the top-k nearest chunks, and return
    a ranked list of evidence dicts:

        [
          {
            "rank": 1,
            "chunk_id": "doc0_2",
            "source_id": "doc0",
            "text": "...",
            "similarity_score": 0.87
          },
          ...
        ]

    Similarity scores are cosine similarities in [−1, 1]; in practice they
    will be in (0, 1] for semantically related pairs.
    """
    if index.ntotal == 0 or not chunks:
        return []

    k_actual = min(k, index.ntotal)
    query_vec = embed_texts([claim])  # (1, 384)

    similarities, indices = index.search(query_vec, k_actual)

    results: list[dict[str, Any]] = []
    for rank, (idx, sim) in enumerate(
        zip(indices[0], similarities[0]), start=1
    ):
        if idx == -1:
            continue
        chunk = chunks[idx]
        results.append(
            {
                "rank": rank,
                "chunk_id": chunk["chunk_id"],
                "source_id": chunk["source_id"],
                "text": chunk["text"],
                "similarity_score": round(float(sim), 6),
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
