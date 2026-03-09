"use client";

import { useState } from "react";
import {
  CaretDoubleLeft,
  CaretDown,
  House,
  Target,
  PushPin,
  Cube,
} from "@phosphor-icons/react";
import { useProjectsContext, type ProjectsPage } from "./ProjectsContext";
import { useUser } from "@/contexts/UserContext";
import { getUserData } from "@/lib/demo-data";
import { PINNED_PROJECTS, WORKSPACES } from "./mock-data";
import { WorkspaceIcon } from "./WorkspaceIcon";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  isExpandable?: boolean;
  children?: NavItem[];
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

const VISIBLE_WORKSPACE_COUNT = 5;

const navigationItems: NavItem[] = [
  { id: "overview", label: "PROJECT HUB", isExpandable: false },
  {
    id: "priority-goals",
    label: "Priority Goals",
    icon: Target,
    isExpandable: true,
    children: [
      { id: "goal-1", label: "GOAL #1" },
      { id: "goal-2", label: "GOAL #2" },
      { id: "goal-3", label: "GOAL #3" },
    ],
  },
];

export function ProjectsSidebar() {
  const { sidebarOpen, toggleSidebar, activePage, setActivePage } = useProjectsContext();
  const { activeUser } = useUser();
  const pinnedProjects = getUserData(PINNED_PROJECTS, activeUser?.slug);
  const workspaces = getUserData(WORKSPACES, activeUser?.slug);

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    overview: false,
    "priority-goals": true,
    "pinned-projects": true,
    workspaces: true,
  });
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(false);

  // Derive activeItem from activePage so card clicks sync the sidebar
  const activeItem = activePage === "hub"
    ? "overview"
    : activePage.startsWith("workspace-")
      ? activePage.replace("workspace-", "")
      : activePage.startsWith("project-")
        ? activePage.replace("project-", "")
        : activePage;

  const setActiveItem = (id: string) => {
    if (id === "overview") {
      setActivePage("hub");
    } else if (id === "goal-1" || id === "goal-2" || id === "goal-3") {
      setActivePage(id);
    } else if (pinnedProjects.some((p) => p.id === id)) {
      setActivePage(`project-${id}`);
    } else if (workspaces.some((ws) => ws.id === id)) {
      setActivePage(`workspace-${id}`);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const visibleWorkspaces = showAllWorkspaces
    ? workspaces
    : workspaces.slice(0, VISIBLE_WORKSPACE_COUNT);
  const hasMore = workspaces.length > VISIBLE_WORKSPACE_COUNT;

  return (
    <aside
      className={cn(
        "border-r border-[#E6E5E3] bg-[#F4F1F1]",
        "transition-all duration-300 shrink-0",
        "flex flex-col",
        sidebarOpen ? "w-[210px] px-2 pt-2 pb-6" : "w-[68px] p-4"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center",
          sidebarOpen ? "justify-between px-1.5 py-1.5" : "justify-center py-1.5"
        )}
      >
        {sidebarOpen && (
          <div className="flex items-center gap-1.5">
            <Cube className="size-4 text-[#1E1E1E]" weight="regular" />
            <span className="text-[12px] font-normal text-[#1E1E1E]">
              PROJECTS + TASKS
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center size-9 rounded-lg hover:bg-white/70 transition-all duration-200 active:scale-95"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <CaretDoubleLeft
            className={cn("transition-transform duration-300", sidebarOpen ? "size-[14px]" : "size-[18px]")}
            weight="bold"
            style={{
              transform: sidebarOpen ? "rotate(0deg)" : "rotate(180deg)",
            }}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto pt-4">
        <div className="flex flex-col gap-0.5">
          {/* Static nav sections (Project Hub, Priority Goals, Pinned Projects) */}
          {navigationItems.map((item) => (
            <div key={item.id}>
              {(!sidebarOpen && !item.isExpandable) ? null : (
              <button
                onClick={() => {
                  if (item.isExpandable) {
                    toggleSection(item.id);
                  } else {
                    setActiveItem(item.id);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-2 h-9 px-1.5 rounded-lg transition-all duration-200",
                  "text-sm leading-5 text-[#1E1E1E]",
                  item.isExpandable ? "font-medium" : "font-normal",
                  activeItem === item.id && "bg-white shadow-sm",
                  activeItem !== item.id && "hover:bg-white/70 hover:shadow-sm",
                  !sidebarOpen && "justify-center"
                )}
              >
                {item.icon && sidebarOpen && (
                  <item.icon size={16} className="flex-shrink-0 text-[#1E1E1E]" />
                )}
                {!item.isExpandable && !item.icon && sidebarOpen && (
                  <House size={16} className="flex-shrink-0 text-[#1E1E1E]" />
                )}
                {sidebarOpen && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {item.isExpandable && sidebarOpen && (
                  <CaretDown
                    size={12}
                    weight="bold"
                    className={cn(
                      "flex-shrink-0 transition-transform text-[#949494]",
                      expandedSections[item.id] && "rotate-180"
                    )}
                  />
                )}
              </button>
              )}

              {item.isExpandable &&
                expandedSections[item.id] &&
                sidebarOpen &&
                item.children && (
                  <div className="flex flex-col">
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => setActiveItem(child.id)}
                        className={cn(
                          "w-full flex items-center h-7 rounded-lg py-0.5 transition-all duration-200 active:scale-95",
                          activeItem === child.id && "bg-white shadow-sm",
                          activeItem !== child.id && "hover:bg-white/70"
                        )}
                      >
                        <div className="flex h-7 flex-1 items-center gap-1.5 min-w-0" style={{ paddingLeft: "34px", paddingRight: "8px" }}>
                          {child.icon && (
                            <child.icon size={12} className="flex-shrink-0 text-[#5F5E5B]" />
                          )}
                          <span
                            className={cn(
                              "flex-1 truncate text-left text-xs font-normal leading-4 text-[#5F5E5B]",
                              child.id === "see-all" && "text-[#949494]"
                            )}
                          >
                            {child.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
            </div>
          ))}

          {/* Pinned Projects section — dynamic from mock data */}
          {sidebarOpen && (
            <div>
              <button
                onClick={() => toggleSection("pinned-projects")}
                className={cn(
                  "w-full flex items-center gap-2 h-9 px-1.5 rounded-lg transition-all duration-200",
                  "text-sm font-medium leading-5 text-[#1E1E1E]",
                  "hover:bg-white/70 hover:shadow-sm"
                )}
              >
                <PushPin size={16} className="flex-shrink-0 text-[#1E1E1E]" />
                <span className="flex-1 text-left truncate">Pinned Projects</span>
                <CaretDown
                  size={12}
                  weight="bold"
                  className={cn(
                    "flex-shrink-0 transition-transform text-[#949494]",
                    expandedSections["pinned-projects"] && "rotate-180"
                  )}
                />
              </button>

              {expandedSections["pinned-projects"] && (
                <div className="flex flex-col">
                  {pinnedProjects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => setActiveItem(proj.id)}
                      className={cn(
                        "w-full flex items-center h-7 rounded-lg py-0.5 transition-all duration-200 active:scale-95",
                        activeItem === proj.id && "bg-white shadow-sm",
                        activeItem !== proj.id && "hover:bg-white/70"
                      )}
                    >
                      <div className="flex h-7 flex-1 items-center gap-1.5 min-w-0" style={{ paddingLeft: "34px", paddingRight: "8px" }}>
                        <span className="flex-1 truncate text-left text-xs font-normal leading-4 text-[#5F5E5B]">
                          {proj.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Workspaces section — dynamic from mock data */}
          {sidebarOpen && (
            <div>
              <button
                onClick={() => toggleSection("workspaces")}
                className={cn(
                  "w-full flex items-center gap-2 h-9 px-1.5 rounded-lg transition-all duration-200",
                  "text-sm font-medium leading-5 text-[#1E1E1E]",
                  "hover:bg-white/70 hover:shadow-sm"
                )}
              >
                <Cube size={16} className="flex-shrink-0 text-[#1E1E1E]" />
                <span className="flex-1 text-left truncate">Workspaces</span>
                <CaretDown
                  size={12}
                  weight="bold"
                  className={cn(
                    "flex-shrink-0 transition-transform text-[#949494]",
                    expandedSections["workspaces"] && "rotate-180"
                  )}
                />
              </button>

              {expandedSections["workspaces"] && (
                <div className="flex flex-col">
                  {visibleWorkspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => setActiveItem(ws.id)}
                      className={cn(
                        "w-full flex items-center h-7 rounded-lg py-0.5 transition-all duration-200 active:scale-95",
                        activeItem === ws.id && "bg-white shadow-sm",
                        activeItem !== ws.id && "hover:bg-white/70"
                      )}
                    >
                      <div className="flex h-7 flex-1 items-center gap-1.5 min-w-0" style={{ paddingLeft: "34px", paddingRight: "8px" }}>
                        <WorkspaceIcon icon={ws.icon} size={12} className="flex-shrink-0 text-[#5F5E5B]" />
                        <span className="flex-1 truncate text-left text-xs font-normal leading-4 text-[#5F5E5B]">
                          {ws.name}
                        </span>
                      </div>
                    </button>
                  ))}
                  {hasMore && (
                    <button
                      onClick={() => setShowAllWorkspaces(!showAllWorkspaces)}
                      className="w-full flex items-center h-7 rounded-lg py-0.5 transition-all duration-200 active:scale-95 hover:bg-white/70"
                    >
                      <div className="flex h-7 flex-1 items-center gap-1.5 min-w-0" style={{ paddingLeft: "34px", paddingRight: "8px" }}>
                        <span className="flex-1 truncate text-left text-xs font-normal leading-4 text-[#949494]">
                          {showAllWorkspaces ? "Show less" : "See all"}
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
