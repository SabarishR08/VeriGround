import React, { useState } from 'react';
import { Database, Search, CheckCircle, ShieldAlert, Zap, Layers, Server, Sparkles } from 'lucide-react';

export default function Module3Preview({ claims, onReset }) {
  const [retrieving, setRetrieving] = useState(false);
  const [retrievedClaims, setRetrievedClaims] = useState(null);

  const simulateRetrieval = () => {
    setRetrieving(true);
    setTimeout(() => {
      setRetrieving(false);
      setRetrievedClaims(
        claims.map((c) => ({
          ...c,
          vector_id: `vec_${Math.floor(1000 + Math.random() * 9000)}`,
          retrieved_sources: [
            "Wikipedia Knowledge Graph (2026.04 Dump)",
            "IEEE Xplore Research Index",
            "Verified AI News Corpus"
          ],
          grounding_status: "VERIFIED_SUPPORTED",
          similarity_score: (0.91 + Math.random() * 0.08).toFixed(3)
        }))
      );
    }, 1500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Title Header Card */}
      <div className="text-center py-6 glass-panel rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl"></div>

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
          Module 3 Pipeline Readiness
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Semantic Claim Understanding & Evidence Retrieval
        </h2>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto mt-2">
          Transfers extracted claims into dense vector embeddings for real-time external knowledge retrieval and claim grounding verification.
        </p>
      </div>

      {/* Vector Queue Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Queued Vector Embeddings */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-slate-200 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>Queued Claim Embeddings</span>
            </h3>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30">
              {claims?.length || 0} Vectors Queued
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {claims && claims.length > 0 ? (
              claims.map((c, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#0B1120] border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-cyan-400 font-mono">Claim #{idx + 1}</span>
                    <span className="text-slate-500 font-mono">Dense Vector [768d]</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200">{c.text}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                    <span>Confidence: {c.confidence}%</span>
                    <span className="text-emerald-400 font-bold">Ready for FAISS / Milvus</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No claims available from Module 2.</p>
            )}
          </div>

          <button
            type="button"
            onClick={simulateRetrieval}
            disabled={retrieving || !claims || claims.length === 0}
            className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-extrabold text-sm shadow-glow-cyan transition-all cursor-pointer"
          >
            {retrieving ? (
              <>
                <Search className="w-4 h-4 animate-spin" />
                <span>Simulating External Knowledge Retrieval...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Simulate Grounding Retrieval Pipeline</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Grounding Verification Output */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-slate-200 flex items-center space-x-2">
              <Server className="w-5 h-5 text-emerald-400" />
              <span>Grounding Verification Output</span>
            </h3>
            {retrievedClaims && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                100% Grounded
              </span>
            )}
          </div>

          {retrievedClaims ? (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1 animate-fadeIn">
              {retrievedClaims.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/40 shadow-glow-emerald space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                      <CheckCircle className="w-4 h-4" />
                      <span>{item.grounding_status}</span>
                    </span>
                    <span className="text-xs font-mono text-cyan-300">
                      Similarity: {item.similarity_score}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-100 bg-[#0B1120] p-2.5 rounded-lg border border-slate-800">
                    "{item.text}"
                  </p>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Retrieved Knowledge Evidence Sources:
                    </span>
                    <ul className="text-[11px] text-slate-300 space-y-0.5 font-mono list-disc list-inside">
                      {item.retrieved_sources.map((src, sIdx) => (
                        <li key={sIdx}>{src}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-3">
              <Database className="w-12 h-12 text-slate-600 animate-bounce" />
              <p className="text-xs text-slate-400 max-w-xs">
                Click <strong>Simulate Grounding Retrieval Pipeline</strong> to demonstrate Module 3 evidence matching against live knowledge bases.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onReset}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-all"
            >
              Start New Verification Cycle (Module 1)
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
