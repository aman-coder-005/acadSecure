import React from 'react';
import { FileText, Trash2, CheckCircle, Clock } from 'lucide-react';

const DocumentList = ({ documents, onDelete, onSelect, selectedDocId }) => {
  if (!documents || documents.length === 0) {
    return (
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Uploaded Documents</h2>
            <p className="text-xs text-slate-400">Documents in the system corpus</p>
          </div>
        </div>
        <div className="py-10 flex flex-col items-center text-center text-slate-500">
          <FileText className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">No documents uploaded yet.</p>
          <p className="text-xs mt-1">Upload files above to begin analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
          <FileText className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Uploaded Documents</h2>
          <p className="text-xs text-slate-400">{documents.length} document{documents.length > 1 ? 's' : ''} in corpus</p>
        </div>
        {selectedDocId && (
          <span className="ml-auto text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
            1 selected
          </span>
        )}
      </div>

      <div className="space-y-2">
        {documents.map((doc, idx) => {
          const isSelected = doc.doc_id === selectedDocId;
          return (
            <div
              key={doc.doc_id}
              onClick={() => onSelect(doc)}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all group
                ${isSelected
                  ? 'border-indigo-500/50 bg-indigo-500/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'}`}
            >
              {/* Index */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
                ${isSelected ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                {idx + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{doc.filename}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500">{doc.submitter || 'anonymous'}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-500">{doc.word_count} words</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isSelected && (
                  <CheckCircle className="w-4 h-4 text-indigo-400" />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(doc.doc_id); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center
                    text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all
                    opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {documents.length > 0 && !selectedDocId && (
        <p className="text-xs text-slate-500 text-center mt-3 flex items-center justify-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Click a document to select it for analysis
        </p>
      )}
    </div>
  );
};

export default DocumentList;
