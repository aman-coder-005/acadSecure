import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Shield } from 'lucide-react';
import FileUpload from './components/FileUpload';
import OriginalityMeter from './components/OriginalityMeter';
import SimilarityHeatmap from './components/SimilarityHeatmap';
import CollusionGraph from './components/CollusionGraph';
import DocumentViewer from './components/DocumentViewer';
import AIDetectionBar from './components/AIDetectionBar';
import BlockchainCard from './components/BlockchainCard';
import { uploadDocuments, preprocessDocument, checkSimilarity, detectAI, checkCollusion, getScore, storeBlockchain } from './api/client';

function App() {
  const [currentDoc, setCurrentDoc] = useState(null);
  const [similarityData, setSimilarityData] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [collusionData, setCollusionData] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [blockchainData, setBlockchainData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async (files, submitter) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Upload
      const uploadRes = await uploadDocuments(files, submitter);
      if (uploadRes.successful === 0) throw new Error("Upload failed.");
      
      const doc = uploadRes.results[0]; // Process first file for dashboard
      setCurrentDoc(doc);
      
      // 2. Preprocess
      await preprocessDocument(doc.doc_id);
      
      // 3. Similarity
      let simRes;
      try {
         simRes = await checkSimilarity(doc.doc_id);
         setSimilarityData(simRes);
      } catch (e) {
         console.warn("Similarity warning or error (maybe no other docs to compare)", e);
         simRes = { max_similarity: 0, matches: [] };
         setSimilarityData(simRes);
      }
      
      // 4. AI Detection
      let aiRes;
      try {
          // Send text preview for AI Detection
          aiRes = await detectAI(doc.text_preview); 
      } catch (e) {
          console.warn("AI Detection error", e);
          aiRes = { ai_probability: 0, human_probability: 100 };
      }
      setAiData(aiRes);
      
      // 5. Collusion
      let colRes;
      try {
          colRes = await checkCollusion();
          setCollusionData(colRes);
      } catch (e) {
          console.warn("Collusion error", e);
          colRes = { nodes: [], links: [] };
      }
      
      // 6. Score
      const plagiarism = simRes ? simRes.max_similarity * 100 : 0;
      const ai = aiRes ? aiRes.ai_probability : 0;
      
      let colRisk = 0;
      if (colRes && colRes.links) {
          const docLinks = colRes.links.filter(l => l.source === doc.doc_id || l.target === doc.doc_id);
          if (docLinks.length > 0) {
              colRisk = Math.max(...docLinks.map(l => l.value)) * 100;
          }
      }
      
      let finalScore;
      try {
          finalScore = await getScore(plagiarism, ai, colRisk);
          setScoreData(finalScore);
      } catch (e) {
          console.error("Score error", e);
      }
      
      // 7. Blockchain Store
      if (finalScore) {
          try {
              const chainRes = await storeBlockchain(doc.doc_id, finalScore);
              setBlockchainData(chainRes);
          } catch(e) {
              console.warn("Blockchain error (Ganache might not be running)", e);
          }
      }
      
    } catch (err) {
      setError(err.message || 'An error occurred during processing.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const reportElement = document.getElementById('report-container');
    if (!reportElement) return;

    html2canvas(reportElement, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`AcadSecure_Report_${currentDoc?.filename || 'Document'}.pdf`);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-12">
      <header className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight">Acad<span className="text-blue-400">Secure</span></h1>
          </div>
          {scoreData && (
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors border border-white/20 text-sm font-medium backdrop-blur-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Report</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <FileUpload onUpload={handleUpload} />

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm animate-in fade-in slide-in-from-top-2">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600 font-medium animate-pulse">Running Deep Analysis Pipeline...</p>
          </div>
        )}

        {scoreData && !loading && (
          <div id="report-container" className="space-y-6 bg-gray-50 p-4 -mx-4 sm:mx-0 sm:p-0 rounded-xl animate-in slide-in-from-bottom-4 fade-in duration-700">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-2">
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-2 flex items-center justify-between">
                Integrity Analysis Report
                <span className="text-sm font-normal text-gray-600 bg-gray-100 px-4 py-1.5 rounded-full border border-gray-200">
                  {currentDoc?.filename}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <OriginalityMeter score={scoreData.originality_score} />
              </div>
              <div className="lg:col-span-2 flex flex-col justify-between">
                <AIDetectionBar 
                  aiProbability={aiData?.ai_probability || 0} 
                  humanProbability={aiData?.human_probability || 100} 
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimilarityHeatmap matches={similarityData?.matches} />
              <CollusionGraph nodes={collusionData?.nodes} links={collusionData?.links} />
            </div>

            <DocumentViewer 
              text={currentDoc?.text_preview + " ... (Content truncated for preview)"} 
              highlights={similarityData?.matches?.[0]?.matching_sentences || []} 
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
