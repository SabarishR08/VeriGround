import React from 'react';
import { FileText, Cpu, Database, CheckCircle2, ArrowRight } from 'lucide-react';

export default function WorkflowStepper({ activeStep, setActiveStep, isPreprocessed, isExtracted }) {
  const steps = [
    {
      id: 1,
      title: "Module 1",
      subtitle: "AI Content Input",
      description: "Source selection, text cleaning & sentence segmentation",
      icon: FileText,
      completed: isPreprocessed,
    },
    {
      id: 2,
      title: "Module 2",
      subtitle: "Intelligent Claim Extraction",
      description: "Extract verifiable claims & filter opinions with confidence",
      icon: Cpu,
      completed: isExtracted,
    },
    {
      id: 3,
      title: "Module 3",
      subtitle: "Semantic Grounding",
      description: "Embedding generation & vector retrieval verification",
      icon: Database,
      completed: false,
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto mb-8">
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            const isDone = step.completed;
            const isSelectable = step.id === 1 || (step.id === 2 && isPreprocessed) || (step.id === 3 && isExtracted);

            return (
              <div
                key={step.id}
                onClick={() => isSelectable && setActiveStep(step.id)}
                className={`relative flex items-center p-4 rounded-xl transition-all duration-300 ${
                  isSelectable ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/60 to-slate-900/90 border border-cyan-500/50 shadow-glow-cyan'
                    : isDone
                    ? 'bg-slate-900/60 border border-emerald-500/30'
                    : 'bg-slate-900/30 border border-slate-800/80'
                }`}
              >
                {/* Step Number/Check Badge */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shrink-0 mr-4 transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                    : isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {isDone ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Icon className="w-6 h-6" />}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {step.title}
                    </span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    )}
                  </div>
                  <h3 className={`text-sm font-bold truncate ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                    {step.subtitle}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                    {step.description}
                  </p>
                </div>

                {/* Arrow indicator between steps */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
