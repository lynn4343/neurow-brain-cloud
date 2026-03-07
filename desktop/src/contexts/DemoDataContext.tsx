"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useUser } from "./UserContext";
import {
  type Task,
  type TopPriority,
  type CalendarEvent,
  TASKS,
  TOP_PRIORITIES,
  CALENDAR_EVENTS,
  getUserData,
} from "@/lib/demo-data";

// ---------------------------------------------------------------------------
// Modal types
// ---------------------------------------------------------------------------

export type ModalMode = "task" | "event";

export type ModalData =
  | {
      mode: "task";
      task: Task | TopPriority;
      index: number;
      source: "tasks" | "topPriorities";
      isNew: boolean;
    }
  | {
      mode: "event";
      event: CalendarEvent;
      isNew: boolean;
    };

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

interface DemoDataContextType {
  // Mutable data
  tasks: Task[];
  topPriorities: TopPriority[];
  events: CalendarEvent[];
  updateTask: (
    index: number,
    source: "tasks" | "topPriorities",
    updates: Partial<Task & TopPriority>,
  ) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  addTask: (task: Task) => void;
  deleteTask: (index: number, source: "tasks" | "topPriorities") => void;
  deleteEvent: (id: string) => void;

  // Modal state
  modalData: ModalData | null;
  openTaskModal: (
    task: Task | TopPriority,
    index: number,
    source: "tasks" | "topPriorities",
  ) => void;
  openNewTaskModal: () => void;
  openEventModal: (event: CalendarEvent) => void;
  openNewEventModal: (date: string, startTime: string) => void;
  addEvent: (event: CalendarEvent) => void;
  closeModal: () => void;
}

const DemoDataContext = createContext<DemoDataContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const { activeUser } = useUser();
  const slug = activeUser?.slug;

  const [tasks, setTasks] = useState<Task[]>(() =>
    getUserData(TASKS, slug),
  );
  const [topPriorities, setTopPriorities] = useState<TopPriority[]>(() =>
    getUserData(TOP_PRIORITIES, slug),
  );
  const [events, setEvents] = useState<CalendarEvent[]>(() =>
    getUserData(CALENDAR_EVENTS, slug),
  );
  const [modalData, setModalData] = useState<ModalData | null>(null);

  // Reinitialize when user changes (React pattern: adjust state during render)
  const [prevSlug, setPrevSlug] = useState(slug);
  if (slug !== prevSlug) {
    setPrevSlug(slug);
    setTasks(getUserData(TASKS, slug));
    setTopPriorities(getUserData(TOP_PRIORITIES, slug));
    setEvents(getUserData(CALENDAR_EVENTS, slug));
    setModalData(null);
  }

  const updateTask = useCallback(
    (
      index: number,
      source: "tasks" | "topPriorities",
      updates: Partial<Task & TopPriority>,
    ) => {
      if (source === "tasks") {
        setTasks((prev) =>
          prev.map((t, i) => (i === index ? { ...t, ...updates } : t)),
        );
      } else {
        setTopPriorities((prev) =>
          prev.map((t, i) => (i === index ? { ...t, ...updates } : t)),
        );
      }
    },
    [],
  );

  const updateEvent = useCallback(
    (id: string, updates: Partial<CalendarEvent>) => {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      );
    },
    [],
  );

  const addTask = useCallback((task: Task) => {
    setTasks((prev) => [...prev, task]);
  }, []);

  const deleteTask = useCallback(
    (index: number, source: "tasks" | "topPriorities") => {
      if (source === "tasks") {
        setTasks((prev) => prev.filter((_, i) => i !== index));
      } else {
        setTopPriorities((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [],
  );

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const openTaskModal = useCallback(
    (
      task: Task | TopPriority,
      index: number,
      source: "tasks" | "topPriorities",
    ) => {
      setModalData({ mode: "task", task, index, source, isNew: false });
    },
    [],
  );

  const openNewTaskModal = useCallback(() => {
    setModalData({
      mode: "task",
      task: { name: "", priority: "None", due: "", project: "" },
      index: -1,
      source: "tasks",
      isNew: true,
    });
  }, []);

  const openEventModal = useCallback((event: CalendarEvent) => {
    setModalData({ mode: "event", event, isNew: false });
  }, []);

  const openNewEventModal = useCallback((date: string, startTime: string) => {
    // Calculate end time (1 hour later, clamped to 23:59)
    const [h, m] = startTime.split(":").map(Number);
    let endH = h + 1;
    let endM = m;
    if (endH > 23) {
      endH = 23;
      endM = 59;
    }
    const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    const durationMin = (endH - h) * 60 + (endM - m);

    const newEvent: CalendarEvent = {
      id: `new-${Date.now()}`,
      title: "",
      date,
      startTime,
      endTime,
      durationMin: Math.max(durationMin, 1),
      category: "Personal",
    };
    setModalData({ mode: "event", event: newEvent, isNew: true });
  }, []);

  const addEvent = useCallback((event: CalendarEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  const closeModal = useCallback(() => {
    setModalData(null);
  }, []);

  return (
    <DemoDataContext.Provider
      value={{
        tasks,
        topPriorities,
        events,
        updateTask,
        updateEvent,
        addTask,
        deleteTask,
        deleteEvent,
        modalData,
        openTaskModal,
        openNewTaskModal,
        openEventModal,
        openNewEventModal,
        addEvent,
        closeModal,
      }}
    >
      {children}
    </DemoDataContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDemoData() {
  const ctx = useContext(DemoDataContext);
  if (!ctx) throw new Error("useDemoData must be used within DemoDataProvider");
  return ctx;
}
