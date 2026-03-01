"use client";

import { useState } from "react";
import { CaretDown, CaretUp, Check, Plus, WarningCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Priority = "Urgent" | "High" | "Medium" | "Low" | "None";

interface MockTask {
  name: string;
  priority: Priority;
  due: string;
  project: string;
}

const mockTasks: MockTask[] = [
  { name: "Review quarterly report", priority: "High", due: "Today", project: "Operations" },
  { name: "Send client proposal", priority: "High", due: "Today", project: "Sales" },
  { name: "Update brand guidelines", priority: "Medium", due: "Tomorrow", project: "Marketing" },
  { name: "Fix login page responsiveness", priority: "Medium", due: "Feb 26", project: "Engineering" },
  { name: "Prepare investor deck slides", priority: "Medium", due: "Feb 27", project: "Fundraising" },
  { name: "Schedule team retrospective", priority: "Low", due: "Feb 28", project: "Operations" },
  { name: "Draft product launch announcement", priority: "High", due: "Mar 1", project: "Marketing" },
  { name: "Review onboarding flow analytics", priority: "Medium", due: "Mar 2", project: "Engineering" },
  { name: "Plan team offsite agenda", priority: "Low", due: "Mar 5", project: "Operations" },
];

/* Priority Bars — matches web app PriorityBars component */
const NUM_BARS = 3;

const BARS_FILLED: Record<Priority, number> = {
  Urgent: 0, // Icon only
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
              index < barsToFill ? activeColor : inactiveColor
            )}
          />
        ))}
    </div>
  );
}

const projectColorMap: Record<string, string> = {
  Operations: "bg-teal-100 text-teal-700 border-teal-200",
  Sales: "bg-blue-100 text-blue-700 border-blue-200",
  Marketing: "bg-purple-100 text-purple-700 border-purple-200",
  Engineering: "bg-pink-100 text-pink-700 border-pink-200",
  Fundraising: "bg-violet-100 text-violet-700 border-violet-200",
};

const defaultProjectColor = "bg-gray-100 text-gray-700 border-gray-200";

const getProjectPillClasses = (project: string): string => {
  return projectColorMap[project] || defaultProjectColor;
};

/* Sorting */
type DayMapSort = "default" | "priority-asc" | "priority-desc" | "due-asc" | "due-desc" | "project-asc" | "project-desc";

const PRIORITY_ORDER: Record<Priority, number> = {
  Urgent: 5,
  High: 4,
  Medium: 3,
  Low: 2,
  None: 1,
};

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseDueDate(due: string): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (due === "Today") return today;
  if (due === "Tomorrow") {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }

  const parts = due.split(" ");
  if (parts.length === 2) {
    const month = MONTHS[parts[0]] ?? 0;
    const day = parseInt(parts[1], 10);
    return new Date(today.getFullYear(), month, day);
  }

  return new Date(2099, 11, 31);
}

function isPastDue(due: string): boolean {
  if (due === "Today" || due === "Tomorrow") return false;
  const dueDate = parseDueDate(due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
}

function shortDue(due: string): string {
  if (due === "Tomorrow") return "Tmrw";
  const dueDate = parseDueDate(due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dueDate.getTime() === yesterday.getTime()) return "Yesterday";
  return due;
}

function sortTasks(tasks: MockTask[], sortType: DayMapSort): MockTask[] {
  const copy = [...tasks];
  switch (sortType) {
    case "default":
      return copy.sort((a, b) => {
        const dateDiff = parseDueDate(a.due).getTime() - parseDueDate(b.due).getTime();
        if (dateDiff !== 0) return dateDiff;
        return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      });
    case "priority-asc":
      return copy.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    case "priority-desc":
      return copy.sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]);
    case "due-asc":
      return copy.sort((a, b) => parseDueDate(a.due).getTime() - parseDueDate(b.due).getTime());
    case "due-desc":
      return copy.sort((a, b) => parseDueDate(b.due).getTime() - parseDueDate(a.due).getTime());
    case "project-asc":
      return copy.sort((a, b) => a.project.localeCompare(b.project, "en", { sensitivity: "base" }));
    case "project-desc":
      return copy.sort((a, b) => b.project.localeCompare(a.project, "en", { sensitivity: "base" }));
    default:
      return copy;
  }
}

export function SecondaryTasks() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [sort, setSort] = useState<DayMapSort>("default");
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const toggleComplete = (taskName: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskName)) next.delete(taskName);
      else next.add(taskName);
      return next;
    });
  };

  const handlePrioritySort = () => setSort(sort === "priority-desc" ? "priority-asc" : "priority-desc");
  const handleDueSort = () => setSort(sort === "due-asc" ? "due-desc" : "due-asc");
  const handleProjectSort = () => setSort(sort === "project-asc" ? "project-desc" : "project-asc");

  const sortedTasks = sortTasks(mockTasks, sort);

  return (
    <div className="flex flex-col rounded-[12px] border border-[#E6E5E3] bg-white p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <CaretDown
            className={cn(
              "size-3 text-[#949494] transition-transform",
              !isExpanded && "-rotate-90"
            )}
            weight="bold"
          />
          <span className="text-sm font-semibold uppercase text-[#1E1E1E]">
            Secondary Tasks
          </span>
        </button>
        <button className="flex items-center gap-1 text-xs text-[#5F5E5B] hover:text-[#1E1E1E] transition-colors">
          <Plus className="size-3" weight="bold" />
          New Task
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 relative">
          <div className="overflow-y-auto scrollbar-thin max-h-[248px]">
            {/* Column Headers - Sticky inside scroll container for alignment */}
            <div className="flex items-center border-b border-[#E6E5E3] text-[11px] font-semibold uppercase tracking-wide text-[#949494] sticky top-0 bg-white z-10">
              <div className="flex-[3_1_0%] min-w-0 px-2 pb-2 truncate">
                Task Name
              </div>
              <button
                onClick={handlePrioritySort}
                className={cn(
                  "flex items-center gap-1 flex-[0.7_1_32px] max-w-[90px] min-w-0 border-l border-[#E6E5E3] px-1.5 pb-2 hover:text-[#1E1E1E] transition-colors overflow-hidden",
                  (sort === "priority-asc" || sort === "priority-desc") && "text-[#1E1E1E]"
                )}
              >
                <span className="truncate">Priority</span>
                {sort === "priority-desc" && <CaretDown size={12} weight="fill" className="flex-shrink-0" />}
                {sort === "priority-asc" && <CaretUp size={12} weight="fill" className="flex-shrink-0" />}
              </button>
              <button
                onClick={handleDueSort}
                className={cn(
                  "flex items-center gap-1 flex-[1_1_40px] max-w-[100px] min-w-0 border-l border-[#E6E5E3] px-1.5 pb-2 hover:text-[#1E1E1E] transition-colors overflow-hidden",
                  (sort === "due-asc" || sort === "due-desc") && "text-[#1E1E1E]"
                )}
              >
                Due
                {sort === "due-asc" && <CaretDown size={12} weight="fill" className="flex-shrink-0" />}
                {sort === "due-desc" && <CaretUp size={12} weight="fill" className="flex-shrink-0" />}
              </button>
              <button
                onClick={handleProjectSort}
                className={cn(
                  "flex items-center gap-1 flex-[1.2_1_45px] max-w-[150px] min-w-0 border-l border-[#E6E5E3] px-1.5 pb-2 hover:text-[#1E1E1E] transition-colors overflow-hidden",
                  (sort === "project-asc" || sort === "project-desc") && "text-[#1E1E1E]"
                )}
              >
                <span className="truncate">Project</span>
                {sort === "project-asc" && <CaretDown size={12} weight="fill" className="flex-shrink-0" />}
                {sort === "project-desc" && <CaretUp size={12} weight="fill" className="flex-shrink-0" />}
              </button>
            </div>
              <div>
                {sortedTasks.map((task, i) => {
                  const done = completedTasks.has(task.name);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "relative flex items-center border-b border-[#E6E5E3] last:border-b-0 hover:bg-[#FAF8F8] transition-opacity duration-300",
                        done && "opacity-55"
                      )}
                      style={{ transitionDelay: done ? "100ms" : "0ms" }}
                    >
                      {/* Strikethrough line — draws left-to-right across name + priority + due */}
                      <div
                        className={cn(
                          "absolute left-7 right-[70px] top-1/2 h-[1.5px] bg-[#1E1E1E]/60 pointer-events-none origin-left transition-transform ease-out",
                          done ? "scale-x-100" : "scale-x-0"
                        )}
                        style={{ transitionDuration: "350ms", transitionDelay: done ? "50ms" : "0ms" }}
                      />

                      {/* Task Name with animated circle */}
                      <div className="flex items-center gap-2 flex-[3_1_0%] min-w-0 px-2 py-1.5">
                        <button
                          onClick={() => toggleComplete(task.name)}
                          className="flex-shrink-0 flex items-center justify-center h-4 w-4 rounded-full transition-all duration-200"
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
                              done ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </button>
                        <span className="text-sm text-[#1E1E1E] truncate">{task.name}</span>
                      </div>

                      {/* Priority Bars */}
                      <div className={cn(
                        "flex-[0.7_1_32px] max-w-[90px] min-w-0 border-l border-[#E6E5E3] px-1.5 py-1.5 flex items-center transition-opacity duration-300",
                        done && "opacity-40"
                      )}>
                        <PriorityBars priority={task.priority} />
                      </div>

                      {/* Due Date */}
                      <div className={cn(
                        "flex-[1_1_40px] max-w-[100px] min-w-0 border-l border-[#E6E5E3] px-1.5 py-1.5 text-xs truncate",
                        isPastDue(task.due) ? "font-semibold text-red-700" : task.due === "Today" ? "font-semibold text-[#1E1E1E]" : "text-[#949494]"
                      )}>
                        {shortDue(task.due)}
                      </div>

                      {/* Project Pill */}
                      <div className="flex-[1.2_1_45px] max-w-[150px] min-w-0 border-l border-[#E6E5E3] px-1.5 py-1.5 flex items-center overflow-hidden">
                        <span className={cn(
                          "block rounded-full border px-2 py-0.5 text-xs font-semibold truncate max-w-full",
                          getProjectPillClasses(task.project)
                        )}>
                          {task.project}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
          </div>

          {/* Bottom fade mask */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>
      )}

      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #E6E5E3;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #949494;
        }
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #E6E5E3 transparent;
        }
      `}</style>
    </div>
  );
}
