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

/** Explicit colors for high-frequency node types */
const EXPLICIT_COLORS: Record<string, string> = {
  Concept: "#14b8a6",     // teal
  Pattern: "#f97316",     // orange
  Tool: "#6366f1",        // indigo
  Feature: "#8b5cf6",     // violet
  Project: "#a855f7",     // purple
  Person: "#3b82f6",      // blue
  Goal: "#22c55e",        // green
  Technique: "#06b6d4",   // cyan
  Practice: "#10b981",    // emerald
  Model: "#ec4899",       // pink
  Role: "#eab308",        // yellow
  Event: "#f43f5e",       // rose
  Place: "#d946ef",       // fuchsia
  Topic: "#0ea5e9",       // sky
};

/** Broader category buckets for the long tail of 120+ types */
const CATEGORY_BUCKETS: Record<string, string> = {
  // Tech / engineering
  Component: "#6366f1", Platform: "#6366f1", Framework: "#6366f1",
  Technology: "#6366f1", System: "#6366f1", Architecture_component: "#6366f1",
  App: "#6366f1", Interface: "#6366f1", Ui: "#6366f1",
  // Content / artifacts
  File: "#DAFF60", Document: "#DAFF60", Artifact: "#DAFF60",
  Section: "#DAFF60", Format: "#DAFF60", Template_collection: "#DAFF60",
  // People / orgs
  Organization: "#3b82f6", Team: "#3b82f6", Group: "#3b82f6",
  Company: "#3b82f6", Author: "#3b82f6", Actor: "#3b82f6",
  // Business / strategy
  Service: "#a855f7", Product: "#a855f7", Offer: "#a855f7",
  Strategy: "#a855f7", Brand: "#a855f7", Revenue: "#a855f7",
  Funding: "#a855f7", Channel: "#a855f7",
  // Process / workflow
  Process: "#06b6d4", Step: "#06b6d4", Phase: "#06b6d4",
  Workflow: "#06b6d4", Method: "#06b6d4", Methodology: "#06b6d4",
  // Identity / personal
  Identity_trait: "#eab308", Emotion: "#eab308", Trait: "#eab308",
  Skill: "#eab308", Mindset_area: "#eab308",
  // Health
  Medical_condition: "#f43f5e", Health_area: "#f43f5e",
  Symptom: "#f43f5e", Procedure: "#f43f5e",
};

const DEFAULT_COLOR = "#94a3b8"; // neutral gray for uncategorized

function getNodeColor(group: string): string {
  return EXPLICIT_COLORS[group] || CATEGORY_BUCKETS[group] || DEFAULT_COLOR;
}

/** Legend shows only the primary types that have visual mass */
const LEGEND_ENTRIES: [string, string][] = [
  ["Concept", "#14b8a6"],
  ["Pattern", "#f97316"],
  ["Tool", "#6366f1"],
  ["Project", "#a855f7"],
  ["Person", "#3b82f6"],
  ["Goal", "#22c55e"],
  ["Technique", "#06b6d4"],
  ["Practice", "#10b981"],
  ["Model", "#ec4899"],
  ["Role", "#eab308"],
  ["Event", "#f43f5e"],
  ["Other", "#94a3b8"],
];

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
        const res = await fetch("/demo_graph.json");
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
            nodeColor={(node: any) => getNodeColor(node.group)}
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

{/* Legend removed for demo — cleaner visual */}
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
