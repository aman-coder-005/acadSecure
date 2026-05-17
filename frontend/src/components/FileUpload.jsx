import React, { useCallback, useState } from 'react';
import { Upload, File as FileIcon, X, Loader } from 'lucide-react';

const FileUpload = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitter, setSubmitter] = useState('');

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (idx) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    await onUpload(files, submitter);
    setUploading(false);
    setFiles([]);
    setSubmitter('');
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 transition-all hover:shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Upload Documents</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Submitter Name / ID (Optional)</label>
        <input 
          type="text" 
          value={submitter}
          onChange={(e) => setSubmitter(e.target.value)}
          placeholder="e.g. John Doe - CS101"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      <div 
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all duration-200
          ${dragActive ? 'border-blue-500 bg-blue-50/50 scale-[1.02]' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          multiple 
          onChange={handleChange} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          accept=".pdf,.docx,.txt"
        />
        <Upload className={`w-10 h-10 mb-3 transition-colors ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className="text-gray-600 font-medium">Drag & drop files here, or click to select</p>
        <p className="text-sm text-gray-500 mt-1">Supports PDF, DOCX, TXT up to 20MB</p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h3>
          <ul className="space-y-2">
            {files.map((file, idx) => (
              <li key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <FileIcon className="w-5 h-5 text-blue-500 mr-3" />
                  <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                </div>
                <button onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          
          <button 
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg flex justify-center items-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
          >
            {uploading ? (
              <><Loader className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
            ) : (
              'Analyze Documents'
            )}
          </button>
        </div>
      )}
    </div>
  );
};
export default FileUpload;
