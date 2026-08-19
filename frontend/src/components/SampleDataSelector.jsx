import React from 'react';
import { X, ArrowRight, ShieldCheck } from 'lucide-react';

export default function SampleDataSelector({ isOpen, onClose, samples, onSelectSample }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fadeIn">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Select Academic Benchmark Suite</h3>
              <p className="text-xs text-slate-400">One-click load research test cases for demonstration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sample List */}
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {samples.map((sample) => (
            <div
              key={sample.id}
              onClick={() => {
                onSelectSample(sample);
                onClose();
              }}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/90 transition-all cursor-pointer group space-y-2"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-cyan-400 group-hover:text-cyan-300 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{sample.title}</span>
                </h4>
                <span className="text-[11px] font-semibold text-slate-400 group-hover:text-cyan-400 flex items-center space-x-1">
                  <span>Load Preset</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
              <p className="text-xs text-slate-400">{sample.description}</p>
              <pre className="text-[11px] font-mono text-slate-200 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 whitespace-pre-wrap max-h-32 overflow-hidden">
                {sample.text}
              </pre>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
