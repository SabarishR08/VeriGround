import React from 'react';
import { X, Layers, ArrowDown } from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-indigo-500/40 shadow-glow-violet p-6 space-y-6 relative overflow-y-auto max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">VeriGround Framework Architecture</h3>
              <p className="text-xs text-slate-400">End-to-End 5-Module Retrieval-Grounding Verification Pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workflow Diagram */}
        <div className="space-y-4 py-2">

          {/* Module 1 */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 shadow-glow-cyan text-center space-y-1 relative">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-extrabold uppercase tracking-wider">
              MODULE 1 — AI CONTENT INPUT & PREPROCESSING
            </span>
            <h4 className="text-sm font-extrabold text-white">Multi-Source Document Parser</h4>
            <p className="text-xs text-slate-400">
              Parses text, PDF, DOCX, and web URLs. Performs HTML stripping, text normalization, and sentence segmentation.
            </p>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-4 h-4 text-cyan-400" />
          </div>

          {/* Module 2 */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/40 shadow-glow-violet text-center space-y-1 relative">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase tracking-wider">
              MODULE 2 — INTELLIGENT CLAIM EXTRACTION
            </span>
            <h4 className="text-sm font-extrabold text-white">Linguistic & Academic Rule Classifier</h4>
            <p className="text-xs text-slate-400">
              Isolates factual declarative statements while filtering subjective opinions, queries, greetings, and unverifiable predictions.
            </p>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-4 h-4 text-indigo-400" />
          </div>

          {/* Module 3 */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-teal-500/40 shadow-glow-teal text-center space-y-1 relative">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-extrabold uppercase tracking-wider">
              MODULE 3 — DENSE VECTOR RETRIEVAL
            </span>
            <h4 className="text-sm font-extrabold text-white">all-MiniLM-L6-v2 + In-Process FAISS</h4>
            <p className="text-xs text-slate-400">
              Generates 384d normalized dense embeddings for claims & knowledge chunks; retrieves top-k evidence via inner product search.
            </p>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-4 h-4 text-teal-400" />
          </div>

          {/* Module 4 */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-purple-500/40 shadow-glow-purple text-center space-y-1 relative">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-extrabold uppercase tracking-wider">
              MODULE 4 — NLI & WEIGHTED EVIDENCE FUSION
            </span>
            <h4 className="text-sm font-extrabold text-white">DeBERTa-v3 Cross-Encoder & 4-Way Fusion</h4>
            <p className="text-xs text-slate-400">
              Evaluates NLI probabilities P(entailment), P(neutral), P(contradiction) with spaCy entity overlap (δ = 0.15) and outputs 4-way verdicts (Supported, Partially Supported, Unsupported, Contradicted).
            </p>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-4 h-4 text-purple-400" />
          </div>

          {/* Module 5 */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 shadow-glow-emerald text-center space-y-1 relative">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
              MODULE 5 — EXPLAINABLE AI (XAI)
            </span>
            <h4 className="text-sm font-extrabold text-white">Natural Language Justification Engine</h4>
            <p className="text-xs text-slate-400">
              Generates human-readable, one-sentence explanations anchored in verdict signals via local Ollama <code className="text-cyan-300 font-mono">phi3:mini</code> (or grounded template fallback).
            </p>
          </div>

        </div>

        {/* Technology Stack Table */}
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Framework Technical Specifications
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-[#0B1120] text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-2 border-b border-slate-800">Module</th>
                  <th className="p-2 border-b border-slate-800">Core Engine / Model</th>
                  <th className="p-2 border-b border-slate-800">Functionality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                <tr>
                  <td className="p-2 font-bold text-cyan-400">Module 1</td>
                  <td className="p-2">PyPDF2, python-docx, BeautifulSoup</td>
                  <td className="p-2">Document parsing & sentence cleaning</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-cyan-400">Module 2</td>
                  <td className="p-2">Academic Rule Classifier + POS</td>
                  <td className="p-2">Claim extraction & opinion filtering</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-cyan-400">Module 3</td>
                  <td className="p-2">all-MiniLM-L6-v2 + FAISS</td>
                  <td className="p-2">Dense vector evidence retrieval</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-cyan-400">Module 4</td>
                  <td className="p-2">nli-deberta-v3-base + spaCy</td>
                  <td className="p-2">Weighted fusion & 4-way verdicting</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-cyan-400">Module 5</td>
                  <td className="p-2">Ollama phi3:mini / Grounded Rules</td>
                  <td className="p-2">Natural language explanation generation</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Close Architecture
          </button>
        </div>

      </div>
    </div>
  );
}
