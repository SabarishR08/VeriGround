# VeriGround

![License](https://img.shields.io/badge/license-MIT-green) ![Language](https://img.shields.io/badge/language-Python-informational)


## 📌 Overview

VeriGround — claim verification and provenance auditing framework for RAG systems: grounding checks, citation tracing, and hallucination guardrails

## 🏗️ Architecture

```text
Browser / UI
     │   HTTP
     ▼
Flask app
```

## 🧰 Tech Stack

- **Language:** Python
- **Backend:** Flask
- **Frontend:** Web frontend (frontend) · React

## 🚀 Getting Started

### Prerequisites

- Python 3.10+

### 1. Clone

```bash
git clone https://github.com/SabarishR08/VeriGround.git
cd VeriGround
```

### 2. Install dependencies

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Run

```bash
python backend/app.py
```


---

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/React-18-cyan.svg)](https://reactjs.org/)
[![FAISS CPU](https://img.shields.io/badge/FAISS-CPU%20v1.9-orange.svg)](https://github.com/facebookresearch/faiss)
[![DeBERTa-v3](https://img.shields.io/badge/NLI-DeBERTa--v3--base-purple.svg)](https://huggingface.co/cross-encoder/nli-deberta-v3-base)
<<<<<<< HEAD
[![Ollama](https://img.shields.io/badge/XAI-Ollama%20phi3%3Amini%20%2F%20qwen2%3A1.5b-green.svg)](https://ollama.ai/)
=======
[![Ollama](https://img.shields.io/badge/XAI-Ollama%20qwen2%3A1.5b-green.svg)](https://ollama.ai/)
>>>>>>> origin/main

**VeriGround** is a real-time, claim-level evidence verification and provenance auditing framework designed specifically for Retrieval-Augmented Generation (RAG) systems. Unlike coarse system-level evaluation metrics or standard 3-way NLI classifiers, VeriGround decomposes LLM outputs into atomic claims, retrieves source evidence chunks, executes a novel **Weighted Evidence-Fusion Verification Pipeline**, and presents actionable provenance trails with explainable AI justifications on a live interactive dashboard.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend (React 18 + Vite)"]
        UI["User Interface Dashboard"]
        M1_UI["Module 1: Raw Output & Context Input"]
        M2_UI["Module 2: Atomic Claim Extraction"]
        M3_UI["Module 3: Evidence Alignment & Ranking"]
        M4_UI["Module 4 & 5: Fusion Verdict & Explanation"]
    end

    subgraph Backend ["Backend REST API (Flask)"]
        API["Flask API Server (app.py)"]
        
        subgraph Mod12 ["Modules 1 & 2: Preprocessing & Claims"]
            NLP["NLP Engine (nlp_engine.py)"]
            SEG["Sentence Segmentation & Text Cleaning"]
            RULE["Rule-based & spaCy Claim Classifier"]
        end

        subgraph Mod3 ["Module 3: Evidence Retrieval"]
            RET["Evidence Retrieval (evidence_retrieval.py)"]
            EMB["sentence-transformers (all-MiniLM-L6-v2)"]
            FAISS[("In-Process FAISS IndexFlatIP")]
        end

        subgraph Mod4 ["Module 4: NLI & Fusion Verification"]
            VERIF["NLI Verification (nli_verification.py)"]
            DEBERTA["DeBERTa-v3-base-mnli (Premise/Hypothesis)"]
            SPACY["spaCy Named Entity & Number Overlap"]
            FUSION["4-Way Weighted Fusion Engine"]
        end

        subgraph Mod5 ["Module 5: Explainable AI"]
            XAI["Explanation Generator (explanation_generation.py)"]
<<<<<<< HEAD
            OLLAMA[("Local Ollama HTTP API (phi3:mini / qwen2:1.5b)")]
=======
            OLLAMA[("Local Ollama HTTP API (qwen2:1.5b / phi3:mini)")]
>>>>>>> origin/main
            FALLBACK["Score-Grounded Template Fallback"]
        end
    end

    UI -->|POST /api/preprocess & /api/extract-claims| API
    API --> NLP
    NLP --> SEG --> RULE

    UI -->|POST /api/retrieve-evidence| API
    API --> RET
    RET --> EMB --> FAISS

    UI -->|POST /api/verify-claims| API
    API --> VERIF
    VERIF --> DEBERTA
    VERIF --> SPACY
    VERIF --> FUSION

    UI -->|POST /api/explain-claim| API
    API --> XAI
    XAI -->|HTTP localhost:11434| OLLAMA
    OLLAMA -.->|Timeout / Off| FALLBACK
```

---

## 🔀 Verification & Data Flow Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as User / RAG System
    participant UI as React Frontend
    participant API as Flask Backend
    participant Retrieval as Evidence Retrieval (FAISS)
    participant NLI as NLI & Fusion Engine
    participant Ollama as Local Ollama LLM

    User->>UI: Input RAG Answer & Source Documents
    UI->>API: POST /api/extract-claims { text }
    API-->>UI: Atomic Claims List

    UI->>API: POST /api/retrieve-evidence { claims, source_documents }
    API->>Retrieval: Embed claims & chunks via all-MiniLM-L6-v2
    Retrieval->>Retrieval: Build in-process FAISS IndexFlatIP & Search top-k
    Retrieval-->>API: Top-k Chunks + Cosine Similarity (SemSim)
    API-->>UI: Claims with Matched Evidence Chunks

    UI->>API: POST /api/verify-claims { claims, evidence }
    API->>NLI: Run DeBERTa NLI (P_entail, P_contradict) + Entity Overlap
    NLI->>NLI: Calculate Fused Score & 4-Way Verdict Thresholding
    NLI-->>API: Fused Scores & Verdicts

    UI->>API: POST /api/explain-claim { claim, evidence, verdict, scores }
<<<<<<< HEAD
    API->>Ollama: POST /api/generate (phi3:mini / qwen2:1.5b)
=======
    API->>Ollama: POST /api/generate (qwen2:1.5b)
>>>>>>> origin/main
    alt Ollama Online
        Ollama-->>API: Grounded Single-Sentence Explanation
    else Ollama Unreachable / Timeout
        API->>API: Generate Templated Score-Grounded Fallback
    end
    API-->>UI: Claim Verification Response + Explanation
    UI-->>User: Display Audit Trail & Interactive Dashboard
```

---

## ⚡ Mathematical Fusion Model

VeriGround uses a novel **Weighted Evidence-Fusion Verification Formula** combining semantic, probabilistic NLI, and entity overlap signals:

$$\text{Verification Score} = \alpha \cdot \text{SemSim} + \beta \cdot P(\text{entail}) - \gamma \cdot P(\text{contradict}) + \delta \cdot \text{EntityOverlap}$$

### Default Calibrated Weights
- $\alpha = 0.25$ (Semantic Similarity via Cosine Distance)
- $\beta = 0.45$ (DeBERTa Entailment Probability)
- $\gamma = 0.35$ (DeBERTa Contradiction Probability Penalty)
- $\delta = 0.15$ (Named Entity & Numeric Overlap Ratio)

---

## 📊 4-Way Decision Thresholding

| Verdict Category | Fused Score Band / Condition | Description |
| :--- | :--- | :--- |
<<<<<<< HEAD
| **Supported** 🟢 | $\text{Fused Score} \ge 0.70$ | Evidence strongly entails all atomic facts in the claim. |
| **Partially Supported** 🟡 | $0.40 \le \text{Fused Score} < 0.70$ | Claim is directionally correct, but evidence omits specific details/entities. |
| **Unsupported** ⚪ | $0.10 \le \text{Fused Score} < 0.40$ or $\text{SemSim} < 0.15$ | Evidence is off-topic or neutral regarding the claim. |
| **Contradicted** 🔴 | $\text{Fused Score} < 0.10$ or $P(\text{contradict}) > 0.60$ | Evidence explicitly negates the assertions in the claim. |
=======
| **Supported** | $\text{Fused Score} \ge 0.70$ | Evidence strongly entails all atomic facts in the claim. |
| **Partially Supported** | $0.40 \le \text{Fused Score} < 0.70$ | Claim is directionally correct, but evidence omits specific details/entities. |
| **Unsupported** | $0.10 \le \text{Fused Score} < 0.40$ or $\text{SemSim} < 0.15$ | Evidence is off-topic or neutral regarding the claim. |
| **Contradicted** | $\text{Fused Score} < 0.10$ or $P(\text{contradict}) > 0.60$ | Evidence explicitly negates the assertions in the claim. |
>>>>>>> origin/main

---

## 🚀 Key Features

<<<<<<< HEAD
1. **Atomic Claim Extraction & Coreference Resolution**: Rule-based sentence segmentation with spaCy fallback to split complex LLM answers into single, testable factual propositions with subject restoration for pronouns (`it`, `he`, `she`).
2. **Fast CPU-Only In-Process Retrieval**: Embeds documents using `all-MiniLM-L6-v2` and searches flat inner-product FAISS vector indexes on the fly—zero external database servers required.
3. **Robust Asymmetric NLI**: Formulates claim verification as premise ($E$) to hypothesis ($C$) inference using `cross-encoder/nli-deberta-v3-base`. Includes off-topic semantic gates ($\text{SemSim} < 0.15$) to prevent false contradiction triggers.
4. **Local Explainable AI (XAI)**: Generates precise single-sentence human-readable justifications grounded in numerical score breakdowns via local Ollama (`phi3:mini` or `qwen2:1.5b`). Includes automatic zero-latency fallback templates when Ollama is offline.
5. **Low Hardware Footprint**: Fully optimized to run locally on consumer laptops (e.g., Ryzen 3 / Core i5 CPU, 8–12GB RAM, CPU-only PyTorch).
=======
1. **Atomic Claim Extraction**: Rule-based sentence segmentation with spaCy fallback to split complex LLM answers into single, testable factual propositions.
2. **Fast CPU-Only In-Process Retrieval**: Embeds documents using `all-MiniLM-L6-v2` and searches flat inner-product FAISS vector indexes on the fly—zero external database servers required.
3. **Robust Asymmetric NLI**: Formulates claim verification as premise ($E$) to hypothesis ($C$) inference using `cross-encoder/nli-deberta-v3-base`. Includes off-topic semantic gates ($\text{SemSim} < 0.15$) to prevent false contradiction triggers.
4. **Local Explainable AI (XAI)**: Generates precise single-sentence human-readable justifications grounded in numerical score breakdowns via local Ollama (`qwen2:1.5b` or `phi3:mini`). Includes automatic zero-latency fallback templates when Ollama is offline.
5. **Low Hardware Footprint**: Fully optimized to run locally on consumer laptops (e.g., Ryzen 3 CPU, 12GB RAM, CPU-only PyTorch).
>>>>>>> origin/main

---

## 📁 Repository Structure

```
VeriGround/
├── backend/
│   ├── app.py                         # Flask REST API Server & Route Handlers
│   ├── evidence_retrieval.py          # Module 3: FAISS & Sentence Transformers Retrieval
│   ├── nli_verification.py            # Module 4: DeBERTa NLI & Weighted Fusion Logic
│   ├── explanation_generation.py      # Module 5: Local Ollama XAI & Template Fallback
│   ├── nlp_engine.py                  # Modules 1 & 2: Text Cleaning & Sentence Segmentation
│   ├── file_parser.py                 # Document Parsing Utilities (PDF, DOCX, TXT)
│   ├── requirements.txt               # Backend Python Dependencies
│   ├── test_evidence_retrieval.py     # Module 3 Verification Test Suite
<<<<<<< HEAD
│   ├── test_nli_verification.py       # Module 4 Verdict Verification Test Suite
│   └── test_explanation_generation.py # Module 5 Ollama / Fallback Test Suite
=======
│   ├── test_nli_verification.py          # Module 4 Verdict Verification Test Suite
│   └── test_explanation_generation.py  # Module 5 Ollama / Fallback Test Suite
>>>>>>> origin/main
├── frontend/                          # React + Vite Interactive Dashboard
│   ├── src/
│   │   ├── components/                # Modular React Dashboard Components
│   │   ├── services/                  # API Call Abstractions
│   │   ├── App.jsx                    # Main UI Assembly
│   │   └── main.jsx                   # React Entry Point
│   └── package.json                   # Frontend Node.js Dependencies
├── docs/
│   └── module4_debugging_notes.md     # In-depth Engineering Notes & NLI Edge-Case Analysis
├── VeriGround_Project_Plan.pdf        # System Technical Specification (PDF)
├── VeriGround_Project_Plan.docx       # System Technical Specification (DOCX)
<<<<<<< HEAD
├── DEPLOYMENT.md                      # Vercel & Production Deployment Guide
=======
>>>>>>> origin/main
└── README.md                          # Project Documentation
```

---

## 🛠️ Quick Start & Installation

### 1. Prerequisites
- **Python**: 3.10+
- **Node.js**: 18+ & npm
- **Ollama**: (Optional for local LLM explanations) Download from [ollama.ai](https://ollama.ai/)

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Download spaCy English model
python -m spacy download en_core_web_sm

# Run verification test suites to check installation
python test_evidence_retrieval.py
python test_nli_verification.py
python test_explanation_generation.py

# Start Flask backend server (runs on http://localhost:5000)
python app.py
```

### 3. Optional Local LLM (Ollama) Setup
```bash
# Pull lightweight model for explanation generation
<<<<<<< HEAD
ollama pull phi3:mini  # or: ollama pull qwen2:1.5b
=======
ollama pull qwen2:1.5b
>>>>>>> origin/main

# Start Ollama server (runs on http://localhost:11434)
ollama serve
```

### 4. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install Node modules
npm install

# Start Vite development server
npm run dev
```

---

## 🧪 Verification & Output Demonstration

### Module 3 — Evidence Retrieval Test Output
```
CLAIM : The Eiffel Tower was built in 1889 and is located in Paris.
----------------------------------------------------------------------
  Rank 1  |  source=doc_eiffel  |  Score: 0.7916
  Text : The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris...

CLAIM : Water boils at 100 degrees Celsius at standard atmospheric pressure.
----------------------------------------------------------------------
  Rank 1  |  source=doc_water   |  Score: 0.8951
  Text : Water boils at 100 degrees Celsius (212 degrees Fahrenheit) under standard pressure...
```

### Module 4 — Verdict Classification Output
```
[Case 1/4]  ✅ Supported      | Fused Score: 0.8039 (SemSim: 0.82, P_entail: 0.9977, Overlap: 1.00)
[Case 2/4]  🟡 Partial        | Fused Score: 0.6373 (SemSim: 0.76, P_entail: 0.9939, Overlap: 0.00)
[Case 3/4]  ⬜ Unsupported    | Fused Score: 0.0076 (Off-Topic Gate Triggered: SemSim < 0.15)
[Case 4/4]  ❌ Contradicted   | Fused Score: 0.0000 (Contradiction Dominance Triggered: P_contradict > 0.60)
```

---

## 📜 License & Acknowledgments

Prepared for Technical Seminar / Project Review, Department of Computer Science and Business Systems, Panimalar Engineering College.  
Developed by **Team Mutex** (Rohith V K, Shafeeq S, Sabarish J, Sabarish R, Srikesh R, Vignesh R).

Released under the [MIT License](LICENSE).

---

## 📄 License

[MIT](LICENSE) — © 2026 Sabarish R.
