"use client";

import { useState, useEffect } from "react";
import { useDayMap } from "@/contexts/DayMapContext";
import { useUser } from "@/contexts/UserContext";
import { StickyWeekHeader } from "./StickyWeekHeader";
import { SunIcon } from "./icons/SunIcon";
import { MoonIcon } from "./icons/MoonIcon";
import { getCurrentDayOfWeek } from "@/lib/calendar-utils";
import { CALENDAR_EVENTS, getUserData } from "@/lib/demo-data";
import { useDemoData } from "@/contexts/DemoDataContext";
import { getEventLayout } from "@/lib/event-layout";
import { EventBlock } from "./EventBlock";
import { cn } from "@/lib/utils";
import { addDays, format, isSameWeek, startOfToday } from "date-fns";

export function WeekTimelineView() {
  const { hourRowHeight, currentWeek } = useDayMap();
  const { activeUser } = useUser();

  const hours = [
    "12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM",
    "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM",
    "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM",
    "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM",
    "12 AM",
  ];

  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  // Reactive current time — updates every 60s
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  // Labels sit at the bottom of each row, so offset +1 to align indicator
  // with the correct visual hour band (see TimelineView for full explanation).
  const currentHourRow = currentHour + 1;
  const minuteOffset = (currentMinute / 60) * hourRowHeight;

  // Only highlight current day if we're viewing the actual current week
  const isCurrentWeek = isSameWeek(currentWeek, startOfToday(), { weekStartsOn: 0 });
  const currentDay = isCurrentWeek ? getCurrentDayOfWeek(new Date()) : "";

  // Calculate dates for the week from context (Sunday-start)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(currentWeek, i);
    return parseInt(format(date, "d"));
  });

  // Event data
  const { events: allEvents, openEventModal, openNewEventModal } = useDemoData();

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
        <div className="-mt-[72px] relative">
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

                {/* Dotted line — only at current hour, only if viewing current week */}
                {hourIndex === currentHourRow && isCurrentWeek && (
                  <div
                    className="absolute left-0 right-0 z-[5] h-[2px] border-t border-dashed border-[#D1D1D1]"
                    style={{ top: `${minuteOffset}px` }}
                  />
                )}
              </div>

              {/* Day columns (flex-grow equally) */}
              {days.map((day, dayIndex) => (
                <div
                  key={day}
                  onDoubleClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const yInRow = e.clientY - rect.top;
                    const rawMinute = Math.round((yInRow / hourRowHeight) * 60 / 30) * 30;
                    const minute = Math.min(rawMinute, 30);
                    const startTime = `${String(hourIndex).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
                    const clickDate = addDays(currentWeek, dayIndex);
                    openNewEventModal(format(clickDate, "yyyy-MM-dd"), startTime);
                  }}
                  className={cn(
                    "relative flex-[1_0_0] border-b",
                    day === currentDay
                      ? "border-l border-l-[#5F5E5B] border-r border-r-[#5F5E5B]"
                      : "border-r border-[#E6E5E3] last:border-r-0"
                  )}
                >
                  {/* Current time indicator — solid line across all columns, dot only on current day */}
                  {hourIndex === currentHourRow && isCurrentWeek && (
                    <div
                      className="absolute left-0 right-0 z-[5] flex items-center"
                      style={{ top: `${minuteOffset}px` }}
                    >
                      <div className="h-[2px] w-full bg-[#1E1E1E]" />
                      {dayIndex === now.getDay() && (
                        <div className="absolute -left-1 h-3 w-3 rounded-full bg-[#1E1E1E]" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Event overlay — z-[2] so current time indicator (z-[5]) renders on top */}
          <div
            className="absolute top-0 bottom-0 z-[2] pointer-events-none"
            style={{ left: "72px", right: "0px" }}
          >
            {days.map((day, dayIndex) => {
              const colDate = format(addDays(currentWeek, dayIndex), "yyyy-MM-dd");
              const colEvents = allEvents.filter(e => e.date === colDate);
              const colLayout = getEventLayout(colEvents, hourRowHeight);

              return (
                <div
                  key={day}
                  className="absolute top-0 bottom-0"
                  style={{
                    left: `calc(${(dayIndex / 7) * 100}% + 2px)`,
                    width: `calc(${100 / 7}% - 4px)`,
                  }}
                >
                  {colEvents.map(event => {
                    const pos = colLayout.get(event.id);
                    return pos ? (
                      <EventBlock key={event.id} event={event} position={pos} compact onEventClick={openEventModal} />
                    ) : null;
                  })}
                </div>
              );
            })}
          </div>
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
