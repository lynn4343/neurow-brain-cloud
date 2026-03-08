"use client";

import { useState } from "react";
import { CaretDown, Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useDemoData } from "@/contexts/DemoDataContext";
import {
  type TopPriority,
  type Priority,
  PROJECT_COLORS,
  DEFAULT_PROJECT_COLOR,
} from "@/lib/demo-data";
import { PriorityBars } from "@/components/ui/PriorityBars";

function PlaceholderSlot({ onDoubleClick }: { onDoubleClick?: () => void }) {
  return (
    <div
      onDoubleClick={onDoubleClick}
      className="flex items-center gap-3 rounded-lg border border-dashed border-[#E6E5E3] bg-[#FAF8F8] px-4 py-3 cursor-pointer"
    >
      <div className="h-[18px] w-[18px] shrink-0 rounded-full border-2 border-[#E6E5E3]" />
      <span className="text-sm text-[#949494]">
        Set today&apos;s priorities
      </span>
    </div>
  );
}

/** Format ISO date to display-friendly string for priority cards. */
function formatDueDate(isoDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(isoDate + "T00:00:00");
  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 7) return "This week";
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TopPriorities() {
  const { activeUser } = useUser();
  const demoData = useDemoData();
  const staticPriorities = demoData.topPriorities;

  // Tag first priority as "Priority Goal" when it matches the clarity session next action.
  // For new users with no static data, synthesize from goal_cascade.
  const gc = activeUser?.goal_cascade;
  const priorities: TopPriority[] =
    staticPriorities.length > 0
      ? staticPriorities.map((p, i) =>
          i === 0 && gc?.next_action_step && p.name === gc.next_action_step
            ? { ...p, project: "Priority Goal" }
            : p,
        )
      : gc?.next_action_step
        ? [
            {
              name: gc.next_action_step,
              priority: "High" as Priority,
              due: gc.next_action_due
                ? formatDueDate(gc.next_action_due)
                : "This week",
              project: "Priority Goal",
            },
          ]
        : [];

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
            <PlaceholderSlot key={`ph-${i}`} onDoubleClick={() => {
              // Materialize synthesized priorities into state so addTopPriority
              // sees the correct array (fixes off-by-one when goal_cascade creates
              // a display-only priority that isn't in state yet).
              if (staticPriorities.length < priorities.length) {
                demoData.materializeTopPriorities(priorities);
              }
              demoData.openNewTaskModal("topPriorities", priorities.length + i);
            }} />
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
        "relative flex flex-col overflow-hidden rounded-lg border border-[#E6E5E3] bg-white px-4 pt-2.5 pb-1.5 transition-opacity duration-300 cursor-pointer",
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

      {/* Line 2: due + time estimate | priority | project — wraps gracefully at narrow widths */}
      <div className="ml-[30px] mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="whitespace-nowrap text-xs text-[#949494]">
          {task.due === "Today" ? "Due today" : task.due === "Overdue" ? "Overdue" : `Due ${task.due}`}
        </span>
        {task.timeEstimate && (
          <span className="rounded-full border border-[#E6E5E3] bg-[#FAF8F8] px-2 py-0.5 text-[11px] text-[#949494] whitespace-nowrap">
            Est: {task.timeEstimate}
          </span>
        )}
        <div className="ml-auto flex w-[130px] shrink-0 items-center gap-1.5">
          <PriorityBars priority={task.priority} />
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-xs font-semibold truncate",
              PROJECT_COLORS[task.project] || DEFAULT_PROJECT_COLOR,
            )}
          >
            {task.project}
          </span>
        </div>
      </div>
    </div>
  );
}
