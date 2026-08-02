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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"[VeriGround Server] Flask NLP Backend running on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
