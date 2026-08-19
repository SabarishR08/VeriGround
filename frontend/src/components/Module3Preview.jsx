import React, { useState } from 'react';
import { Database, Search, Layers, Server, Zap, FileText, CheckCircle2, ArrowRight, AlertTriangle, Globe, BookOpen } from 'lucide-react';
import { retrieveEvidence } from '../services/api';

const PRESET_KNOWLEDGE_BASES = [
  {
    id: "benchmark-kb",
    title: "Ground-Truth Knowledge Base (Benchmark Corpus)",
    text: `The Eiffel Tower was constructed between 1887 and 1889 and stands on the Champ de Mars in Paris, France. It is one of the most famous architectural landmarks in Europe.

OpenAI officially announced and released the GPT-4 large language model in March 2023.

Water boils at 100°C (212°F) under standard atmospheric pressure (1 atm / 101.3 kPa).

Tokyo is the capital and most populous metropolis of Japan, located at the head of Tokyo Bay on the eastern coast of Honshu.

Artificial Intelligence has made significant progress in computer vision and natural language processing, but human replacement predictions remain speculative.`
  },
  {
    id: "ai-history-kb",
    title: "AI History & Computing Knowledge Base",
    text: `Artificial Intelligence as an academic discipline was founded at a workshop on the campus of Dartmouth College in 1955, organized by John McCarthy, Marvin Minsky, Nathaniel Rochester, and Claude Shannon.

DeepMind developed AlphaGo, a computer program that defeated world champion Go player Lee Sedol 4-1 in March 2016.

Python was created by Guido van Rossum and first released in 1991 as a successor to the ABC programming language.`
  }
];

export default function Module3Preview({ claims, onRetrievalComplete, onContinueToModule4 }) {
  const [selectedKbIndex, setSelectedKbIndex] = useState(0);
  const [customKbText, setCustomKbText] = useState(PRESET_KNOWLEDGE_BASES[0].text);
  
  // Default Mode: 'auto_web' (Auto-Fetch Online Live Web & Wikipedia)
  const [kbMode, setKbMode] = useState('auto_web');
  
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [retrievalResults, setRetrievalResults] = useState(null);

  const handleRunRetrieval = async () => {
    if (!claims || claims.length === 0) return;
    setIsRetrieving(true);

    const isAuto = kbMode === 'auto_web';
    let sourceDocs = [];

    if (kbMode === 'preset') {
      sourceDocs = [{ id: "ground_truth_doc_1", text: PRESET_KNOWLEDGE_BASES[selectedKbIndex].text }];
    } else if (kbMode === 'custom') {
      sourceDocs = [{ id: "custom_doc_1", text: customKbText }];
    }

    try {
      const data = await retrieveEvidence(claims, sourceDocs, 3, isAuto);
      setRetrievalResults(data);
      if (onRetrievalComplete) {
        onRetrievalComplete(data);
      }
    } catch (err) {
      console.error("Retrieval error:", err);
    } finally {
      setIsRetrieving(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Title Header Card */}
      <div className="text-center py-6 glass-panel rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl"></div>

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
          Module 3 — Ground-Truth Evidence Retrieval
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight">
          Dense Vector Embedding & Multi-Source FAISS Search
        </h2>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto mt-2 font-medium">
          Automatically fetches live online reference papers (arXiv, Wikipedia, Live Web Knowledge), embeds claims into 384-dimensional dense vectors using <code className="text-cyan-400 font-mono font-bold">all-MiniLM-L6-v2</code>, and builds an in-process FAISS vector index.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Knowledge Base Selection & Queued Claims */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Reference Knowledge Base Selector */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Reference Knowledge Base</span>
              </h3>
              <span className="text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                Multi-Source Online Fetch (Default)
              </span>
            </div>

            <div className="space-y-3">
              {/* Mode Selection Buttons */}
              <div className="flex items-center space-x-2 text-xs flex-wrap gap-y-2">
                <button
                  type="button"
                  onClick={() => setKbMode('auto_web')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    kbMode === 'auto_web' ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 shadow-glow-emerald' : 'bg-slate-900 border border-slate-800 text-slate-400'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Auto-Fetch Online (Default)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setKbMode('preset')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    kbMode === 'preset' ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400' : 'bg-slate-900 border border-slate-800 text-slate-400'
                  }`}
                >
                  Preset Corpora
                </button>
                <button
                  type="button"
                  onClick={() => setKbMode('custom')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    kbMode === 'custom' ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400' : 'bg-slate-900 border border-slate-800 text-slate-400'
                  }`}
                >
                  Custom Text
                </button>
              </div>

              {/* Mode Specific Box */}
              {kbMode === 'auto_web' && (
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-xs text-emerald-300 space-y-2 font-sans">
                  <div className="flex items-center space-x-1.5 font-bold text-emerald-400">
                    <Globe className="w-4 h-4 shrink-0 animate-pulse" />
                    <span>Multi-Source Online Reference Search</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                    Automatically searches and aggregates reference papers and articles across 3 live online knowledge sources:
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono font-bold text-center pt-1">
                    <div className="p-1 rounded bg-slate-900/80 border border-emerald-500/30 text-emerald-300">
                      📄 arXiv Papers
                    </div>
                    <div className="p-1 rounded bg-slate-900/80 border border-cyan-500/30 text-cyan-300">
                      📚 Wikipedia
                    </div>
                    <div className="p-1 rounded bg-slate-900/80 border border-indigo-500/30 text-indigo-300">
                      🌐 Web Search
                    </div>
                  </div>
                </div>
              )}

              {kbMode === 'preset' && (
                <select
                  value={selectedKbIndex}
                  onChange={(e) => setSelectedKbIndex(Number(e.target.value))}
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-cyan-500"
                >
                  {PRESET_KNOWLEDGE_BASES.map((kb, idx) => (
                    <option key={kb.id} value={idx}>
                      {kb.title}
                    </option>
                  ))}
                </select>
              )}

              {kbMode === 'custom' && (
                <textarea
                  value={customKbText}
                  onChange={(e) => setCustomKbText(e.target.value)}
                  rows={5}
                  placeholder="Paste reference text or document content to test evidence grounding..."
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500 font-mono"
                />
              )}

              {kbMode !== 'auto_web' && (
                <div className="p-3 bg-[#0B1120] rounded-xl border border-slate-800/80 text-[11px] space-y-1 font-mono">
                  <div className="font-bold text-slate-300">Document Content Preview:</div>
                  <div className="line-clamp-3 italic text-slate-400 font-sans text-xs">
                    "{kbMode === 'custom' ? customKbText : PRESET_KNOWLEDGE_BASES[selectedKbIndex].text}"
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Queued Claims Card */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Input Claims ({claims?.length || 0})</span>
              </h3>
              <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                Ready to Embed
              </span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {claims && claims.length > 0 ? (
                claims.map((c, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#0B1120] border border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-cyan-400 font-mono">Claim #{idx + 1}</span>
                      <span className="text-slate-400 font-mono font-medium">{c.category || 'Verifiable Claim'}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200">{c.text || c}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No claims available from Module 2.</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleRunRetrieval}
              disabled={isRetrieving || !claims || claims.length === 0}
              className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-extrabold text-sm shadow-glow-cyan transition-all cursor-pointer disabled:opacity-50"
            >
              {isRetrieving ? (
                <>
                  <Search className="w-4 h-4 animate-spin" />
                  <span>
                    {kbMode === 'auto_web' ? 'Fetching arXiv, Wikipedia & Web Sources...' : 'Embedding Claims & Querying FAISS...'}
                  </span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>
                    {kbMode === 'auto_web' ? 'Auto-Fetch Online Papers & Run Retrieval' : 'Run Module 3 Vector Retrieval'}
                  </span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right Column: Retrieved Evidence Results */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold flex items-center space-x-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Ranked Evidence Chunks (FAISS Results)</span>
              </h3>
              {retrievalResults && (
                <div className="flex items-center space-x-2">
                  {retrievalResults.auto_fetched_sources_count > 0 && (
                    <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30 flex items-center space-x-1">
                      <Globe className="w-3 h-3" />
                      <span>{retrievalResults.auto_fetched_sources_count} Online Sources Fetched</span>
                    </span>
                  )}
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    {retrievalResults.total_chunks_indexed} Chunks Indexed
                  </span>
                </div>
              )}
            </div>

            {retrievalResults ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 animate-fadeIn">
                {retrievalResults.results.map((item, idx) => {
                  const topScore = item.evidence && item.evidence.length > 0 ? item.evidence[0].similarity_score : 0;
                  const isLowRelevance = topScore < 0.15;

                  return (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800/60">
                        <span className="font-bold text-cyan-400 font-mono">Claim #{idx + 1}</span>
                        <span className="font-semibold text-slate-300 truncate max-w-[280px]" title={item.claim}>
                          "{item.claim}"
                        </span>
                      </div>

                      {/* Low Similarity Warning Banner if no relevant match */}
                      {isLowRelevance && (
                        <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                          <span>No direct evidence match found in knowledge base (Similarity &lt; 0.15). Showing top vector neighbors.</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-400">
                          Top-k Retrieved Passages:
                        </span>
                        {item.evidence && item.evidence.length > 0 ? (
                          item.evidence.map((ev, evIdx) => {
                            const sim = typeof ev.similarity_score === 'number' ? ev.similarity_score : parseFloat(ev.similarity_score);
                            const isHighSim = sim >= 0.50;
                            const isMedSim = sim >= 0.15 && sim < 0.50;

                            return (
                              <div key={evIdx} className="p-3 rounded-lg bg-[#070C18] border border-slate-800 text-xs space-y-1.5">
                                <div className="flex justify-between items-center font-mono text-[11px]">
                                  <span className="text-emerald-400 font-bold truncate max-w-[220px]" title={ev.source_id}>
                                    Rank #{ev.rank} • {ev.chunk_id}
                                  </span>
                                  
                                  {/* Color-Coded Similarity Score Badge */}
                                  <span className={`font-bold px-2 py-0.5 rounded border text-[11px] ${
                                    isHighSim
                                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                                      : isMedSim
                                      ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                                      : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                                  }`}>
                                    Cosine Similarity: {typeof sim === 'number' ? sim.toFixed(6) : sim}
                                    {!isHighSim && !isMedSim && ' (Low Match)'}
                                  </span>
                                </div>
                                <p className="leading-relaxed font-sans text-xs font-normal text-slate-200">{ev.text}</p>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-slate-500 italic">No matching evidence found above threshold.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-center space-y-3">
                <Database className="w-12 h-12 text-slate-600 animate-pulse" />
                <p className="text-xs text-slate-400 max-w-sm">
                  VeriGround will automatically fetch live reference papers (arXiv, Wikipedia & Web Knowledge) when you click <strong>Auto-Fetch Online Papers & Run Retrieval</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          {retrievalResults && (
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => onContinueToModule4 && onContinueToModule4(retrievalResults)}
                className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-glow-emerald transition-all cursor-pointer"
              >
                <span>Proceed to Module 4: NLI & Fusion Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
