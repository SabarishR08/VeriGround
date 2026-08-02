import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  PieChart as PieIcon,
  ShieldCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function ResultsDashboard({
  claims,
  verifications,
  explanations,
  loadingExplain,
  currentExplainClaimIndex,
  onReset
}) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  // Compute summary stats
  const totalClaims = verifications ? verifications.length : 0;
  const countSupported = verifications ? verifications.filter(v => v.verdict === 'Supported').length : 0;
  const countPartial = verifications ? verifications.filter(v => v.verdict === 'Partially Supported').length : 0;
  const countUnsupported = verifications ? verifications.filter(v => v.verdict === 'Unsupported').length : 0;
  const countContradicted = verifications ? verifications.filter(v => v.verdict === 'Contradicted').length : 0;

  const chartData = [
    { name: 'Supported', value: countSupported, color: '#10b981' },
    { name: 'Partially Supported', value: countPartial, color: '#f59e0b' },
    { name: 'Unsupported', value: countUnsupported, color: '#64748b' },
    { name: 'Contradicted', value: countContradicted, color: '#f43f5e' },
  ].filter(d => d.value > 0);

  const getVerdictBadge = (verdict) => {
    switch (verdict) {
      case 'Supported':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-xs font-bold shadow-glow-emerald">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Supported</span>
          </span>
        );
      case 'Partially Supported':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-md bg-amber-950/80 text-amber-400 border border-amber-500/40 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Partially Supported</span>
          </span>
        );
      case 'Unsupported':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Unsupported</span>
          </span>
        );
      case 'Contradicted':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-md bg-rose-950/80 text-rose-400 border border-rose-500/40 text-xs font-bold">
            <XCircle className="w-3.5 h-3.5" />
            <span>Contradicted</span>
          </span>
        );
      default:
        return <span className="text-slate-400 text-xs">{verdict}</span>;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Summary Bar & Donut Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-extrabold text-white">Verification Telemetry Summary</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Analyzed Claims</div>
              <div className="text-xl font-extrabold text-white mt-1">{totalClaims}</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
              <div className="text-[10px] font-bold text-emerald-400 uppercase">Supported</div>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">{countSupported}</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40">
              <div className="text-[10px] font-bold text-amber-400 uppercase">Partial</div>
              <div className="text-xl font-extrabold text-amber-400 mt-1">{countPartial}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Unsupported</div>
              <div className="text-xl font-extrabold text-slate-300 mt-1">{countUnsupported}</div>
            </div>
            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40">
              <div className="text-[10px] font-bold text-rose-400 uppercase">Contradicted</div>
              <div className="text-xl font-extrabold text-rose-400 mt-1">{countContradicted}</div>
            </div>
          </div>
        </div>

        {/* Recharts Donut */}
        <div className="md:col-span-4 h-36 flex items-center justify-center relative">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-xs text-slate-500 flex items-center space-x-1">
              <PieIcon className="w-4 h-4" />
              <span>No data</span>
            </div>
          )}
        </div>
      </div>

      {/* Per-Claim Result Cards */}
      <div className="space-y-4">
        {verifications && verifications.map((item, idx) => {
          const isExpanded = expandedIndex === idx;
          const expInfo = explanations ? explanations[idx] : null;
          const isExplainingThis = loadingExplain && currentExplainClaimIndex === idx;

          return (
            <div
              key={idx}
              className={`glass-panel p-5 rounded-2xl border transition-all ${
                item.verdict === 'Supported'
                  ? 'border-emerald-500/30'
                  : item.verdict === 'Partially Supported'
                  ? 'border-amber-500/30'
                  : item.verdict === 'Contradicted'
                  ? 'border-rose-500/30'
                  : 'border-slate-800'
              }`}
            >
              {/* Top Row: Claim Text + Verdict + Fused Score */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                      Claim #{idx + 1}
                    </span>
                    {getVerdictBadge(item.verdict)}
                  </div>
                  <h3 className="text-sm font-bold text-white leading-relaxed">
                    "{item.claim}"
                  </h3>
                </div>

                <div className="flex items-center space-x-4 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fused Score</div>
                    <div className="text-lg font-mono font-extrabold text-cyan-400">
                      {item.fused_score !== undefined ? item.fused_score.toFixed(4) : '0.0000'}
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Module 5 Explanation Row */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                {isExplainingThis ? (
                  <div className="flex items-center space-x-2 text-xs text-cyan-400 bg-cyan-950/30 p-3 rounded-xl border border-cyan-500/30">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating explainable AI justification via Ollama (qwen2:1.5b)... (~15-25s)</span>
                  </div>
                ) : expInfo ? (
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>XAI Justification ({expInfo.model || 'qwen2:1.5b'})</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {expInfo.source === 'ollama' ? 'Local LLM' : 'Template Fallback'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      "{expInfo.explanation}"
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Expandable Evidence & Component Telemetry */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 animate-fadeIn">
                  
                  {/* Evidence Text */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Matched Evidence Chunk ({item.chunk_id || 'N/A'} · Source: {item.source_id || 'N/A'})
                    </span>
                    <p className="text-xs font-mono text-slate-300 bg-[#070B14] p-3 rounded-xl border border-slate-800 leading-relaxed">
                      {item.matched_evidence ? item.matched_evidence.text : 'No matching evidence chunk found'}
                    </p>
                  </div>

                  {/* Component Score Telemetry (Monospace) */}
                  {item.components && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Fusion Component Telemetry Breakdown
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">SemSim (α=0.25)</span>
                          <span className="font-bold text-cyan-400">
                            {item.components.sem_sim !== undefined ? item.components.sem_sim.toFixed(4) : '0.0000'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">P(entail) (β=0.45)</span>
                          <span className="font-bold text-emerald-400">
                            {item.components.p_entail !== undefined ? item.components.p_entail.toFixed(4) : '0.0000'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">P(neutral)</span>
                          <span className="font-bold text-slate-300">
                            {item.components.p_neutral !== undefined ? item.components.p_neutral.toFixed(4) : '0.0000'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">P(contradict) (γ=0.35)</span>
                          <span className="font-bold text-rose-400">
                            {item.components.p_contradict !== undefined ? item.components.p_contradict.toFixed(4) : '0.0000'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">EntityOverlap (δ=0.15)</span>
                          <span className="font-bold text-amber-400">
                            {item.components.entity_overlap !== undefined ? item.components.entity_overlap.toFixed(4) : '0.0000'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          );
        })}
      </div>

      <div className="pt-4 text-center">
        <button
          onClick={onReset}
          className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
        >
          Start New Verification Cycle
        </button>
      </div>

    </div>
  );
}
