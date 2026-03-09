"use client";

import { PushPin } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { useProjectsContext } from "./ProjectsContext";
import { PROJECT_COLORS, type PinnedProject } from "./types";

interface PinnedProjectCardProps {
  project: PinnedProject;
}

export function PinnedProjectCard({ project }: PinnedProjectCardProps) {
  const { setActivePage } = useProjectsContext();
  const projectColorIndex =
    project.tag
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    PROJECT_COLORS.length;

  return (
    <button
      type="button"
      className="min-w-[280px] rounded-[8px] bg-white p-4 border border-[#E6E5E3] hover:shadow-sm transition-shadow relative cursor-pointer text-left"
      onClick={() => setActivePage(`project-${project.id}`)}
    >
      <div className="absolute top-4 right-4">
        <PushPin size={16} weight="fill" className="text-[#5F5E5B]" />
      </div>

      <h3 className="text-[12px] font-semibold text-[#1E1E1E] leading-[16px] mb-4 pr-6">
        {project.name}
      </h3>

      <div className="flex items-center gap-1 flex-wrap">
        <Badge
          variant="outline"
          className="text-xs bg-white text-[#1E1E1E] border-[#E6E5E3]"
        >
          {project.workspace}
        </Badge>
        <Badge
          variant="outline"
          className={`text-xs max-w-[120px] overflow-hidden ${PROJECT_COLORS[projectColorIndex]}`}
        >
          <span className="truncate block">{project.tag}</span>
        </Badge>
      </div>
    </button>
  );
}
