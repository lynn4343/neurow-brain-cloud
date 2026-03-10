"use client";

import { cn } from "@/lib/utils";
import { Check, Sparkle } from "@phosphor-icons/react";
import type { QuarterlyGoal } from "@/lib/demo-data";
import { ProgressRing } from "./ProgressRing";

interface GoalProgressCardProps {
  goal: QuarterlyGoal;
}

export function GoalProgressCard({ goal }: GoalProgressCardProps) {
  const completed = goal.milestones.filter((m) => m.completed).length;
  const total = goal.milestones.length;

  return (
    <div className="min-w-[320px] max-w-[400px] flex-shrink-0 rounded-[12px] border border-[#E6E5E3] bg-white p-5">
      {/* Header: title + ring */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1 min-w-0 pr-3">
          <h4 className="text-base font-semibold text-[#1E1E1E] leading-snug">
            {goal.title}
          </h4>
          <p className="text-xs italic text-[#949494] mt-1 leading-relaxed">
            &ldquo;{goal.why}&rdquo;
          </p>
        </div>
        <ProgressRing completed={completed} total={total} />
      </div>

      {/* Milestones */}
      <div className="mt-3 space-y-1">
        {goal.milestones.map((milestone, idx) => (
          <div key={idx} className="flex items-center gap-2 py-1">
            <div
              className={cn(
                "h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                milestone.completed
                  ? "bg-[#1E1E1E] border-[#1E1E1E]"
                  : "border-[#E6E5E3]"
              )}
            >
              {milestone.completed && (
                <Check size={8} weight="bold" className="text-white" />
              )}
            </div>
            <span
              className={cn(
                "text-xs leading-snug",
                milestone.completed
                  ? "text-[#949494] line-through"
                  : "text-[#1E1E1E]"
              )}
            >
              {milestone.text}
            </span>
          </div>
        ))}
      </div>

      {/* Next milestone */}
      {goal.nextMilestone ? (
        <div className="mt-3 pt-3 border-t border-[#F4F1F1] flex items-center justify-between">
          <span className="text-[11px] text-[#5F5E5B]">
            Next: {goal.nextMilestone}
          </span>
          {goal.nextMilestoneDue && (
            <span className="text-[11px] text-[#949494]">
              {goal.nextMilestoneDue}
            </span>
          )}
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-[#F4F1F1]">
          <span className="text-[11px] text-[#949494]">All milestones completed</span>
        </div>
      )}

      {/* Celebration */}
      {goal.celebration && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 border border-amber-100">
          <Sparkle size={14} weight="fill" className="text-amber-500 flex-shrink-0" />
          <span className="text-xs font-medium text-amber-800">
            {goal.celebration}
          </span>
        </div>
      )}
    </div>
  );
}
