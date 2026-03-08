"use client";

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { getUserData } from "@/lib/demo-data";
import { PinnedProjectCard } from "./PinnedProjectCard";
import { PINNED_PROJECTS } from "./mock-data";

export function PinnedProjects() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { activeUser } = useUser();
  const projects = getUserData(PINNED_PROJECTS, activeUser?.slug) ?? [];

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
            PINNED PROJECTS
          </h2>
        </button>
      </div>

      {isExpanded && (
        <div className="relative">
          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-4">
              {projects.map((project) => (
                <PinnedProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        </div>
      )}
    </section>
  );
}
