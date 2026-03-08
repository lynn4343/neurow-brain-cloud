"use client";

import { Badge } from "@/components/ui/badge";
import { PriorityBars } from "@/components/ui/PriorityBars";
import { PrioritySelector } from "@/components/ui/PrioritySelector";
import { PROJECT_COLORS, DEFAULT_PROJECT_COLOR } from "@/lib/demo-data";
import type { Task, Priority } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

interface ComingUpTaskRowProps {
  task: Task;
  isCompleted?: boolean;
  onToggleComplete?: () => void;
  onPriorityChange?: (priority: Priority) => void;
  onDoubleClick?: () => void;
}

export function ComingUpTaskRow({
  task,
  isCompleted = false,
  onToggleComplete,
  onPriorityChange,
  onDoubleClick,
}: ComingUpTaskRowProps) {
  const projectPillClasses = PROJECT_COLORS[task.project] || DEFAULT_PROJECT_COLOR;

  return (
    <div
      className="group flex items-center border-b border-[#E6E5E3] hover:bg-gray-50/50 transition-colors last:border-0 cursor-pointer"
      onDoubleClick={onDoubleClick}
    >
      {/* Checkbox + Task Name */}
      <div className="flex items-center gap-2 px-2 py-1.5 flex-[2_1_0%] min-w-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete?.();
          }}
          className={cn(
            "flex-shrink-0 size-4 rounded-full border-2 transition-colors flex items-center justify-center",
            isCompleted
              ? "bg-[#1E1E1E] border-[#1E1E1E]"
              : "border-[#C8C7C5] hover:border-[#949494]"
          )}
          aria-label={`Mark ${task.name} as ${isCompleted ? "incomplete" : "complete"}`}
        >
          {isCompleted && (
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
              <path
                d="M1 3L3 5L7 1"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
        <span
          className={cn(
            "text-sm truncate",
            isCompleted
              ? "line-through text-[#949494]"
              : "text-[#1E1E1E]"
          )}
        >
          {task.name}
        </span>
      </div>

      {/* Priority */}
      <div className="flex items-center border-l border-[#E6E5E3] px-2 py-1.5 w-[90px] flex-shrink-0">
        {onPriorityChange ? (
          <PrioritySelector value={task.priority} onChange={onPriorityChange} />
        ) : (
          <PriorityBars priority={task.priority} />
        )}
      </div>

      {/* Due Date */}
      <div className="flex items-center border-l border-[#E6E5E3] px-2 py-1.5 w-[100px] flex-shrink-0">
        <span
          className={cn(
            "text-xs",
            task.due === "Today"
              ? "font-semibold text-[#1E1E1E]"
              : "text-[#5F5E5B]"
          )}
        >
          {task.due}
        </span>
      </div>

      {/* Project Tag */}
      <div className="flex items-center border-l border-[#E6E5E3] px-2 py-1.5 w-[150px] flex-shrink-0">
        <Badge
          variant="outline"
          className={`max-w-full text-xs ${projectPillClasses}`}
        >
          <span className="truncate">{task.project}</span>
        </Badge>
      </div>
    </div>
  );
}
