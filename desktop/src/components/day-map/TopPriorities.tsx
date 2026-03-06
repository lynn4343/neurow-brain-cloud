"use client";

import { useState } from "react";
import { CaretDown, Circle, CheckCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";

/**
 * Format an ISO date string (YYYY-MM-DD) for display.
 * Parses as local date to avoid the UTC midnight off-by-one issue.
 * Returns: "Due Sunday, Mar 8"
 */
function formatDueDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const monthStr = date.toLocaleDateString("en-US", { month: "short" });
  return `Due ${weekday}, ${monthStr} ${day}`;
}

function PlaceholderSlot() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-[#E6E5E3] bg-[#FAF8F8] px-4 py-2.5">
      <Circle className="size-5 shrink-0 text-[#E6E5E3]" weight="regular" />
      <span className="text-sm text-[#949494]">
        Set today&apos;s priorities
      </span>
    </div>
  );
}

export function TopPriorities() {
  const { activeUser } = useUser();
  const [isExpanded, setIsExpanded] = useState(true);

  const actionStep = activeUser?.goal_cascade?.next_action_step || null;
  const actionDue = activeUser?.goal_cascade?.next_action_due || null;

  return (
    <div className="flex flex-col rounded-[12px] border border-[#E6E5E3] bg-white p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2"
      >
        <CaretDown
          className={cn(
            "size-3 text-[#949494] transition-transform",
            !isExpanded && "-rotate-90"
          )}
          weight="bold"
        />
        <span className="text-sm font-semibold uppercase text-[#1E1E1E]">
          Today&apos;s Top 3 Priorities
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {/* Slot 1: Next action step from Goal Cascade, or placeholder */}
          {actionStep ? (
            <div className="flex items-start gap-3 rounded-lg border border-[#E6E5E3] bg-white px-4 py-2.5">
              <CheckCircle
                className="mt-0.5 size-5 shrink-0 text-[#1E1E1E]"
                weight="regular"
              />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[#1E1E1E]">
                  {actionStep}
                </span>
                {actionDue && (
                  <span className="text-xs text-[#949494]">
                    {formatDueDate(actionDue)}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <PlaceholderSlot />
          )}

          {/* Slots 2-3: Always placeholders */}
          <PlaceholderSlot />
          <PlaceholderSlot />
        </div>
      )}
    </div>
  );
}
