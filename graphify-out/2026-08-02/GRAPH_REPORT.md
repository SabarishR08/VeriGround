# Graph Report - .  (2026-08-02)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 157 nodes · 206 edges · 16 communities (13 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d0faca86`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.jsx
- verify_claim_evidence
- build_faiss_index
- package.json
- devDependencies
- extract_claims_from_text
- generate_explanation
- app.py
- file_parser.py
- VeriGround: Claim Verification & Provenance Auditing Framework for RAG Systems
- GEMINI.md
- VeriGround Project Plan
- Index HTML

## God Nodes (most connected - your core abstractions)
1. `generate_explanation()` - 10 edges
2. `verify_claim_evidence()` - 10 edges
3. `extract_claims_from_text()` - 9 edges
4. `build_faiss_index()` - 8 edges
5. `retrieve_evidence()` - 8 edges
6. `retrieve_evidence_batch()` - 7 edges
7. `verify_claim_against_evidence_list()` - 6 edges
8. `embed_texts()` - 5 edges
9. `_fallback_explanation()` - 5 edges
10. `classify_sentence()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `VeriGround: Claim Verification & Provenance Auditing Framework for RAG Systems` --references--> `VeriGround Backend — Python dependencies`  [EXTRACTED]
  README.md → backend/requirements.txt
- `VeriGround: Claim Verification & Provenance Auditing Framework for RAG Systems` --references--> `Module 4 Debugging Notes — NLI + Fusion Verification`  [EXTRACTED]
  README.md → docs/module4_debugging_notes.md
- `verify_claims_route()` --calls--> `verify_claim_against_evidence_list()`  [EXTRACTED]
  backend/app.py → backend/nli_verification.py
- `explain_claim_route()` --calls--> `generate_explanation()`  [EXTRACTED]
  backend/app.py → backend/explanation_generation.py
- `main()` --calls--> `retrieve_evidence_batch()`  [EXTRACTED]
  backend/test_evidence_retrieval.py → backend/evidence_retrieval.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **VeriGround System Components** — veriground_readme, veriground_backend_requirements, veriground_module4_debugging_notes [INFERRED 0.75]

## Communities (16 total, 3 thin omitted)

### Community 0 - "App.jsx"
Cohesion: 0.15
Nodes (14): App(), ArchitectureModal(), Header(), Module1Input(), Module2Extraction(), Module3Preview(), SampleDataSelector(), WorkflowStepper() (+6 more)

### Community 1 - "verify_claim_evidence"
Cohesion: 0.15
Nodes (19): classify_verdict(), _extract_entity_tokens(), fuse_score(), get_entity_overlap(), get_nli_scores(), Any, VeriGround — Module 4: Claim-Evidence NLI + Fusion Verification ===============, Return a lower-cased set of named entities, dates, and numeric tokens     from (+11 more)

### Community 2 - "build_faiss_index"
Cohesion: 0.15
Nodes (18): POST /api/retrieve-evidence      Request body (JSON):         {, retrieve_evidence_route(), build_faiss_index(), chunk_document(), embed_texts(), Any, VeriGround — Module 3: Evidence Retrieval ======================================, Embed *claim*, search *index* for the top-k nearest chunks, and return     a ran (+10 more)

### Community 3 - "package.json"
Cohesion: 0.11
Nodes (17): framer-motion, dependencies, framer-motion, lucide-react, react, react-dom, name, private (+9 more)

### Community 4 - "devDependencies"
Cohesion: 0.13
Nodes (15): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/react, @types/react-dom, vite (+7 more)

### Community 5 - "extract_claims_from_text"
Cohesion: 0.20
Nodes (13): classify_sentence(), clean_text(), detect_ai_provider(), detect_language(), extract_claims_from_text(), Any, Classifies a sentence using strict, research-style hierarchical filtering:     1, Main pipeline entry for Module 1 & Module 2 processing. (+5 more)

### Community 6 - "generate_explanation"
Cohesion: 0.22
Nodes (12): _build_prompt(), _fallback_explanation(), generate_explanation(), _ollama_is_reachable(), Any, VeriGround — Module 5: Explainable AI (Explanation Generation) ================, Return a deterministic template-based explanation when Ollama is     unreachabl, Fast TCP-level check — avoids a full HTTP round-trip for the probe. (+4 more)

### Community 7 - "app.py"
Cohesion: 0.18
Nodes (4): explain_claim_route(), POST /api/verify-claims      Request body (JSON):         {             "res, POST /api/explain-claim      Generate a one-sentence human-readable explanatio, verify_claims_route()

### Community 8 - "file_parser.py"
Cohesion: 0.22
Nodes (8): extract_text_from_docx(), extract_text_from_pdf(), extract_text_from_txt(), extract_text_from_url(), Extract text from Word .docx file bytes using python-docx., Extract text from plain text file bytes., Scrapes text content from article or web page URL., Extract text from PDF file bytes using PyPDF2.

### Community 9 - "VeriGround: Claim Verification & Provenance Auditing Framework for RAG Systems"
Cohesion: 0.67
Nodes (3): VeriGround Backend — Python dependencies, Module 4 Debugging Notes — NLI + Fusion Verification, VeriGround: Claim Verification & Provenance Auditing Framework for RAG Systems

## Knowledge Gaps
- **23 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `verify_claim_against_evidence_list()` connect `verify_claim_evidence` to `app.py`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `generate_explanation()` connect `generate_explanation` to `app.py`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `build_faiss_index()` connect `build_faiss_index` to `app.py`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _23 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._