"use client";

import { useSessions } from "@/contexts/SessionContext";
import { useChat } from "@/contexts/ChatContext";

export function ChatSubHeader() {
  const { activeSessionId, sessions, clearActiveSession } = useSessions();
  const { resetChat } = useChat();

  const activeSession = activeSessionId
    ? sessions.find((s) => s.id === activeSessionId)
    : null;

  const handleNewChat = () => {
    clearActiveSession();
    resetChat(true);
  };

  if (!activeSession) {
    // Stale selection (session deleted/missing) — offer recovery
    if (activeSessionId) {
      return (
        <div className="flex h-[44px] items-center justify-between bg-[#F4F1F1] px-[24px] py-[8px]">
          <button
            type="button"
            onClick={handleNewChat}
            className="text-xs text-[#949494] hover:text-[#1E1E1E] transition-colors"
          >
            New chat
          </button>
        </div>
      );
    }
    return <div className="flex h-[44px] items-center bg-[#F4F1F1] px-[24px] py-[8px]" />;
  }

  return (
    <div className="flex h-[44px] items-center justify-between bg-[#F4F1F1] px-[24px] py-[8px] min-w-0">
      <span className="text-sm font-medium text-[#1E1E1E] truncate min-w-0">
        {activeSession.title}
      </span>
      <button
        type="button"
        onClick={handleNewChat}
        className="text-xs text-[#949494] hover:text-[#1E1E1E] transition-colors flex-shrink-0 ml-4"
      >
        New chat
      </button>
    </div>
  );
}
