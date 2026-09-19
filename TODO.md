# VeriGround â€” daily improvement backlog
# Fact-verification / NLI platform (Python backend + React/Vite frontend)

- [ ] Create a smoke-test CI workflow at .github/workflows/ci.yml that runs python -m compileall on backend/ to catch syntax errors on every push and pull_request (dependency-free; do not install heavy ML requirements in CI)
- [ ] Add module-level docstrings to backend/nli_verification.py describing its purpose and usage
- [ ] Add type hints to all functions in backend/evidence_retrieval.py
- [ ] Add type hints to all functions in backend/explanation_generation.py
- [ ] Create backend/__init__.py exporting __version__ = "0.1.0"
- [ ] Add logging.getLogger(__name__) to backend/app.py replacing bare print() calls
- [ ] Add input validation in backend/app.py: reject claims shorter than 3 words with HTTP 400
- [ ] Add a /health endpoint to backend/app.py returning {"status": "ok"}
- [ ] Add a constants.py in backend/ for model names and threshold values used across modules
- [ ] Add try/except with logging around the NLI model inference call in nli_verification.py
- [ ] Add a truncate_text(text, max_tokens=512) helper in backend/nlp_engine.py
- [ ] Add a confidence_label() helper that maps float score to "HIGH"/"MEDIUM"/"LOW"
- [ ] Add a normalise_claim(text) function that strips extra whitespace and lowercases
- [ ] Add a CONTRIBUTING.md at repo root with backend setup instructions
- [ ] Add a .editorconfig at repo root (4-space indent, utf-8, lf line endings)
- [ ] Add a requirements-dev.txt in backend/ with pytest, ruff
- [ ] Add a pytest.ini at repo root with testpaths = ["backend"]
- [ ] Add a smoke test in backend/ that imports nli_verification and asserts module loads
- [ ] Add __all__ to backend/nlp_engine.py listing its public symbols
- [ ] Add caching decorator to evidence_retrieval so identical queries are not re-fetched
- [ ] Add a provenance_summary() function to provenance_store.py that returns source count
- [ ] Add elapsed-time logging around the evidence retrieval call
- [ ] Add elapsed-time logging around the NLI inference call
- [ ] Add a retry helper (3 attempts, exponential backoff) for external evidence API calls
- [ ] Add an error_code field to the verification result dict (e.g. "NLI_TIMEOUT")
- [ ] Normalise all raised exception messages to sentence case
- [ ] Add a .gitattributes file to the repo root normalising line endings
- [ ] Add a top-level README section "Architecture" describing the pipeline stages
- [ ] Add a dataclass VerificationResult replacing plain dict returns from nli_verification
- [ ] Add a dataclass EvidenceItem replacing plain dict returns from evidence_retrieval
- [ ] Add a CLI entry point in backend/ that accepts a claim string and prints the verdict


<!-- backlog top-up 2026-09-19 (file-verified) -->
- [ ] Add a module-level docstring to backend/file_parser.py describing the supported input formats
- [ ] Add a module-level docstring to backend/provenance_store.py describing the provenance data model
- [ ] Add type hints to all function signatures in backend/nlp_engine.py
- [ ] Add type hints to all function signatures in backend/file_parser.py
- [ ] Add a module-level docstring to backend/nlp_engine.py describing its preprocessing responsibilities
- [ ] Extract hardcoded model names and score thresholds in backend/nli_verification.py into module-level constants
- [ ] Add a module-level docstring to api/index.py describing the serverless entry point
- [ ] Add type hints to all function signatures in backend/explanation_generation.py


<!-- backlog top-up 2026-09-19 batch 2 (file+verb deduped) -->
- [ ] Add a module-level docstring to backend/evidence_retrieval.py describing the retrieval pipeline
- [ ] Add a module-level docstring to backend/explanation_generation.py describing the explanation flow
- [ ] Add a module-level docstring to backend/app.py describing the Flask application setup
- [ ] Add type hints to all function signatures in backend/provenance_store.py
- [ ] Add type hints to all function signatures in backend/nli_verification.py
- [ ] Add a module-level docstring to frontend/src/services/api.js describing the API client
- [ ] Extract hardcoded API base URLs in frontend/src/services/api.js into a single constant
- [ ] Add error handling with logging around file parsing in backend/file_parser.py
- [ ] Add type hints to all function signatures in backend/app.py
- [ ] Add input validation in backend/file_parser.py rejecting unsupported file extensions with a clear error
- [ ] Extract hardcoded prompts in backend/explanation_generation.py into module-level constants


<!-- backlog top-up 2026-09-19 batch 2b (file+verb deduped) -->
- [ ] Add error handling with logging around storage operations in backend/provenance_store.py
- [ ] Add error handling with logging around text preprocessing in backend/nlp_engine.py
