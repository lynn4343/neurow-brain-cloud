"use client";

import { cn } from "@/lib/utils";
import { useDayMap } from "@/contexts/DayMapContext";
import { useDemoData } from "@/contexts/DemoDataContext";
import { generateMonthCalendar, getCurrentDayOfWeek } from "@/lib/calendar-utils";
import { EVENT_CATEGORY_COLORS, DEFAULT_EVENT_COLOR } from "@/lib/demo-data";
import { format } from "date-fns";

const MAX_VISIBLE_EVENTS = 3;

export function MonthCalendarView() {
  const { currentMonth } = useDayMap();
  const { events: allEvents, openEventModal } = useDemoData();

  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const currentDayOfWeek = getCurrentDayOfWeek(new Date());
  const calendarDays = generateMonthCalendar(currentMonth);

  // Dynamic row count: calendar can be 4, 5, or 6 weeks
  const rowCount = calendarDays.length / 7;

  // Build a date → events lookup for fast rendering
  const eventsByDate = new Map<string, typeof allEvents>();
  for (const event of allEvents) {
    const existing = eventsByDate.get(event.date);
    if (existing) {
      existing.push(event);
    } else {
      eventsByDate.set(event.date, [event]);
    }
  }

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
        {calendarDays.map((dayData, index) => {
          const dateStr = format(dayData.date, "yyyy-MM-dd");
          const dayEvents = eventsByDate.get(dateStr) ?? [];
          const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
          const overflowCount = dayEvents.length - MAX_VISIBLE_EVENTS;

          return (
            <div
              key={`${dayData.date.toISOString()}-${index}`}
              className={cn(
                "relative flex flex-col border border-[#E6E5E3] p-[3.5px]",
                dayData.isCurrentMonth ? "bg-white" : "bg-[#FAF8F8] opacity-40"
              )}
            >
              {/* Day Number - Positioned top-right */}
              <div className="flex justify-end">
                <div
                  className={cn(
                    "flex size-[28px] flex-shrink-0 items-center justify-center rounded-full",
                    "text-[12px] font-normal leading-[14px]",
                    dayData.isToday
                      ? "bg-[#1E1E1E] text-white"
                      : "text-[#1E1E1E]"
                  )}
                >
                  {dayData.dayNumber}
                </div>
              </div>

              {/* Event pills */}
              <div className="mt-0.5 flex min-h-0 flex-1 flex-col gap-[2px] overflow-hidden">
                {visibleEvents.map((event) => {
                  const colors = EVENT_CATEGORY_COLORS[event.category] ?? DEFAULT_EVENT_COLOR;
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => openEventModal(event)}
                      className={cn(
                        "flex items-center gap-1 rounded-[3px] px-1 py-[1px] text-left transition-colors",
                        "min-w-0 cursor-pointer",
                        colors.bg,
                        colors.hover,
                      )}
                    >
                      <div className={cn("h-[6px] w-[6px] flex-shrink-0 rounded-full", colors.dot)} />
                      <span className={cn("truncate text-[10px] leading-[14px] font-medium", colors.text)}>
                        {event.title}
                      </span>
                    </button>
                  );
                })}
                {overflowCount > 0 && (
                  <span className="px-1 text-[10px] leading-[14px] font-medium text-[#8C8C8C]">
                    +{overflowCount} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
