"use client";

import { useState, useEffect, useCallback } from "react";
import { MainNavSidebar, type View } from "./MainNavSidebar";
import { GlobalHeader } from "./GlobalHeader";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { DayMapLayout } from "@/components/day-map/DayMapLayout";
import { NotesLayout } from "@/components/notes/NotesLayout";
import { SettingsView } from "@/components/settings/SettingsView";
import { GraphView } from "@/components/graph/GraphView";
import { checkClaudeInstalled } from "@/lib/electron";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AssistantButton } from "./AssistantButton";

const headerTitles: Record<View, string> = {
  home: "NEUROW CENTER",
  daymap: "DAY MAP",
  chat: "NEUROW CHAT",
  projects: "PROJECTS",
  notes: "NOTES",
  "brain-cloud": "BRAIN CLOUD",
  settings: "SETTINGS",
};

export function AppShell() {
  const [activeView, setActiveView] = useState<View>("daymap");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [claudeInstalled, setClaudeInstalled] = useState<boolean | null>(null);

  const sidebarWidth = sidebarOpen ? 210 : 68;
  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);

  useEffect(() => {
    checkClaudeInstalled()
      .then(setClaudeInstalled)
      .catch(() => setClaudeInstalled(false));
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="relative flex h-screen w-screen overflow-hidden bg-background">
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

        {/* Sidebar right border (from curve bottom to page bottom) */}
        <div
          className="absolute top-[72px] bottom-0 w-px bg-[#E6E5E3] z-10 pointer-events-none transition-all duration-300 ease-in-out"
          style={{ left: `${sidebarWidth}px` }}
        />

        {/* Header bottom border (from curve right edge to page right edge) */}
        <div
          className="absolute top-[60px] right-0 h-px bg-[#E6E5E3] z-10 pointer-events-none transition-all duration-300 ease-in-out"
          style={{ left: `${sidebarWidth + 12}px` }}
        />

        <MainNavSidebar
          activeView={activeView}
          onViewChange={setActiveView}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <GlobalHeader title={headerTitles[activeView]} onViewChange={setActiveView} />

          {/* Claude not installed warning */}
          {claudeInstalled === false && (
            <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-sm text-destructive">
              Claude Code is not installed. Install it from{" "}
              <span className="font-mono">
                npm install -g @anthropic-ai/claude-code
              </span>{" "}
              and ensure you&apos;re authenticated.
            </div>
          )}

          {/* Views — use CSS visibility to keep components mounted */}
          <div
            className={
              activeView === "chat"
                ? "flex-1 flex flex-col overflow-hidden"
                : "hidden"
            }
          >
            <ChatLayout />
          </div>

          <div
            className={
              activeView === "daymap"
                ? "flex-1 flex flex-col overflow-hidden"
                : "hidden"
            }
          >
            <DayMapLayout />
          </div>

          <div
            className={
              activeView === "home"
                ? "flex-1 flex items-center justify-center"
                : "hidden"
            }
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">Neurow Center</h2>
              <p className="text-muted-foreground">Dashboard view</p>
            </div>
          </div>

          <div
            className={
              activeView === "projects"
                ? "flex-1 flex items-center justify-center"
                : "hidden"
            }
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">Projects</h2>
              <p className="text-muted-foreground">Coming soon</p>
            </div>
          </div>

          <div
            className={
              activeView === "notes"
                ? "flex-1 flex flex-col overflow-hidden"
                : "hidden"
            }
          >
            <NotesLayout />
          </div>

          <div
            className={
              activeView === "brain-cloud"
                ? "flex-1 flex flex-col overflow-hidden"
                : "hidden"
            }
          >
            <GraphView isActive={activeView === "brain-cloud"} />
          </div>

          <div
            className={
              activeView === "settings"
                ? "flex-1 flex flex-col overflow-hidden"
                : "hidden"
            }
          >
            <SettingsView />
          </div>
        </main>

        {/* Global Floating Assistant Button */}
        <AssistantButton />
      </div>
    </TooltipProvider>
  );
}
