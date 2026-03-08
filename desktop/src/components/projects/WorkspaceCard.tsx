"use client";

import { WorkspaceIcon } from "./WorkspaceIcon";
import type { Workspace } from "./types";

interface WorkspaceCardProps {
  workspace: Workspace;
  onClick?: () => void;
}

// Map background colors to complementary icon colors from the palette
const ICON_COLOR_MAP: Record<string, string> = {
  "#21504E": "#E4E279", // Verdigris → Lemonade
  "#FD8B71": "#E8DDD4", // Flamingo → oatmeal
  "#C3B5EE": "#E4E279", // Lavendermis → Lemonade
  "#E4E279": "#21504E", // Lemonade → Verdigris
  "#F6D6DA": "#21504E", // Ballet → Verdigris
};

function getIconColor(bgColor: string): string {
  return ICON_COLOR_MAP[bgColor] || "#1E1E1E";
}

export function WorkspaceCard({ workspace, onClick }: WorkspaceCardProps) {
  const iconColor = getIconColor(workspace.bgColor);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open workspace: ${workspace.name}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="relative rounded-[8px] min-h-[75px] min-w-[160px] hover:shadow-sm transition-shadow cursor-pointer overflow-hidden border border-[#E6E5E3] focus:outline-none focus:ring-2 focus:ring-[#1E1E1E] focus:ring-offset-2"
    >
      {/* Top: Solid color (40% height) */}
      <div
        className="absolute inset-x-0 top-0 h-[40%] rounded-t-[8px] flex items-center justify-start pl-4"
        style={{ backgroundColor: workspace.bgColor }}
      >
        {/* Icon centered within the color block */}
        <WorkspaceIcon
          icon={workspace.icon}
          size={24}
          color={iconColor}
        />
      </div>

      {/* Bottom: White (60% height) */}
      <div className="absolute inset-x-0 bottom-0 h-[60%] bg-white rounded-b-[8px]" />

      {/* Content */}
      <div className="relative z-20 pt-[calc(40%+4px)] px-4 pb-2">
        <p className="text-[12px] font-semibold text-[#1E1E1E] text-left leading-[16px] line-clamp-2">
          {workspace.name}
        </p>
        {workspace.taskCount !== undefined && workspace.taskCount > 0 && (
          <span className="mt-1 text-[12px] font-normal text-[#5F5E5B]">
            {workspace.taskCount} {workspace.taskCount === 1 ? "task" : "tasks"}
          </span>
        )}
      </div>
    </div>
  );
}
