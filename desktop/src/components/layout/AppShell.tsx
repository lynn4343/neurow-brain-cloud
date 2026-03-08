"use client";

import { useState, useEffect, useCallback } from "react";
import { MainNavSidebar, type View } from "./MainNavSidebar";
import { GlobalHeader } from "./GlobalHeader";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { DayMapLayout } from "@/components/day-map/DayMapLayout";
import { NotesLayout } from "@/components/notes/NotesLayout";
import { SettingsView } from "@/components/settings/SettingsView";
import { GraphView } from "@/components/graph/GraphView";
import { checkClaudeInstalled } from "@/lib/electron";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AssistantButton } from "./AssistantButton";
import { ChatProvider } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";

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
  const [chatPanelOpen, setChatPanelOpen] = useState(false);

  const sidebarWidth = sidebarOpen ? 210 : 68;
  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);

  useEffect(() => {
    checkClaudeInstalled()
      .then(setClaudeInstalled)
      .catch(() => setClaudeInstalled(false));
  }, []);

  // Open chat panel: collapse main nav + signal DayMap sidebar
  const openChatPanel = useCallback(() => {
    setChatPanelOpen(true);
    setSidebarOpen(false);
    window.dispatchEvent(new CustomEvent("neurow-chat-panel-open"));
  }, []);

  const closeChatPanel = useCallback(() => {
    setChatPanelOpen(false);
  }, []);

  // Listen for cross-context request to open chat panel (e.g. import processing)
  useEffect(() => {
    const handleOpenPanel = () => openChatPanel();
    window.addEventListener("neurow-open-chat-panel", handleOpenPanel);
    return () => window.removeEventListener("neurow-open-chat-panel", handleOpenPanel);
  }, [openChatPanel]);

  // View change: auto-close panel when switching to full chat view
  const handleViewChange = useCallback((view: View) => {
    setActiveView(view);
    if (view === "chat") {
      setChatPanelOpen(false);
    }
  }, []);

  // FAB visible when: not on chat view AND panel is closed
  const fabVisible = activeView !== "chat" && !chatPanelOpen;

  return (
    <TooltipProvider delayDuration={0}>
      <ChatProvider>
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
            onViewChange={handleViewChange}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={toggleSidebar}
          />

          <main className="flex-1 flex flex-col overflow-hidden">
            <GlobalHeader title={headerTitles[activeView]} onViewChange={handleViewChange} />

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

            {/* Content row: views + chat panel */}
            <div className="flex-1 flex overflow-hidden">
              {/* Views container */}
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
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
              </div>

              {/* Sliding Chat Panel — width transitions for smooth reflow */}
              <div
                className={cn(
                  "flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out",
                  chatPanelOpen ? "w-[380px] border-l border-[#E6E5E3]" : "w-0"
                )}
                style={{ boxShadow: chatPanelOpen ? "-4px 0 16px rgba(0,0,0,0.08)" : "none" }}
              >
                <div className="w-[380px] h-full">
                  <ChatPanel open={chatPanelOpen} onClose={closeChatPanel} />
                </div>
              </div>
            </div>
          </main>

          {/* Global Floating Assistant Button */}
          <AssistantButton onClick={openChatPanel} visible={fabVisible} />
        </div>
      </ChatProvider>
    </TooltipProvider>
  );
}
