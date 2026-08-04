import React from 'react';
import { ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

export default function Header({ backendOnline, onOpenArchitecture, onSelectSample }) {
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
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 border border-blue-200 text-blue-700 tracking-wide">
                Google Research Style
              </span>
            </div>
            <p className="text-xs font-medium text-[#5F6368] hidden sm:block">
              Retrieval-Grounding Verification Framework for AI-Generated Content
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          
          {/* Preset Samples Button */}
          <button
            type="button"
            onClick={onSelectSample}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-[#DADCE0] bg-white hover:bg-slate-50 text-[#202124] text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-[#1A73E8]" />
            <span className="hidden sm:inline">Load Sample</span>
          </button>

          {/* System Flow Diagram Button */}
          <button
            type="button"
            onClick={onOpenArchitecture}
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
            </span>
          </div>

        </div>

      </div>
    </header>
  );
}
