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
# evidence_retrieval and nli_verification are imported lazily inside their
# respective route handlers — keeps startup fast and avoids loading the 370MB
# NLI model until the first verification request arrives.

app = Flask(__name__)
CORS(app)

SAMPLE_DATASETS = [
    {
        "id": "academic-strict-benchmark",
        "title": "VeriGround Research Evaluation Suite (Strict Benchmark)",
        "description": "10-sentence academic benchmark suite testing Claims, Opinions, Questions, Predictions, Greetings, and Commands with ground-truth reference evidence.",
        "text": """The Eiffel Tower is located in Paris.

I think Paris is the most beautiful city in the world.

Can AI replace teachers?

OpenAI released GPT-4 in 2023.

Artificial Intelligence will completely replace humans by 2035.

Thank you for reading.

Water boils at 100°C under standard atmospheric pressure.

Our team believes VeriGround is an innovative framework.

The capital of Japan is Tokyo.

Please verify these claims.""",
        "source_documents": [
            {
                "id": "doc_eiffel",
                "title": "Wikipedia Reference: Eiffel Tower",
                "text": "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France. Constructed between 1887 and 1889 as the entrance to the 1889 World's Fair, it was named after the engineer Gustave Eiffel, whose company designed and built the tower."
            },
            {
                "id": "doc_gpt4",
                "title": "Wikipedia Reference: GPT-4",
                "text": "Generative Pre-trained Transformer 4 (GPT-4) is a multimodal large language model created by OpenAI. OpenAI officially released GPT-4 in March 2023, making it available to ChatGPT Plus subscribers and via OpenAI's commercial API."
            },
            {
                "id": "doc_water",
                "title": "Physics Reference: Thermodynamics of Water",
                "text": "Water boils at 100 degrees Celsius (212 degrees Fahrenheit) under standard atmospheric pressure of 1 atmosphere (101.325 kPa). The boiling point decreases at higher altitudes where atmospheric pressure is lower."
            },
            {
                "id": "doc_japan",
                "title": "Geography Reference: Japan",
                "text": "Tokyo is the capital and most populous city of Japan. Located at the head of Tokyo Bay, the Greater Tokyo Area is the most populous metropolitan area in the world."
            }
        ]
    },
    {
        "id": "sample-ai-history",
        "title": "AI Milestones & Tech Opinions",
        "description": "Historical AI events mixed with subjective tech hype.",
        "text": """Artificial Intelligence was invented in 1955 by John McCarthy.

DeepMind developed AlphaGo which defeated Lee Sedol in 2016.

Machine learning is absolutely amazing and every developer must use it today.

Can quantum computing solve artificial general intelligence by next year?

Python is the most pleasant programming language in human history.""",
        "source_documents": [
            {
                "id": "doc_ai_history",
                "title": "Computer Science History: Artificial Intelligence",
                "text": "Artificial Intelligence as an academic discipline was founded at a workshop on the campus of Dartmouth College in 1955, organized by John McCarthy, Marvin Minsky, Nathaniel Rochester, and Claude Shannon."
            },
            {
                "id": "doc_alphago",
                "title": "DeepMind Research: AlphaGo",
                "text": "DeepMind developed AlphaGo, a computer program that defeated world champion Go player Lee Sedol 4 games to 1 in March 2016."
            },
            {
                "id": "doc_python",
                "title": "Programming Languages: Python History",
                "text": "Python was created by Guido van Rossum and first released in 1991 as a successor to the ABC programming language."
            }
        ]
    }
]

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online",
        "service": "VeriGround Retrieval-Grounding API",
        "version": "1.1.0",
        "modules": ["Module 1: AI Content Input", "Module 2: Intelligent Claim Extraction (Strict Academic Filtering)"]
    })

@app.route('/api/sample-data', methods=['GET'])
def get_samples():
    return jsonify({
        "success": True,
        "samples": SAMPLE_DATASETS
    })

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
    
    words_count = len(cleaned.split())
    chars_count = len(cleaned)
    
    return jsonify({
        "success": True,
        "source": provider,
        "characters": chars_count,
        "sentences_count": len(sentences),
        "sentences": sentences,
        "words": words_count,
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
    return jsonify({
        "success": True,
        "data": result
    })

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
        return jsonify({
            "success": True,
            "filename": filename,
            "extracted_text": cleaned
        })
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
        return jsonify({
            "success": True,
            "url": url,
            "extracted_text": cleaned
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/verify-claims', methods=['POST'])
def verify_claims_route():
    """
    POST /api/verify-claims

    Request body (JSON):
        {
            "results": [
                {
                    "claim": "claim text",
                    "evidence": [
                        {
                            "rank": 1,
                            "chunk_id": "doc0_0",
                            "source_id": "doc0",
                            "text": "...",
                            "similarity_score": 0.87
                        },
                        ...
                    ]
                },
                ...
            ]
        }

    This accepts the direct output shape from /api/retrieve-evidence so
    the two routes can be chained without any client-side transformation.

    Response (JSON):
        {
            "success": true,
            "verifications": [
                {
                    "claim": "...",
                    "verdict": "Supported",
                    "fused_score": 0.812,
                    "chunk_id": "doc0_0",
                    "source_id": "doc0",
                    "components": {
                        "sem_sim": 0.87,
                        "p_entail": 0.91,
                        "p_neutral": 0.06,
                        "p_contradict": 0.03,
                        "entity_overlap": 0.75
                    },
                    "all_evidence_scores": [...]
                },
                ...
            ],
            "total_claims": 2
        }
    """
    data = request.get_json() or {}
    results = data.get("results", [])

    if not results:
        return jsonify({"success": False, "error": "No results provided. Expected key 'results' with retrieve-evidence output."}), 400
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
            verification = verify_claim_against_evidence_list(claim, evidence_list)
            verifications.append(verification)

        return jsonify({
            "success": True,
            "verifications": verifications,
            "total_claims": len(verifications),
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/retrieve-evidence', methods=['POST'])
def retrieve_evidence_route():
    """
    POST /api/retrieve-evidence

    Request body (JSON):
        {
            "claims": ["claim text 1", "claim text 2", ...],
            "source_documents": [
                {"id": "doc0", "text": "full document text ..."},
                ...
            ],
            "k": 3   (optional, default 3)
        }

    Response (JSON):
        {
            "success": true,
            "results": [
                {
                    "claim": "claim text 1",
                    "evidence": [
                        {
                            "rank": 1,
                            "chunk_id": "doc0_0",
                            "source_id": "doc0",
                            "text": "...",
                            "similarity_score": 0.871234
                        },
                        ...
                    ]
                },
                ...
            ],
            "total_claims": 2,
            "total_chunks_indexed": 14
        }
    """
    data = request.get_json() or {}

    claims = data.get("claims", [])
    source_documents = data.get("source_documents", [])
    auto_fetch = bool(data.get("auto_fetch", True))
    k = int(data.get("k", 3))

    if not claims:
        return jsonify({"success": False, "error": "No claims provided"}), 400
    if not isinstance(claims, list):
        return jsonify({"success": False, "error": "'claims' must be a list"}), 400
    if k < 1:
        k = 3

    try:
        from evidence_retrieval import build_faiss_index, retrieve_evidence, fetch_reference_documents_for_claims

        docs_to_index = list(source_documents) if source_documents else []

        # Automatically fetch reference documents if requested or if no source_documents were provided
        if auto_fetch or not docs_to_index:
            auto_docs = fetch_reference_documents_for_claims(claims)
            docs_to_index.extend(auto_docs)

        index, chunks = build_faiss_index(docs_to_index)
        total_chunks = len(chunks)

        results = []
        for claim_item in claims:
            claim_str = claim_item.get("text", str(claim_item)) if isinstance(claim_item, dict) else str(claim_item)
            evidence = retrieve_evidence(claim_str, index, chunks, k=k)
            results.append({"claim": claim_str, "evidence": evidence})

        return jsonify({
            "success": True,
            "results": results,
            "total_claims": len(claims),
            "total_chunks_indexed": total_chunks,
            "auto_fetched_sources_count": len(docs_to_index) - len(source_documents) if source_documents else len(docs_to_index)
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/explain-claim', methods=['POST'])
def explain_claim_route():
    """
    POST /api/explain-claim

    Generate a one-sentence human-readable explanation for a verification
    verdict.  Calls local Ollama phi3:mini; falls back to a template-based
    explanation if Ollama is not running.

    This route is intentionally separate from /api/verify-claims so that
    explanation generation (5–25s on CPU) does not block the faster
    verification pipeline.  The frontend calls this only when a user
    explicitly requests an explanation.

    Request body (JSON) — accepts the direct output shape of one item from
    /api/verify-claims so no client-side transformation is needed:
        {
            "claim":      "claim text",
            "evidence":   "best evidence chunk text",
            "verdict":    "Supported",
            "components": {
                "sem_sim":        0.87,
                "p_entail":       0.91,
                "p_neutral":      0.06,
                "p_contradict":   0.03,
                "entity_overlap": 0.75
            },
            "model": "phi3:mini"   (optional, default phi3:mini)
        }

    Response (JSON):
        {
            "success":          true,
            "explanation":      "The evidence directly states...",
            "source":           "ollama",
            "model":            "phi3:mini",
            "ollama_available": true
        }
    """
    data = request.get_json() or {}

    claim      = data.get("claim", "").strip()
    evidence   = data.get("evidence", "").strip()
    verdict    = data.get("verdict", "").strip()
    components = data.get("components", {})
    model      = data.get("model", "phi3:mini")

    if not claim:
        return jsonify({"success": False, "error": "Missing required field: 'claim'"}), 400
    if not verdict:
        return jsonify({"success": False, "error": "Missing required field: 'verdict'"}), 400
    if verdict not in ("Supported", "Partially Supported", "Unsupported", "Contradicted"):
        return jsonify({
            "success": False,
            "error": f"Invalid verdict '{verdict}'. Must be one of: Supported, Partially Supported, Unsupported, Contradicted"
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
        return jsonify({"success": True, **result})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"[VeriGround Server] Flask NLP Backend running on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
