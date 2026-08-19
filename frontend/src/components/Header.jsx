import React from 'react';
import { ShieldCheck, BookOpen, Database } from 'lucide-react';

export default function Header({ backendOnline, onOpenArchitecture, onSelectSample, activeTab, setActiveTab }) {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Left Branding */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl p-[2px] border border-gray-200 bg-white">
            <div className="w-full h-full bg-[#0B1222] rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-sans">
                VeriGround
              </h1>
              
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Claim-level truth for AI answers
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
            onClick={onSelectSample}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-all hover:border-cyan-500/40"
          >
            <span className="hidden md:inline">Load Sample</span>
          </button>

          <button
            onClick={onOpenArchitecture}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-700/50 text-xs font-semibold text-indigo-300 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Architecture</span>
          </button>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium">
            <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`}></span>
            <span className="text-slate-300 hidden md:inline">
              {backendOnline ? 'Flask Backend Active' : 'Offline'}
            </span>
          </div>

        </div>

      </div>
    </header>
  );
}
