import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Network } from 'lucide-react';

const CollusionGraph = ({ nodes, links }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!nodes || !links || nodes.length === 0) return;

    const width = 400;
    const height = 300;

    // Clear previous SVG contents
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Create a copy of the data since d3 modifies it
    const simulationNodes = nodes.map(d => Object.create(d));
    const simulationLinks = links.map(d => Object.create(d));

    const simulation = d3.forceSimulation(simulationNodes)
      .force("link", d3.forceLink(simulationLinks).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(simulationLinks)
      .join("line")
      .attr("stroke-width", d => Math.max(1, Math.sqrt(d.value) * 2));

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(simulationNodes)
      .join("circle")
      .attr("r", 8)
      .attr("fill", d => d.group > 0 ? "#ef4444" : "#3b82f6")
      .call(drag(simulation));

    node.append("title")
      .text(d => d.label);

    const label = svg.append("g")
      .selectAll("text")
      .data(simulationNodes)
      .join("text")
      .attr("dy", -12)
      .attr("dx", 0)
      .attr("text-anchor", "middle")
      .text(d => d.label.substring(0, 10))
      .attr("font-size", "10px")
      .attr("fill", "#4b5563")
      .attr("font-weight", "500");

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x = Math.max(8, Math.min(width - 8, d.x)))
        .attr("cy", d => d.y = Math.max(8, Math.min(height - 8, d.y)));
        
      label
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });

    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => simulation.stop();
  }, [nodes, links]);

  if (!nodes || nodes.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center h-48">
        <Network className="w-10 h-10 text-gray-300 mb-2" />
        <p className="text-gray-500 font-medium">No collusion network data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <Network className="w-5 h-5 mr-2 text-red-500" />
        Collusion Network
      </h2>
      <div className="bg-slate-50 rounded-xl overflow-hidden border border-gray-200">
        <svg ref={svgRef}></svg>
      </div>
      <p className="mt-3 text-xs text-gray-500 text-center">
        <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1 align-middle"></span> Flagged Pair
        <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1 ml-3 align-middle"></span> Safe
      </p>
    </div>
  );
};

export default CollusionGraph;
