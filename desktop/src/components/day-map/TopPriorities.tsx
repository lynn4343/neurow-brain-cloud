"use client";

import { useState } from "react";
import { CaretDown, Circle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function TopPriorities() {
  const [isExpanded, setIsExpanded] = useState(true);

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
          {[1, 2, 3].map((slot) => (
            <div
              key={slot}
              className="flex items-center gap-3 rounded-lg border border-dashed border-[#E6E5E3] bg-[#FAF8F8] px-4 py-2.5"
            >
              <Circle className="size-5 text-[#E6E5E3]" weight="regular" />
              <span className="text-sm text-[#949494]">
                Set today&apos;s priorities
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
