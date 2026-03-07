"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { useDemoData, type ModalMode } from "@/contexts/DemoDataContext";
import {
  type Priority,
  type TopPriority,
  PROJECT_COLORS,
  DEFAULT_PROJECT_COLOR,
  EVENT_CATEGORY_COLORS,
  DEFAULT_EVENT_COLOR,
} from "@/lib/demo-data";
import { formatEventTime } from "@/lib/event-layout";
import {
  X,
  Check,
  CalendarBlank,
  Hourglass,
  CalendarCheck,
  ArrowsClockwise,
  Lightning,
  Car,
  MapPin,
  Plus,
  CircleDashed,
  Trash,
} from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// Priority helpers
// ---------------------------------------------------------------------------

const PRIORITY_LEVELS: Priority[] = ["None", "Low", "Medium", "High", "Urgent"];

const PRIORITY_BAR_COLORS: Record<Priority, string[]> = {
  Urgent: ["bg-red-600", "bg-red-600", "bg-red-600"],
  High: ["bg-red-700", "bg-red-400", "bg-red-300"],
  Medium: ["bg-amber-500", "bg-amber-400", "bg-amber-300"],
  Low: ["bg-amber-400", "bg-amber-300", "bg-amber-200"],
  None: ["bg-gray-300", "bg-gray-200", "bg-gray-200"],
};

function PriorityDisplay({ priority }: { priority: Priority }) {
  const bars = PRIORITY_BAR_COLORS[priority] ?? PRIORITY_BAR_COLORS.None;
  const count = priority === "None" ? 0 : priority === "Low" ? 1 : priority === "Medium" ? 2 : 3;
  return (
    <div className="flex items-center gap-1">
      <span className="flex items-end gap-[2px]">
        {bars.map((color, i) => (
          <span
            key={i}
            className={cn(
              "w-[3px] rounded-sm",
              i < count ? color : "bg-gray-200",
            )}
            style={{ height: `${8 + i * 3}px` }}
          />
        ))}
      </span>
      <span className="text-sm text-[#1E1E1E] ml-1">{priority}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Time estimate options
// ---------------------------------------------------------------------------

const TIME_OPTIONS = ["15 min", "30 min", "45 min", "1 hr", "2 hrs", "3 hrs"];

// ---------------------------------------------------------------------------
// Due date options
// ---------------------------------------------------------------------------

const DUE_OPTIONS = ["Today", "Tomorrow", "Next Week", "Mar 10", "Mar 12", "Mar 14"];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ModeTogglePill({
  mode,
  onToggle,
}: {
  mode: ModalMode;
  onToggle: (m: ModalMode) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-[#E6E5E3] bg-[#FAF8F8] p-0.5">
      <button
        onClick={() => onToggle("event")}
        className={cn(
          "rounded-full px-4 py-1 text-xs font-medium transition-colors",
          mode === "event"
            ? "bg-[#1E1E1E] text-white"
            : "text-[#949494] hover:text-[#1E1E1E]",
        )}
      >
        Event
      </button>
      <button
        onClick={() => onToggle("task")}
        className={cn(
          "rounded-full px-4 py-1 text-xs font-medium transition-colors",
          mode === "task"
            ? "bg-[#1E1E1E] text-white"
            : "text-[#949494] hover:text-[#1E1E1E]",
        )}
      >
        Task
      </button>
    </div>
  );
}

function FieldRow({
  icon: Icon,
  label,
  isSet = false,
  disabled = false,
  onClick,
  children,
}: {
  icon: React.ElementType;
  label: string;
  isSet?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const Wrapper = disabled ? "div" : "button";
  return (
    <Wrapper
      {...(!disabled && { type: "button" as const })}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "flex w-full items-center gap-3 py-2.5 text-left text-sm transition-colors rounded-md px-1",
        disabled
          ? "opacity-40 cursor-default"
          : "hover:bg-[#FAF8F8] cursor-pointer",
      )}
    >
      <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
        {isSet ? (
          <Icon size={18} weight="regular" className="text-[#1E1E1E]" />
        ) : (
          <>
            <CircleDashed size={20} weight="regular" className="absolute text-[#C8C7C5]" />
            <Icon size={12} weight="regular" className="relative text-[#949494]" />
          </>
        )}
      </div>
      <span className="text-[#949494] text-xs font-medium w-[110px] shrink-0">
        {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </Wrapper>
  );
}

// ---------------------------------------------------------------------------
// Dropdown (inline, simple)
// ---------------------------------------------------------------------------

function InlineDropdown({
  options,
  isOpen,
  onSelect,
  onClose,
  renderOption,
}: {
  options: string[];
  isOpen: boolean;
  onSelect: (value: string) => void;
  onClose: () => void;
  renderOption?: (option: string) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border border-[#E6E5E3] bg-white shadow-lg py-1"
    >
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => {
            onSelect(opt);
            onClose();
          }}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[#1E1E1E] hover:bg-[#FAF8F8] transition-colors"
        >
          {renderOption ? renderOption(opt) : opt}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

export function TaskEventModal() {
  const { modalData, closeModal, updateTask, updateEvent, addTask, addEvent, deleteTask, deleteEvent } = useDemoData();

  // Local editing state
  const [mode, setMode] = useState<ModalMode>("task");
  const [name, setName] = useState("");
  const [priority, setPriority] = useState<Priority>("None");
  const [due, setDue] = useState("");
  const [project, setProject] = useState("");
  const [timeEstimate, setTimeEstimate] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Sync local state when modal opens (React pattern: adjust state during render)
  const [prevModalData, setPrevModalData] = useState(modalData);
  if (modalData !== prevModalData) {
    setPrevModalData(modalData);
    if (modalData) {
      setOpenDropdown(null);
      setIsComplete(false);
      setDescription("");

      if (modalData.mode === "task") {
        setMode("task");
        setName(modalData.task.name);
        setPriority(modalData.task.priority);
        setDue(modalData.task.due);
        setProject(modalData.task.project);
        setTimeEstimate((modalData.task as TopPriority).timeEstimate ?? "");
      } else {
        setMode("event");
        setName(modalData.event.title);
        setLocation(modalData.event.location ?? "");
        setCategory(modalData.event.category);
      }
    }
  }

  if (!modalData) return null;

  const handleClose = () => {
    // Save changes before closing
    if (modalData.mode === "task") {
      if (modalData.isNew && name.trim()) {
        addTask({ name: name.trim(), priority, due: due || "Today", project: project || "Personal" });
      } else if (!modalData.isNew) {
        const updates: Record<string, string> = { name, priority, due, project };
        if (timeEstimate) (updates as Record<string, string>).timeEstimate = timeEstimate;
        updateTask(modalData.index, modalData.source, updates);
      }
    } else if (modalData.mode === "event") {
      if (modalData.isNew && name.trim()) {
        addEvent({ ...modalData.event, title: name.trim(), category, location: location || undefined });
      } else if (!modalData.isNew) {
        updateEvent(modalData.event.id, {
          title: name,
          category,
          location: location || undefined,
        });
      }
    }
    closeModal();
  };

  const projectKeys = Object.keys(PROJECT_COLORS);

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-[480px] max-w-[90vw] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[#E6E5E3] bg-white shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* ── Top Bar ── */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            {mode === "task" ? (
              <button
                onClick={() => setIsComplete(!isComplete)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  isComplete
                    ? "border-[#1E1E1E] bg-[#1E1E1E] text-white"
                    : "border-[#E6E5E3] text-[#949494] hover:border-[#C8C7C5] hover:text-[#1E1E1E]",
                )}
              >
                <Check size={12} weight="bold" />
                Mark complete
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-[#949494]">
                <span className="text-[#949494] font-medium">Mark as focus block</span>
              </div>
            )}
            <DialogPrimitive.Close
              className="rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
            >
              <X size={16} />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

          {/* ── Title Input ── */}
          <div className="px-6 pb-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={mode === "task" ? "Add a task name" : "Add an event name"}
              className="w-full text-lg font-semibold text-[#1E1E1E] placeholder:text-[#C8C7C5] bg-transparent border-none outline-none"
              autoFocus={modalData.isNew}
            />
          </div>

          {/* ── Mode Toggle ── */}
          <div className="px-6 pb-4">
            <ModeTogglePill mode={mode} onToggle={setMode} />
          </div>

          <div className="border-t border-[#E6E5E3]" />

          {/* ── Field Rows ── */}
          <div className="px-5 py-2">
            {mode === "task" ? (
              <>
                {/* Due Date */}
                <div className="relative">
                  <FieldRow
                    icon={CalendarBlank}
                    label="Due Date"
                    isSet={!!due}
                    onClick={() => setOpenDropdown(openDropdown === "due" ? null : "due")}
                  >
                    <span className={due ? "text-[#1E1E1E]" : "text-[#B0AFAD]"}>
                      {due || "No due date"}
                    </span>
                  </FieldRow>
                  <InlineDropdown
                    options={DUE_OPTIONS}
                    isOpen={openDropdown === "due"}
                    onSelect={setDue}
                    onClose={() => setOpenDropdown(null)}
                  />
                </div>

                {/* Estimated Time */}
                <div className="relative">
                  <FieldRow
                    icon={Hourglass}
                    label="Estimated time"
                    isSet={!!timeEstimate}
                    onClick={() => setOpenDropdown(openDropdown === "time" ? null : "time")}
                  >
                    <span className={timeEstimate ? "text-[#1E1E1E]" : "text-[#B0AFAD]"}>
                      {timeEstimate || "Set duration"}
                    </span>
                  </FieldRow>
                  <InlineDropdown
                    options={TIME_OPTIONS}
                    isOpen={openDropdown === "time"}
                    onSelect={setTimeEstimate}
                    onClose={() => setOpenDropdown(null)}
                  />
                </div>

                {/* Schedule it (placeholder) */}
                <FieldRow icon={CalendarCheck} label="Schedule it" disabled>
                  <span className="text-[#B0AFAD]">Task not scheduled</span>
                </FieldRow>

                {/* Repeat (placeholder) */}
                <FieldRow icon={ArrowsClockwise} label="Repeat" disabled>
                  <span className="text-[#B0AFAD]">Set recurrence</span>
                </FieldRow>

                {/* Priority */}
                <div className="relative">
                  <FieldRow
                    icon={Lightning}
                    label="Priority"
                    isSet={priority !== "None"}
                    onClick={() => setOpenDropdown(openDropdown === "priority" ? null : "priority")}
                  >
                    <PriorityDisplay priority={priority} />
                  </FieldRow>
                  <InlineDropdown
                    options={PRIORITY_LEVELS}
                    isOpen={openDropdown === "priority"}
                    onSelect={(v) => setPriority(v as Priority)}
                    onClose={() => setOpenDropdown(null)}
                    renderOption={(opt) => <PriorityDisplay priority={opt as Priority} />}
                  />
                </div>

                {/* Projects */}
                <div className="relative">
                  <FieldRow
                    icon={CalendarBlank}
                    label="Projects"
                    isSet={!!project}
                    onClick={() => setOpenDropdown(openDropdown === "project" ? null : "project")}
                  >
                    {project ? (
                      <span
                        className={cn(
                          "inline-block rounded-full border px-2 py-0.5 text-xs font-semibold",
                          PROJECT_COLORS[project] ?? DEFAULT_PROJECT_COLOR,
                        )}
                      >
                        {project}
                      </span>
                    ) : (
                      <span className="inline-block rounded-full border border-[#E6E5E3] px-3 py-0.5 text-xs text-[#B0AFAD]">
                        Attach a project
                      </span>
                    )}
                  </FieldRow>
                  <InlineDropdown
                    options={projectKeys}
                    isOpen={openDropdown === "project"}
                    onSelect={setProject}
                    onClose={() => setOpenDropdown(null)}
                    renderOption={(opt) => (
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs font-semibold",
                          PROJECT_COLORS[opt] ?? DEFAULT_PROJECT_COLOR,
                        )}
                      >
                        {opt}
                      </span>
                    )}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Date (display only) */}
                <FieldRow icon={CalendarBlank} label="Date" isSet disabled>
                  <span className="text-[#1E1E1E]">
                    {modalData.mode === "event"
                      ? new Date(modalData.event.date + "T12:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : ""}
                  </span>
                </FieldRow>

                {/* Duration (display only) */}
                <FieldRow icon={Hourglass} label="Duration" isSet={modalData.mode === "event"} disabled>
                  <span className="text-[#1E1E1E]">
                    {modalData.mode === "event"
                      ? `${formatEventTime(modalData.event.startTime)} – ${formatEventTime(modalData.event.endTime)}`
                      : "Enter duration"}
                  </span>
                </FieldRow>

                {/* Repeat (placeholder) */}
                <FieldRow icon={ArrowsClockwise} label="Repeat" disabled>
                  <span className="text-[#B0AFAD]">Set recurrence</span>
                </FieldRow>

                {/* Travel time (placeholder) */}
                <FieldRow icon={Car} label="Travel time" disabled>
                  <span className="text-[#B0AFAD]">Enter travel time</span>
                </FieldRow>

                {/* Calendar / Category */}
                <div className="relative">
                  <FieldRow
                    icon={CalendarBlank}
                    label="Calendar"
                    isSet={!!category}
                    onClick={() => setOpenDropdown(openDropdown === "calendar" ? null : "calendar")}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          (EVENT_CATEGORY_COLORS[category] ?? DEFAULT_EVENT_COLOR).dot,
                        )}
                      />
                      <span className="text-[#1E1E1E] text-sm">{category}</span>
                    </div>
                  </FieldRow>
                  <InlineDropdown
                    options={Object.keys(EVENT_CATEGORY_COLORS)}
                    isOpen={openDropdown === "calendar"}
                    onSelect={setCategory}
                    onClose={() => setOpenDropdown(null)}
                    renderOption={(opt) => (
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            (EVENT_CATEGORY_COLORS[opt] ?? DEFAULT_EVENT_COLOR).dot,
                          )}
                        />
                        <span className="text-sm">{opt}</span>
                      </div>
                    )}
                  />
                </div>

                {/* Location */}
                <FieldRow icon={MapPin} label="Loc/Video Call" isSet={!!location}>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Add Location or Video Call"
                    className="w-full bg-transparent text-sm text-[#1E1E1E] placeholder:text-[#B0AFAD] outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                </FieldRow>
              </>
            )}
          </div>

          <div className="border-t border-[#E6E5E3]" />

          {/* ── Description / Notes ── */}
          <div className="px-6 py-4">
            <p className="text-xs font-medium text-[#949494] mb-2">
              {mode === "task" ? "Description" : "Notes"}
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                mode === "task"
                  ? "Write a description for this task"
                  : "Add additional notes"
              }
              className="w-full min-h-[80px] resize-none rounded-lg border border-[#E6E5E3] bg-[#FAF8F8] px-3 py-2.5 text-sm text-[#1E1E1E] placeholder:text-[#B0AFAD] outline-none focus:border-[#C8C7C5]"
            />
          </div>

          {/* ── Add subtask (task mode only, placeholder) ── */}
          {mode === "task" && (
            <div className="px-6 pb-3">
              <button className="flex items-center gap-1.5 rounded-full border border-[#E6E5E3] px-3 py-1 text-xs text-[#949494] hover:text-[#1E1E1E] hover:border-[#C8C7C5] transition-colors">
                <Plus size={12} weight="bold" />
                Add subtask
              </button>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex items-center gap-2 px-6 pb-5 pt-1">
            {!modalData.isNew && (
              <button
                onClick={() => {
                  if (modalData.mode === "task") {
                    deleteTask(modalData.index, modalData.source);
                  } else {
                    deleteEvent(modalData.event.id);
                  }
                  closeModal();
                }}
                className="flex items-center justify-center rounded-lg border border-[#E6E5E3] p-2 text-[#949494] hover:text-red-600 hover:border-red-200 transition-colors"
                aria-label="Delete"
              >
                <Trash size={16} />
              </button>
            )}
            <button
              onClick={handleClose}
              className="flex-1 rounded-lg bg-[#1E1E1E] py-2 text-sm font-medium text-white hover:bg-[#2E2E2E] transition-colors"
            >
              {modalData.isNew ? "Create" : "Save"}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}
