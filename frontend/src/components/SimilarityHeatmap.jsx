import React from 'react';
import { BarChart2, AlertTriangle, FileCheck } from 'lucide-react';

const getRiskBadge = (score) => {
  if (score >= 70) return 'badge-high';
  if (score >= 30) return 'badge-medium';
  return 'badge-low';
};

const SimilarityHeatmap = ({ matches = [] }) => {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <BarChart2 className="w-5 h-5 text-cyan-400" />
        <h3 className="font-bold text-white">Similarity Results</h3>
        {matches.length > 0 && (
          <span className="ml-auto badge badge-medium text-xs">{matches.length} match{matches.length !== 1 ? 'es' : ''}</span>
        )}
      </div>

      {matches.length === 0 ? (
        <div className="py-10 flex flex-col items-center text-slate-500">
          <FileCheck className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No similar documents found</p>
          <p className="text-xs mt-1 text-slate-600">This document appears original in the corpus.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match, idx) => (
            <div key={idx} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{match.filename}</p>
                  <p className="text-xs text-slate-500">{match.submitter || 'anonymous'}</p>
                </div>
                <span className={`badge ${getRiskBadge(match.overall_similarity)} text-xs font-bold ml-2`}>
                  {match.overall_similarity.toFixed(1)}%
                </span>
              </div>

              {/* Overall bar */}
              <div className="mb-3">
                <div className="progress-track">
                  <div
                    className={`progress-fill ${match.overall_similarity >= 70 ? 'bg-red-500' : match.overall_similarity >= 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${match.overall_similarity}%` }}
                  />
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/[0.03] rounded-lg px-3 py-2">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">TF-IDF</p>
                  <p className="text-sm font-bold text-cyan-400">{match.tfidf_similarity?.toFixed(1) ?? '—'}%</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg px-3 py-2">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Semantic</p>
                  <p className="text-sm font-bold text-violet-400">{match.semantic_similarity?.toFixed(1) ?? '—'}%</p>
                </div>
              </div>

              {/* Matching sentences */}
              {match.matching_sentences?.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Top Matching Sentences
                  </p>
                  {match.matching_sentences.slice(0, 2).map((s, si) => (
                    <div key={si} className="text-xs bg-red-500/5 border border-red-500/15 rounded-lg p-2 mb-1 text-slate-300">
                      <span className="text-red-400 font-medium">{(s.score * 100).toFixed(0)}%</span>
                      {' · '}{s.source_sentence?.slice(0, 80)}...
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimilarityHeatmap;
