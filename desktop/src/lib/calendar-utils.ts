import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  isSameMonth,
} from "date-fns";

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

/**
 * Generate a calendar grid for a given month.
 * Returns 4-6 weeks x 7 days, including previous/next month overflow.
 * Week starts on Sunday (US standard).
 */
/**
 * Returns the abbreviated day-of-week for a given date (e.g., "SUN", "MON").
 */
export function getCurrentDayOfWeek(date: Date): string {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return days[date.getDay()];
}

/**
 * Format date for month/year display.
 * Returns uppercase format like "FEBRUARY 2026".
 */
export function formatMonthLabel(date: Date): string {
  return format(date, "MMMM yyyy").toUpperCase();
}

/**
 * Generate a calendar grid for a given month.
 * Returns 4-6 weeks x 7 days, including previous/next month overflow.
 * Week starts on Sunday (US standard).
 */
export function generateMonthCalendar(date: Date): CalendarDay[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return days.map((day) => ({
    date: day,
    dayNumber: parseInt(format(day, "d")),
    isCurrentMonth: isSameMonth(day, date),
    isToday: isToday(day),
  }));
}
