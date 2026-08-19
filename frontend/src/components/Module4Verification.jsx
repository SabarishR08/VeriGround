import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, HelpCircle, ArrowRight, RefreshCw, BarChart2, Layers } from 'lucide-react';
import { verifyClaims } from '../services/api';

export default function Module4Verification({ retrievalData, onVerificationComplete, onContinueToModule5 }) {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResults, setVerificationResults] = useState(null);

  useEffect(() => {
    if (retrievalData) {
      runVerification(retrievalData);
    }
  }, [retrievalData]);

  const runVerification = async (data) => {
    setIsLoading(true);
    try {
      const results = await verifyClaims(data.results || []);
      setVerificationResults(results);
      if (onVerificationComplete) {
        onVerificationComplete(results);
      }
    } catch (err) {
      console.error("Verification error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getVerdictStyle = (verdict) => {
    switch (verdict) {
      case 'Supported':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/40',
          text: 'text-emerald-400',
          icon: CheckCircle2,
          glow: 'shadow-glow-emerald',
          badgeBg: 'bg-emerald-500 text-slate-950'
        };
      case 'Partially Supported':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/40',
          text: 'text-amber-400',
          icon: AlertTriangle,
          glow: 'shadow-glow-amber',
          badgeBg: 'bg-amber-500 text-slate-950'
        };
      case 'Contradicted':
        return {
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/40',
          text: 'text-rose-400',
          icon: XCircle,
          glow: 'shadow-glow-rose',
          badgeBg: 'bg-rose-500 text-slate-950'
        };
      default: // Unsupported
        return {
          bg: 'bg-slate-800/40',
          border: 'border-slate-700',
          text: 'text-slate-400',
          icon: HelpCircle,
          glow: '',
          badgeBg: 'bg-slate-700 text-slate-200'
        };
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Title Header Card */}
      <div className="text-center py-6 glass-panel rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl"></div>

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
          Module 4 — NLI & Weighted Evidence Fusion
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Claim-Evidence Cross-Encoder Verification
        </h2>
        <p className="text-slate-400 text-sm max-w-3xl mx-auto mt-2">
          Executes <code className="text-cyan-300 font-mono font-bold">cross-encoder/nli-deberta-v3-base</code> and spaCy entity overlap algorithm. Combines semantic similarity (α = 0.25), entailment (β = 0.45), contradiction (γ = 0.35), and entity overlap (δ = 0.15) into a fused grounding score.
        </p>
      </div>

      {isLoading ? (
        <div className="glass-panel rounded-2xl p-12 border border-slate-800 text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
          <h3 className="text-lg font-bold text-slate-200">Evaluating NLI Entailment & Entity Overlap...</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Passing claim/evidence premise-hypothesis pairs through DeBERTa-v3 cross-encoder and computing named entity intersections.
          </p>
        </div>
      ) : verificationResults ? (
        <div className="space-y-6">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Supported Claims",
                count: verificationResults.verifications.filter(v => v.verdict === 'Supported').length,
                color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
              },
              {
                label: "Partially Supported",
                count: verificationResults.verifications.filter(v => v.verdict === 'Partially Supported').length,
                color: "text-amber-400 border-amber-500/30 bg-amber-500/10"
              },
              {
                label: "Unsupported Claims",
                count: verificationResults.verifications.filter(v => v.verdict === 'Unsupported').length,
                color: "text-slate-400 border-slate-700 bg-slate-800/40"
              },
              {
                label: "Contradicted Claims",
                count: verificationResults.verifications.filter(v => v.verdict === 'Contradicted').length,
                color: "text-rose-400 border-rose-500/30 bg-rose-500/10"
              }
            ].map((stat, idx) => (
              <div key={idx} className={`p-4 rounded-xl border ${stat.color} text-center space-y-1`}>
                <div className="text-2xl font-extrabold font-mono">{stat.count}</div>
                <div className="text-xs font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Verification Cards */}
          <div className="space-y-4">
            {verificationResults.verifications.map((item, idx) => {
              const style = getVerdictStyle(item.verdict);
              const VerdictIcon = style.icon;
              const comp = item.components || {};

              return (
                <div key={idx} className={`glass-panel rounded-2xl p-6 border ${style.border} ${style.glow} space-y-4`}>
                  
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-bold text-cyan-400 font-mono px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/30">
                        Claim #{idx + 1}
                      </span>
                      <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${style.badgeBg}`}>
                        <VerdictIcon className="w-3.5 h-3.5" />
                        <span>{item.verdict}</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 font-mono text-xs text-slate-300">
                      <span>Fused Score:</span>
                      <span className="text-sm font-extrabold text-cyan-300">{(item.fused_score * 100).toFixed(1)}%</span>
                      <span className="text-slate-500">({item.fused_score})</span>
                    </div>
                  </div>

                  {/* Claim Text */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evaluated Claim Statement:</h4>
                      {item.is_compound && (
                        <span className="text-[11px] font-mono font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
                          Decomposed Compound Statement ({item.sub_claim_verdicts?.length || 2} Atomic Sub-claims)
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-100 bg-[#0B1120] p-3 rounded-xl border border-slate-800">
                      "{item.claim}"
                    </p>

                    {/* Atomic Sub-claims Decomposition List */}
                    {item.sub_claim_verdicts && item.sub_claim_verdicts.length > 0 && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                        <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Atomic Sub-claim Decomposition & Verification:</span>
                          <span className="text-cyan-400 font-mono">ClaimVer / RAGChecker Pipeline</span>
                        </div>
                        <div className="space-y-1.5 font-mono text-xs">
                          {item.sub_claim_verdicts.map((sub, sIdx) => {
                            const isSupp = sub.verdict === 'Supported';
                            return (
                              <div key={sIdx} className="flex items-center justify-between p-2 rounded-lg bg-[#070C18] border border-slate-800">
                                <div className="flex items-center space-x-2 truncate">
                                  <span className={isSupp ? "text-emerald-400 font-bold" : "text-slate-400"}>
                                    {isSupp ? "✅" : "❌"}
                                  </span>
                                  <span className="text-slate-200 truncate">"{sub.claim}"</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ml-2 ${
                                  isSupp ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400 border border-slate-700"
                                }`}>
                                  {sub.verdict}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>


                  {/* Component Scores Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                    <div className="p-2.5 rounded-lg bg-[#070C18] border border-slate-800 text-center font-mono">
                      <div className="text-[10px] text-slate-400 uppercase">Semantic Sim (α)</div>
                      <div className="text-sm font-bold text-cyan-400">{comp.sem_sim ?? 0}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#070C18] border border-slate-800 text-center font-mono">
                      <div className="text-[10px] text-slate-400 uppercase">P(Entailment) (β)</div>
                      <div className="text-sm font-bold text-emerald-400">{comp.p_entail ?? 0}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#070C18] border border-slate-800 text-center font-mono">
                      <div className="text-[10px] text-slate-400 uppercase">P(Neutral)</div>
                      <div className="text-sm font-bold text-slate-300">{comp.p_neutral ?? 0}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#070C18] border border-slate-800 text-center font-mono">
                      <div className="text-[10px] text-slate-400 uppercase">P(Contradict) (γ)</div>
                      <div className="text-sm font-bold text-rose-400">{comp.p_contradict ?? 0}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#070C18] border border-slate-800 text-center font-mono">
                      <div className="text-[10px] text-slate-400 uppercase">Entity Overlap (δ)</div>
                      <div className="text-sm font-bold text-purple-400">{comp.entity_overlap ?? 0}</div>
                    </div>
                  </div>

                  {/* Grounding Evidence Chunk */}
                  {item.chunk_id && (
                    <div className="pt-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Best Grounding Evidence Chunk ({item.chunk_id}):</div>
                      <p className="text-xs text-slate-300 italic bg-[#060A14] p-3 rounded-xl border border-slate-800/80">
                        "{retrievalData?.results?.[idx]?.evidence?.[0]?.text || 'Grounding evidence chunk verified.'}"
                      </p>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => onContinueToModule5 && onContinueToModule5(verificationResults)}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-extrabold text-sm shadow-glow-cyan transition-all cursor-pointer"
            >
              <span>Proceed to Module 5: Explainable AI Justifications</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      ) : null}

    </div>
  );
}
