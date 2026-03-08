"use client";

import { Funnel } from "@phosphor-icons/react";
import { WorkspaceToggle } from "./WorkspaceToggle";
import { useProjectsContext } from "./ProjectsContext";

export function ComingUpFilters() {
  const { comingUpFilter, setComingUpFilter } = useProjectsContext();

  return (
    <div className="flex items-center gap-3">
      <button className="flex items-center gap-2 px-3 py-1 rounded-lg border border-[#E6E5E3] hover:bg-white/50 transition-colors">
        <Funnel size={12} className="text-[#5F5E5B]" />
        <span className="text-[10px] font-normal text-[#1E1E1E]">Filter</span>
      </button>
      <WorkspaceToggle value={comingUpFilter} onChange={setComingUpFilter} />
    </div>
  );
}
