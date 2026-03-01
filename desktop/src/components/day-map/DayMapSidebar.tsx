"use client";

import { cn } from "@/lib/utils";
import { CalendarBlank, CaretDoubleLeft } from "@phosphor-icons/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDayMap } from "@/contexts/DayMapContext";
import { MiniCalendar } from "./MiniCalendar";
import { DailyQuote } from "./DailyQuote";
import { WeeklyGoals } from "./WeeklyGoals";

export function DayMapSidebar() {
  const { sidebarOpen, toggleSidebar, currentDay, goToDay } = useDayMap();

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-[#F4F1F1] transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-[210px] px-4 py-[10px]" : "w-[68px] p-4 hover:bg-[#EBE7E7]"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center",
          sidebarOpen ? "justify-between" : "justify-center"
        )}
      >
        {sidebarOpen && (
          <div className="flex items-center gap-[4px]">
            <CalendarBlank className="size-[16px] text-[#1E1E1E]" weight="regular" />
            <span className="text-[12px] font-normal text-[#1E1E1E]">
              CALENDAR
            </span>
          </div>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleSidebar}
              className="flex size-7 items-center justify-center rounded-lg transition-all duration-200 hover:bg-white/70 active:scale-95"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <CaretDoubleLeft
                className="size-[14px] transition-transform duration-300"
                weight="bold"
                style={{
                  transform: sidebarOpen ? "rotate(0deg)" : "rotate(180deg)",
                }}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{sidebarOpen ? "Collapse" : "Expand"}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Content — only when expanded */}
      {sidebarOpen && (
        <div className="mt-[24px] space-y-3">
          <MiniCalendar onDayClick={goToDay} selectedDate={currentDay} />
          <DailyQuote />
          <WeeklyGoals />
        </div>
      )}
    </aside>
  );
}
