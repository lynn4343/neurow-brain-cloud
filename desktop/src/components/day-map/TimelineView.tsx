"use client";

import { useEffect, useRef, useState } from "react";
import { StickyCalendarHeader } from "./StickyCalendarHeader";
import { SunIcon } from "./icons/SunIcon";
import { MoonIcon } from "./icons/MoonIcon";
import { useDayMap } from "@/contexts/DayMapContext";
import { useUser } from "@/contexts/UserContext";
import { useDemoData } from "@/contexts/DemoDataContext";
import { CALENDAR_EVENTS, getUserData } from "@/lib/demo-data";
import { getEventLayout } from "@/lib/event-layout";
import { EventBlock } from "./EventBlock";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const hours = [
  "12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM",
  "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM",
  "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM",
  "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM",
  "12 AM",
];

export function TimelineView() {
  const { hourRowHeight, currentDay } = useDayMap();
  const { activeUser } = useUser();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reactive current time — updates every 60s
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  // Labels sit at the bottom of each row (straddling the border), so the visual
  // region users read as "11 AM" is row 12. Offset by +1 to align the indicator
  // with the correct visual hour band.
  const currentHourIndex = currentHour + 1;
  const minuteOffset = (currentMinute / 60) * hourRowHeight;

  // Event data for current day
  const { events: allEvents, openEventModal, openNewEventModal } = useDemoData();
  const dateStr = format(currentDay, "yyyy-MM-dd");
  const dayEvents = allEvents.filter(e => e.date === dateStr);
  const layout = getEventLayout(dayEvents, hourRowHeight);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const scrollTarget = Math.max(0, currentHourIndex * hourRowHeight - 100);
      scrollRef.current.scrollTop = scrollTarget;
    }
  }, [currentHour, hourRowHeight]);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-white">
      <StickyCalendarHeader />

      {/* Scrollable timeline grid */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto timeline-scrollbar">
        {/* Sticky Sun Icon */}
        <div className="pointer-events-none sticky top-0 z-10 flex">
          <div className="flex w-12 items-center justify-center border-r border-[#E6E5E3] bg-white py-2">
            <SunIcon className="h-4 w-[31px]" />
          </div>
        </div>

        {/* Gradient fade zone top */}
        <div className="pointer-events-none sticky top-[32px] z-[9] flex">
          <div className="h-8 w-[44px] bg-gradient-to-b from-white to-transparent" />
        </div>

        {/* Hourly Grid */}
        <div className="-mt-[72px] relative">
          {hours.map((hour, index) => (
            <div
              key={`${hour}-${index}`}
              className="relative flex transition-all duration-300 ease-out"
              style={{ height: `${hourRowHeight}px` }}
            >
              {/* Hour Label */}
              <div className="relative flex w-12 justify-center border-r border-[#E6E5E3]">
                <span
                  className={cn(
                    "absolute bottom-0 translate-y-1/2 text-[12px] leading-[14px] tracking-[-0.01em] text-[#1E1E1E]",
                    hour === "12 PM" && "font-bold"
                  )}
                >
                  {hour}
                </span>
              </div>

              {/* Event Area */}
              <div
                className="relative flex-1 border-b border-[#E6E5E3] pl-4"
                onDoubleClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const yInRow = e.clientY - rect.top;
                  const rawMinute = Math.round((yInRow / hourRowHeight) * 60 / 30) * 30;
                  const hour = rawMinute >= 60 ? index + 1 : index;
                  const minute = rawMinute >= 60 ? 0 : rawMinute;
                  if (hour > 23) return;
                  const startTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
                  openNewEventModal(format(currentDay, "yyyy-MM-dd"), startTime);
                }}
              >
                {/* Current Time Indicator — z-[5] to render above event overlay (z-[2]) */}
                {index === currentHourIndex && (
                  <>
                    <div
                      className="absolute -left-14 z-[5] h-[2px] w-[50px] border-t border-dashed border-[#D1D1D1]"
                      style={{ top: `${minuteOffset}px` }}
                    />
                    <div
                      className="absolute left-0 right-0 z-[5] flex items-center"
                      style={{ top: `${minuteOffset}px` }}
                    >
                      <div className="h-[2px] w-full bg-[#1E1E1E]" />
                      <div className="absolute -left-1 h-3 w-3 rounded-full bg-[#1E1E1E]" />
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Event overlay — z-[2] so current time indicator (z-[5]) renders on top */}
          <div
            className="absolute top-0 bottom-0 z-[2] pointer-events-none"
            style={{ left: "calc(3rem + 4px)", right: "4px" }}
          >
            {dayEvents.map(event => {
              const pos = layout.get(event.id);
              return pos ? <EventBlock key={event.id} event={event} position={pos} onEventClick={openEventModal} /> : null;
            })}
          </div>
        </div>

        {/* Gradient fade zone bottom */}
        <div className="pointer-events-none sticky bottom-[34px] z-[9] flex">
          <div className="h-8 w-[44px] bg-gradient-to-t from-white to-transparent" />
        </div>

        {/* Sticky Moon Icon */}
        <div className="sticky bottom-0 z-10 flex">
          <div className="flex w-12 items-center justify-center border-r border-[#E6E5E3] bg-white py-2">
            <MoonIcon className="h-[18px] w-[18px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
