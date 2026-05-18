import React from 'react';
import { Shield, TrendingUp, TrendingDown } from 'lucide-react';

const getRiskColor = (score) => {
  if (score >= 80) return { ring: '#34d399', text: '#34d399', label: 'LOW RISK', badge: 'badge-low' };
  if (score >= 50) return { ring: '#fbbf24', text: '#fbbf24', label: 'MEDIUM RISK', badge: 'badge-medium' };
  return { risk: 'HIGH RISK', ring: '#f87171', text: '#f87171', label: 'HIGH RISK', badge: 'badge-high' };
};

const OriginalityMeter = ({ score = 0 }) => {
  const riskInfo = getRiskColor(score);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const strokeDashoffset = circumference - progress;

  return (
    <div className="card p-6 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-5 self-start">
        <Shield className="w-5 h-5 text-indigo-400" />
        <h3 className="font-bold text-white">Originality Score</h3>
      </div>

      {/* SVG Ring */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 180 180">
          {/* Track */}
          <circle
            cx="90" cy="90" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="12"
          />
          {/* Progress */}
          <circle
            cx="90" cy="90" r={radius}
            fill="none"
            stroke={riskInfo.ring}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ filter: `drop-shadow(0 0 8px ${riskInfo.ring})`, transition: 'stroke-dashoffset 1.2s ease' }}
          />
        </svg>

        {/* Center text */}
        <div className="text-center z-10">
          <p className="text-5xl font-black" style={{ color: riskInfo.text }}>
            {score.toFixed(0)}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">/ 100</p>
        </div>
      </div>

      {/* Badge */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <span className={`badge ${riskInfo.badge} text-xs font-bold`}>{riskInfo.label}</span>
        <p className="text-xs text-slate-500 text-center">
          {score >= 80 && 'This document appears original.'}
          {score >= 50 && score < 80 && 'Moderate integrity issues detected.'}
          {score < 50 && 'Significant integrity concerns found.'}
        </p>
      </div>

      {/* Mini legend */}
      <div className="mt-5 w-full grid grid-cols-3 gap-2 text-center">
        {[['80+', '#34d399', 'Original'], ['50–79', '#fbbf24', 'Moderate'], ['<50', '#f87171', 'High Risk']].map(([range, color, label]) => (
          <div key={range} className="bg-white/[0.03] rounded-lg py-2">
            <div className="text-xs font-bold" style={{ color }}>{range}</div>
            <div className="text-[10px] text-slate-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OriginalityMeter;
