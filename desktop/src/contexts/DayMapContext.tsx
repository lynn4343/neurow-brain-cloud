"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  startOfToday,
  startOfWeek,
  startOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
} from "date-fns";

const MIN_HOUR_HEIGHT = 40;
const MAX_HOUR_HEIGHT = 100;
const DEFAULT_HOUR_HEIGHT = 60;
const ZOOM_STEP = 20;
const DEFAULT_TIMELINE_WIDTH = 500;

export type CalendarView = "Day" | "Week" | "Month" | "Year";

interface DayMapContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  hourRowHeight: number;
  zoomIn: () => void;
  zoomOut: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  currentDay: Date;
  goToDay: (date: Date) => void;
  goToToday: () => void;
  timelineWidth: number;
  setTimelineWidth: (width: number) => void;
  currentView: CalendarView;
  setCurrentView: (view: CalendarView) => void;
  currentWeek: Date;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  currentMonth: Date;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToMonth: (date: Date) => void;
}

const DayMapContext = createContext<DayMapContextType | null>(null);

export function DayMapProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hourRowHeight, setHourRowHeight] = useState(DEFAULT_HOUR_HEIGHT);
  const [currentDay, setCurrentDay] = useState<Date>(startOfToday());
  const [timelineWidth, setTimelineWidth] = useState(DEFAULT_TIMELINE_WIDTH);
  const [currentView, setCurrentView] = useState<CalendarView>("Day");
  const [currentWeek, setCurrentWeek] = useState<Date>(
    startOfWeek(startOfToday(), { weekStartsOn: 0 })
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(startOfToday())
  );

  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);

  const zoomIn = useCallback(() => {
    setHourRowHeight((prev) => Math.min(prev + ZOOM_STEP, MAX_HOUR_HEIGHT));
  }, []);

  const zoomOut = useCallback(() => {
    setHourRowHeight((prev) => Math.max(prev - ZOOM_STEP, MIN_HOUR_HEIGHT));
  }, []);

  const goToDay = useCallback((date: Date) => {
    setCurrentDay(date);
    setCurrentView("Day");
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDay(startOfToday());
    setCurrentWeek(startOfWeek(startOfToday(), { weekStartsOn: 0 }));
    setCurrentMonth(startOfMonth(startOfToday()));
  }, []);

  const goToPreviousWeek = useCallback(() => {
    setCurrentWeek((prev) => subWeeks(prev, 1));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentWeek((prev) => addWeeks(prev, 1));
  }, []);

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  const goToMonth = useCallback((date: Date) => {
    setCurrentMonth(date);
  }, []);

  return (
    <DayMapContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        hourRowHeight,
        zoomIn,
        zoomOut,
        canZoomIn: hourRowHeight < MAX_HOUR_HEIGHT,
        canZoomOut: hourRowHeight > MIN_HOUR_HEIGHT,
        currentDay,
        goToDay,
        goToToday,
        timelineWidth,
        setTimelineWidth,
        currentView,
        setCurrentView,
        currentWeek,
        goToPreviousWeek,
        goToNextWeek,
        currentMonth,
        goToPreviousMonth,
        goToNextMonth,
        goToMonth,
      }}
    >
      {children}
    </DayMapContext.Provider>
  );
}

export function useDayMap() {
  const ctx = useContext(DayMapContext);
  if (!ctx) throw new Error("useDayMap must be used within DayMapProvider");
  return ctx;
}
