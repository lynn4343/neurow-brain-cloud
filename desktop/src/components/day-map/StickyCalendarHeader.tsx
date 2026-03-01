"use client";

import { MinusCircle, PlusCircle } from "@phosphor-icons/react";
import { format, getQuarter } from "date-fns";
import { useDayMap } from "@/contexts/DayMapContext";
import { cn } from "@/lib/utils";

export function StickyCalendarHeader() {
  const { zoomIn, zoomOut, canZoomIn, canZoomOut, currentDay } = useDayMap();

  const dayOfWeek = format(currentDay, "EEEE").toUpperCase();
  const dayOfMonth = format(currentDay, "d");
  const quarter = `Q${getQuarter(currentDay)}`;

  return (
    <div className="sticky top-0 z-10">
      {/* Row 1: Dark header */}
      <div className="flex items-center justify-between bg-[#1E1E1E] px-[16px] py-[8px]">
        <div className="text-[14px] font-semibold uppercase leading-[20px] text-white">
          {quarter}
        </div>
        <div className="text-[14px] font-semibold uppercase leading-[20px] text-white">
          {dayOfWeek} {dayOfMonth}
        </div>
        <div className="flex items-center gap-[2px]">
          <button
            onClick={zoomOut}
            disabled={!canZoomOut}
            className={cn(
              "flex size-[24px] items-center justify-center rounded-[6px] p-[4px]",
              "hover:bg-white/10 transition-colors",
              !canZoomOut && "opacity-40 cursor-not-allowed hover:bg-transparent"
            )}
            aria-label="Zoom out"
          >
            <MinusCircle className="size-[14px] text-white" weight="regular" />
          </button>
          <button
            onClick={zoomIn}
            disabled={!canZoomIn}
            className={cn(
              "flex size-[24px] items-center justify-center rounded-[6px] p-[4px]",
              "hover:bg-white/10 transition-colors",
              !canZoomIn && "opacity-40 cursor-not-allowed hover:bg-transparent"
            )}
            aria-label="Zoom in"
          >
            <PlusCircle className="size-[14px] text-white" weight="regular" />
          </button>
        </div>
      </div>

      {/* Row 2: Event preview */}
      <div className="flex items-center border-b border-[#E6E5E3] bg-white py-[8px]">
        <span className="w-12 text-center text-[12px] text-[#5F5E5B]">all-day</span>
      </div>
    </div>
  );
}
