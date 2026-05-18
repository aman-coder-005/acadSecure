import React from 'react';
import { BarChart2, Shield, Bot, Users } from 'lucide-react';

const getRiskBadge = (label) => {
  if (!label) return 'badge-low';
  if (label === 'HIGH') return 'badge-high';
  if (label === 'MEDIUM') return 'badge-medium';
  return 'badge-low';
};

const ScoreBreakdown = ({ scoreData }) => {
  if (!scoreData) return null;

  const items = [
    {
      label: 'Plagiarism',
      score: scoreData.breakdown?.plagiarism?.score ?? scoreData.details?.plagiarism_percent ?? 0,
      risk: scoreData.breakdown?.plagiarism?.risk_label ?? scoreData.plagiarism_risk,
      icon: <BarChart2 className="w-4 h-4 text-cyan-400" />,
      color: 'bg-cyan-500',
    },
    {
      label: 'AI Content',
      score: scoreData.breakdown?.ai_generation?.score ?? scoreData.details?.ai_percent ?? 0,
      risk: scoreData.breakdown?.ai_generation?.risk_label ?? scoreData.ai_risk,
      icon: <Bot className="w-4 h-4 text-amber-400" />,
      color: 'bg-amber-500',
    },
    {
      label: 'Collusion',
      score: scoreData.breakdown?.collusion?.score ?? scoreData.details?.collusion_risk_percent ?? 0,
      risk: scoreData.breakdown?.collusion?.risk_label ?? scoreData.collusion_risk,
      icon: <Users className="w-4 h-4 text-pink-400" />,
      color: 'bg-pink-500',
    },
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Shield className="w-5 h-5 text-indigo-400" />
        <h3 className="font-bold text-white">Score Breakdown</h3>
        <span className="ml-auto text-2xl font-black text-white">
          {scoreData.originality_score?.toFixed(1)}
          <span className="text-sm text-slate-400 font-normal"> / 100</span>
        </span>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center bg-white/5">
                  {item.icon}
                </div>
                <span className="text-sm text-slate-300">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{item.score?.toFixed(1)}%</span>
                <span className={`badge ${getRiskBadge(item.risk)} text-[10px]`}>{item.risk}</span>
              </div>
            </div>
            <div className="progress-track">
              <div
                className={`progress-fill ${item.score >= 70 ? 'bg-red-500' : item.score >= 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${item.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-white/[0.06] text-xs text-slate-500 text-center">
        Formula: 100 − (0.4 × plagiarism) − (0.4 × AI) − (0.2 × collusion)
      </div>
    </div>
  );
};

export default ScoreBreakdown;
