import React from 'react';

const DocumentViewer = ({ text, highlights }) => {
  if (!text) return null;

  let highlightedText = text;
  
  if (highlights && highlights.length > 0) {
    highlights.forEach(h => {
      if (h.source_sentence) {
        highlightedText = highlightedText.replace(
          h.source_sentence, 
          `<mark class="bg-yellow-200 text-yellow-900 rounded px-1 font-medium">${h.source_sentence}</mark>`
        );
      }
    });
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Document Content</h2>
      <div 
        className="bg-gray-50 p-6 rounded-xl text-sm text-gray-800 leading-relaxed font-serif max-h-96 overflow-y-auto border border-gray-200 shadow-inner"
        dangerouslySetInnerHTML={{ __html: highlightedText }}
      />
    </div>
  );
};
export default DocumentViewer;
