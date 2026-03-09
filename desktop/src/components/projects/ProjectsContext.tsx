"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { ComingUpSort } from "./types";

export type ProjectsPage =
  | "hub"
  | "goal-1" | "goal-2" | "goal-3"
  | `project-${string}`
  | `workspace-${string}`;

interface ProjectsContextValue {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  activePage: ProjectsPage;
  setActivePage: (page: ProjectsPage) => void;
  workspacesFilter: "all" | "personal" | "professional";
  setWorkspacesFilter: (filter: "all" | "personal" | "professional") => void;
  comingUpFilter: "all" | "personal" | "professional";
  setComingUpFilter: (filter: "all" | "personal" | "professional") => void;
  comingUpSort: ComingUpSort;
  setComingUpSort: (sort: ComingUpSort) => void;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function useProjectsContext() {
  const ctx = useContext(ProjectsContext);
  if (!ctx)
    throw new Error(
      "useProjectsContext must be used within ProjectsProvider"
    );
  return ctx;
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState<ProjectsPage>("hub");
  const [workspacesFilter, setWorkspacesFilter] = useState<
    "all" | "personal" | "professional"
  >("all");
  const [comingUpFilter, setComingUpFilter] = useState<
    "all" | "personal" | "professional"
  >("all");
  const [comingUpSort, setComingUpSort] = useState<ComingUpSort>("default");

  const toggleSidebar = useCallback(
    () => setSidebarOpen((prev) => !prev),
    []
  );

  return (
    <ProjectsContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        activePage,
        setActivePage,
        workspacesFilter,
        setWorkspacesFilter,
        comingUpFilter,
        setComingUpFilter,
        comingUpSort,
        setComingUpSort,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}
