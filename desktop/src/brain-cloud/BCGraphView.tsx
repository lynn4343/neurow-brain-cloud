"use client";

import { GraphView } from "@/components/graph/GraphView";

interface BCGraphViewProps {
  isActive: boolean;
}

export function BCGraphView({ isActive }: BCGraphViewProps) {
  return <GraphView isActive={isActive} />;
}
