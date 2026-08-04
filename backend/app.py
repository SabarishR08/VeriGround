import os
import sys

# Ensure backend directory is in python module search path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from flask import Flask, request, jsonify
from flask_cors import CORS

from nlp_engine import extract_claims_from_text, clean_text, segment_sentences, detect_ai_provider, detect_language
from file_parser import extract_text_from_pdf, extract_text_from_docx, extract_text_from_txt, extract_text_from_url

# Heavy modules (evidence_retrieval, nli_verification, explanation_generation)
# are imported lazily inside their route handlers — keeps startup fast and
# avoids loading ~400MB of model weights until the first request arrives.
# provenance_store is lightweight (stdlib sqlite3) so it's imported at top level.
from provenance_store import (
    log_verification,
    get_provenance_log,
    get_provenance_stats,
    get_most_recent_claim_id_by_text,
    update_explanation,
)

app = Flask(__name__)
CORS(app)

SAMPLE_DATASETS = [
    {
        "id": "academic-strict-benchmark",
        "title": "VeriGround Research Evaluation Suite (Strict Benchmark)",
        "description": "10-sentence academic benchmark suite testing Claims, Opinions, Questions, Predictions, Greetings, and Commands.",
        "text": """The Eiffel Tower is located in Paris.

I think Paris is the most beautiful city in the world.

Can AI replace teachers?

OpenAI released GPT-4 in 2023.

Artificial Intelligence will completely replace humans by 2035.

Thank you for reading.

Water boils at 100°C under standard atmospheric pressure.

Our team believes VeriGround is an innovative framework.

The capital of Japan is Tokyo.

Please verify these claims."""
    },
    {
        "id": "sample-ai-history",
        "title": "AI Milestones & Tech Opinions",
        "description": "Historical AI events mixed with subjective tech hype.",
        "text": """Artificial Intelligence was invented in 1955 by John McCarthy.

DeepMind developed AlphaGo which defeated Lee Sedol in 2016.

Machine learning is absolutely amazing and every developer must use it today.

Can quantum computing solve artificial general intelligence by next year?

Python is the most pleasant programming language in human history."""
    }
]


# ─────────────────────────────────────────────────────────────────────────────
# Health & utilities
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online",
        "service": "VeriGround Retrieval-Grounding API",
        "version": "2.0.0",
        "modules": [
            "Module 1: AI Content Input",
            "Module 2: Intelligent Claim Extraction",
            "Module 3: Evidence Retrieval (FAISS)",
            "Module 4: NLI Fusion Verification",
            "Module 5: Explanation Generation (Ollama)",
            "Module 6: Provenance Store (SQLite)",
        ]
    })


@app.route('/api/sample-data', methods=['GET'])
def get_samples():
    return jsonify({"success": True, "samples": SAMPLE_DATASETS})


# ─────────────────────────────────────────────────────────────────────────────
# Module 1+2: Preprocess & Claim Extraction
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/preprocess', methods=['POST'])
def preprocess():
    data = request.get_json() or {}
    raw_text = data.get('text', '')

    if not raw_text.strip():
        return jsonify({"success": False, "error": "No text provided"}), 400

    cleaned = clean_text(raw_text)
    sentences = segment_sentences(cleaned)
    provider = detect_ai_provider(cleaned)
    language = detect_language(cleaned)

    return jsonify({
        "success": True,
        "source": provider,
        "characters": len(cleaned),
        "sentences_count": len(sentences),
        "sentences": sentences,
        "words": len(cleaned.split()),
        "language": language,
        "status": "Ready for Claim Extraction",
        "cleaned_text": cleaned
    })


@app.route('/api/extract-claims', methods=['POST'])
def extract_claims():
    data = request.get_json() or {}
    raw_text = data.get('text', '')

    if not raw_text.strip():
        return jsonify({"success": False, "error": "No text provided for extraction"}), 400

    result = extract_claims_from_text(raw_text)
    return jsonify({"success": True, "data": result})


@app.route('/api/parse-file', methods=['POST'])
def parse_file():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files['file']
    filename = file.filename or ""
    file_bytes = file.read()
    ext = filename.split('.')[-1].lower()

    try:
        if ext == 'pdf':
            extracted_text = extract_text_from_pdf(file_bytes)
        elif ext in ['doc', 'docx']:
            extracted_text = extract_text_from_docx(file_bytes)
        elif ext == 'txt':
            extracted_text = extract_text_from_txt(file_bytes)
        else:
            return jsonify({"success": False, "error": f"Unsupported file extension '.{ext}'. Supported: PDF, DOCX, TXT"}), 400

        cleaned = clean_text(extracted_text)
        return jsonify({"success": True, "filename": filename, "extracted_text": cleaned})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/fetch-url', methods=['POST'])
def fetch_url():
    data = request.get_json() or {}
    url = data.get('url', '').strip()

    if not url:
        return jsonify({"success": False, "error": "No URL provided"}), 400

    if not (url.startswith("http://") or url.startswith("https://")):
        url = "https://" + url

    try:
        extracted_text = extract_text_from_url(url)
        cleaned = clean_text(extracted_text)
        return jsonify({"success": True, "url": url, "extracted_text": cleaned})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# Module 3: Evidence Retrieval
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/retrieve-evidence', methods=['POST'])
def retrieve_evidence_route():
    """
    POST /api/retrieve-evidence
    Input:  { "claims": [...], "source_documents": [...], "k": 3 }
    Output: { "success": true, "results": [{claim, evidence:[{rank,chunk_id,
              source_id,text,similarity_score},...]},...], "total_chunks_indexed": N }
    """
    data = request.get_json() or {}
    claims = data.get("claims", [])
    source_documents = data.get("source_documents", [])
    k = int(data.get("k", 3))

    if not claims:
        return jsonify({"success": False, "error": "No claims provided"}), 400
    if not source_documents:
        return jsonify({"success": False, "error": "No source_documents provided"}), 400
    if not isinstance(claims, list) or not isinstance(source_documents, list):
        return jsonify({"success": False, "error": "'claims' and 'source_documents' must be lists"}), 400
    if k < 1:
        k = 3

    try:
        from evidence_retrieval import build_faiss_index, retrieve_evidence

        index, chunks = build_faiss_index(source_documents)
        results = []
        for claim in claims:
            evidence = retrieve_evidence(claim, index, chunks, k=k)
            results.append({"claim": claim, "evidence": evidence})

        return jsonify({
            "success": True,
            "results": results,
            "total_claims": len(claims),
            "total_chunks_indexed": len(chunks),
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# Module 4: NLI Fusion Verification  (+ Module 6 provenance logging)
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/verify-claims', methods=['POST'])
def verify_claims_route():
    """
    POST /api/verify-claims
    Input:  direct output of /api/retrieve-evidence
            { "results": [{claim, evidence:[...]},...] }
    Output: { "success": true, "verifications": [{claim, verdict, fused_score,
              chunk_id, source_id, components, all_evidence_scores},...] }

    Each verified claim is automatically logged to the provenance store.
    """
    data = request.get_json() or {}
    results = data.get("results", [])

    if not results:
        return jsonify({"success": False,
                        "error": "No results provided. Expected key 'results' with retrieve-evidence output."}), 400
    if not isinstance(results, list):
        return jsonify({"success": False, "error": "'results' must be a list"}), 400

    try:
        from nli_verification import verify_claim_against_evidence_list

        verifications = []
        for item in results:
            claim = item.get("claim", "")
            evidence_list = item.get("evidence", [])
            if not claim:
                continue
            v = verify_claim_against_evidence_list(claim, evidence_list)
            verifications.append(v)
 
            # Module 6 — log to provenance store (fire-and-forget; don't fail
            # the route if logging has an error)
            try:
                claim_id = log_verification(
                    claim_text=claim,
                    verdict=v.get("verdict", "Unsupported"),
                    evidence_chunk_id=v.get("chunk_id", ""),
                    source_document_id=v.get("source_id", ""),
                    fused_score=v.get("fused_score", 0.0),
                    component_scores=v.get("components", {}),
                    explanation="",   # explanation added later via /api/explain-claim
                )
                v["claim_id"] = claim_id
            except Exception:
                pass  # logging failure must not break verification response

        return jsonify({
            "success": True,
            "verifications": verifications,
            "total_claims": len(verifications),
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# Module 5: Explanation Generation  (+ Module 6 provenance update)
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/explain-claim', methods=['POST'])
def explain_claim_route():
    """
    POST /api/explain-claim
    Input:  { "claim", "evidence", "verdict", "components", "model"(opt),
              "claim_id"(opt — if provided, updates existing provenance row) }
    Output: { "success": true, "explanation", "source", "model",
              "ollama_available" }

    If "claim_id" is provided in the request body, the provenance row for
    that claim is updated with the generated explanation.
    """
    data = request.get_json() or {}

    claim      = data.get("claim", "").strip()
    evidence   = data.get("evidence", "").strip()
    verdict    = data.get("verdict", "").strip()
    components = data.get("components", {})
    model      = data.get("model", "qwen2:1.5b")
    claim_id   = data.get("claim_id", None)

    if not claim:
        return jsonify({"success": False, "error": "Missing required field: 'claim'"}), 400
    if not verdict:
        return jsonify({"success": False, "error": "Missing required field: 'verdict'"}), 400
    if verdict not in ("Supported", "Partially Supported", "Unsupported", "Contradicted"):
        return jsonify({
            "success": False,
            "error": f"Invalid verdict '{verdict}'. Must be Supported, Partially Supported, Unsupported, or Contradicted"
        }), 400

    try:
        from explanation_generation import generate_explanation

        result = generate_explanation(
            claim=claim,
            evidence=evidence,
            verdict=verdict,
            components=components,
            model=model,
        )

        # Module 6 — write/update provenance row with the explanation
        try:
            provenance_id = claim_id
            if provenance_id is None:
                provenance_id = get_most_recent_claim_id_by_text(claim)
 
            if provenance_id:
                update_explanation(provenance_id, result.get("explanation", ""))
                result["claim_id"] = provenance_id
        except Exception:
            pass

        return jsonify({"success": True, **result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# Module 6: Provenance Log (read)
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/provenance-log', methods=['GET'])
def provenance_log_route():
    """
    GET /api/provenance-log
    Query params:
        verdict  (optional) — filter by verdict label
        limit    (optional, default 500)
    Response: { "success": true, "rows": [...], "stats": {...}, "total": N }
    """
    verdict_filter = request.args.get("verdict", None)
    limit = int(request.args.get("limit", 500))

    try:
        rows = get_provenance_log(verdict_filter=verdict_filter, limit=limit)
        stats = get_provenance_stats()
        return jsonify({
            "success": True,
            "rows": rows,
            "stats": stats,
            "total": len(rows),
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# Entrypoint
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"[VeriGround Server] Flask NLP Backend running on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
