"use client";

import { useState } from "react";
import {
  CaretDoubleLeft,
  CaretDown,
  House,
  CurrencyDollar,
  Heart,
  Brain,
  Users,
  Cube,
} from "@phosphor-icons/react";
import { useProjectsContext } from "./ProjectsContext";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  isExpandable?: boolean;
  children?: NavItem[];
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

const navigationItems: NavItem[] = [
  { id: "overview", label: "Overview", isExpandable: false },
  {
    id: "priority-goals",
    label: "Priority Goals",
    isExpandable: true,
    children: [
      { id: "goal-1", label: "GOAL #1" },
      { id: "goal-2", label: "GOAL #2" },
      { id: "goal-3", label: "GOAL #3" },
    ],
  },
  {
    id: "pinned-projects",
    label: "Pinned Projects",
    isExpandable: true,
    children: [
      { id: "team-alignment", label: "Team Alignment" },
      { id: "work-life-balance", label: "Work-Life Balance" },
      { id: "dads-birthday", label: "Dad's birthday" },
      { id: "yearly-holiday", label: "Yearly holiday" },
    ],
  },
  {
    id: "workspaces",
    label: "Workspaces",
    isExpandable: true,
    children: [
      { id: "home", label: "Home", icon: House },
      { id: "personal-finance", label: "Personal Finance", icon: CurrencyDollar },
      { id: "health-wellness", label: "Health & Wellness", icon: Heart },
      { id: "mental-emotional", label: "Mental & Emotional", icon: Brain },
      { id: "family", label: "Family", icon: Users },
      { id: "see-all", label: "See all" },
    ],
  },
];

export function ProjectsSidebar() {
  const { sidebarOpen, toggleSidebar } = useProjectsContext();
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    overview: false,
    "priority-goals": true,
    "pinned-projects": true,
    workspaces: true,
  });
  const [activeItem, setActiveItem] = useState("overview");

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <aside
      className={cn(
        "border-r border-[#E6E5E3] bg-[#F4F1F1]",
        "transition-all duration-300",
        "flex flex-col",
        sidebarOpen ? "w-[237px]" : "w-[68px]"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center px-4 py-[10px]",
          sidebarOpen ? "justify-between" : "justify-center"
        )}
      >
        {sidebarOpen && (
          <div className="flex items-center gap-[4px]">
            <Cube className="size-[16px] text-[#1E1E1E]" />
            <span className="text-[12px] font-normal text-[#1E1E1E]">
              PROJECTS + TASKS
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center size-[28px] rounded-lg hover:bg-white/70 transition-all duration-200 active:scale-95"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <CaretDoubleLeft
            className="size-[18px] transition-transform duration-300"
            weight="bold"
            style={{
              transform: sidebarOpen ? "rotate(0deg)" : "rotate(180deg)",
            }}
          />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-1">
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
                  "w-full flex items-center gap-2 h-[36px] px-3 py-2 rounded-lg transition-colors",
                  "text-[14px] font-semibold text-[#1E1E1E]",
                  activeItem === item.id && "bg-white",
                  activeItem !== item.id && "hover:bg-white/50",
                  !sidebarOpen && "justify-center"
                )}
              >
                {sidebarOpen && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
                {item.isExpandable && sidebarOpen && (
                  <CaretDown
                    size={16}
                    className={cn(
                      "transition-transform text-[#5F5E5B]",
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
                  <div className="mt-1 space-y-1">
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => setActiveItem(child.id)}
                        className={cn(
                          "w-full flex items-center gap-2 h-[36px] px-0 py-[2px] rounded-lg transition-colors",
                          "text-[14px] font-normal text-[#1E1E1E]",
                          activeItem === child.id && "bg-white"
                        )}
                      >
                        <div className="relative shrink-0 size-[32px]">
                          <div className="absolute bg-[#E6E5E3] h-[36px] left-[calc(50%+3.5px)] top-1/2 -translate-x-1/2 -translate-y-1/2 w-px" />
                        </div>
                        {child.icon && (
                          <child.icon size={16} className="text-[#5F5E5B]" />
                        )}
                        <span
                          className={cn(
                            "flex-1 text-left",
                            child.id === "see-all" && "text-[#5F5E5B]"
                          )}
                        >
                          {child.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}
