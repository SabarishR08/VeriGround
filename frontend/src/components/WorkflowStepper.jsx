import React from 'react';
import { FileText, Cpu, Database, ShieldCheck, CheckCircle2, ArrowRight, Activity } from 'lucide-react';

export default function WorkflowStepper({ activeStep, setActiveStep, isPreprocessed, isExtracted, isRetrieved, isVerified, isExplained, currentStage }) {
  const steps = [
    {
      id: 1,
      title: "Module 1",
      subtitle: "Input & Cleaning",
      description: "Text normalization",
      icon: FileText,
      completed: isPreprocessed,
    },
    {
      id: 2,
      title: "Module 2",
      subtitle: "Claim Extraction",
      description: "Decompose into claims",
      icon: Cpu,
      completed: isExtracted,
    },
    {
      id: 3,
      title: "Module 3",
      subtitle: "Evidence Retrieval",
      description: "FAISS vector search",
      icon: Database,
      completed: isRetrieved,
    },
    {
      id: 4,
      title: "Module 4",
      subtitle: "NLI & Fusion",
      description: "DeBERTa 4-way verdict",
      icon: ShieldCheck,
      completed: isVerified,
    },
    {
      id: 5,
      title: "Module 5",
      subtitle: "Explainable AI",
      description: "Ollama justification",
    icon: Activity,
      completed: isExplained,
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto mb-8">
      <div className="rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm bg-white">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            const isDone = step.completed;
            const isSelectable = step.id === 1 ||
              (step.id === 2 && isPreprocessed) ||
              (step.id === 3 && isExtracted) ||
              (step.id === 4 && isRetrieved) ||
              (step.id === 5 && isVerified);

            return (
              <div
                key={step.id}
                onClick={() => isSelectable && setActiveStep(step.id)}
                className={`relative flex flex-col p-3 rounded-xl transition-all duration-300 ${
                  isSelectable ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
                } ${
                  isActive
                    ? 'bg-primary/10 border border-primary/20 shadow-sm'
                    : isDone
                    ? 'bg-white border border-gray-100'
                    : 'bg-white border border-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Icon className="w-5 h-5" />}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {step.title}
                      </span>
                      {isActive && currentStage && (
                        <Activity className="w-3 h-3 text-cyan-400 animate-spin" />
                      )}
                    </div>
                    <h3 className={`text-xs font-bold truncate ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {step.subtitle}
                    </h3>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-1">
                  {step.description}
                </p>

                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10">
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
