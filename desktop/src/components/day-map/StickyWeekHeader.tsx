"use client";

import { MinusCircle, PlusCircle } from "@phosphor-icons/react";
import { useDayMap } from "@/contexts/DayMapContext";
import { cn } from "@/lib/utils";
import { startOfToday, isSameWeek } from "date-fns";

interface StickyWeekHeaderProps {
  days: string[];
  currentDay: string;
  dates: number[];
}

export function StickyWeekHeader({ days, currentDay, dates }: StickyWeekHeaderProps) {
  const { zoomIn, zoomOut, canZoomIn, canZoomOut, currentWeek } = useDayMap();

  const isCurrentWeek = isSameWeek(currentWeek, startOfToday(), { weekStartsOn: 0 });

  return (
    <div className="sticky top-0 z-10">
      <div className="flex border-b border-[#E6E5E3] bg-white">
        {/* Zoom controls above time column */}
        <div className="w-[72px] flex-shrink-0 border-r border-[#E6E5E3] flex items-center justify-center gap-[2px] py-[8px]">
          <button
            onClick={zoomOut}
            disabled={!canZoomOut}
            className={cn(
              "flex size-[24px] items-center justify-center rounded-[6px] p-[4px] transition-colors",
              canZoomOut ? "hover:bg-gray-100" : "opacity-40 cursor-not-allowed"
            )}
            aria-label="Zoom out calendar"
          >
            <MinusCircle className="size-[14px] text-[#1E1E1E]" weight="regular" />
          </button>
          <button
            onClick={zoomIn}
            disabled={!canZoomIn}
            className={cn(
              "flex size-[24px] items-center justify-center rounded-[6px] p-[4px] transition-colors",
              canZoomIn ? "hover:bg-gray-100" : "opacity-40 cursor-not-allowed"
            )}
            aria-label="Zoom in calendar"
          >
            <PlusCircle className="size-[14px] text-[#1E1E1E]" weight="regular" />
          </button>
        </div>

        {/* Day labels with date numbers */}
        {days.map((day, index) => {
          const isCurrentDayColumn = day === currentDay && isCurrentWeek;

          return (
            <div
              key={day}
              className={cn(
                "flex-[1_0_0] px-[4px] py-[8px] text-center",
                "text-[14px] uppercase leading-[20px]",
                isCurrentDayColumn
                  ? "bg-[#1E1E1E] text-white border-l border-l-[#5F5E5B] border-r border-r-[#5F5E5B]"
                  : "text-[#1E1E1E] border-r border-[#E6E5E3] last:border-r-0"
              )}
            >
              <span className="font-semibold">{day}</span>
              <span className="ml-2 font-light">{dates[index]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
