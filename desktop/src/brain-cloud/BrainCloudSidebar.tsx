"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  House,
  Graph,
  DownloadSimple,
  GearSix,
  Plugs,
  CaretDoubleLeft,
  type IconProps,
} from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BCView =
  | "dashboard"
  | "graph"
  | "import"
  | "settings"
  | "connected-apps";

interface BCNavItem {
  icon: React.ComponentType<IconProps>;
  label: string;
  viewId: BCView;
}

const navItems: BCNavItem[] = [
  { icon: House, label: "Dashboard", viewId: "dashboard" },
  { icon: Graph, label: "Knowledge Graph", viewId: "graph" },
  { icon: DownloadSimple, label: "Import", viewId: "import" },
  { icon: GearSix, label: "Settings", viewId: "settings" },
  { icon: Plugs, label: "Connected Apps", viewId: "connected-apps" },
];

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

interface BrainCloudSidebarProps {
  activeView: BCView;
  onViewChange: (view: BCView) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function BrainCloudSidebar({
  activeView,
  onViewChange,
  sidebarOpen,
  onToggleSidebar,
}: BrainCloudSidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full flex-col gap-6 bg-white transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-[210px] px-4 pt-4 pb-6" : "w-[68px] px-4 pt-2 pb-4",
      )}
    >
      {/* Logo / Header */}
      <div
        className={cn(
          "flex items-center gap-2.5 transition-all duration-300",
          sidebarOpen ? "justify-between pl-[9px]" : "justify-center",
        )}
      >
        {sidebarOpen && (
          <button
            className="flex flex-1 items-center gap-2.5 cursor-pointer ml-1"
            onClick={onToggleSidebar}
          >
            <Image
              src="/brain-cloud-mark.svg"
              alt="Brain Cloud"
              width={28}
              height={20}
              className="h-5 w-auto flex-shrink-0"
            />
            <span className="font-albra text-lg font-medium text-[#1E1E1E]">
              Brain Cloud
            </span>
          </button>
        )}

        {!sidebarOpen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleSidebar}
                className="flex size-9 items-center justify-center rounded-lg transition-all duration-200 hover:bg-white/70 active:scale-95 mt-[8px]"
                aria-label="Expand sidebar"
              >
                <Image
                  src="/brain-cloud-mark.svg"
                  alt="Brain Cloud"
                  width={24}
                  height={17}
                  className="h-4 w-auto"
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Expand sidebar</p>
            </TooltipContent>
          </Tooltip>
        )}

        {sidebarOpen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleSidebar}
                className="flex size-9 items-center justify-center rounded-lg transition-all duration-200 hover:bg-white active:scale-95"
                aria-label="Collapse sidebar"
              >
                <CaretDoubleLeft className="size-[14px]" weight="bold" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Collapse sidebar</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0">
        {navItems.map((item) => (
          <NavItemButton
            key={item.label}
            icon={item.icon}
            label={item.label}
            viewId={item.viewId}
            active={activeView === item.viewId}
            expanded={sidebarOpen}
            onViewChange={onViewChange}
          />
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />
    </aside>
  );
}

// ---------------------------------------------------------------------------
// NavItemButton — replicates exact active-state CSS from MainNavSidebar
// ---------------------------------------------------------------------------

interface NavItemButtonProps {
  icon: React.ComponentType<IconProps>;
  label: string;
  viewId: BCView;
  active: boolean;
  expanded: boolean;
  onViewChange: (view: BCView) => void;
}

function NavItemButton({
  icon: Icon,
  label,
  viewId,
  active,
  expanded,
  onViewChange,
}: NavItemButtonProps) {
  const buttonContent = (
    <button
      onClick={() => onViewChange(viewId)}
      className={cn(
        "flex h-[44px] items-center gap-2 relative",
        expanded
          ? "px-1.5 text-sm font-medium leading-5"
          : "justify-center rounded-lg",
        active && expanded
          ? "bg-[#F4F1F1] text-[#1E1E1E] rounded-l-lg -mr-4 pr-[calc(1.5rem+16px)] shadow-md after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[2px] after:bg-[#F4F1F1]"
          : active && !expanded
            ? "bg-[#F4F1F1] text-[#1E1E1E] -ml-2 pl-2 pr-4 -mr-4 rounded-l-lg rounded-r-none shadow-md after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[16px] after:bg-[#F4F1F1]"
            : expanded
              ? "text-[#1E1E1E] hover:bg-[#EBE7E7] hover:rounded-l-lg hover:-mr-4 hover:pr-[calc(1.5rem+16px)] hover:shadow-md active:scale-95"
              : "text-[#1E1E1E] hover:bg-[#EBE7E7] hover:shadow-md active:scale-95 rounded-lg",
      )}
    >
      <div className="flex size-7 items-center justify-center rounded-lg p-1 transition-transform duration-200">
        <Icon className="size-7" weight="fill" />
      </div>
      {expanded && (
        <span className="flex-1 truncate text-left transition-opacity duration-150 delay-150 opacity-100">
          {label}
        </span>
      )}
    </button>
  );

  if (expanded) {
    return buttonContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
      <TooltipContent side="right">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
