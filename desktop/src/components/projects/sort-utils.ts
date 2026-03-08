import type { Priority } from "@/lib/demo-data";
import type { ComingUpSort } from "./types";

// ---------------------------------------------------------------------------
// Priority ordering (higher = more urgent)
// ---------------------------------------------------------------------------

const PRIORITY_ORDER: Record<Priority, number> = {
  Urgent: 5,
  High: 4,
  Medium: 3,
  Low: 2,
  None: 1,
};

// ---------------------------------------------------------------------------
// Parse due date strings into Date objects for comparison
// ---------------------------------------------------------------------------

function parseDueDate(due: string): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lower = due.toLowerCase();
  if (lower === "today") return today;
  if (lower === "tomorrow") {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (lower === "next week") {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return d;
  }

  // Try parsing "Mar 10", "Aug 11 - 13", etc.
  const rangeMatch = due.match(/^(\w+ \d+)/);
  const dateStr = rangeMatch ? rangeMatch[1] : due;
  const parsed = new Date(`${dateStr}, ${today.getFullYear()}`);
  if (!isNaN(parsed.getTime())) {
    // If parsed date is more than 6 months in the past, assume next year
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (parsed < sixMonthsAgo) {
      parsed.setFullYear(parsed.getFullYear() + 1);
    }
    return parsed;
  }

  // Fallback: far future (unparseable dates sort last)
  return new Date(today.getFullYear() + 1, 0, 1);
}

// ---------------------------------------------------------------------------
// Sort function
// ---------------------------------------------------------------------------

interface Sortable {
  name: string;
  priority: Priority;
  due: string;
  project: string;
}

export function sortComingUpTasks<T extends Sortable>(
  tasks: T[],
  sort: ComingUpSort
): T[] {
  const sorted = [...tasks];

  switch (sort) {
    case "priority-desc":
      sorted.sort(
        (a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]
      );
      break;
    case "priority-asc":
      sorted.sort(
        (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      );
      break;
    case "due-asc":
      sorted.sort(
        (a, b) => parseDueDate(a.due).getTime() - parseDueDate(b.due).getTime()
      );
      break;
    case "due-desc":
      sorted.sort(
        (a, b) => parseDueDate(b.due).getTime() - parseDueDate(a.due).getTime()
      );
      break;
    case "project-asc":
      sorted.sort((a, b) =>
        a.project.toLowerCase().localeCompare(b.project.toLowerCase())
      );
      break;
    case "project-desc":
      sorted.sort((a, b) =>
        b.project.toLowerCase().localeCompare(a.project.toLowerCase())
      );
      break;
    default:
      // Default: by due date (soonest first), then priority (highest first) within same date
      sorted.sort((a, b) => {
        const dateDiff =
          parseDueDate(a.due).getTime() - parseDueDate(b.due).getTime();
        if (dateDiff !== 0) return dateDiff;
        return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      });
  }

  return sorted;
}
