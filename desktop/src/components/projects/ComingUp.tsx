"use client";

import { useState } from "react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useDemoData } from "@/contexts/DemoDataContext";
import { ComingUpTaskRow } from "./ComingUpTaskRow";
import { ComingUpFilters } from "./ComingUpFilters";
import { useProjectsContext } from "./ProjectsContext";
import { sortComingUpTasks } from "./sort-utils";
import type { Priority } from "@/lib/demo-data";

export function ComingUp() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const { comingUpSort, setComingUpSort } = useProjectsContext();
  const { tasks, updateTask, openTaskModal } = useDemoData();

  const toggleComplete = (name: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handlePriorityChange = (index: number, newPriority: Priority) => {
    updateTask(index, "tasks", { priority: newPriority });
  };

  const handlePrioritySort = () => {
    setComingUpSort(
      comingUpSort === "priority-desc" ? "priority-asc" : "priority-desc"
    );
  };

  const handleDueSort = () => {
    setComingUpSort(comingUpSort === "due-asc" ? "due-desc" : "due-asc");
  };

  const handleProjectSort = () => {
    setComingUpSort(
      comingUpSort === "project-asc" ? "project-desc" : "project-asc"
    );
  };

  const sortedTasks = sortComingUpTasks(tasks, comingUpSort);

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
          <CaretDown
            className={cn(
              "h-4 w-4 text-[#1E1E1E] transition-transform",
              !isExpanded && "-rotate-90"
            )}
            weight="fill"
          />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#1E1E1E]">
            COMING UP
          </h2>
        </button>
        <ComingUpFilters />
      </div>

      {isExpanded && (
        <>
          {/* Column Headers */}
          <div className="flex items-center border-b border-[#E6E5E3] pb-2 text-xs font-semibold uppercase tracking-wide text-[#949494]">
            <div className="flex-[2_1_0%] px-2">Task Name</div>

            <button
              onClick={handlePrioritySort}
              className={cn(
                "flex items-center gap-1 border-l border-[#E6E5E3] px-2 w-[90px] flex-shrink-0 hover:text-[#1E1E1E]",
                (comingUpSort === "priority-asc" ||
                  comingUpSort === "priority-desc") &&
                  "text-[#1E1E1E]"
              )}
            >
              Priority
              {comingUpSort === "priority-desc" && (
                <CaretDown size={12} weight="fill" />
              )}
              {comingUpSort === "priority-asc" && (
                <CaretUp size={12} weight="fill" />
              )}
            </button>

            <button
              onClick={handleDueSort}
              className={cn(
                "flex items-center gap-1 border-l border-[#E6E5E3] px-2 w-[100px] flex-shrink-0 hover:text-[#1E1E1E]",
                (comingUpSort === "due-asc" || comingUpSort === "due-desc") &&
                  "text-[#1E1E1E]"
              )}
            >
              Due
              {comingUpSort === "due-asc" && (
                <CaretUp size={12} weight="fill" />
              )}
              {comingUpSort === "due-desc" && (
                <CaretDown size={12} weight="fill" />
              )}
            </button>

            <button
              onClick={handleProjectSort}
              className={cn(
                "flex items-center gap-1 border-l border-[#E6E5E3] px-2 w-[150px] flex-shrink-0 hover:text-[#1E1E1E]",
                (comingUpSort === "project-asc" ||
                  comingUpSort === "project-desc") &&
                  "text-[#1E1E1E]"
              )}
            >
              Project
              {comingUpSort === "project-asc" && (
                <CaretUp size={12} weight="fill" />
              )}
              {comingUpSort === "project-desc" && (
                <CaretDown size={12} weight="fill" />
              )}
            </button>
          </div>

          {/* Task Rows */}
          <div className="relative">
            <div className="overflow-y-auto max-h-[336px] [scrollbar-width:thin] [scrollbar-color:#E6E5E3_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#E6E5E3] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#949494]">
              <div>
                {sortedTasks.map((task) => {
                  const originalIndex = tasks.indexOf(task);
                  return (
                    <ComingUpTaskRow
                      key={task.name}
                      task={task}
                      isCompleted={completedTasks.has(task.name)}
                      onToggleComplete={() => toggleComplete(task.name)}
                      onPriorityChange={(priority) =>
                        handlePriorityChange(originalIndex, priority)
                      }
                      onDoubleClick={() =>
                        openTaskModal(task, originalIndex, "tasks")
                      }
                    />
                  );
                })}
              </div>
            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          </div>
        </>
      )}
    </section>
  );
}
