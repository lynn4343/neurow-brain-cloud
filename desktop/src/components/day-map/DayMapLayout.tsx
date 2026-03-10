"use client";

import { useRef, useCallback, useEffect } from "react";
import { DayMapProvider, useDayMap } from "@/contexts/DayMapContext";
import { DayMapSidebar } from "./DayMapSidebar";
import { CalendarTopTools } from "./CalendarTopTools";
import { TimelineView } from "./TimelineView";
import { WeekTimelineView } from "./WeekTimelineView";
import { MonthCalendarView } from "./MonthCalendarView";
import { DayMapRightPanel } from "./DayMapRightPanel";

const TIMELINE_MIN_WIDTH = 300;
const TIMELINE_MAX_RATIO = 0.7;
const RIGHT_PANEL_MIN_WIDTH = 320;

function DayViewContent() {
  const { timelineWidth, setTimelineWidth } = useDayMap();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const clampWidth = useCallback(
    (width: number) => {
      if (!containerRef.current) return width;
      const containerWidth = containerRef.current.offsetWidth;
      const maxFromRatio = containerWidth * TIMELINE_MAX_RATIO;
      const maxFromRightPanel = containerWidth - RIGHT_PANEL_MIN_WIDTH;
      const max = Math.min(maxFromRatio, maxFromRightPanel);
      return Math.max(TIMELINE_MIN_WIDTH, Math.min(width, max));
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = moveEvent.clientX - containerRect.left;
        setTimelineWidth(clampWidth(newWidth));
      };

      const onMouseUp = () => {
        isDragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [clampWidth, setTimelineWidth]
  );

  // Re-clamp on window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const maxFromRatio = containerWidth * TIMELINE_MAX_RATIO;
      const maxFromRightPanel = containerWidth - RIGHT_PANEL_MIN_WIDTH;
      const max = Math.min(maxFromRatio, maxFromRightPanel);
      setTimelineWidth(Math.max(TIMELINE_MIN_WIDTH, Math.min(timelineWidth, max)));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [timelineWidth, setTimelineWidth]);

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden">
      {/* Left: Timeline */}
      <div
        className="flex flex-col overflow-hidden bg-[#FAF8F8]"
        style={{
          width: `${timelineWidth}px`,
          minWidth: `${TIMELINE_MIN_WIDTH}px`,
          maxWidth: `calc(100% - ${RIGHT_PANEL_MIN_WIDTH}px)`,
          flexShrink: 0,
        }}
      >
        <div className="mt-4 mb-4 ml-4 flex flex-1 flex-col overflow-hidden rounded-[8px] border border-[#F1F0F0]">
          <TimelineView />
        </div>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="group relative z-10 flex w-0 cursor-col-resize items-stretch"
      >
        <div className="absolute inset-y-0 -left-4 w-8" />
        <div className="absolute inset-y-4 left-[7px] w-[2px] rounded-full bg-transparent transition-colors group-hover:bg-[#D1D1D1]" />
      </div>

      {/* Right: Priorities & Tasks */}
      <DayMapRightPanel />
    </div>
  );
}

function WeekViewContent() {
  return (
    <div className="flex flex-1 overflow-hidden bg-[#FAF8F8]">
      <div className="mt-4 mb-4 mx-4 flex flex-1 flex-col overflow-hidden">
        <WeekTimelineView />
      </div>
    </div>
  );
}

function MonthViewContent() {
  return (
    <div className="flex flex-1 overflow-hidden bg-[#FAF8F8]">
      <div className="mt-4 mb-4 mx-4 flex flex-1 flex-col overflow-hidden">
        <MonthCalendarView />
      </div>
    </div>
  );
}

function DayMapContent() {
  const { sidebarOpen, currentView, setSidebarOpen } = useDayMap();

  // Auto-collapse sidebar when chat panel opens (event-based coordination)
  useEffect(() => {
    const handlePanelOpen = () => setSidebarOpen(false);
    window.addEventListener("neurow-chat-panel-open", handlePanelOpen);
    return () => window.removeEventListener("neurow-chat-panel-open", handlePanelOpen);
  }, [setSidebarOpen]);
  const sidebarWidth = sidebarOpen ? 210 : 68;

  return (
    <div className="relative flex flex-1 overflow-hidden">
      <DayMapSidebar />

      {/* Curved corner at sub-sidebar / sub-header junction */}
      <div
        className="absolute z-20 h-[12px] w-[12px] pointer-events-none transition-all duration-300 ease-in-out"
        style={{ left: `${sidebarWidth}px`, top: "48px" }}
      >
        <div
          className="absolute top-0 left-0 w-[12px] h-[12px]"
          style={{
            background:
              "radial-gradient(circle 12px at 100% 100%, transparent 12px, #F4F1F1 12px)",
          }}
        />
        <div className="absolute inset-0 rounded-tl-[12px] border-t border-l border-[#E6E5E3]" />
      </div>

      {/* Vertical border (below curve to bottom) */}
      <div
        className="absolute z-20 w-px bg-[#E6E5E3] pointer-events-none transition-all duration-300 ease-in-out"
        style={{ left: `${sidebarWidth}px`, top: "60px", bottom: 0 }}
      />

      {/* Horizontal border (right of curve to right edge) */}
      <div
        className="absolute z-20 h-px bg-[#E6E5E3] right-0 pointer-events-none transition-all duration-300 ease-in-out"
        style={{ left: `${sidebarWidth + 12}px`, top: "48px" }}
      />

      {/* Content column */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[#FAF8F8]">
        <CalendarTopTools />

        {/* View-dependent content */}
        {currentView === "Month" ? (
          <MonthViewContent />
        ) : currentView === "Week" ? (
          <WeekViewContent />
        ) : (
          <DayViewContent />
        )}
      </div>
    </div>
  );
}

export function DayMapLayout() {
  return (
    <DayMapProvider>
      <DayMapContent />
    </DayMapProvider>
  );
}
