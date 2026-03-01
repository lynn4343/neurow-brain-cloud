"use client";

import { useState, useCallback } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatSubHeader } from "./ChatSubHeader";
import { ChatView } from "./ChatView";

export function ChatLayout() {
  const [chatSidebarOpen, setChatSidebarOpen] = useState(true);
  const chatSidebarWidth = chatSidebarOpen ? 210 : 68;
  const toggleChatSidebar = useCallback(
    () => setChatSidebarOpen((prev) => !prev),
    []
  );

  return (
    <div className="relative flex flex-1 overflow-hidden">
      <ChatSidebar open={chatSidebarOpen} onToggle={toggleChatSidebar} />

      {/* Curved corner at sub-sidebar / sub-header junction */}
      <div
        className="absolute z-20 h-[12px] w-[12px] pointer-events-none transition-all duration-300 ease-in-out"
        style={{ left: `${chatSidebarWidth}px`, top: "44px" }}
      >
        <div
          className="absolute top-0 left-0 w-[12px] h-[12px]"
          style={{
            background:
              "radial-gradient(circle 12px at 100% 100%, transparent 12px, #F4F1F1 12px)",
          }}
        />
        <div className="absolute inset-0 rounded-tl-[12px] border-t border-l border-[#E6E5E3]" />
      </div>

      {/* Sub-sidebar right border (from curve bottom to page bottom) */}
      <div
        className="absolute z-20 w-px bg-[#E6E5E3] pointer-events-none transition-all duration-300 ease-in-out"
        style={{
          left: `${chatSidebarWidth}px`,
          top: "56px",
          bottom: 0,
        }}
      />

      {/* Sub-header bottom border (from curve right edge to page right edge) */}
      <div
        className="absolute z-20 h-px bg-[#E6E5E3] right-0 pointer-events-none transition-all duration-300 ease-in-out"
        style={{
          left: `${chatSidebarWidth + 12}px`,
          top: "44px",
        }}
      />

      {/* Content column: sub-header + chat */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ChatSubHeader />

        {/* ChatView uses h-full (not flex-1) on its root div.
            This flex-1 wrapper gives it the correct remaining height. */}
        <div className="flex-1 overflow-hidden">
          <ChatView />
        </div>
      </div>
    </div>
  );
}
