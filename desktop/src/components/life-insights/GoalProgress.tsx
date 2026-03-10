"use client";

import type { QuarterlyGoal } from "@/lib/demo-data";
import { GoalProgressCard } from "./GoalProgressCard";

interface GoalProgressProps {
  goals: QuarterlyGoal[];
}

export function GoalProgress({ goals }: GoalProgressProps) {
  if (goals.length === 0) {
    return (
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#949494] mb-3">
          Quarterly Goals
        </h3>
        <div className="rounded-[12px] border border-dashed border-[#E6E5E3] bg-white p-6 text-center">
          <p className="text-sm text-[#949494]">
            Your goals will appear here after your first week of sessions.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#949494] mb-3">
        Quarterly Goals
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {goals.map((goal) => (
          <GoalProgressCard key={goal.id} goal={goal} />
        ))}
      </div>
    </section>
  );
}
