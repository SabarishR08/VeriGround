import React from 'react';
<<<<<<< HEAD
import { ShieldCheck, Sparkles, BookOpen } from 'lucide-react';
=======
import { ShieldCheck, Sparkles, BookOpen, Database } from 'lucide-react';
>>>>>>> origin/main

export default function Header({ backendOnline, onOpenArchitecture, onSelectSample, activeTab, setActiveTab }) {
  return (
    <header className="bg-white border-b border-[#E8EAED] sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Left Branding */}
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-[#1A73E8] relative inline-block">
                VeriGround
              </h1>
<<<<<<< HEAD
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 border border-blue-200 text-blue-700 tracking-wide">
                Google Research Style
              </span>
            </div>
            <p className="text-xs font-medium text-[#5F6368] hidden sm:block">
              Retrieval-Grounding Verification Framework for AI-Generated Content
=======
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 tracking-wider uppercase">
                Enterprise v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Claim-level truth for AI answers
>>>>>>> origin/main
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'pipeline'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Verification Pipeline
          </button>
          <button
            onClick={() => setActiveTab('provenance')}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'provenance'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Provenance Log</span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          
          <button
            type="button"
            onClick={onSelectSample}
<<<<<<< HEAD
            className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-[#DADCE0] bg-white hover:bg-slate-50 text-[#202124] text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-[#1A73E8]" />
            <span className="hidden sm:inline">Load Sample</span>
=======
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-all hover:border-cyan-500/40"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Load Sample</span>
>>>>>>> origin/main
          </button>

          <button
            type="button"
            onClick={onOpenArchitecture}
<<<<<<< HEAD
            className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#1A73E8] text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-[#1A73E8]" />
            <span className="hidden md:inline">Framework Flow</span>
          </button>

          {/* Backend Status Indicator */}
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-[#E8EAED] bg-slate-50 text-xs font-medium text-[#5F6368]">
            <span className={`w-2.5 h-2.5 rounded-full ${backendOnline ? 'bg-[#188038] animate-pulse' : 'bg-[#1A73E8]'}`}></span>
            <span className="hidden lg:inline">
              {backendOnline ? 'Python Flask NLP Online' : 'Client Execution Engine'}
=======
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-700/50 text-xs font-semibold text-indigo-300 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Architecture</span>
          </button>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium">
            <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`}></span>
            <span className="text-slate-300 hidden md:inline">
              {backendOnline ? 'Flask Backend Active' : 'Offline'}
>>>>>>> origin/main
            </span>
          </div>

        </div>

      </div>
    </header>
  );
}
