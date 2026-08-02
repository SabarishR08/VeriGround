import React from 'react';
import { ShieldCheck, Cpu, Sparkles, BookOpen, Activity } from 'lucide-react';

export default function Header({ backendOnline, onOpenArchitecture, onSelectSample }) {
  return (
    <header className="border-b border-slate-800/80 bg-[#0A0F1D]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Left Branding */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-600 p-[2px] shadow-glow-cyan">
            <div className="w-full h-full bg-[#0B1222] rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans">
                Veri<span className="gradient-text-cyan">Ground</span>
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 tracking-wide">
                v1.0 Demo
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Retrieval-Grounding Verification Framework for AI-Generated Content
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          
          {/* Preset Samples Button */}
          <button
            onClick={onSelectSample}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-all hover:border-cyan-500/40"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Load Preset Sample</span>
          </button>

          {/* System Flow Diagram Button */}
          <button
            onClick={onOpenArchitecture}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-700/50 text-xs font-semibold text-indigo-300 transition-all"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="hidden md:inline">Framework Flow</span>
          </button>

          {/* Backend Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium">
            <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`}></span>
            <span className="text-slate-300 hidden md:inline">
              {backendOnline ? 'Python Flask NLP Online' : 'Client Execution Engine'}
            </span>
          </div>

        </div>

      </div>
    </header>
  );
}
