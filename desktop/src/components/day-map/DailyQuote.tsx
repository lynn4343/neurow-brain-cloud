"use client";

import { ArrowsClockwise } from "@phosphor-icons/react";

export function DailyQuote() {
  return (
    <div className="rounded-lg border border-[#E6E5E3] bg-white p-3">
      <div className="space-y-3 text-center">
        <p className="font-serif italic text-xs leading-relaxed text-[#1E1E1E]">
          &ldquo;To accomplish great things we must not only act but also dream;
          not only plan but also believe.&rdquo;
        </p>
        <div className="relative flex items-center justify-center">
          <p className="text-[9px] font-medium uppercase tracking-wide text-[#949494]">
            Anatole France
          </p>
          <button
            className="absolute right-0 flex h-5 w-5 items-center justify-center rounded hover:bg-[#E6E5E3] transition-colors"
            aria-label="Refresh quote"
          >
            <ArrowsClockwise className="h-3 w-3 text-[#949494]" />
          </button>
        </div>
      </div>
    </div>
  );
}
