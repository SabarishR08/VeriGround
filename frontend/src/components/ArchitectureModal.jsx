import React from 'react';
import { X, Layers, Cpu, Database, CheckCircle2, ArrowDown } from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl rounded-2xl border border-gray-200 p-6 space-y-6 relative overflow-y-auto max-h-[90vh] bg-white shadow-sm">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">VeriGround Framework Architecture</h3>
              <p className="text-xs text-slate-400">Retrieval-Grounding Verification Pipeline Flow</p>
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
        <div className="space-y-6 py-2">
          
          {/* Module 1 Block */}
          <div className="p-4 rounded-xl bg-white border border-gray-100 text-center space-y-2 relative">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-primary text-[10px] font-semibold uppercase tracking-wider">
              MODULE 1
            </span>
            <h4 className="text-base font-semibold text-gray-900">AI Content Input Module</h4>
            <p className="text-xs text-slate-400">
              Input Sources: ChatGPT, Gemini, Claude, Copilot, DeepSeek, PDF, DOCX, TXT, or Website URL
            </p>
            <div className="pt-2 border-t border-slate-800 text-xs font-mono text-cyan-400">
              Output: Cleaned Text & Sentence Segmentation Metrics
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <ArrowDown className="w-4 h-4 text-cyan-400" />
            </div>
          </div>

          {/* Module 2 Block */}
          <div className="p-4 rounded-xl bg-white border border-gray-100 text-center space-y-2 relative">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-primary text-[10px] font-semibold uppercase tracking-wider">
              MODULE 2
            </span>
            <h4 className="text-base font-semibold text-gray-900">Intelligent Claim Extraction</h4>
            <p className="text-xs text-slate-400">
              NLP Engine: Evaluates linguistic indicators to isolate factual assertions from non-verifiable opinions
            </p>
            <div className="pt-2 border-t border-slate-800 text-xs font-mono text-indigo-300">
              Output: List of Factual Claims with Confidence Scores & Reasoned Ignored Sentences
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <ArrowDown className="w-4 h-4 text-indigo-400" />
            </div>
          </div>

          {/* Module 3 Block */}
          <div className="p-4 rounded-xl bg-white border border-gray-100 text-center space-y-2 relative">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-success text-[10px] font-semibold uppercase tracking-wider">
              MODULE 3
            </span>
            <h4 className="text-base font-semibold text-gray-900">Semantic Grounding & Verification</h4>
            <p className="text-xs text-slate-400">
              Embedding Generation & Retrieval: Compares vector representations against external ground-truth datasets
            </p>
            <div className="pt-2 border-t border-slate-800 text-xs font-mono text-emerald-400">
              Output: Verified Claim Grounding Report & Hallucination Score
            </div>
          </div>

        </div>

        {/* Technology Stack Table */}
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Technology Stack Specifications
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-[#0B1120] text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-2 border-b border-slate-800">Component</th>
                  <th className="p-2 border-b border-slate-800">Technology</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                <tr>
                  <td className="p-2 font-bold text-cyan-400">Frontend UI</td>
                  <td className="p-2">React + Tailwind CSS + Lucide Icons</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-cyan-400">Backend Framework</td>
                  <td className="p-2">Python Flask REST API</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-cyan-400">NLP & Tokenization</td>
                  <td className="p-2">spaCy (en_core_web_sm) + NLTK (punkt)</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-cyan-400">Claim Classifier</td>
                  <td className="p-2">Entity Density + Linguistic POS Rules</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-cyan-400">File & URL Parsing</td>
                  <td className="p-2">PyPDF2 + python-docx + BeautifulSoup</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-cyan-400">Animations</td>
                  <td className="p-2">Framer Motion + CSS Glassmorphic Effects</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
}
