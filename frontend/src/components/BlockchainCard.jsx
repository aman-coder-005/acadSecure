import React from 'react';
import { ShieldCheck, Database, Link as LinkIcon, ExternalLink } from 'lucide-react';

const BlockchainCard = ({ txHash, blockNumber, docHash, verified }) => {
  if (!txHash && !verified) return null;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 p-6 rounded-2xl shadow-lg text-white mb-6 transform transition-all hover:-translate-y-1 hover:shadow-xl border border-gray-700/50">
      <div className="flex justify-between items-start mb-5">
        <h2 className="text-xl font-bold flex items-center text-gray-50">
          <Database className="w-5 h-5 mr-2 text-blue-400" />
          Blockchain Ledger
        </h2>
        <div className="flex items-center bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20 backdrop-blur-sm">
          <ShieldCheck className="w-4 h-4 mr-1" />
          Verified
        </div>
      </div>
      
      <div className="space-y-4 font-mono text-xs text-gray-300">
        <div className="group">
          <span className="text-gray-400 block mb-1 text-[10px] uppercase tracking-wider font-semibold">Document Hash (SHA-256)</span>
          <div className="bg-black/40 p-2.5 rounded-lg truncate border border-gray-700/50 group-hover:border-gray-600 transition-colors">
            {docHash}
          </div>
        </div>
        {txHash && (
          <div className="group">
            <span className="text-gray-400 block mb-1 text-[10px] uppercase tracking-wider font-semibold">Transaction Hash</span>
            <div className="bg-black/40 p-2.5 rounded-lg truncate border border-gray-700/50 flex items-center justify-between group-hover:border-gray-600 transition-colors">
              <span className="truncate mr-2 text-blue-200">{txHash}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0 text-blue-400 cursor-pointer hover:text-blue-300" />
            </div>
          </div>
        )}
        {blockNumber && (
          <div className="flex items-center pt-2 mt-2 border-t border-gray-700/50">
            <LinkIcon className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-gray-400 font-sans">Minted in Block: <span className="text-blue-400 font-mono font-bold text-sm bg-blue-900/30 px-2 py-0.5 rounded">{blockNumber}</span></span>
          </div>
        )}
      </div>
    </div>
  );
};
export default BlockchainCard;
