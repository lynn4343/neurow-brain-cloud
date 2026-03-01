"use client";

import { ArrowSquareOut } from "@phosphor-icons/react";

export function WeeklyGoals() {
  return (
    <div className="space-y-4">
      {/* Weekly Targets */}
      <div className="rounded-lg border border-[#E6E5E3] bg-white p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#949494]">
            Weekly Targets
          </h3>
          <button className="flex h-5 w-5 items-center justify-center rounded hover:bg-[#E6E5E3] transition-colors">
            <ArrowSquareOut className="h-3 w-3 text-[#949494]" />
          </button>
        </div>
        <div className="space-y-1.5">
          <div className="text-xs text-[#949494]">Text</div>
          <div className="text-xs text-[#949494]">Text</div>
          <div className="text-xs text-[#949494]">Text</div>
        </div>
      </div>

      {/* Monthly Targets */}
      <div className="rounded-lg border border-[#E6E5E3] bg-white p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#949494]">
            Monthly Targets
          </h3>
          <button className="flex h-5 w-5 items-center justify-center rounded hover:bg-[#E6E5E3] transition-colors">
            <ArrowSquareOut className="h-3 w-3 text-[#949494]" />
          </button>
        </div>
        <div className="space-y-1.5">
          <div className="text-xs text-[#949494]">Text</div>
          <div className="text-xs text-[#949494]">Text</div>
        </div>
      </div>
    </div>
  );
}
