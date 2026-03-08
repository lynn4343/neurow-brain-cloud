"use client";

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { getUserData } from "@/lib/demo-data";
import { PriorityGoalCard } from "./PriorityGoalCard";
import { PRIORITY_GOALS } from "./mock-data";
import type { PriorityGoal } from "./types";

export function PriorityGoals() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { activeUser } = useUser();
  const staticGoals = getUserData(PRIORITY_GOALS, activeUser?.slug);
  const hasUserSpecificData =
    !!activeUser?.slug && activeUser.slug in PRIORITY_GOALS;
  const gc = activeUser?.goal_cascade;

  // If user completed clarity session but has no curated mock data,
  // override card #1 with their actual quarterly goal + next action step
  const goals: PriorityGoal[] =
    gc?.quarterly_goal && !hasUserSpecificData
      ? [
          {
            id: "gc-1",
            position: 1 as const,
            title: gc.quarterly_goal_headline ?? gc.quarterly_goal,
            nextMilestone: gc.next_action_step,
            milestoneDate: gc.next_action_due
              ? new Date(
                  gc.next_action_due + "T00:00:00"
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "",
            backgroundColor: "#D5CCDB",
          },
          ...staticGoals.slice(1),
        ]
      : staticGoals;

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
            TOP PRIORITY GOALS
          </h2>
        </button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <PriorityGoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </section>
  );
}
