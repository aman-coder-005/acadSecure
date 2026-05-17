import React from 'react';
import { FileText } from 'lucide-react';

const SimilarityHeatmap = ({ matches }) => {
  if (!matches || matches.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center h-48">
        <FileText className="w-10 h-10 text-gray-300 mb-2" />
        <p className="text-gray-500 font-medium">No matching documents found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-blue-500" />
        Similarity Heatmap
      </h2>
      <div className="space-y-4">
        {matches.map((match, idx) => {
          const sim = Math.round(match.overall_similarity * 100);
          let color = 'bg-green-500';
          if (sim > 40) color = 'bg-yellow-500';
          if (sim > 75) color = 'bg-red-500';
          
          return (
            <div key={idx} className="flex flex-col group">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-gray-700 truncate mr-4">
                  {match.filename} <span className="text-gray-400 font-normal">({match.submitter})</span>
                </span>
                <span className={`font-bold ${color.replace('bg-', 'text-')}`}>{sim}% Match</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                <div 
                  className={`${color} h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-110`} 
                  style={{ width: `${sim}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default SimilarityHeatmap;
