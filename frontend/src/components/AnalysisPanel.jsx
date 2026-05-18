import React from 'react';
import { Zap, BarChart2, Users, Star, ChevronRight, Loader2 } from 'lucide-react';

const AnalysisPanel = ({
  selectedDoc,
  onPreprocess,
  onSimilarity,
  onAIDetect,
  onCollusion,
  onScore,
  preprocessed,
  loading,
  loadingStep,
}) => {
  if (!selectedDoc) {
    return (
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Analysis Controls</h2>
        </div>
        <div className="py-8 text-center text-slate-500">
          <Zap className="w-10 h-10 mx-auto mb-3 opacity-25" />
          <p className="text-sm">Select a document from the list to run analysis.</p>
        </div>
      </div>
    );
  }

  const steps = [
    {
      id: 'preprocess',
      label: 'Preprocess',
      desc: 'Tokenize & lemmatize text',
      icon: <Zap className="w-4 h-4" />,
      color: 'text-violet-400',
      bg: 'bg-violet-500/20',
      action: onPreprocess,
      enabled: true,
    },
    {
      id: 'similarity',
      label: 'Similarity Check',
      desc: 'Compare against corpus',
      icon: <BarChart2 className="w-4 h-4" />,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/20',
      action: onSimilarity,
      enabled: preprocessed,
    },
    {
      id: 'ai',
      label: 'AI Detection',
      desc: 'Detect AI-generated content',
      icon: <Star className="w-4 h-4" />,
      color: 'text-amber-400',
      bg: 'bg-amber-500/20',
      action: onAIDetect,
      enabled: preprocessed,
    },
    {
      id: 'collusion',
      label: 'Collusion Detection',
      desc: 'Find collaboration rings',
      icon: <Users className="w-4 h-4" />,
      color: 'text-pink-400',
      bg: 'bg-pink-500/20',
      action: onCollusion,
      enabled: preprocessed,
    },
    {
      id: 'score',
      label: 'Compute Score',
      desc: 'Generate integrity report',
      icon: <Star className="w-4 h-4" />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
      action: onScore,
      enabled: preprocessed,
    },
  ];

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Analysis Controls</h2>
          <p className="text-xs text-slate-400 truncate max-w-[220px]">{selectedDoc.filename}</p>
        </div>
        {preprocessed && (
          <span className="ml-auto badge badge-low text-xs">Preprocessed ✓</span>
        )}
      </div>

      {/* Run All button */}
      <button
        onClick={async () => {
          await onPreprocess();
          await onSimilarity();
          await onAIDetect();
          await onCollusion();
          await onScore();
        }}
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm mb-4"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Running {loadingStep}...</>
        ) : (
          <><Zap className="w-4 h-4" /> Run Full Analysis</>
        )}
      </button>

      {/* Individual Steps */}
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-semibold">Individual Steps</p>
      <div className="space-y-2">
        {steps.map((step) => {
          const isRunning = loading && loadingStep === step.label;
          return (
            <button
              key={step.id}
              onClick={step.action}
              disabled={!step.enabled || loading}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all
                ${step.enabled && !loading
                  ? 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 cursor-pointer'
                  : 'border-white/[0.03] bg-white/[0.01] opacity-40 cursor-not-allowed'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${step.bg}`}>
                <span className={step.color}>
                  {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : step.icon}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{step.label}</p>
                <p className="text-xs text-slate-500">{step.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
            </button>
          );
        })}
      </div>

      {!preprocessed && (
        <p className="text-xs text-amber-400/70 text-center mt-3 flex items-center justify-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg py-2">
          ⚠️ Run "Preprocess" first to unlock all analysis steps
        </p>
      )}
    </div>
  );
};

export default AnalysisPanel;
