"""
VeriGround — Module 3: Evidence Retrieval & Multi-Source Automated Reference Collection
=======================================================================================
Pipeline step 2 from Section 5 of the project plan:
  - Embed claims and evidence chunks with all-MiniLM-L6-v2
  - Build an in-process FAISS flat index (cosine similarity via normalized
    inner product)
  - Retrieve the top-k evidence chunks per claim, returning similarity scores
    and source document ids
  - Automatically fetch live reference papers, academic articles, encyclopedias,
    and web search sources matching claim content (arXiv, Wikipedia, DuckDuckGo)

The embedding model is loaded once at import time to avoid per-call overhead.
All computation is CPU-only; no GPU dependencies.
"""

from __future__ import annotations

import re
import urllib.parse
from typing import Any

import faiss
import numpy as np
import requests
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

    Paragraphs are separated by one or more blank lines. Preserves document
    header/subject context across all paragraph chunks so NLI retains subject context.
    """
    lines = text.replace("\r\n", "\n").strip().split("\n")
    header_prefix = ""
    if lines and lines[0].startswith("[") and (":" in lines[0]):
        header_prefix = lines[0].strip()

    raw_paragraphs = re.split(r"\n\s*\n", text.replace("\r\n", "\n"))
    chunks: list[dict[str, str]] = []
    idx = 0
    for para in raw_paragraphs:
        para = para.strip()
        if len(para) < 20:
            continue
        
        # Attach header prefix to subsequent chunks if not already present
        if header_prefix and not para.startswith("["):
            chunk_text = f"{header_prefix}\n{para}"
        else:
            chunk_text = para

        chunks.append(
            {
                "chunk_id": f"{doc_id}_{idx}",
                "source_id": doc_id,
                "text": chunk_text,
            }
        )
        idx += 1
    return chunks


def _extract_search_query(claim_text: str) -> str:
    """Extract key named entities, proper nouns, action verbs, and numbers to formulate clean, focused search API queries."""
    if not claim_text.strip():
        return claim_text

    from nli_verification import _nlp

    # Normalize temperature & unit symbols prior to tokenization
    norm_text = claim_text.replace("°C", " degrees Celsius ").replace("°F", " degrees Fahrenheit ").replace("°", " degrees ")
    doc = _nlp(norm_text)
    keywords: list[str] = []
    seen_words: set[str] = set()

    # 1. Named entities (highest priority)
    for ent in doc.ents:
        e_clean = re.sub(r"[^\w\-\s]", " ", ent.text).strip()
        e_clean = re.sub(r"\s+", " ", e_clean)
        if e_clean:
            e_words = [w.lower() for w in e_clean.split()]
            if not any(w in seen_words for w in e_words):
                keywords.append(e_clean)
                seen_words.update(e_words)

    # 2. Key nouns, proper nouns, numerals, and action verbs
    stop_words = {"the", "a", "an", "is", "are", "was", "were", "be", "been", "in", "on", "at", "to", "for", "of", "with", "by", "and", "under", "has", "have", "had", "do", "does", "did"}
    for tok in doc:
        t_lower = tok.text.lower()
        if tok.pos_ in {"NOUN", "PROPN", "NUM", "VERB"} and t_lower not in stop_words and len(tok.text) > 1:
            t_clean = re.sub(r"[^\w\-\s]", " ", tok.text).strip()
            t_clean = re.sub(r"\s+", " ", t_clean)
            if t_clean and t_lower not in seen_words:
                keywords.append(t_clean)
                seen_words.add(t_lower)

    if keywords:
        return " ".join(keywords[:5])

    clean_text = re.sub(r"[^\w\s]", " ", norm_text).strip()
    words = clean_text.split()
    key_words = [w for w in words if w.lower() not in stop_words and len(w) > 1]
    return " ".join(key_words[:5]) if key_words else clean_text


def fetch_reference_documents_for_claims(claims: list[Any]) -> list[dict[str, str]]:
    """
    Automatically search and fetch multi-source reference background documents:
    1. Wikipedia Encyclopedic Knowledge API (https://en.wikipedia.org)
    2. DuckDuckGo Instant Answer & Live Web Knowledge API (https://api.duckduckgo.com)
    3. arXiv Academic Research Papers API (http://export.arxiv.org/api/query)
    """
    fetched_docs: list[dict[str, str]] = []
    seen_keys: set[str] = set()
    headers = {"User-Agent": "VeriGround-Academic-Framework/2.0 (research-verification)"}

    for idx, claim_item in enumerate(claims):
        claim_text = claim_item.get("text", str(claim_item)) if isinstance(claim_item, dict) else str(claim_item)
        clean_query = re.sub(r'[^\w\s]', '', claim_text).strip()
        if not clean_query or len(clean_query) < 3:
            continue

        search_query = _extract_search_query(claim_text)
        query_encoded = urllib.parse.quote(search_query)

        # Source 1: Wikipedia Encyclopedic Knowledge API (Highest priority for general knowledge)
        try:
            wiki_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={query_encoded}&format=json&srlimit=4"
            r_wiki = requests.get(wiki_url, headers=headers, timeout=2.5)
            if r_wiki.status_code == 200:
                search_results = r_wiki.json().get("query", {}).get("search", [])
                for s_idx, item in enumerate(search_results):
                    title = item.get("title", "")
                    key = f"wiki_{title.lower()}"
                    if not title or key in seen_keys:
                        continue
                    
                    # Only skip explicit non-topic disambiguations (film, song, game, location variants like Texas)
                    if "(" in title and ")" in title:
                        p_content = title[title.find("(")+1 : title.find(")")].lower()
                        skip_triggers = {"texas", "tennessee", "disambiguation", "film", "song", "album", "band", "video game", "tv series"}
                        if any(st in p_content for st in skip_triggers) and not any(st in clean_query.lower() for st in skip_triggers):
                            continue

                    ext_url = f"https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles={urllib.parse.quote(title)}&format=json"
                    r_ext = requests.get(ext_url, headers=headers, timeout=2.5)
                    if r_ext.status_code == 200:
                        pages = r_ext.json().get("query", {}).get("pages", {})
                        for page_id, page_data in pages.items():
                            extract_text = page_data.get("extract", "").strip()
                            if extract_text and len(extract_text) > 40:
                                seen_keys.add(key)
                                fetched_docs.append({
                                    "id": f"wiki_doc_{idx}_{s_idx}",
                                    "title": f"Wikipedia Entry: {title}",
                                    "text": f"[Wikipedia Reference] Subject: {title}. {extract_text}"
                                })
        except Exception as err:
            print(f"[Evidence Retrieval] Wikipedia fetch notice for '{clean_query}': {err}")

        # Source 2: DuckDuckGo Live Web Knowledge API
        try:
            ddg_url = f"https://api.duckduckgo.com/?q={query_encoded}&format=json&no_html=1&skip_disambig=1"
            r_ddg = requests.get(ddg_url, headers=headers, timeout=2.0)
            if r_ddg.status_code == 200:
                ddg_data = r_ddg.json()
                abstract = ddg_data.get("AbstractText", "").strip()
                heading = ddg_data.get("Heading", clean_query)
                if abstract and len(abstract) > 30:
                    key = f"ddg_{heading.lower()}"
                    if key not in seen_keys:
                        seen_keys.add(key)
                        fetched_docs.append({
                            "id": f"web_knowledge_{idx}",
                            "title": f"Web Source: {heading}",
                            "text": f"[Live Web Knowledge] Topic: {heading}. Details: {abstract}"
                        })
                # Related Topics
                topics = ddg_data.get("RelatedTopics", [])
                for topic in topics[:2]:
                    t_text = topic.get("Text", "").strip()
                    if t_text and len(t_text) > 40:
                        key = f"ddg_topic_{t_text[:30].lower()}"
                        if key not in seen_keys:
                            seen_keys.add(key)
                            fetched_docs.append({
                                "id": f"web_ref_{idx}",
                                "title": f"Web Knowledge Reference",
                                "text": f"[Live Web Search] {t_text}"
                            })
        except Exception as err:
            print(f"[Evidence Retrieval] Web search fetch notice for '{clean_query}': {err}")

        # Source 3: arXiv Scientific Research Papers API (Filtered for domain relevance)
        try:
            arxiv_url = f"http://export.arxiv.org/api/query?search_query=all:{query_encoded}&start=0&max_results=2"
            r_arxiv = requests.get(arxiv_url, headers=headers, timeout=2.0)
            if r_arxiv.status_code == 200:
                entries = re.findall(r'<entry>(.*?)</entry>', r_arxiv.text, re.DOTALL)
                for entry in entries:
                    t_match = re.search(r'<title>(.*?)</title>', entry, re.DOTALL)
                    s_match = re.search(r'<summary>(.*?)</summary>', entry, re.DOTALL)
                    if t_match and s_match:
                        title = re.sub(r'\s+', ' ', t_match.group(1)).strip()
                        summary = re.sub(r'\s+', ' ', s_match.group(1)).strip()
                        key = f"arxiv_{title.lower()}"
                        
                        # Verify strong domain relevance: paper title/abstract must match at least 2 key query terms (or >=50%)
                        query_words = set(w.lower() for w in clean_query.split() if len(w) > 3 and w.lower() not in {"the", "that", "this", "with", "from"})
                        text_words = set((title + " " + summary).lower().split())
                        overlap_count = len(query_words & text_words)
                        if query_words and overlap_count < min(2, len(query_words)):
                            continue

                        if key not in seen_keys and len(summary) > 40:
                            seen_keys.add(key)
                            fetched_docs.append({
                                "id": f"arxiv_paper_{idx}",
                                "title": f"arXiv Research Paper: {title}",
                                "text": f"[arXiv Research Paper] Title: {title}. Abstract: {summary}"
                            })
        except Exception as err:
            print(f"[Evidence Retrieval] arXiv fetch notice for '{clean_query}': {err}")

    return fetched_docs


def build_faiss_index(
    source_documents: list[dict[str, str]],
) -> tuple[faiss.IndexFlatIP, list[dict[str, str]]]:
    """
    Accept a list of source-document dicts:
        [{"id": "<doc_id>", "text": "<full document text>"}, ...]

    1. Chunk each document by paragraph.
    2. Embed all chunks.
    3. Build an in-process FAISS IndexFlatIP (exact cosine search on
       L2-normalised vectors).

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
    a ranked list of evidence dicts.
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
    claims: list[Any],
    source_documents: list[dict[str, str]],
    k: int = 3,
    auto_fetch: bool = True
) -> list[dict[str, Any]]:
    """
    Convenience wrapper used by the Flask route.

    Builds a fresh FAISS index from *source_documents* and automatically fetches multi-source
    reference documents (arXiv papers, Wikipedia, Live Web Search) for the given claims.
    """
    docs_to_index = list(source_documents) if source_documents else []

    # Auto-fetch multi-source reference documents by default
    if auto_fetch or not docs_to_index:
        auto_docs = fetch_reference_documents_for_claims(claims)
        docs_to_index.extend(auto_docs)

    index, chunks = build_faiss_index(docs_to_index)

    output: list[dict[str, Any]] = []
    for claim_item in claims:
        claim_str = claim_item.get("text", str(claim_item)) if isinstance(claim_item, dict) else str(claim_item)
        evidence = retrieve_evidence(claim_str, index, chunks, k=k)
        output.append({"claim": claim_str, "evidence": evidence})

    return output
