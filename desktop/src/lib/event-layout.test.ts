import { describe, it, expect } from "vitest";
import {
  getEventLayout,
  formatEventTime,
  parseTime,
  timeToMinutes,
} from "./event-layout";
import type { CalendarEvent } from "./demo-data";

// Helper — create a minimal CalendarEvent for testing
function event(
  overrides: Partial<CalendarEvent> & {
    id: string;
    startTime: string;
    durationMin: number;
  },
): CalendarEvent {
  return {
    title: "Test",
    date: "2026-03-09",
    endTime: "12:00",
    category: "Work",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// parseTime
// ---------------------------------------------------------------------------

describe("parseTime", () => {
  it("parses afternoon time", () => {
    expect(parseTime("14:30")).toEqual({ hour: 14, minute: 30 });
  });

  it("parses midnight", () => {
    expect(parseTime("00:00")).toEqual({ hour: 0, minute: 0 });
  });

  it("parses end of day", () => {
    expect(parseTime("23:59")).toEqual({ hour: 23, minute: 59 });
  });
});

// ---------------------------------------------------------------------------
// timeToMinutes
// ---------------------------------------------------------------------------

describe("timeToMinutes", () => {
  it("converts time to minutes", () => {
    expect(timeToMinutes("14:30")).toBe(870);
  });

  it("converts midnight to 0", () => {
    expect(timeToMinutes("00:00")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// formatEventTime
// ---------------------------------------------------------------------------

describe("formatEventTime", () => {
  it("formats PM time with minutes", () => {
    expect(formatEventTime("14:30")).toBe("2:30 PM");
  });

  it("formats PM time without minutes", () => {
    expect(formatEventTime("13:00")).toBe("1 PM");
  });

  it("formats midnight", () => {
    expect(formatEventTime("00:00")).toBe("12 AM");
  });

  it("formats noon", () => {
    expect(formatEventTime("12:00")).toBe("12 PM");
  });

  it("formats single-digit hour with padded minutes", () => {
    expect(formatEventTime("09:05")).toBe("9:05 AM");
  });
});

// ---------------------------------------------------------------------------
// getEventLayout — positioning
// ---------------------------------------------------------------------------

describe("getEventLayout — positioning", () => {
  it("positions a single event correctly", () => {
    const events = [event({ id: "a", startTime: "11:30", durationMin: 45 })];
    const layout = getEventLayout(events, 60);
    const pos = layout.get("a")!;
    expect(pos.top).toBe(690);
    expect(pos.height).toBe(45);
    expect(pos.column).toBe(0);
    expect(pos.totalColumns).toBe(1);
  });

  it("positions a 5-hour event correctly", () => {
    const events = [event({ id: "a", startTime: "07:00", durationMin: 300 })];
    const layout = getEventLayout(events, 60);
    const pos = layout.get("a")!;
    expect(pos.top).toBe(420);
    expect(pos.height).toBe(300);
  });

  it("scales proportionally with zoom", () => {
    const events = [event({ id: "a", startTime: "11:30", durationMin: 45 })];
    const layout = getEventLayout(events, 100);
    const pos = layout.get("a")!;
    expect(pos.top).toBe(1150);
    expect(pos.height).toBe(75);
  });

  it("enforces minimum height", () => {
    const events = [event({ id: "a", startTime: "10:00", durationMin: 15 })];
    const layout = getEventLayout(events, 40);
    const pos = layout.get("a")!;
    expect(pos.height).toBe(20);
  });

  it("clamps height at midnight", () => {
    const events = [event({ id: "a", startTime: "23:00", durationMin: 120 })];
    const layout = getEventLayout(events, 60);
    const pos = layout.get("a")!;
    expect(pos.height).toBe(60);
  });
});

// ---------------------------------------------------------------------------
// getEventLayout — overlaps
// ---------------------------------------------------------------------------

describe("getEventLayout — overlaps", () => {
  it("non-overlapping events get full width", () => {
    const events = [
      event({ id: "a", startTime: "09:00", durationMin: 60 }),
      event({ id: "b", startTime: "11:00", durationMin: 60 }),
    ];
    const layout = getEventLayout(events, 60);
    expect(layout.get("a")!.column).toBe(0);
    expect(layout.get("a")!.totalColumns).toBe(1);
    expect(layout.get("b")!.column).toBe(0);
    expect(layout.get("b")!.totalColumns).toBe(1);
  });

  it("two overlapping events split into columns", () => {
    const events = [
      event({ id: "a", startTime: "10:00", durationMin: 60 }),
      event({ id: "b", startTime: "10:30", durationMin: 60 }),
    ];
    const layout = getEventLayout(events, 60);
    expect(layout.get("a")!.totalColumns).toBe(2);
    expect(layout.get("b")!.totalColumns).toBe(2);
    expect(layout.get("a")!.column).toBe(0);
    expect(layout.get("b")!.column).toBe(1);
  });

  it("transitive overlap clusters correctly", () => {
    const events = [
      event({ id: "a", startTime: "10:00", durationMin: 90 }),
      event({ id: "b", startTime: "11:00", durationMin: 90 }),
      event({ id: "c", startTime: "12:00", durationMin: 60 }),
    ];
    const layout = getEventLayout(events, 60);
    expect(layout.get("a")!.totalColumns).toBe(2);
    expect(layout.get("b")!.totalColumns).toBe(2);
    expect(layout.get("c")!.totalColumns).toBe(2);
    expect(layout.get("a")!.column).toBe(0);
    expect(layout.get("b")!.column).toBe(1);
    expect(layout.get("c")!.column).toBe(0); // reuses A's column
  });

  it("empty events array returns empty Map", () => {
    const layout = getEventLayout([], 60);
    expect(layout.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getEventLayout — sort order
// ---------------------------------------------------------------------------

describe("getEventLayout — sort order", () => {
  it("longer events sort first at same start time", () => {
    const events = [
      event({ id: "short", startTime: "10:00", durationMin: 30 }),
      event({ id: "long", startTime: "10:00", durationMin: 120 }),
    ];
    const layout = getEventLayout(events, 60);
    expect(layout.get("long")!.column).toBe(0);
    expect(layout.get("short")!.column).toBe(1);
  });
});
