import React, { useEffect, useRef } from 'react';
import { Users, Network } from 'lucide-react';

const CollusionGraph = ({ nodes = [], links = [], clusters = [] }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!nodes.length || !svgRef.current) return;

    const svg = svgRef.current;
    const W = svg.clientWidth || 400;
    const H = svg.clientHeight || 280;
    const cx = W / 2, cy = H / 2;

    // Clear old content
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const colors = ['#6366f1', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#38bdf8'];

    // Position nodes in a circle
    const angleStep = (2 * Math.PI) / nodes.length;
    const radius = Math.min(W, H) * 0.32;
    const positions = {};
    nodes.forEach((node, i) => {
      const angle = i * angleStep - Math.PI / 2;
      positions[node.id] = {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });

    // Draw links
    links.forEach((link) => {
      const s = positions[link.source];
      const t = positions[link.target];
      if (!s || !t) return;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', s.x);
      line.setAttribute('y1', s.y);
      line.setAttribute('x2', t.x);
      line.setAttribute('y2', t.y);
      const opacity = 0.3 + (link.value / 100) * 0.7;
      line.setAttribute('stroke', '#f87171');
      line.setAttribute('stroke-width', Math.max(1, (link.value / 100) * 4));
      line.setAttribute('stroke-opacity', opacity);
      svg.appendChild(line);

      // Edge label
      const midX = (s.x + t.x) / 2;
      const midY = (s.y + t.y) / 2;
      const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      labelBg.setAttribute('x', midX - 16);
      labelBg.setAttribute('y', midY - 9);
      labelBg.setAttribute('width', 32);
      labelBg.setAttribute('height', 16);
      labelBg.setAttribute('rx', 4);
      labelBg.setAttribute('fill', '#0b0f1a');
      labelBg.setAttribute('fill-opacity', 0.85);
      svg.appendChild(labelBg);

      const edgeTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      edgeTxt.setAttribute('x', midX);
      edgeTxt.setAttribute('y', midY + 4);
      edgeTxt.setAttribute('text-anchor', 'middle');
      edgeTxt.setAttribute('fill', '#f87171');
      edgeTxt.setAttribute('font-size', '9');
      edgeTxt.setAttribute('font-weight', '700');
      edgeTxt.textContent = `${link.value.toFixed(0)}%`;
      svg.appendChild(edgeTxt);
    });

    // Draw nodes
    nodes.forEach((node) => {
      const pos = positions[node.id];
      if (!pos) return;

      const color = node.group >= 0 ? colors[node.group % colors.length] : '#475569';
      const isColluding = node.group >= 0;

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('cursor', 'pointer');

      // Glow circle (for colluding nodes)
      if (isColluding) {
        const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        glow.setAttribute('cx', pos.x);
        glow.setAttribute('cy', pos.y);
        glow.setAttribute('r', 20);
        glow.setAttribute('fill', color);
        glow.setAttribute('fill-opacity', '0.15');
        g.appendChild(glow);
      }

      // Main circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pos.x);
      circle.setAttribute('cy', pos.y);
      circle.setAttribute('r', 14);
      circle.setAttribute('fill', isColluding ? color : '#1e2a3a');
      circle.setAttribute('fill-opacity', isColluding ? '0.9' : '1');
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', '2');
      g.appendChild(circle);

      // Index label inside node
      const initTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      initTxt.setAttribute('x', pos.x);
      initTxt.setAttribute('y', pos.y + 4);
      initTxt.setAttribute('text-anchor', 'middle');
      initTxt.setAttribute('fill', 'white');
      initTxt.setAttribute('font-size', '10');
      initTxt.setAttribute('font-weight', '700');
      initTxt.textContent = node.label?.slice(0, 2).toUpperCase();
      g.appendChild(initTxt);

      // Name label below node
      const nameLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      nameLabel.setAttribute('x', pos.x);
      nameLabel.setAttribute('y', pos.y + 28);
      nameLabel.setAttribute('text-anchor', 'middle');
      nameLabel.setAttribute('fill', '#94a3b8');
      nameLabel.setAttribute('font-size', '9');
      nameLabel.textContent = node.label?.slice(0, 12);
      g.appendChild(nameLabel);

      svg.appendChild(g);
    });
  }, [nodes, links]);

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-pink-400" />
        <h3 className="font-bold text-white">Collusion Graph</h3>
        {clusters.length > 0 && (
          <span className="ml-auto badge badge-high text-xs">{clusters.length} ring{clusters.length !== 1 ? 's' : ''} detected</span>
        )}
      </div>

      {nodes.length < 2 ? (
        <div className="py-10 flex flex-col items-center text-slate-500">
          <Network className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">Need at least 2 preprocessed documents</p>
          <p className="text-xs mt-1">Upload & preprocess more documents to detect collusion.</p>
        </div>
      ) : (
        <>
          <svg
            ref={svgRef}
            className="w-full rounded-xl bg-white/[0.02] border border-white/[0.05]"
            style={{ height: '260px' }}
            viewBox={`0 0 400 260`}
            preserveAspectRatio="xMidYMid meet"
          />

          {/* Cluster list */}
          {clusters.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">Collusion Rings Detected</p>
              {clusters.map((cluster) => (
                <div key={cluster.cluster_id}
                  className="bg-red-500/[0.06] border border-red-500/20 rounded-xl p-3 mb-2">
                  <p className="text-xs text-red-400 font-semibold mb-1">Ring {cluster.cluster_id + 1}</p>
                  <div className="flex flex-wrap gap-1">
                    {cluster.members.map((m) => (
                      <span key={m} className="text-[11px] bg-red-500/10 text-red-300 border border-red-500/20 rounded px-2 py-0.5">{m}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {links.length === 0 && (
            <p className="text-xs text-slate-500 text-center mt-3">No high-similarity links found. No collusion detected.</p>
          )}
        </>
      )}
    </div>
  );
};

export default CollusionGraph;
