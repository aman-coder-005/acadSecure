import React, { useState, useCallback, useEffect } from 'react';
import { Shield, Download, RefreshCw, AlertCircle, CheckCircle2, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import FileUpload from './components/FileUpload';
import DocumentList from './components/DocumentList';
import AnalysisPanel from './components/AnalysisPanel';
import OriginalityMeter from './components/OriginalityMeter';
import AIDetectionBar from './components/AIDetectionBar';
import SimilarityHeatmap from './components/SimilarityHeatmap';
import CollusionGraph from './components/CollusionGraph';
import BlockchainCard from './components/BlockchainCard';
import ScoreBreakdown from './components/ScoreBreakdown';

import {
  uploadDocuments,
  preprocessDocument,
  checkSimilarity,
  detectAI,
  checkCollusion,
  getScore,
  storeBlockchain,
  listDocuments,
  deleteDocument,
} from './api/client';

// ── Toast notification component ──────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-fade-in
      ${type === 'error' ? 'bg-red-950 border-red-500/40 text-red-300' : 'bg-emerald-950 border-emerald-500/40 text-emerald-300'}`}>
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

// ── Main App ──────────────────────────────────────────────────────────────
function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [preprocessed, setPreprocessed] = useState(false);

  // Analysis results
  const [similarityData, setSimilarityData] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [collusionData, setCollusionData] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [blockchainData, setBlockchainData] = useState(null);

  // UI state
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });
  const hideToast = () => setToast(null);

  // Load document list from backend
  const refreshDocuments = useCallback(async () => {
    try {
      const res = await listDocuments();
      setDocuments(res.documents || []);
    } catch (e) {
      console.error('Failed to list documents', e);
    }
  }, []);

  useEffect(() => { refreshDocuments(); }, [refreshDocuments]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleUpload = async (files, submitter) => {
    setUploading(true);
    try {
      const res = await uploadDocuments(files, submitter);
      if (res.successful === 0) throw new Error(res.errors?.[0]?.error || 'Upload failed');
      showToast(`${res.successful} document${res.successful > 1 ? 's' : ''} uploaded successfully.`);
      await refreshDocuments();
      // Auto-select the first newly uploaded doc
      if (res.results?.[0]) {
        setSelectedDoc(res.results[0]);
        setPreprocessed(false);
        clearResults();
      }
    } catch (err) {
      showToast(err.message || 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectDoc = (doc) => {
    setSelectedDoc(doc);
    setPreprocessed(false);
    clearResults();
  };

  const handleDeleteDoc = async (docId) => {
    try {
      await deleteDocument(docId);
      showToast('Document deleted.');
      await refreshDocuments();
      if (selectedDoc?.doc_id === docId) {
        setSelectedDoc(null);
        setPreprocessed(false);
        clearResults();
      }
    } catch (e) {
      showToast('Failed to delete document.', 'error');
    }
  };

  const clearResults = () => {
    setSimilarityData(null);
    setAiData(null);
    setCollusionData(null);
    setScoreData(null);
    setBlockchainData(null);
  };

  const handlePreprocess = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    setLoadingStep('Preprocessing');
    try {
      await preprocessDocument(selectedDoc.doc_id);
      setPreprocessed(true);
      showToast('Document preprocessed successfully.');
    } catch (e) {
      showToast('Preprocessing failed.', 'error');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleSimilarity = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    setLoadingStep('Similarity Check');
    try {
      const res = await checkSimilarity(selectedDoc.doc_id);
      setSimilarityData(res);
      showToast(`Similarity check complete. Max: ${res.max_similarity}%`);
    } catch (e) {
      setSimilarityData({ max_similarity: 0, matches: [] });
      showToast('Similarity check: no other documents to compare yet.', 'error');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleAIDetect = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    setLoadingStep('AI Detection');
    try {
      // Use text preview from the selected doc for AI detection
      const text = selectedDoc.text_preview || selectedDoc.filename;
      const res = await detectAI(text);
      setAiData(res);
      showToast(`AI Detection: ${res.ai_probability.toFixed(1)}% AI, ${res.human_probability.toFixed(1)}% Human`);
    } catch (e) {
      showToast('AI detection failed.', 'error');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleCollusion = async () => {
    setLoading(true);
    setLoadingStep('Collusion Detection');
    try {
      const res = await checkCollusion(0.75);
      setCollusionData(res);
      const rings = res.clusters?.length ?? 0;
      showToast(`Collusion check complete. ${rings > 0 ? `${rings} ring(s) detected!` : 'No collusion detected.'}`);
    } catch (e) {
      showToast('Collusion detection failed.', 'error');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleScore = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    setLoadingStep('Compute Score');
    try {
      const plagiarism = similarityData?.max_similarity ?? 0;
      const ai = aiData?.ai_probability ?? 0;

      let colRisk = 0;
      if (collusionData?.links && selectedDoc) {
        const links = collusionData.links.filter(
          l => l.source === selectedDoc.doc_id || l.target === selectedDoc.doc_id
        );
        if (links.length > 0) colRisk = Math.max(...links.map(l => l.value));
      }

      const res = await getScore(plagiarism, ai, colRisk);
      setScoreData(res);
      showToast(`Originality Score: ${res.originality_score?.toFixed(1)} / 100`);

      // Try blockchain store
      try {
        const chain = await storeBlockchain(selectedDoc.doc_id, res);
        setBlockchainData(chain);
      } catch {
        // Ganache not running — silently skip
      }
    } catch (e) {
      showToast('Scoring failed.', 'error');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleDownloadPDF = () => {
    const el = document.getElementById('report-container');
    if (!el) return;
    html2canvas(el, { scale: 2, backgroundColor: '#0b0f1a' }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, w, h);
      pdf.save(`AcadSecure_${selectedDoc?.filename || 'Report'}.pdf`);
    });
  };

  const hasResults = similarityData || aiData || collusionData || scoreData;

  return (
    <div className="min-h-screen" style={{ background: '#0b0f1a' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06]"
        style={{ background: 'rgba(11,15,26,0.85)', backdropFilter: 'blur(20px)' }}>
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

          <div className="flex items-center gap-2">
            <button
              onClick={refreshDocuments}
              className="btn-ghost flex items-center gap-1.5 py-2 px-3 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            {hasResults && (
              <button
                onClick={handleDownloadPDF}
                className="btn-primary flex items-center gap-1.5 py-2 px-3 text-xs"
              >
                <Download className="w-3.5 h-3.5" /> Export PDF
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-0">
            <FileUpload onUpload={handleUpload} uploading={uploading} />
            <DocumentList
              documents={documents}
              onDelete={handleDeleteDoc}
              onSelect={handleSelectDoc}
              selectedDocId={selectedDoc?.doc_id}
            />
            <AnalysisPanel
              selectedDoc={selectedDoc}
              onPreprocess={handlePreprocess}
              onSimilarity={handleSimilarity}
              onAIDetect={handleAIDetect}
              onCollusion={handleCollusion}
              onScore={handleScore}
              preprocessed={preprocessed}
              loading={loading}
              loadingStep={loadingStep}
            />
          </div>

          {/* Right — Results */}
          <div className="lg:col-span-2" id="report-container">
            {!hasResults && !loading && (
              <div className="card p-16 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 animate-pulse-glow">
                  <Shield className="w-10 h-10 text-indigo-400/50" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to AcadSecure</h2>
                <p className="text-slate-400 max-w-md text-sm leading-relaxed">
                  Upload documents using the panel on the left, then run individual analysis steps or use <strong className="text-indigo-400">Run Full Analysis</strong> to generate a complete integrity report.
                </p>
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
                  {[
                    ['🔍', 'Plagiarism', 'TF-IDF + Semantic'],
                    ['🤖', 'AI Detection', 'Logistic Regression'],
                    ['👥', 'Collusion', 'DBSCAN Clustering'],
                    ['⛓️', 'Blockchain', 'Immutable Records'],
                  ].map(([icon, title, sub]) => (
                    <div key={title} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                      <div className="text-2xl mb-1">{icon}</div>
                      <p className="text-xs font-semibold text-white">{title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && !hasResults && (
              <div className="card p-16 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4" />
                <p className="text-white font-semibold">{loadingStep}...</p>
                <p className="text-slate-400 text-sm mt-1">Please wait</p>
              </div>
            )}

            {hasResults && (
              <div className="space-y-5 animate-fade-in">
                {/* Report header */}
                {selectedDoc && (
                  <div className="card px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Analysis Report</p>
                      <h2 className="text-lg font-bold text-white">{selectedDoc.filename}</h2>
                    </div>
                    {scoreData && (
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Originality</p>
                        <p className={`text-3xl font-black ${scoreData.originality_score >= 80 ? 'text-emerald-400' : scoreData.originality_score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          {scoreData.originality_score?.toFixed(1)}
                          <span className="text-lg font-semibold text-slate-400"> / 100</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Row 1: Score + AI */}
                {(scoreData || aiData) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {scoreData && <OriginalityMeter score={scoreData.originality_score ?? 0} />}
                    {aiData && (
                      <div className="space-y-4">
                        <AIDetectionBar
                          aiProbability={aiData.ai_probability ?? 0}
                          humanProbability={aiData.human_probability ?? 100}
                        />
                        {blockchainData && (
                          <BlockchainCard
                            txHash={blockchainData.tx_hash}
                            blockNumber={blockchainData.block_number}
                            docHash={blockchainData.doc_hash}
                            verified={true}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Row 2: Score Breakdown */}
                {scoreData && <ScoreBreakdown scoreData={scoreData} />}

                {/* Row 3: Similarity + Collusion */}
                {(similarityData || collusionData) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {similarityData && <SimilarityHeatmap matches={similarityData.matches} />}
                    {collusionData && (
                      <CollusionGraph
                        nodes={collusionData.nodes}
                        links={collusionData.links}
                        clusters={collusionData.clusters}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}

export default App;
