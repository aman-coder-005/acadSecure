import React from 'react';
import { Users, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';

const CollusionCard = ({ documents, onRunCollusion, loading, collusionData }) => {
  const hasEnoughDocs = documents.length >= 2;
  const canRun = hasEnoughDocs && !loading;
  const clusters = collusionData?.clusters || [];

  return (
    <div className="card p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Collusion Check</h2>
          <p className="text-xs text-slate-400">Detect unauthorized collaboration among all documents</p>
        </div>
        {clusters.length > 0 && (
          <span className="ml-auto badge badge-high text-xs">
            {clusters.length} group{clusters.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Info bar */}
      <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05] mb-4 text-xs text-slate-400">
        Documents in corpus:{' '}
        <strong className="text-white">{documents.length}</strong>
        {!hasEnoughDocs && (
          <span className="text-amber-400 ml-1">(need at least 2)</span>
        )}
      </div>

      {/* Run Button */}
      <button
        onClick={onRunCollusion}
        disabled={!canRun}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm mb-4"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Collusion...</>
        ) : (
          <><Users className="w-4 h-4" /> Run Collusion Check</>
        )}
      </button>

      {/* Results */}
      {collusionData && (
        <div className="border-t border-white/[0.06] pt-4 space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
            Results
          </p>

          {/* No collusion */}
          {clusters.length === 0 && (
            <div className="py-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-emerald-400">No Collusion Detected</p>
              <p className="text-xs text-slate-500 mt-1">All documents appear independently authored.</p>
            </div>
          )}

          {/* Groups */}
          {clusters.map((cluster) => (
            <div
              key={cluster.cluster_id}
              className="bg-red-500/[0.06] border border-red-500/20 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm font-bold text-red-400">
                  Group {cluster.cluster_id + 1}
                </p>
                <span className="ml-auto badge badge-high text-[10px]">
                  {cluster.members.length} docs
                </span>
              </div>

              <ul className="space-y-1.5">
                {cluster.members.map((member, i) => (
                  <li key={member} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-200 truncate">{member}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollusionCard;
