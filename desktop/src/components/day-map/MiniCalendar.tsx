"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { format, startOfToday, addMonths, subMonths, isSameDay } from "date-fns";
import { generateMonthCalendar } from "@/lib/calendar-utils";
import { useState } from "react";

interface MiniCalendarProps {
  onDayClick?: (date: Date) => void;
  selectedDate?: Date;
}

export function MiniCalendar({ onDayClick, selectedDate }: MiniCalendarProps) {
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const [displayMonth, setDisplayMonth] = useState<Date>(startOfToday());

  const today = startOfToday();
  const calendarDays = generateMonthCalendar(displayMonth);
  const currentDayOfWeek = today.getDay();

  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const activeWeekIndex = weeks.findIndex((week) =>
    week.some((date) => date.isToday)
  );

  return (
    <div className="rounded-lg border border-[#E6E5E3] bg-white p-4">
      <div className="space-y-2">
        {/* Month Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setDisplayMonth((prev) => subMonths(prev, 1))}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[#E6E5E3]"
            aria-label="Previous month"
          >
            <CaretLeft className="h-4 w-4 text-[#1E1E1E]" />
          </button>
          <span className="text-xs font-semibold text-[#1E1E1E]">
            {format(displayMonth, "MMM yyyy").toUpperCase()}
          </span>
          <button
            onClick={() => setDisplayMonth((prev) => addMonths(prev, 1))}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[#E6E5E3]"
            aria-label="Next month"
          >
            <CaretRight className="h-4 w-4 text-[#1E1E1E]" />
          </button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-0.5">
          {daysOfWeek.map((day, index) => (
            <div
              key={day}
              className={`flex h-7 w-7 items-center justify-center text-xs ${
                index === currentDayOfWeek
                  ? "font-extrabold text-[#1E1E1E]"
                  : "font-medium text-[#5F5E5B]"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="space-y-0">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="relative grid grid-cols-7 gap-0.5">
              {weekIndex === activeWeekIndex && (
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[calc(100%+8px)] rounded-full bg-[#EBE7E7]" />
              )}
              {week.map((dayData, dayIndex) => {
                const isSelected =
                  selectedDate && isSameDay(dayData.date, selectedDate);

                return (
                  <button
                    key={dayIndex}
                    onClick={() => onDayClick?.(dayData.date)}
                    className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full text-xs transition-colors ${
                      dayData.isToday
                        ? "bg-[#1E1E1E] text-white"
                        : isSelected
                        ? "bg-[#6070CC] text-white"
                        : dayData.isCurrentMonth
                        ? "text-[#1E1E1E] hover:bg-[#E6E5E3]"
                        : "text-[#949494]"
                    } ${onDayClick ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {dayData.dayNumber}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
