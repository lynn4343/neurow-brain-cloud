"use client";

import { useState, useEffect, useCallback } from "react";
import { MainNavSidebar, type View } from "./MainNavSidebar";
import { GlobalHeader } from "./GlobalHeader";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { DayMapLayout } from "@/components/day-map/DayMapLayout";
import { NotesLayout } from "@/components/notes/NotesLayout";
import { SettingsView } from "@/components/settings/SettingsView";
import { ProjectsLayout } from "@/components/projects/ProjectsLayout";
import { checkChatAvailable, setBYOKConfig, type ChatAvailableResult } from "@/lib/electron";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AssistantButton } from "./AssistantButton";
import { ChatProvider } from "@/contexts/ChatContext";
import { DemoDataProvider } from "@/contexts/DemoDataContext";
import { TaskEventModal } from "@/components/day-map/TaskEventModal";
import { cn } from "@/lib/utils";

const headerTitles: Record<View, string> = {
  home: "NEUROW CENTER",
  daymap: "DAY MAP",
  chat: "NEUROW CHAT",
  projects: "PROJECTS",
  notes: "NOTES",
  settings: "SETTINGS",
};

export function AppShell() {
  const [activeView, setActiveView] = useState<View>("daymap");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatMode, setChatMode] = useState<'api' | 'cli' | 'none' | null>(null);
  const [chatPanelOpen, setChatPanelOpen] = useState(false);

  const sidebarWidth = sidebarOpen ? 210 : 68;
  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);

  // Hydrate BYOK config from localStorage on startup, then check availability
  useEffect(() => {
    const hydrateBYOK = async () => {
      try {
        const raw = localStorage.getItem('neurow_byok');
        if (raw) {
          const config = JSON.parse(raw);
          if (config.apiKey && typeof window !== 'undefined' && window.neurow) {
            await setBYOKConfig({
              provider: config.provider,
              endpoint: config.endpoint,
              apiKey: config.apiKey,
              model: config.model,
            });
          }
        }
      } catch {
        // Invalid localStorage — ignore
      }

      // Now check availability (will see BYOK key if hydrated)
      checkChatAvailable()
        .then((result) => setChatMode(result.mode))
        .catch(() => setChatMode('none'));
    };

    hydrateBYOK();
  }, []);

  // Listen for BYOK config changes from Settings
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ChatAvailableResult;
      if (detail?.mode) {
        setChatMode(detail.mode);
      }
    };
    window.addEventListener('neurow-chat-mode-change', handler);
    return () => window.removeEventListener('neurow-chat-mode-change', handler);
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
        <DemoDataProvider>
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

            {/* BYOK banner disabled — key entry happens in onboarding flow before Clarity Session.
               Judges land on onboarding first, never see the main app without a key.
               Keeping code for post-hackathon (returning users who revoke key). */}
            {/* chatMode === 'none' && (
              <div
                className="border-b px-4 py-2.5 text-sm"
                style={{
                  backgroundColor: 'rgba(101, 121, 238, 0.08)',
                  borderColor: 'rgba(101, 121, 238, 0.15)',
                  color: '#4f5bb3',
                }}
              >
                Connect your AI to get started. Add your API key in{" "}
                <button
                  onClick={() => handleViewChange('settings')}
                  className="font-medium underline underline-offset-2 hover:opacity-80"
                  style={{ color: '#6579EE' }}
                >
                  Settings &gt; Model Configuration
                </button>
                .
              </div>
            ) */}

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
                      ? "flex-1 flex flex-col overflow-hidden"
                      : "hidden"
                  }
                >
                  <ProjectsLayout />
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

          {/* Global Task/Event Modal */}
          <TaskEventModal />
        </div>
        </DemoDataProvider>
      </ChatProvider>
    </TooltipProvider>
  );
}
