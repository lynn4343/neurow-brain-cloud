import type { CalendarEvent } from "./demo-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EventPosition {
  top: number; // px from top of grid
  height: number; // px, min 20
  column: number; // 0-indexed
  totalColumns: number; // 1 if no overlaps
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_EVENT_HEIGHT = 20; // px — fits one line of 11px text

// ---------------------------------------------------------------------------
// Time utilities
// ---------------------------------------------------------------------------

export function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(":").map(Number);
  return { hour: h, minute: m };
}

export function timeToMinutes(time: string): number {
  const { hour, minute } = parseTime(time);
  return hour * 60 + minute;
}

export function formatEventTime(time24: string): string {
  const { hour, minute } = parseTime(time24);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMin = minute > 0 ? `:${minute.toString().padStart(2, "0")}` : "";
  return `${displayHour}${displayMin} ${period}`;
}

// ---------------------------------------------------------------------------
// Layout algorithm
// ---------------------------------------------------------------------------

export function getEventLayout(
  events: CalendarEvent[],
  hourRowHeight: number,
): Map<string, EventPosition> {
  const result = new Map<string, EventPosition>();
  if (events.length === 0) return result;

  // Step 1: Sort by start time ascending, tiebreak: longer duration first
  const sorted = [...events].sort((a, b) => {
    const diff = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    return diff !== 0 ? diff : b.durationMin - a.durationMin;
  });

  // Compute top + height for every event (before overlap logic)
  for (const event of sorted) {
    const { hour, minute } = parseTime(event.startTime);
    const top = (hour + minute / 60) * hourRowHeight;
    const rawHeight = (event.durationMin / 60) * hourRowHeight;
    const height = Math.max(
      MIN_EVENT_HEIGHT,
      Math.min(rawHeight, 24 * hourRowHeight - top),
    );
    result.set(event.id, { top, height, column: 0, totalColumns: 1 });
  }

  // Step 2: Cluster overlapping events (merge-interval scan)
  const clusters: CalendarEvent[][] = [];
  let current: CalendarEvent[] = [];
  let clusterEnd = 0;
  for (const event of sorted) {
    const start = timeToMinutes(event.startTime);
    const end = start + event.durationMin;
    if (current.length > 0 && start < clusterEnd) {
      current.push(event);
      clusterEnd = Math.max(clusterEnd, end);
    } else {
      if (current.length > 0) clusters.push(current);
      current = [event];
      clusterEnd = end;
    }
  }
  if (current.length > 0) clusters.push(current);

  // Steps 3-4: Assign columns within each cluster
  for (const cluster of clusters) {
    const columnEnds: number[] = [];
    const assignments: { eventId: string; column: number }[] = [];
    for (const event of cluster) {
      const start = timeToMinutes(event.startTime);
      const col = columnEnds.findIndex((endTime) => endTime <= start);
      if (col >= 0) {
        columnEnds[col] = start + event.durationMin;
        assignments.push({ eventId: event.id, column: col });
      } else {
        columnEnds.push(start + event.durationMin);
        assignments.push({
          eventId: event.id,
          column: columnEnds.length - 1,
        });
      }
    }
    const totalColumns = columnEnds.length;
    for (const { eventId, column } of assignments) {
      const pos = result.get(eventId)!;
      result.set(eventId, { ...pos, column, totalColumns });
    }
  }

  return result;
}
