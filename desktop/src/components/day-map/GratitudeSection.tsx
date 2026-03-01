"use client";

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function GratitudeSection() {
  const [isExpanded, setIsExpanded] = useState(false);

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
          Gratitude
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-[#5F5E5B]">
            What are you grateful for today?
          </p>
          <textarea
            placeholder="Write your gratitude here..."
            className="w-full min-h-[80px] rounded-lg border border-[#E6E5E3] bg-white p-3 text-sm text-[#1E1E1E] placeholder:text-[#949494] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f5bb3] resize-none"
          />
        </div>
      )}
    </div>
  );
}
