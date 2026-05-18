import React, { useState, useCallback, useEffect } from 'react';
import { Shield, RefreshCw, X, AlertCircle, CheckCircle2 } from 'lucide-react';

import FileUpload from './components/FileUpload';
import DocumentList from './components/DocumentList';
import SimilarityAICard from './components/SimilarityAICard';
import CollusionCard from './components/CollusionCard';

import client, {
  uploadDocuments,
  preprocessDocument,
  checkSimilarity,
  detectAI,
  checkCollusion,
  listDocuments,
  deleteDocument,
} from './api/client';

// ── Toast ──────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl
      shadow-2xl border animate-fade-in max-w-sm
      ${type === 'error'
        ? 'bg-red-950 border-red-500/40 text-red-300'
        : 'bg-emerald-950 border-emerald-500/40 text-emerald-300'}`}
    >
      {type === 'error'
        ? <AlertCircle className="w-4 h-4 flex-shrink-0" />
        : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [documents, setDocuments]       = useState([]);
  const [uploading, setUploading]       = useState(false);

  // Similarity + AI state
  const [simLoading, setSimLoading]     = useState(false);
  const [aiLoading, setAiLoading]       = useState(false);
  const [similarityData, setSimilarity] = useState(null);
  const [aiData, setAiData]             = useState(null);

  // Collusion state
  const [colLoading, setColLoading]     = useState(false);
  const [collusionData, setCollusion]   = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => setToast({ message, type });

  // ── Load documents ────────────────────────────────────────────────────────
  const refreshDocs = useCallback(async () => {
    try {
      const res = await listDocuments();
      setDocuments(res.documents || []);
    } catch { /* server might not be up yet */ }
  }, []);

  useEffect(() => { refreshDocs(); }, [refreshDocs]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleUpload = async (files, submitter) => {
    setUploading(true);
    try {
      const res = await uploadDocuments(files, submitter);
      if (res.successful === 0) throw new Error(res.errors?.[0]?.error || 'Upload failed');

      // Auto-preprocess every successfully uploaded doc so similarity works immediately
      await Promise.all(
        res.results.map(doc => preprocessDocument(doc.doc_id).catch(() => null))
      );

      showToast(`${res.successful} document${res.successful > 1 ? 's' : ''} uploaded & preprocessed.`);
      await refreshDocs();
    } catch (err) {
      showToast(err.message || 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    try {
      await deleteDocument(docId);
      showToast('Document deleted.');
      await refreshDocs();
      // Clear stale results if they referenced this doc
      setSimilarity(null);
      setAiData(null);
    } catch {
      showToast('Failed to delete document.', 'error');
    }
  };

  // Similarity + AI — triggered from SimilarityAICard with a selected doc
  const handleSimAICheck = async (docId) => {
    setSimLoading(true);
    setAiLoading(true);
    setSimilarity(null);
    setAiData(null);
    try {
      // Ensure preprocessed (idempotent — backend caches)
      await preprocessDocument(docId).catch(() => null);

      // Fetch full doc record (has text) + similarity in parallel
      const [simRes, fullDoc] = await Promise.all([
        checkSimilarity(docId).catch(() => ({ max_similarity: 0, matches: [] })),
        client.get(`/documents/${docId}`).then(r => r.data).catch(() => null),
      ]);

      // Show similarity results immediately
      setSimilarity(simRes);
      setSimLoading(false);
      showToast(`Similarity done. Max: ${simRes.max_similarity?.toFixed(1)}%`);

      // AI detection runs separately — spinner stays in AI section
      if (fullDoc?.text) {
        const aiRes = await detectAI(fullDoc.text).catch(() => null);
        if (aiRes) setAiData(aiRes);
      }
    } catch (err) {
      showToast(err.message || 'Analysis failed.', 'error');
    } finally {
      setSimLoading(false);
      setAiLoading(false);
    }
  };

  // Collusion — across all documents
  const handleCollusion = async () => {
    setColLoading(true);
    setCollusion(null);
    try {
      const res = await checkCollusion(0.75);
      setCollusion(res);
      const rings = res.clusters?.length ?? 0;
      showToast(rings > 0 ? `${rings} collusion ring${rings > 1 ? 's' : ''} detected!` : 'No collusion detected.');
    } catch (err) {
      showToast(err.message || 'Collusion check failed.', 'error');
    } finally {
      setColLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#0b0f1a' }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40 border-b border-white/[0.06]"
        style={{ background: 'rgba(11,15,26,0.88)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center animate-pulse-glow">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">
                <span className="text-white">Acad</span>
                <span className="shimmer-text">Secure</span>
              </h1>
              <p className="text-[10px] text-slate-500 leading-none">Academic Integrity Platform</p>
            </div>
          </div>

          <button
            onClick={refreshDocs}
            className="btn-ghost flex items-center gap-1.5 py-2 px-3 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </header>

      {/* ── Two-column body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ── LEFT COLUMN: Upload + Document List ── */}
          <div className="flex flex-col gap-6">
            <FileUpload onUpload={handleUpload} uploading={uploading} />
            <DocumentList
              documents={documents}
              onDelete={handleDelete}
              /* no selection needed on this side */
              onSelect={() => {}}
              selectedDocId={null}
            />
          </div>

          {/* ── RIGHT COLUMN: Similarity/AI + Collusion ── */}
          <div className="flex flex-col gap-6">
            <SimilarityAICard
              documents={documents}
              onRunCheck={handleSimAICheck}
              loading={simLoading}
              aiLoading={aiLoading}
              similarityData={similarityData}
              aiData={aiData}
            />
            <CollusionCard
              documents={documents}
              onRunCollusion={handleCollusion}
              loading={colLoading}
              collusionData={collusionData}
            />
          </div>

        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
