import React, { useState } from 'react';
import { BarChart2, Bot, User, CheckCircle, Loader2, FileText, AlertTriangle, FileCheck } from 'lucide-react';

const getRiskBadge = (score) => {
  if (score >= 70) return 'badge-high';
  if (score >= 30) return 'badge-medium';
  return 'badge-low';
};

const SimilarityAICard = ({
  documents,
  onRunCheck,
  loading,
  aiLoading,
  similarityData,
  aiData,
}) => {
  const [selectedDocId, setSelectedDocId] = useState(null);

  const selectedDoc = documents.find(d => d.doc_id === selectedDocId);
  const canRun = selectedDocId && !loading;

  const handleRun = () => {
    if (!selectedDocId) return;
    onRunCheck(selectedDocId);
  };

  return (
    <div className="card p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
          <BarChart2 className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Similarity & AI Check</h2>
          <p className="text-xs text-slate-400">Select one document to compare against all others</p>
        </div>
      </div>

      {/* Document Selection List */}
      {documents.length === 0 ? (
        <div className="py-8 flex flex-col items-center text-slate-500 flex-1">
          <FileText className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="mb-4 space-y-1.5 max-h-48 overflow-y-auto pr-1">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">
            Select a document to analyze
          </p>
          {documents.map((doc, idx) => {
            const isSelected = doc.doc_id === selectedDocId;
            return (
              <label
                key={doc.doc_id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                  ${isSelected
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'}`}
              >
                {/* Radio */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  ${isSelected ? 'border-cyan-400 bg-cyan-500/20' : 'border-slate-600'}`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />}
                </div>

                {/* Doc info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{doc.filename}</p>
                  <p className="text-xs text-slate-500">{doc.submitter || 'anonymous'} · {doc.word_count} words</p>
                </div>

                {isSelected && <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />}

                <input
                  type="radio"
                  name="similarity-doc"
                  value={doc.doc_id}
                  checked={isSelected}
                  onChange={() => setSelectedDocId(doc.doc_id)}
                  className="hidden"
                />
              </label>
            );
          })}
        </div>
      )}

      {/* Run Button */}
      <button
        onClick={handleRun}
        disabled={!canRun}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm mb-4"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Running Analysis...</>
        ) : (
          <><BarChart2 className="w-4 h-4" /> Run Similarity & AI Check</>
        )}
      </button>

      {!selectedDocId && documents.length > 0 && (
        <p className="text-xs text-amber-400/70 text-center bg-amber-500/10 border border-amber-500/20 rounded-lg py-2 mb-4">
          ⚠️ Select a document above to enable the check
        </p>
      )}

      {/* ── RESULTS ── */}
      {(similarityData || aiData || aiLoading) && (
        <div className="border-t border-white/[0.06] pt-4 space-y-4 mt-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Results</p>

          {/* AI Detection — loading or result */}
          {aiLoading && !aiData ? (
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">AI Detection</span>
              </div>
              <div className="flex items-center justify-center gap-3 py-4">
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                <span className="text-sm text-slate-400">Analyzing with Sapling AI…</span>
              </div>
            </div>
          ) : aiData ? (
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">AI Detection</span>
                <span className={`ml-auto badge text-xs ${aiData.ai_probability > 50 ? 'badge-high' : 'badge-low'}`}>
                  {aiData.ai_probability > 50 ? 'AI Detected' : 'Likely Human'}
                </span>
              </div>

              {/* Bar */}
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-emerald-400 flex items-center gap-1">
                  <User className="w-3 h-3" /> Human {aiData.human_probability?.toFixed(1)}%
                </span>
                <span className="text-red-400 flex items-center gap-1">
                  {aiData.ai_probability?.toFixed(1)}% AI <Bot className="w-3 h-3" />
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden bg-white/5 flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                  style={{ width: `${aiData.human_probability}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-700"
                  style={{ width: `${aiData.ai_probability}%` }}
                />
              </div>
            </div>
          ) : null}

          {/* Similarity Results */}
          {similarityData && (
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">Similarity</span>
                <span className={`ml-auto badge text-xs ${getRiskBadge(
                  Math.max(0, ...( similarityData.matches?.map(m => m.tfidf_similarity) || [0]))
                )}`}>
                  Max: {Math.max(0, ...(similarityData.matches?.map(m => m.tfidf_similarity) || [0])).toFixed(1)}%
                </span>
              </div>

              {similarityData.matches?.length === 0 ? (
                <div className="py-4 flex flex-col items-center text-slate-500">
                  <FileCheck className="w-6 h-6 mb-1 opacity-40" />
                  <p className="text-xs">No similar documents found in corpus.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {similarityData.matches?.map((match, idx) => (
                    <div key={idx} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.04]">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-white truncate flex-1">{match.filename}</p>
                        <span className={`badge text-[10px] ${getRiskBadge(match.tfidf_similarity)}`}>
                          {match.tfidf_similarity?.toFixed(1)}%
                        </span>
                      </div>

                      {/* Progress bar — TF-IDF only */}
                      <div className="progress-track mb-2">
                        <div
                          className={`progress-fill ${match.tfidf_similarity >= 70 ? 'bg-red-500' : match.tfidf_similarity >= 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${match.tfidf_similarity}%` }}
                        />
                      </div>

                      {/* Matching sentences */}
                      {match.matching_sentences?.length > 0 && (
                        <div className="mt-2">
                          {match.matching_sentences.slice(0, 2).map((s, si) => (
                            <div key={si} className="text-[10px] bg-red-500/5 border border-red-500/15 rounded px-2 py-1 mb-1 text-slate-400">
                              <span className="text-red-400 font-semibold">{(s.score * 100).toFixed(0)}%</span>
                              {' · '}{s.source_sentence?.slice(0, 70)}...
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SimilarityAICard;
