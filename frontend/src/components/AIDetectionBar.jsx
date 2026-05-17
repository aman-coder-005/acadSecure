import React from 'react';
import { Bot, User } from 'lucide-react';

const AIDetectionBar = ({ aiProbability, humanProbability }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 transition-all hover:shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <Bot className="w-5 h-5 mr-2 text-indigo-500" />
        AI Content Detection
      </h2>
      
      <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
        <div 
          className="bg-indigo-500 h-full flex items-center justify-start px-3 transition-all duration-1000"
          style={{ width: `${aiProbability}%` }}
        >
          {aiProbability > 15 && <span className="text-xs font-bold text-white drop-shadow-md">AI {Math.round(aiProbability)}%</span>}
        </div>
        <div 
          className="bg-emerald-500 h-full flex items-center justify-end px-3 transition-all duration-1000"
          style={{ width: `${humanProbability}%` }}
        >
          {humanProbability > 15 && <span className="text-xs font-bold text-white drop-shadow-md">Human {Math.round(humanProbability)}%</span>}
        </div>
      </div>
      
      <div className="flex justify-between mt-3 text-sm font-medium">
        <div className="flex items-center text-indigo-600">
          <Bot className="w-4 h-4 mr-1" />
          AI Generated
        </div>
        <div className="flex items-center text-emerald-600">
          <User className="w-4 h-4 mr-1" />
          Human Written
        </div>
      </div>
    </div>
  );
};
export default AIDetectionBar;
