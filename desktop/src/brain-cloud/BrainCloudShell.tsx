"use client";

import { useState, useCallback } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrainCloudSidebar, type BCView } from "./BrainCloudSidebar";
import { DashboardView } from "./DashboardView";
import { ConnectedAppsView } from "./ConnectedAppsView";
import { BCSettingsView } from "./BCSettingsView";
import { BCImportView } from "./BCImportView";
import { BCExportView } from "./BCExportView";
import { BCGraphView } from "./BCGraphView";

const headerTitles: Record<BCView, string> = {
  dashboard: "DASHBOARD",
  graph: "KNOWLEDGE GRAPH",
  import: "IMPORT",
  export: "EXPORT",
  settings: "SETTINGS",
  "connected-apps": "CONNECTED APPS",
};

export function BrainCloudShell() {
  const [activeView, setActiveView] = useState<BCView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = sidebarOpen ? 210 : 68;
  const toggleSidebar = useCallback(
    () => setSidebarOpen((prev) => !prev),
    [],
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div className="relative flex h-screen w-screen overflow-hidden bg-[#faf8f8]">
        {/* Curved corner at sidebar/header junction */}
        <div
          className="absolute top-[60px] z-10 h-[12px] w-[12px] pointer-events-none transition-all duration-300 ease-in-out"
          style={{ left: `${sidebarWidth}px` }}
        >
          <div
            className="absolute top-0 left-0 w-[12px] h-[12px]"
            style={{
              background:
                "radial-gradient(circle 12px at 100% 100%, transparent 12px, white 12px)",
            }}
          />
          <div className="absolute inset-0 rounded-tl-[12px] border-t border-l border-[#E6E5E3]" />
        </div>

        {/* Sidebar right border */}
        <div
          className="absolute top-[72px] bottom-0 w-px bg-[#E6E5E3] z-10 pointer-events-none transition-all duration-300 ease-in-out"
          style={{ left: `${sidebarWidth}px` }}
        />

        {/* Header bottom border */}
        <div
          className="absolute top-[60px] right-0 h-px bg-[#E6E5E3] z-10 pointer-events-none transition-all duration-300 ease-in-out"
          style={{ left: `${sidebarWidth + 12}px` }}
        />

        <BrainCloudSidebar
          activeView={activeView}
          onViewChange={setActiveView}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex h-[60px] items-center justify-between gap-2.5 bg-white px-6">
            <div className="flex-1" />
            <h1 className="font-albra-sans text-center text-2xl font-medium uppercase leading-[100%] tracking-normal text-[#1E1E1E]">
              {headerTitles[activeView]}
            </h1>
            <div className="flex-1" />
          </div>

          {/* Views — CSS hide/show, never unmount */}
          <div
            className={
              activeView === "dashboard"
                ? "flex-1 flex flex-col overflow-hidden"
                : "hidden"
            }
          >
            <DashboardView onNavigate={setActiveView} />
          </div>
          <div
            className={
              activeView === "graph"
                ? "flex-1 flex flex-col overflow-hidden"
                : "hidden"
            }
          >
            <BCGraphView isActive={activeView === "graph"} />
          </div>
          <div
            className={
              activeView === "import"
                ? "flex-1 flex flex-col overflow-hidden"
                : "hidden"
            }
          >
            <BCImportView />
          </div>
          <div
            className={
              activeView === "export"
                ? "flex-1 flex flex-col overflow-hidden"
                : "hidden"
            }
          >
            <BCExportView />
          </div>
          <div
            className={
              activeView === "settings"
                ? "flex-1 flex flex-col overflow-hidden"
                : "hidden"
            }
          >
            <BCSettingsView />
          </div>
          <div
            className={
              activeView === "connected-apps"
                ? "flex-1 flex flex-col overflow-hidden"
                : "hidden"
            }
          >
            <ConnectedAppsView />
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
