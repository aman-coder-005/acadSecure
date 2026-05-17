import React from 'react';

const OriginalityMeter = ({ score }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = 'text-green-500';
  if (score < 50) color = 'text-red-500';
  else if (score < 80) color = 'text-yellow-500';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center transition-all hover:shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Originality Score</h2>
      <div className="relative flex items-center justify-center">
        <svg className="transform -rotate-90 w-40 h-40 drop-shadow-sm">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-gray-100"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${color} transition-all duration-1500 ease-out`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-800 tracking-tight">{Math.round(score)}%</span>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-500 text-center font-medium">
        Higher is better.<br/>Based on plagiarism, AI, and collusion risk.
      </p>
    </div>
  );
};
export default OriginalityMeter;
