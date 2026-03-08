"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/demo-data";

export type { Priority };

interface PriorityBarsProps {
  priority: Priority;
  className?: string;
}

const NUM_BARS = 3;

const BARS_FILLED: Record<Priority, number> = {
  Urgent: 0,
  High: 3,
  Medium: 2,
  Low: 1,
  None: 0,
};

const ACTIVE_COLORS: Record<Priority, string> = {
  Urgent: "bg-red-600",
  High: "bg-red-700",
  Medium: "bg-amber-500",
  Low: "bg-yellow-500",
  None: "bg-gray-100",
};

const INACTIVE_COLORS: Record<Priority, string> = {
  Urgent: "bg-red-200",
  High: "bg-red-200",
  Medium: "bg-orange-100",
  Low: "bg-yellow-100",
  None: "bg-gray-100",
};

export function PriorityBars({ priority, className }: PriorityBarsProps) {
  const barsToFill = BARS_FILLED[priority];
  const activeColor = ACTIVE_COLORS[priority];
  const inactiveColor = INACTIVE_COLORS[priority];

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {priority === "Urgent" && (
        <WarningCircle size={22} weight="fill" className="text-red-600" />
      )}
      {priority !== "Urgent" &&
        Array.from({ length: NUM_BARS }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-3 w-1 rounded-full",
              index < barsToFill ? activeColor : inactiveColor
            )}
          />
        ))}
    </div>
  );
}
