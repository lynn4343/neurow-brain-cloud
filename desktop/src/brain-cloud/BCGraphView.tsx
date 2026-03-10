"use client";

import { GraphView } from "@/components/graph/GraphView";
import { useUser } from "@/contexts/UserContext";

interface BCGraphViewProps {
  isActive: boolean;
}

export function BCGraphView({ isActive }: BCGraphViewProps) {
  const { activeUser } = useUser();
  return (
    <GraphView
      isActive={isActive}
      userId={activeUser?.id}
    />
  );
}
