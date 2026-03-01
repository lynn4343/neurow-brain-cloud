"use client";

import { useState } from "react";
import {
  CaretLeft,
  CaretRight,
  SlidersHorizontal,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { format, endOfWeek } from "date-fns";
import { useDayMap } from "@/contexts/DayMapContext";
import { cn } from "@/lib/utils";
import { formatMonthLabel } from "@/lib/calendar-utils";
import { MonthYearPickerModal } from "./MonthYearPickerModal";
import type { CalendarView } from "@/contexts/DayMapContext";

export function CalendarTopTools() {
  const {
    currentDay,
    goToDay,
    goToToday,
    currentView,
    setCurrentView,
    currentWeek,
    goToPreviousWeek,
    goToNextWeek,
    currentMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToMonth,
  } = useDayMap();

  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Date label depends on current view
  let dateLabel: string;
  if (currentView === "Month") {
    dateLabel = formatMonthLabel(currentMonth);
  } else if (currentView === "Week") {
    dateLabel = `${format(currentWeek, "MMM d").toUpperCase()} - ${format(
      endOfWeek(currentWeek, { weekStartsOn: 0 }),
      "MMM d, yyyy"
    ).toUpperCase()}`;
  } else {
    dateLabel = format(currentDay, "MMMM d, yyyy").toUpperCase();
  }

  const handlePrev = () => {
    if (currentView === "Month") {
      goToPreviousMonth();
    } else if (currentView === "Week") {
      goToPreviousWeek();
    } else {
      const prev = new Date(currentDay);
      prev.setDate(prev.getDate() - 1);
      goToDay(prev);
    }
  };

  const handleNext = () => {
    if (currentView === "Month") {
      goToNextMonth();
    } else if (currentView === "Week") {
      goToNextWeek();
    } else {
      const next = new Date(currentDay);
      next.setDate(next.getDate() + 1);
      goToDay(next);
    }
  };

  const handleDateClick = () => {
    if (currentView === "Month") {
      setShowMonthPicker(true);
    }
  };

  const navLabel =
    currentView === "Month" ? "month" : currentView === "Week" ? "week" : "day";

  return (
    <>
      <div className="flex items-center justify-between bg-[#F4F1F1] px-[24px] py-[8px]">
        {/* Left: Navigation + Date Label */}
        <div className="flex items-center gap-[16px]">
          <div className="flex items-center gap-[4px]">
            <button
              onClick={handlePrev}
              className="flex size-[28px] items-center justify-center rounded-[8px] p-[8px] hover:bg-[#FAF8F8] transition-colors"
              aria-label={`Previous ${navLabel}`}
            >
              <CaretLeft className="size-[12px] text-[#1E1E1E]" weight="bold" />
            </button>
            <button
              onClick={goToToday}
              className="flex h-[28px] items-center rounded-[8px] px-[8px] text-[12px] font-normal text-[#1E1E1E] hover:bg-[#FAF8F8] transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="flex size-[28px] items-center justify-center rounded-[8px] p-[8px] hover:bg-[#FAF8F8] transition-colors"
              aria-label={`Next ${navLabel}`}
            >
              <CaretRight className="size-[12px] text-[#1E1E1E]" weight="bold" />
            </button>
          </div>
          <h2
            className={cn(
              "text-[14px] font-semibold uppercase text-[#1E1E1E]",
              currentView === "Month" && "cursor-pointer hover:text-[#5F5E5B] transition-colors"
            )}
            onClick={handleDateClick}
          >
            {dateLabel}
          </h2>
        </div>

        {/* Center: View Toggles */}
        <div className="flex items-center gap-[4px] rounded-full bg-white p-[3px]">
          {(["Day", "Week", "Month", "Year"] as const).map((view) => {
            const isActive = view === currentView;
            const isDisabled = view === "Year";

            return (
              <button
                key={view}
                disabled={isDisabled}
                onClick={() => !isDisabled && setCurrentView(view as CalendarView)}
                className={cn(
                  "rounded-full py-[1px] text-[12px] font-normal transition-all",
                  isActive
                    ? "bg-[#1E1E1E] px-[24px] text-white shadow-sm"
                    : isDisabled
                    ? "px-[21px] text-[#5F5E5B] opacity-40 cursor-not-allowed"
                    : "px-[21px] text-[#5F5E5B] hover:bg-[#F0EFED]"
                )}
              >
                {view}
              </button>
            );
          })}
        </div>

        {/* Right: Options + Separator + Open */}
        <div className="flex items-center gap-[8px]">
          <button className="flex h-[28px] items-center gap-[4px] rounded-[8px] p-[8px] text-[12px] font-normal text-[#1E1E1E] hover:bg-[#FAF8F8] transition-colors">
            <SlidersHorizontal className="size-[12px]" weight="regular" />
            Options
          </button>
          <div className="h-4 w-px bg-[#E6E5E3]" />
          <button className="flex h-[28px] items-center gap-[4px] rounded-[8px] p-[8px] text-[12px] font-normal text-[#1E1E1E] hover:bg-[#FAF8F8] transition-colors">
            <ArrowSquareOut className="size-[12px]" weight="regular" />
            Open
          </button>
        </div>
      </div>

      {/* Month/Year Picker Modal */}
      {showMonthPicker && (
        <MonthYearPickerModal
          currentMonth={currentMonth}
          onSelect={(date) => {
            goToMonth(date);
            setShowMonthPicker(false);
          }}
          onClose={() => setShowMonthPicker(false)}
        />
      )}
    </>
  );
}
