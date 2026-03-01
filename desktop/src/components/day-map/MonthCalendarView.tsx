"use client";

import { cn } from "@/lib/utils";
import { useDayMap } from "@/contexts/DayMapContext";
import { generateMonthCalendar, getCurrentDayOfWeek } from "@/lib/calendar-utils";

export function MonthCalendarView() {
  const { currentMonth } = useDayMap();

  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const currentDayOfWeek = getCurrentDayOfWeek(new Date());
  const calendarDays = generateMonthCalendar(currentMonth);

  // Dynamic row count: calendar can be 4, 5, or 6 weeks
  const rowCount = calendarDays.length / 7;

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden rounded-[8px] border border-[#F1F0F0] bg-white">
      {/* Sticky Day Header Row */}
      <div className="sticky top-0 z-10 flex border-b border-[#E6E5E3] bg-white">
        {days.map((day) => (
          <div
            key={day}
            className={cn(
              "flex-[1_0_0] px-[4px] py-[8px] text-center",
              "text-[14px] font-semibold uppercase leading-[20px]",
              day === currentDayOfWeek
                ? "bg-[#1E1E1E] text-white"
                : "text-[#1E1E1E]"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div
        className="grid h-full grid-cols-[repeat(7,_minmax(0,_1fr))]"
        style={{
          gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))`,
        }}
      >
        {calendarDays.map((dayData, index) => (
          <div
            key={`${dayData.date.toISOString()}-${index}`}
            className={cn(
              "relative border border-[#E6E5E3] p-[3.5px]",
              dayData.isCurrentMonth ? "bg-white" : "bg-[#FAF8F8] opacity-40"
            )}
          >
            {/* Day Number - Positioned top-right */}
            <div className="absolute right-[3.5px] top-[3.5px]">
              <div
                className={cn(
                  "flex size-[28px] items-center justify-center rounded-full",
                  "text-[12px] font-normal leading-[14px]",
                  dayData.isToday
                    ? "bg-[#1E1E1E] text-white"
                    : "text-[#1E1E1E]"
                )}
              >
                {dayData.dayNumber}
              </div>
            </div>

            {/* Event slots will go here in future */}
          </div>
        ))}
      </div>
    </div>
  );
}
