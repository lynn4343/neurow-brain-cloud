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

/* ── Shared column flex classes (container-query responsive) ──────────── */

const COL_TASK = "flex-[3.5_1_0%] min-w-0";
const COL_PRIO =
  "flex-[0.6_1_32px] min-w-[32px] max-w-[50px] @[500px]:max-w-[90px] @[700px]:max-w-[120px]";
const COL_DUE =
  "flex-[0.8_1_40px] min-w-[40px] max-w-[60px] @[500px]:max-w-[100px] @[700px]:max-w-[130px]";
const COL_PROJECT =
  "flex-[1_1_45px] min-w-[45px] max-w-[95px] @[500px]:max-w-[140px] @[700px]:max-w-[170px]";

/* ── Placeholder Slot ─────────────────────────────────────────────────── */

function PlaceholderSlot({ onDoubleClick }: { onDoubleClick?: () => void }) {
  return (
    <div
      onDoubleClick={onDoubleClick}
      className="rounded-lg bg-[#F0EFED] p-[3px] cursor-pointer"
    >
      <div className="flex items-center rounded-md border border-dashed border-[#E6E5E3] bg-[#FAF8F8] overflow-hidden">
        <div className={cn(COL_TASK, "flex items-center gap-2 px-2 py-2")}>
          <div className="h-4 w-4 shrink-0 rounded-full border-2 border-[#E6E5E3]" />
          <span className="text-sm text-[#949494]">
            Set today&apos;s priorities
          </span>
        </div>
        <div className={cn(COL_PRIO, "border-l border-[#E6E5E3] px-1.5 py-2 flex items-center")}>
          <span className="text-xs text-[#D4D3D0]">&mdash;</span>
        </div>
        <div className={cn(COL_DUE, "border-l border-[#E6E5E3] px-1.5 py-2")}>
          <span className="text-xs text-[#D4D3D0]">&mdash;</span>
        </div>
        <div className={cn(COL_PROJECT, "border-l border-[#E6E5E3] px-1.5 py-2")}>
          <span className="text-xs text-[#D4D3D0]">&mdash;</span>
        </div>
      </div>
    </div>
  );
}

/* ── Date formatting ──────────────────────────────────────────────────── */

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
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── Top Priorities (main export) ─────────────────────────────────────── */

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
    <div className="@container flex flex-col rounded-[12px] border border-[#E6E5E3] bg-white px-2 py-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-2"
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
        <div className="mt-3">
          {/* Column Headers */}
          <div className="flex items-center px-1 pb-1 text-[10px] font-medium uppercase tracking-wide text-[#949494]">
            <div className={cn(COL_TASK, "px-2 truncate")}>
              Task Name
            </div>
            <div className={cn(COL_PRIO, "border-l border-[#E6E5E3] px-1.5")}>
              Prio
            </div>
            <div className={cn(COL_DUE, "border-l border-[#E6E5E3] px-1.5")}>
              Due
            </div>
            <div className={cn(COL_PROJECT, "border-l border-[#E6E5E3] px-1.5")}>
              Project
            </div>
          </div>

          <div className="space-y-2">
            {priorities.slice(0, 3).map((task, i) => {
              const taskKey = `${task.name}|${task.project}`;
              return (
                <PriorityCard
                  key={taskKey}
                  task={task}
                  done={completedTasks.has(taskKey)}
                  onToggle={() => toggleComplete(taskKey)}
                  onDoubleClick={() => demoData.openTaskModal(task, i, "topPriorities")}
                />
              );
            })}

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
        </div>
      )}
    </div>
  );
}

/* ── Priority Card ────────────────────────────────────────────────────── */

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
        "rounded-lg bg-[#F0EFED] p-[3px] transition-opacity duration-300 cursor-pointer",
        done && "opacity-55",
      )}
    >
      <div className="relative flex items-center rounded-md border border-[#E6E5E3] bg-white overflow-hidden">
        {/* Strikethrough line — spans across the task name cell */}
        <div
          className={cn(
            "absolute left-8 right-[calc(100%-var(--task-col-right))] top-1/2 h-[1.5px] bg-[#1E1E1E]/60 pointer-events-none origin-left transition-transform ease-out z-10",
            done ? "scale-x-100" : "scale-x-0",
          )}
          style={{
            transitionDuration: "350ms",
            transitionDelay: done ? "50ms" : "0ms",
            /* Approximate: span across the task name column only */
            right: "40%",
          }}
        />

        {/* Task Name column */}
        <div className={cn(COL_TASK, "flex items-center gap-2 px-2 py-2")}>
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="flex shrink-0 items-center justify-center h-4 w-4 rounded-full transition-all duration-200"
            style={{
              backgroundColor: done ? "#1E1E1E" : "transparent",
              borderWidth: done ? "0px" : "2px",
              borderColor: "#E6E5E3",
              borderStyle: "solid",
            }}
            aria-label={done ? "Mark as not done" : "Mark as done"}
          >
            <Check
              size={10}
              weight="bold"
              className={cn(
                "text-white transition-opacity duration-200",
                done ? "opacity-100" : "opacity-0",
              )}
            />
          </button>

          <span className="text-sm font-medium text-[#1E1E1E] truncate">
            {task.name}
          </span>
        </div>

        {/* Priority column */}
        <div className={cn(
          COL_PRIO,
          "border-l border-[#E6E5E3] px-1.5 py-2 flex items-center transition-opacity duration-300",
          done && "opacity-40",
        )}>
          <PriorityBars priority={task.priority} />
        </div>

        {/* Due column */}
        <div className={cn(
          COL_DUE,
          "border-l border-[#E6E5E3] px-1.5 py-2",
          task.due === "Overdue" ? "text-red-700 font-semibold" : task.due === "Today" ? "font-semibold text-[#1E1E1E]" : "text-[#949494]",
        )}>
          <span className="text-xs truncate">{task.due}</span>
        </div>

        {/* Project column */}
        <div className={cn(COL_PROJECT, "border-l border-[#E6E5E3] px-1.5 py-2 flex items-center overflow-hidden")}>
          <span className={cn(
            "block rounded-full border px-2 py-0.5 text-[11px] font-semibold truncate max-w-full",
            PROJECT_COLORS[task.project] || DEFAULT_PROJECT_COLOR,
          )}>
            {task.project}
          </span>
        </div>
      </div>
    </div>
  );
}
