import React from 'react';
import { Bot, User } from 'lucide-react';

const AIDetectionBar = ({ aiProbability = 0, humanProbability = 100 }) => {
  const isAI = aiProbability > 50;

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Bot className="w-5 h-5 text-amber-400" />
        <h3 className="font-bold text-white">AI Content Detection</h3>
        <span className={`ml-auto badge ${isAI ? 'badge-high' : 'badge-low'} text-xs`}>
          {isAI ? 'AI Detected' : 'Likely Human'}
        </span>
      </div>

      {/* Main bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> Human {humanProbability.toFixed(1)}%
          </span>
          <span className="text-red-400 font-semibold flex items-center gap-1">
            {aiProbability.toFixed(1)}% AI <Bot className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="h-5 rounded-full overflow-hidden bg-white/5 flex">
          {/* Human portion */}
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-l-full transition-all duration-1000"
            style={{ width: `${humanProbability}%` }}
          />
          {/* AI portion */}
          <div
            className="h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-r-full transition-all duration-1000"
            style={{ width: `${aiProbability}%` }}
          />
        </div>
      </div>

      {/* Two meters */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs text-slate-400 font-medium">Human Written</span>
          </div>
          <p className="text-2xl font-black text-emerald-400">{humanProbability.toFixed(1)}<span className="text-base font-semibold">%</span></p>
          <div className="progress-track mt-2">
            <div className="progress-fill bg-emerald-500" style={{ width: `${humanProbability}%` }} />
          </div>
        </div>

        <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-xs text-slate-400 font-medium">AI Generated</span>
          </div>
          <p className="text-2xl font-black text-red-400">{aiProbability.toFixed(1)}<span className="text-base font-semibold">%</span></p>
          <div className="progress-track mt-2">
            <div className="progress-fill bg-red-500" style={{ width: `${aiProbability}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDetectionBar;
