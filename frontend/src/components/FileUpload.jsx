import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, Loader2, User, CheckCircle2, AlertCircle } from 'lucide-react';

const FileUpload = ({ onUpload, uploading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [submitter, setSubmitter] = useState('');

  const handleDrag = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      ['.pdf', '.docx', '.txt'].some(ext => f.name.toLowerCase().endsWith(ext))
    );
    setFiles(prev => [...prev, ...dropped]);
  }, []);

  const handleChange = (e) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (idx) => setFiles(files.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!files.length) return;
    await onUpload(files, submitter);
    setFiles([]);
    setSubmitter('');
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (name) => {
    if (name.endsWith('.pdf')) return '📄';
    if (name.endsWith('.docx')) return '📝';
    return '📃';
  };

  return (
    <div className="card p-6 mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <Upload className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Upload Documents</h2>
          <p className="text-xs text-slate-400">PDF, DOCX, or TXT · Max 20MB each</p>
        </div>
        {files.length > 0 && (
          <span className="ml-auto badge badge-low">{files.length} file{files.length > 1 ? 's' : ''} selected</span>
        )}
      </div>

      {/* Submitter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          <User className="inline w-3.5 h-3.5 mr-1 text-slate-400" />
          Submitter Name / Student ID
          <span className="text-slate-500 font-normal ml-1">(optional)</span>
        </label>
        <input
          type="text"
          value={submitter}
          onChange={e => setSubmitter(e.target.value)}
          placeholder="e.g. John Doe — CS101"
          className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500
            bg-white/5 border border-white/10 focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/20
            outline-none transition-all"
        />
      </div>

      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center
          cursor-pointer transition-all duration-300
          ${dragActive
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-white/10 hover:border-white/25 hover:bg-white/[0.02]'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          onChange={handleChange}
          accept=".pdf,.docx,.txt"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all
          ${dragActive ? 'bg-indigo-500/30' : 'bg-white/5'}`}>
          <Upload className={`w-7 h-7 transition-colors ${dragActive ? 'text-indigo-400' : 'text-slate-500'}`} />
        </div>
        <p className="text-slate-300 font-semibold text-base mb-1">
          {dragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-slate-500 text-sm">or <span className="text-indigo-400 underline underline-offset-2">click to browse</span></p>
        <p className="text-xs text-slate-600 mt-3">Supports PDF, DOCX, TXT · Upload multiple files at once</p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, idx) => (
            <div key={idx}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] group"
            >
              <span className="text-2xl leading-none">{getFileIcon(file.name)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
              </div>
              <button
                onClick={() => removeFile(idx)}
                className="w-7 h-7 rounded-lg flex items-center justify-center
                  text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <button
          onClick={handleSubmit}
          disabled={uploading}
          className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-3 text-sm"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing {files.length} document{files.length > 1 ? 's' : ''}...</>
          ) : (
            <><CheckCircle2 className="w-4 h-4" /> Analyze {files.length} Document{files.length > 1 ? 's' : ''}</>
          )}
        </button>
      )}
    </div>
  );
};

export default FileUpload;
