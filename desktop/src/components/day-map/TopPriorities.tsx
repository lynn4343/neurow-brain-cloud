"use client";

import { useState } from "react";
import { CaretDown, Check, WarningCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useDemoData } from "@/contexts/DemoDataContext";
import {
  type TopPriority,
  type Priority,
  TOP_PRIORITIES,
  PROJECT_COLORS,
  DEFAULT_PROJECT_COLOR,
  getUserData,
} from "@/lib/demo-data";

/* Priority Bars — matches SecondaryTasks */
const NUM_BARS = 3;

const BARS_FILLED: Record<Priority, number> = {
  Urgent: 0,
  High: 3,
  Medium: 2,
  Low: 1,
  None: 0,
};

const ACTIVE_COLORS: Record<Priority, string> = {
  Urgent: "bg-red-600",
  High: "bg-red-700",
  Medium: "bg-amber-500",
  Low: "bg-yellow-500",
  None: "bg-gray-100",
};

const INACTIVE_COLORS: Record<Priority, string> = {
  Urgent: "bg-red-200",
  High: "bg-red-200",
  Medium: "bg-orange-100",
  Low: "bg-yellow-100",
  None: "bg-gray-100",
};

function PriorityBars({ priority }: { priority: Priority }) {
  const barsToFill = BARS_FILLED[priority];
  const activeColor = ACTIVE_COLORS[priority];
  const inactiveColor = INACTIVE_COLORS[priority];

  return (
    <div className="flex items-center gap-0.5">
      {priority === "Urgent" && (
        <WarningCircle size={22} weight="fill" className="text-red-700" />
      )}
      {priority !== "Urgent" &&
        Array.from({ length: NUM_BARS }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-3 w-1 rounded-full",
              index < barsToFill ? activeColor : inactiveColor,
            )}
          />
        ))}
    </div>
  );
}

function PlaceholderSlot() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-[#E6E5E3] bg-[#FAF8F8] px-4 py-3">
      <div className="h-[18px] w-[18px] shrink-0 rounded-full border-2 border-[#E6E5E3]" />
      <span className="text-sm text-[#949494]">
        Set today&apos;s priorities
      </span>
    </div>
  );
}

export function TopPriorities() {
  const { activeUser } = useUser();
  const demoData = useDemoData();
  const priorities = demoData.topPriorities;
  const [isExpanded, setIsExpanded] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const toggleComplete = (name: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const placeholderCount = Math.max(0, 3 - priorities.length);

  return (
    <div className="flex flex-col rounded-[12px] border border-[#E6E5E3] bg-white p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2"
      >
        <CaretDown
          className={cn(
            "size-3 text-[#949494] transition-transform",
            !isExpanded && "-rotate-90",
          )}
          weight="bold"
        />
        <span className="text-sm font-semibold uppercase text-[#1E1E1E]">
          Today&apos;s Top 3 Priorities
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {priorities.slice(0, 3).map((task, i) => (
            <PriorityCard
              key={i}
              task={task}
              done={completedTasks.has(task.name)}
              onToggle={() => toggleComplete(task.name)}
              onDoubleClick={() => demoData.openTaskModal(task, i, "topPriorities")}
            />
          ))}

          {Array.from({ length: placeholderCount }).map((_, i) => (
            <PlaceholderSlot key={`ph-${i}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Priority Card ─────────────────────────────────────────────────────── */

function PriorityCard({
  task,
  done,
  onToggle,
  onDoubleClick,
}: {
  task: TopPriority;
  done: boolean;
  onToggle: () => void;
  onDoubleClick?: () => void;
}) {
  return (
    <div
      onDoubleClick={onDoubleClick}
      className={cn(
        "relative flex flex-col rounded-lg border border-[#E6E5E3] bg-white px-4 pt-2.5 pb-1.5 transition-opacity duration-300 cursor-pointer",
        done && "opacity-55",
      )}
    >
      {/* Strikethrough line */}
      <div
        className={cn(
          "absolute left-[46px] right-16 top-[18px] h-[1.5px] bg-[#1E1E1E]/60 pointer-events-none origin-left transition-transform ease-out",
          done ? "scale-x-100" : "scale-x-0",
        )}
        style={{
          transitionDuration: "350ms",
          transitionDelay: done ? "50ms" : "0ms",
        }}
      />

      {/* Line 1: checkbox + name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="flex shrink-0 items-center justify-center h-[18px] w-[18px] rounded-full transition-all duration-200"
          style={{
            backgroundColor: done ? "#1E1E1E" : "transparent",
            borderWidth: done ? "0px" : "2px",
            borderColor: "#E6E5E3",
            borderStyle: "solid",
          }}
          aria-label={done ? "Mark as not done" : "Mark as done"}
        >
          <Check
            size={11}
            weight="bold"
            className={cn(
              "text-white transition-opacity duration-200",
              done ? "opacity-100" : "opacity-0",
            )}
          />
        </button>

        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#1E1E1E]">
          {task.name}
        </span>
      </div>

      {/* Line 2: due + time estimate | priority | project */}
      <div className="ml-[30px] mt-0.5 flex items-center">
        <div className="min-w-0 flex-1 flex items-center gap-1.5 text-xs text-[#949494]">
          <span>{task.due === "Today" ? "Due today" : `Due ${task.due}`}</span>
          {task.timeEstimate && (
            <span className="rounded-full border border-[#E6E5E3] bg-[#FAF8F8] px-2 py-0.5 text-[11px] text-[#949494] whitespace-nowrap">
              Est: {task.timeEstimate}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center">
          <div className="flex w-[40px] items-center justify-center">
            <PriorityBars priority={task.priority} />
          </div>
          <div className="flex w-[80px] items-center justify-start">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
                PROJECT_COLORS[task.project] || DEFAULT_PROJECT_COLOR,
              )}
            >
              {task.project}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
