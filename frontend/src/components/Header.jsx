import React from 'react';
import { ShieldCheck, Sparkles, BookOpen, Sun, Moon } from 'lucide-react';

export default function Header({ backendOnline, onOpenArchitecture, onSelectSample, theme, onToggleTheme }) {
  const isLight = theme === 'light';

  return (
    <header className={`border-b sticky top-0 z-40 transition-colors backdrop-blur-md ${
      isLight ? 'bg-white/90 border-slate-200 shadow-sm' : 'bg-[#0A0F1D]/80 border-slate-800/80'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Left Branding */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-600 p-[2px] shadow-glow-cyan">
            <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${isLight ? 'bg-slate-50' : 'bg-[#0B1222]'}`}>
              <ShieldCheck className="w-7 h-7 text-cyan-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className={`text-2xl font-extrabold tracking-tight font-sans ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Veri<span className="gradient-text-cyan">Ground</span>
              </h1>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border tracking-wide ${
                isLight ? 'bg-cyan-100 border-cyan-300 text-cyan-800' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              }`}>
                v1.0 Demo
              </span>
            </div>
            <p className={`text-xs font-medium hidden sm:block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Retrieval-Grounding Verification Framework for AI-Generated Content
            </p>
          </div>
        </div>

        {/* Right Controls (Original Order: Theme Toggle -> Load Sample -> Framework Flow -> Status) */}
        <div className="flex items-center space-x-3">
          
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
              isLight
                ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-slate-800/60 hover:bg-slate-700/80 border-slate-700 text-slate-200'
            }`}
          >
            {isLight ? (
              <>
                <Sun className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Light Theme</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Dark Theme</span>
              </>
            )}
          </button>

          {/* Preset Samples Button */}
          <button
            type="button"
            onClick={onSelectSample}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-slate-800/60 hover:bg-slate-700/80 border-slate-700 text-slate-200 hover:border-cyan-500/40'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-600" />
            <span className="hidden sm:inline">Load Sample</span>
          </button>

          {/* System Flow Diagram Button */}
          <button
            type="button"
            onClick={onOpenArchitecture}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
              isLight
                ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-900'
                : 'bg-indigo-950/40 hover:bg-indigo-900/60 border-indigo-700/50 text-indigo-300'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span className="hidden md:inline">Framework Flow</span>
          </button>

          {/* Backend Status Indicator */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
            isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-slate-300'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-cyan-500'}`}></span>
            <span className="hidden lg:inline">
              {backendOnline ? 'Python Flask NLP Online' : 'Client Execution Engine'}
            </span>
          </div>

        </div>

      </div>
    </header>
  );
}
