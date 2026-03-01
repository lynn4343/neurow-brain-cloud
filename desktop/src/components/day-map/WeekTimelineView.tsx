"use client";

import { useDayMap } from "@/contexts/DayMapContext";
import { StickyWeekHeader } from "./StickyWeekHeader";
import { SunIcon } from "./icons/SunIcon";
import { MoonIcon } from "./icons/MoonIcon";
import { getCurrentDayOfWeek } from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";
import { addDays, format, isSameWeek, startOfToday } from "date-fns";

export function WeekTimelineView() {
  const { hourRowHeight, currentWeek } = useDayMap();

  const hours = [
    "12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM",
    "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM",
    "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM",
    "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM",
    "12 AM",
  ];

  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  // Only highlight current day if we're viewing the actual current week
  const isCurrentWeek = isSameWeek(currentWeek, startOfToday(), { weekStartsOn: 0 });
  const currentDay = isCurrentWeek ? getCurrentDayOfWeek(new Date()) : "";

  // Calculate dates for the week from context (Sunday-start)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(currentWeek, i);
    return parseInt(format(date, "d"));
  });

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden rounded-[8px] border border-[#F1F0F0] bg-white">
      <StickyWeekHeader days={days} currentDay={currentDay} dates={dates} />

      {/* Scrollable grid */}
      <div className="relative flex-1 overflow-y-auto timeline-scrollbar">
        {/* Sticky Sun Icon - only in time column */}
        <div className="pointer-events-none sticky top-0 z-10 flex">
          <div className="flex w-[72px] items-center justify-center border-r border-[#E6E5E3] bg-white py-2">
            <SunIcon className="h-4 w-[31px]" />
          </div>
        </div>

        {/* Gradient fade zone */}
        <div className="pointer-events-none sticky top-[32px] z-[9] flex">
          <div className="h-8 w-[60px] bg-gradient-to-b from-white to-transparent" />
        </div>

        {/* Hourly Grid */}
        <div className="-mt-[72px]">
          {hours.map((hour, hourIndex) => (
            <div
              key={`${hour}-${hourIndex}`}
              className="flex transition-all duration-300 ease-out"
              style={{ height: `${hourRowHeight}px` }}
            >
              {/* Time label column (72px fixed) */}
              <div className="relative flex w-[72px] flex-shrink-0 justify-center border-r border-[#E6E5E3]">
                <span className={cn(
                  "absolute bottom-0 translate-y-1/2 text-[12px] leading-[14px] tracking-[-0.01em] text-[#1E1E1E]",
                  hour === "12 PM" && "font-bold"
                )}>
                  {hour}
                </span>

                {/* Dotted line for current time indicator (at 10 AM) */}
                {hour === "10 AM" && (
                  <div
                    className="absolute left-0 right-0 h-[2px] border-t border-dashed border-[#D1D1D1]"
                    style={{ top: `${hourRowHeight / 2}px` }}
                  />
                )}
              </div>

              {/* Day columns (flex-grow equally) */}
              {days.map((day, dayIndex) => (
                <div
                  key={day}
                  className={cn(
                    "relative flex-[1_0_0] border-b",
                    day === currentDay
                      ? "border-l border-l-[#5F5E5B] border-r border-r-[#5F5E5B]"
                      : "border-r border-[#E6E5E3] last:border-r-0"
                  )}
                >
                  {/* Current Time Indicator (at 10 AM) */}
                  {hour === "10 AM" && (
                    <div
                      className="absolute left-0 right-0 flex items-center"
                      style={{ top: `${hourRowHeight / 2}px` }}
                    >
                      <div className="h-[2px] w-full bg-[#1E1E1E]" />
                      {dayIndex === 0 && (
                        <div className="absolute -left-1 h-3 w-3 rounded-full bg-[#1E1E1E]" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Gradient fade zone bottom */}
        <div className="pointer-events-none sticky bottom-[34px] z-[9] flex">
          <div className="h-8 w-[60px] bg-gradient-to-t from-white to-transparent" />
        </div>

        {/* Sticky Moon Icon - only in time column */}
        <div className="sticky bottom-0 z-10 flex">
          <div className="flex w-[72px] items-center justify-center border-r border-[#E6E5E3] bg-white py-2">
            <MoonIcon className="h-[18px] w-[18px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
