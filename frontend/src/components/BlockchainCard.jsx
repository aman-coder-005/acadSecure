import React from 'react';
import { Link2, ExternalLink, CheckCircle } from 'lucide-react';

const BlockchainCard = ({ txHash, blockNumber, docHash, verified }) => {
  const truncate = (str, len = 20) => str ? `${str.slice(0, len)}…` : '—';

  return (
    <div className="card p-5 border border-emerald-500/20 bg-emerald-500/[0.03] mt-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Link2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-bold text-white text-sm">Blockchain Verified</h3>
          <p className="text-[10px] text-emerald-400/70">Immutable record stored on chain</p>
        </div>
        {verified && (
          <div className="ml-auto flex items-center gap-1 text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-semibold">Verified</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {[
          { label: 'Doc Hash', value: truncate(docHash, 24) },
          { label: 'Tx Hash', value: truncate(txHash, 24) },
          { label: 'Block', value: blockNumber ? `#${blockNumber}` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
            <span className="text-xs text-slate-500">{label}</span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockchainCard;
