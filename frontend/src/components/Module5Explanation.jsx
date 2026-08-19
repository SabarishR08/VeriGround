import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquareQuote, CheckCircle2, AlertTriangle, XCircle, HelpCircle, Copy, Check, RotateCcw } from 'lucide-react';
import { explainClaim } from '../services/api';

export default function Module5Explanation({ verificationData, retrievalData, onReset }) {
  const [explanations, setExplanations] = useState({});
  const [loadingClaims, setLoadingClaims] = useState({});
  const [copiedFormat, setCopiedFormat] = useState(null);

  useEffect(() => {
    if (verificationData && verificationData.verifications) {
      loadAllExplanations(verificationData.verifications);
    }
  }, [verificationData]);

  const loadAllExplanations = (verifications) => {
    verifications.forEach(async (v, idx) => {
      // If already generated for this index, don't re-fetch unless triggered
      if (explanations[idx]) return;

      const evidenceText = retrievalData?.results?.[idx]?.evidence?.[0]?.text || "";
      setLoadingClaims(prev => ({ ...prev, [idx]: true }));
      try {
        const res = await explainClaim(v.claim, evidenceText, v.verdict, v.components);
        // Instantly display explanation as soon as generated
        setExplanations(prev => ({ ...prev, [idx]: res }));
      } catch (err) {
        console.error(`Error explaining claim #${idx + 1}:`, err);
      } finally {
        setLoadingClaims(prev => ({ ...prev, [idx]: false }));
      }
    });
  };

  const handleExplainSingle = async (idx, item) => {
    setLoadingClaims(prev => ({ ...prev, [idx]: true }));
    const evidenceText = retrievalData?.results?.[idx]?.evidence?.[0]?.text || "";
    try {
      const res = await explainClaim(item.claim, evidenceText, item.verdict, item.components);
      setExplanations(prev => ({ ...prev, [idx]: res }));
    } catch (err) {
      console.error(`Error explaining claim #${idx + 1}:`, err);
    } finally {
      setLoadingClaims(prev => ({ ...prev, [idx]: false }));
    }
  };

  const handleCopyReport = (type) => {
    if (!verificationData) return;

    let content = "";
    if (type === 'markdown') {
      content = `# VeriGround Verification & Explanation Report\n\n`;
      content += `**Generated:** ${new Date().toLocaleString()}\n`;
      content += `**Total Claims Evaluated:** ${verificationData.verifications.length}\n\n`;
      verificationData.verifications.forEach((v, idx) => {
        const exp = explanations[idx]?.explanation || "N/A";
        content += `### Claim ${idx + 1}: ${v.verdict}\n`;
        content += `- **Claim:** "${v.claim}"\n`;
        content += `- **Fused Score:** ${v.fused_score}\n`;
        content += `- **Justification:** ${exp}\n\n`;
      });
    } else {
      content = JSON.stringify({ verificationData, explanations }, null, 2);
    }

    navigator.clipboard.writeText(content);
    setCopiedFormat(type);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  const getVerdictStyle = (verdict) => {
    switch (verdict) {
      case 'Supported':
        return { text: 'text-emerald-500 font-extrabold', bg: 'bg-emerald-500/10 border-emerald-500/40', icon: CheckCircle2 };
      case 'Partially Supported':
        return { text: 'text-amber-500 font-extrabold', bg: 'bg-amber-500/10 border-amber-500/40', icon: AlertTriangle };
      case 'Contradicted':
        return { text: 'text-rose-500 font-extrabold', bg: 'bg-rose-500/10 border-rose-500/40', icon: XCircle };
      default:
        return { text: 'text-slate-400 font-bold', bg: 'bg-slate-800 border-slate-700', icon: HelpCircle };
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Title Header Card */}
      <div className="text-center py-6 glass-panel rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-extrabold uppercase tracking-wider mb-2">
          Module 5 — Explainable AI (XAI Justifications)
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Natural Language Verdict Explanations
        </h2>
        <p className="text-slate-400 text-sm max-w-3xl mx-auto mt-2">
          Generates human-readable, one-sentence evidence justifications using local <code className="text-cyan-400 font-mono font-bold">Ollama phi3:mini</code> (or component-grounded rule engine), explaining why claims were classified as Supported, Partially Supported, Unsupported, or Contradicted.
        </p>
      </div>

      {/* Explanations List */}
      <div className="space-y-4">
        {verificationData?.verifications?.map((item, idx) => {
          const style = getVerdictStyle(item.verdict);
          const VerdictIcon = style.icon;
          const expData = explanations[idx];
          const isClaimLoading = loadingClaims[idx];

          return (
            <div key={idx} className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-cyan-400 font-mono px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/30">
                    Claim #{idx + 1}
                  </span>
                  <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs ${style.bg} ${style.text}`}>
                    <VerdictIcon className="w-3.5 h-3.5" />
                    <span>{item.verdict}</span>
                  </span>
                </div>

                {expData && (
                  <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full border ${
                    expData.source === 'ollama' 
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' 
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                  }`}>
                    Engine: {expData.source === 'ollama' ? `Ollama (${expData.model})` : 'Grounded Template Engine'}
                  </span>
                )}
              </div>

              {/* Claim Content */}
              <div>
                <p className="text-xs font-bold text-slate-300">
                  "{item.claim}"
                </p>
              </div>

              {/* Explanation Quote Box */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 relative space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-400 flex items-center space-x-1.5">
                    <MessageSquareQuote className="w-4 h-4 text-cyan-400" />
                    <span>Module 5 Natural Language Explanation:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleExplainSingle(idx, item)}
                    disabled={isClaimLoading}
                    className="text-[11px] font-mono font-bold text-slate-400 hover:text-cyan-300 transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Regenerate</span>
                  </button>
                </div>

                {isClaimLoading && !expData ? (
                  <div className="py-2 text-xs text-slate-400 flex items-center space-x-2 font-mono">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span>Generating justification text...</span>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-slate-100 leading-relaxed italic">
                    "{expData?.explanation || 'Explanation pending generation...'}"
                  </p>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Report Summary & Export Options */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-200">Verification Report Export</h3>
            <p className="text-xs text-slate-400">Download or copy the complete multi-module verification trajectory.</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => handleCopyReport('markdown')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-sm"
            >
              {copiedFormat === 'markdown' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>Copy Markdown</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopyReport('json')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-sm"
            >
              {copiedFormat === 'json' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>Copy JSON</span>
            </button>
          </div>
        </div>

        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-extrabold text-sm shadow-glow-cyan transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start New Verification Cycle (Module 1)</span>
          </button>
        </div>
      </div>

    </div>
  );
}
