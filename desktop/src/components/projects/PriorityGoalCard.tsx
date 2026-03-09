"use client";

import Image from "next/image";
import { useProjectsContext, type ProjectsPage } from "./ProjectsContext";
import type { PriorityGoal } from "./types";

interface PriorityGoalCardProps {
  goal: PriorityGoal;
}

const getIconPath = (position: number): string => {
  const iconMap: Record<number, string> = {
    1: "/icons/goal-1.svg",
    2: "/icons/goal-2.svg",
    3: "/icons/goal-3.svg",
  };
  return iconMap[position] || iconMap[1];
};

export function PriorityGoalCard({ goal }: PriorityGoalCardProps) {
  const { setActivePage } = useProjectsContext();
  const pageId = `goal-${goal.position}` as ProjectsPage;

  return (
    <button
      type="button"
      className="rounded-[8px] p-6 min-h-[140px] min-w-0 flex flex-col cursor-pointer transition-shadow hover:shadow-md text-left"
      style={{ backgroundColor: goal.backgroundColor }}
      onClick={() => setActivePage(pageId)}
    >
      <div className="flex items-start justify-between w-full mb-4">
        <Image
          src={getIconPath(goal.position)}
          alt={`Goal ${goal.position}`}
          width={70}
          height={27}
          className="object-contain"
        />
        <span className="ml-auto px-2.5 py-0.5 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200 text-[11px] font-semibold whitespace-nowrap">
          Priority Goal
        </span>
      </div>

      <h3 className="text-[14px] font-semibold text-[#1E1E1E] leading-[20px] mb-2">
        {goal.title}
      </h3>

      <div className="mt-auto pt-4">
        <p className="text-[10px] font-medium text-[#1E1E1E] uppercase tracking-[0.5px] mb-1">
          NEXT ACTION STEP:
        </p>
        <p className="text-[14px] font-normal text-[#4A5ACF] leading-[18px]">
          {goal.nextMilestone}
        </p>
      </div>
    </button>
  );
}
