"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Neo4j data shapes + react-force-graph-3d API */

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { SpinnerGap, Graph as GraphIcon } from "@phosphor-icons/react";

// Dynamic import of the wrapper file — NOT the library directly.
// The wrapper uses a static import of react-force-graph-3d, so the ref
// reaches the actual ForceGraph3D instance (not the next/dynamic loader).
const ForceGraph3D = dynamic(() => import("./ForceGraphWrapper"), {
  ssr: false,
  loading: () => null,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GraphNode {
  id: string;
  name: string;
  group: string;
}

interface GraphLink {
  source: string;
  target: string;
  label: string;
}

interface ForceGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLOR_MAP: Record<string, string> = {
  Goal: "#22c55e",
  Pattern: "#f97316",
  Person: "#3b82f6",
  Project: "#a855f7",
  Concept: "#14b8a6",
  Insight: "#eab308",
  Place: "#ec4899",
};

const BACKGROUND_COLOR = "#F4F1F1";

// ---------------------------------------------------------------------------
// Data transformation (Neo4j export shape → react-force-graph shape)
// ---------------------------------------------------------------------------

function transformGraphData(graph: {
  nodes: any[];
  edges: any[];
}): ForceGraphData {
  return {
    nodes: graph.nodes.map((n: any) => ({
      id: n.properties.id,
      name: n.properties.name || n.labels[0] || "Node",
      group: n.labels[0] || "Unknown",
    })),
    links: graph.edges.map((e: any) => ({
      source: e.from.id,
      target: e.to.id,
      label: e.type,
    })),
  };
}

// ---------------------------------------------------------------------------
// GraphView
// ---------------------------------------------------------------------------

interface GraphViewProps {
  isActive: boolean;
}

export function GraphView({ isActive }: GraphViewProps) {
  const [graphData, setGraphData] = useState<ForceGraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ nodes: number; edges: number; types: string[] } | null>(null);

  const loadedRef = useRef(false);

  // Load graph data from static file (pre-generated from brain_export)
  useEffect(() => {
    if (!isActive || loadedRef.current || loading) return;

    async function loadGraph() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/theo_graph.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();

        if (raw.nodes && raw.edges) {
          const transformed = transformGraphData(raw);
          setGraphData(transformed);
          setStats({
            nodes: transformed.nodes.length,
            edges: transformed.links.length,
            types: [...new Set(transformed.nodes.map((n) => n.group))],
          });
          loadedRef.current = true;
        } else {
          setError("Graph data file is missing nodes or edges");
        }
      } catch (e) {
        console.error("[GraphView] Failed to load graph data:", e);
        setError("Failed to load graph data");
      } finally {
        setLoading(false);
      }
    }

    loadGraph();
  }, [isActive, loading]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <SpinnerGap className="size-8 text-[#1E1E1E] animate-spin" weight="bold" />
        <p className="text-sm text-muted-foreground">Building knowledge graph...</p>
      </div>
    );
  }

  if (error && !graphData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <GraphIcon className="size-8 text-muted-foreground" weight="regular" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (graphData) {
    return (
      <div className="flex-1 relative overflow-hidden">
        {/* Absolute-fill container — ForceGraph3D auto-sizes to window when no width/height passed */}
        <div className="absolute inset-0">
          <ForceGraph3D
            graphData={graphData}
            nodeColor={(node: any) => COLOR_MAP[node.group] || "#94a3b8"}
            nodeLabel={(node: any) => `${node.group}: ${node.name}`}
            nodeOpacity={0.9}
            nodeVal={4}
            linkLabel={(link: any) => link.label}
            linkColor={() => "rgba(0,0,0,0.12)"}
            linkWidth={1}
            linkOpacity={0.4}
            backgroundColor={BACKGROUND_COLOR}
            controlType="orbit"
            enableNodeDrag={true}
            enableNavigationControls={true}
            showNavInfo={false}
          />
        </div>

        {/* Stats overlay */}
        {stats && (
          <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-lg bg-white/80 backdrop-blur-sm px-3 py-2 text-xs text-[#1E1E1E] border border-[#E6E5E3]">
            <span>{stats.nodes} nodes</span>
            <span className="text-muted-foreground">·</span>
            <span>{stats.edges} relationships</span>
            <span className="text-muted-foreground">·</span>
            <span>{stats.types.length} types</span>
          </div>
        )}

        {/* Legend overlay */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 rounded-lg bg-white/80 backdrop-blur-sm px-3 py-2 text-xs border border-[#E6E5E3]">
          {Object.entries(COLOR_MAP).map(([label, color]) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[#1E1E1E]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <GraphIcon className="size-8 text-muted-foreground" weight="regular" />
      <p className="text-sm text-muted-foreground">Your knowledge graph will appear here</p>
    </div>
  );
}
