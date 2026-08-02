import React from 'react';
import { FileText, Cpu, Database, ShieldCheck, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function WorkflowStepper({
  activeStep,
  setActiveStep,
  isPreprocessed,
  isExtracted,
  isRetrieved,
  isVerified,
  isExplained
}) {
  const steps = [
    {
      id: 1,
      title: "Module 1",
      subtitle: "AI Content Input",
      description: "Text cleaning & sentence segmentation",
      icon: FileText,
      completed: isPreprocessed,
      selectable: true,
    },
    {
      id: 2,
      title: "Module 2",
      subtitle: "Claim Extraction",
      description: "Filter factual claims vs opinions",
      icon: Cpu,
      completed: isExtracted,
      selectable: isPreprocessed,
    },
    {
      id: 3,
      title: "Module 3",
      subtitle: "Evidence Retrieval",
      description: "Dense vector FAISS knowledge search",
      icon: Database,
      completed: isRetrieved,
      selectable: isExtracted,
    },
    {
      id: 4,
      title: "Module 4",
      subtitle: "NLI & Fusion",
      description: "DeBERTa-v3 & weighted 4-way fusion",
      icon: ShieldCheck,
      completed: isVerified,
      selectable: isRetrieved,
    },
    {
      id: 5,
      title: "Module 5",
      subtitle: "Explainable AI",
      description: "Natural language verdict justifications",
      icon: Sparkles,
      completed: isExplained,
      selectable: isVerified,
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto mb-8">
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative">
          
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            const isDone = step.completed;
            const isSelectable = step.selectable;

            return (
              <div
                key={step.id}
                onClick={() => isSelectable && setActiveStep(step.id)}
                className={`relative flex items-center p-3.5 rounded-xl transition-all duration-300 ${
                  isSelectable ? 'cursor-pointer hover:border-cyan-500/50' : 'opacity-50 cursor-not-allowed'
                } ${
                  isActive
                    ? 'bg-gradient-to-br from-cyan-500/20 via-teal-500/10 to-indigo-500/10 border-2 border-cyan-500 shadow-glow-cyan'
                    : isDone
                    ? 'bg-emerald-500/10 border border-emerald-500/40'
                    : 'bg-slate-800/30 border border-slate-700/60'
                }`}
              >
                {/* Step Icon Badge */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 mr-3 transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Icon className="w-5 h-5" />}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      {step.title}
                    </span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    )}
                  </div>
                  <h3 className={`text-xs font-extrabold truncate ${isActive ? 'text-cyan-400' : 'text-slate-200'}`}>
                    {step.subtitle}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400 line-clamp-1 mt-0.5">
                    {step.description}
                  </p>
                </div>

                {/* Desktop Arrow Indicator */}
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 text-slate-500" />
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
