"use client";

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { getUserData } from "@/lib/demo-data";
import { useProjectsContext } from "./ProjectsContext";
import { WorkspaceToggle } from "./WorkspaceToggle";
import { WorkspaceCard } from "./WorkspaceCard";
import { WORKSPACES } from "./mock-data";

export function Workspaces() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { workspacesFilter, setWorkspacesFilter } = useProjectsContext();
  const { activeUser } = useUser();
  const allWorkspaces = getUserData(WORKSPACES, activeUser?.slug);

  const filteredWorkspaces = allWorkspaces.filter((workspace) => {
    if (workspacesFilter === "all") return true;
    return workspace.type === workspacesFilter;
  });

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
          <CaretDown
            className={cn(
              "h-4 w-4 text-[#1E1E1E] transition-transform",
              !isExpanded && "-rotate-90"
            )}
            weight="fill"
          />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#1E1E1E]">
            WORKSPACES
          </h2>
        </button>
        <WorkspaceToggle
          value={workspacesFilter}
          onChange={setWorkspacesFilter}
        />
      </div>

      {isExpanded && (
        <>
          {filteredWorkspaces.length > 0 ? (
            <div className="relative">
              <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex gap-4">
                  {filteredWorkspaces.map((workspace) => (
                    <WorkspaceCard key={workspace.id} workspace={workspace} />
                  ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className="text-center py-12 text-[#5F5E5B]">
              <p className="text-[14px]">
                {workspacesFilter === "all"
                  ? "No workspaces yet."
                  : `No ${workspacesFilter} workspaces yet.`}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
