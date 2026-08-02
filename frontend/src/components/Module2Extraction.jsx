import React, { useState } from 'react';
import { Cpu, CheckCircle2, XCircle, Sparkles, ArrowRight, RefreshCw, BarChart2, ShieldCheck, HelpCircle, MessageSquare, AlertTriangle, Terminal, Filter } from 'lucide-react';

export default function Module2Extraction({ 
  processedText, 
  sentences, 
  onExtractClaims, 
  extractionResult, 
  isLoading, 
  onContinueToModule3 
}) {
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Category badge styling mapper
  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Verifiable Claim':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
          icon: '✓',
          label: 'Verifiable Claim'
        };
      case 'Question':
        return {
          bg: 'bg-purple-500/15 border-purple-500/40 text-purple-300',
          icon: '❓',
          label: 'Question (Non-claim)'
        };
      case 'Opinion':
        return {
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
          icon: '💬',
          label: 'Opinion (Subjective)'
        };
      case 'Prediction':
        return {
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
          icon: '🔮',
          label: 'Prediction (Unverified)'
        };
      case 'Command':
        return {
          bg: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
          icon: '⚡',
          label: 'Command (Directive)'
        };
      case 'Greeting':
        return {
          bg: 'bg-pink-500/15 border-pink-500/40 text-pink-300',
          icon: '👋',
          label: 'Greeting (Conversational)'
        };
      default:
        return {
          bg: 'bg-slate-800 border-slate-700 text-slate-300',
          icon: '○',
          label: category || 'Non-verifiable'
        };
    }
  };

  const ignoredList = extractionResult?.ignored || [];
  const filteredIgnored = filterCategory === 'ALL'
    ? ignoredList
    : ignoredList.filter(item => item.category === filterCategory);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Title Header Card */}
      <div className="text-center py-6 glass-panel rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl"></div>

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
          Module 2 (Strict Research Evaluation Engine)
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Intelligent Claim Extraction Module
        </h2>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto mt-2">
          Extract only factual, verifiable claims. Automatically ignores Questions, Commands, Opinions, Predictions, and Greetings.
        </p>
      </div>

      {/* Top Input Screen: Processed Text Display & Extract Claims Trigger */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Processed Input Sentences</span>
          </label>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30">
            {sentences?.length || 0} Sentences Loaded
          </span>
        </div>

        {/* Processed Text Box */}
        <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4 text-slate-200 font-mono text-sm max-h-56 overflow-y-auto space-y-2 shadow-inner">
          {sentences && sentences.length > 0 ? (
            sentences.map((sent, idx) => (
              <div key={idx} className="flex space-x-3 py-1 border-b border-slate-800/40 last:border-0">
                <span className="text-slate-500 font-bold select-none">{idx + 1}.</span>
                <span>{sent}</span>
              </div>
            ))
          ) : (
            <p className="text-slate-500 italic">No preprocessed text available. Please complete Module 1 first.</p>
          )}
        </div>

        {/* Action Button: Extract Claims */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onExtractClaims}
            disabled={isLoading || !sentences || sentences.length === 0}
            className="w-full flex items-center justify-center space-x-2 py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-extrabold text-sm shadow-glow-violet disabled:opacity-50 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Running Strict Research Classifier Engine...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>[ Extract Claims ]</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Screen Section */}
      {extractionResult && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Metrics Summary Card matching exact specification */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <BarChart2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-extrabold text-white">Research Classification Metrics</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                Strict Filtering Enabled
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-4 rounded-xl bg-[#0B1120] border border-slate-800/80 text-center space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Sentences
                </span>
                <p className="text-3xl font-extrabold text-white font-mono">
                  {extractionResult.stats.total_sentences}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1 shadow-glow-emerald">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Claims Extracted</span>
                </span>
                <p className="text-3xl font-extrabold text-emerald-400 font-mono">
                  {extractionResult.stats.claims_extracted}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center space-y-1">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center justify-center space-x-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Ignored Sentences</span>
                </span>
                <p className="text-3xl font-extrabold text-rose-400 font-mono">
                  {extractionResult.stats.ignored_count}
                </p>
              </div>

            </div>
          </div>

          {/* Main Extracted Claims Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Factual Claims List */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-emerald-400 flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>✓ Verifiable Factual Claims ({extractionResult.claims?.length || 0})</span>
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  Passed to Module 3
                </span>
              </div>

              {extractionResult.claims && extractionResult.claims.length > 0 ? (
                <div className="space-y-4">
                  {extractionResult.claims.map((claim, idx) => (
                    <div 
                      key={idx}
                      className="glass-panel rounded-xl p-5 border border-emerald-500/40 shadow-glow-emerald space-y-3 relative overflow-hidden transition-all hover:translate-y-[-2px]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/40">
                            ✔
                          </div>
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                            Claim {idx + 1}
                          </span>
                        </div>
                        
                        {/* Confidence Percentage Badge */}
                        <div className="flex items-center space-x-2 bg-[#0B1120] px-3 py-1 rounded-full border border-emerald-500/30">
                          <span className="text-xs text-slate-400 font-medium">Confidence:</span>
                          <span className="text-xs font-extrabold text-emerald-400 font-mono">
                            {claim.confidence}%
                          </span>
                        </div>
                      </div>

                      {/* Claim Content */}
                      <p className="text-sm font-semibold text-slate-100 leading-relaxed font-sans bg-[#0B1120]/60 p-3 rounded-lg border border-slate-800">
                        {claim.text}
                      </p>

                      {/* Classification Category Badge */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                          ✓ Verifiable Factual Assertion
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          Declarative Syntax
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-sm">
                  No verifiable factual claims detected in input text.
                </div>
              )}
            </div>

            {/* Right Column: Ignored Sentences with Category Filters */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-rose-400 flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-rose-400" />
                  <span>Filtered Non-Verifiable Sentences ({ignoredList.length})</span>
                </h3>
              </div>

              {/* Research Category Filter Tabs */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
                {['ALL', 'Question', 'Opinion', 'Prediction', 'Command', 'Greeting'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg border font-semibold whitespace-nowrap transition-all ${
                      filterCategory === cat
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Ignored' : cat}
                  </button>
                ))}
              </div>

              {filteredIgnored && filteredIgnored.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {filteredIgnored.map((item, idx) => {
                    const badge = getCategoryBadge(item.category);
                    return (
                      <div 
                        key={idx}
                        className="glass-panel rounded-xl p-5 border border-slate-800 space-y-3 relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{badge.icon}</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                              Sentence #{idx + 1}
                            </span>
                          </div>
                          
                          <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>

                        {/* Sentence text */}
                        <p className="text-xs text-slate-300 bg-[#0B1120]/60 p-3 rounded-lg border border-slate-800">
                          "{item.text}"
                        </p>

                        {/* Reason */}
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            Filter Decision Rationale
                          </span>
                          <span className="text-xs font-medium text-slate-300 block">
                            {item.reason}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-sm">
                  No sentences match the selected filter category '{filterCategory}'.
                </div>
              )}
            </div>

          </div>

          {/* Continue to Semantic Analysis Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onContinueToModule3}
              className="w-full flex items-center justify-center space-x-2 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm shadow-glow-cyan transition-all cursor-pointer"
            >
              <span>[ Continue to Semantic Grounding Analysis ]</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
