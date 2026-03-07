"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { useUser } from "@/contexts/UserContext";
import { type Message } from "@/components/chat/ChatMessage";
import { type ActivityItem } from "@/components/chat/ActivityIndicator";
import {
  sendMessage,
  onChatStream,
  onChatComplete,
  onChatError,
  onToolActivity,
  type ChatStreamEvent,
  type ChatCompleteEvent,
  type ChatErrorEvent,
  type ToolActivityEvent,
} from "@/lib/electron";

// ---------------------------------------------------------------------------
// ChatContext — single source of truth for chat state + IPC listeners.
//
// Extracted from ChatView to prevent duplicate IPC listener registration
// when both ChatView (full page) and ChatPanel (side drawer) are mounted.
// Both consume this context. One set of listeners. Conversation continuity.
// ---------------------------------------------------------------------------

interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  sessionId: string | null;
  activities: ActivityItem[];
  handleSend: (text: string, modeOverride?: string) => Promise<void>;
  resetChat: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { activeUser, appPhase } = useUser();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Refs for event listener callbacks (prevents stale closures — BUG-000b)
  const sessionIdRef = useRef<string | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const handleSendRef = useRef<((text: string, modeOverride?: string) => Promise<void>) | null>(null);
  const importTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Reset chat state when user or mode changes
  const resetChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    sessionIdRef.current = null;
    setActivities([]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    resetChat();
  }, [activeUser?.slug, appPhase, resetChat]);

  // --- IPC listeners (single registration, shared across all consumers) ---

  useEffect(() => {
    const unlisteners: Array<() => void> = [];

    unlisteners.push(onToolActivity((payload: ToolActivityEvent) => {
      setActivities((prev) => {
        if (prev.some((a) => a.summary === payload.summary)) return prev;
        return [
          ...prev,
          { tool_name: payload.tool_name, summary: payload.summary },
        ];
      });
    }));

    unlisteners.push(onChatStream((payload: ChatStreamEvent) => {
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1
              ? { ...m, content: payload.content, isStreaming: payload.is_partial }
              : m
          );
        } else {
          return [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: payload.content,
              timestamp: new Date().toISOString(),
              isStreaming: payload.is_partial,
            },
          ];
        }
      });
    }));

    unlisteners.push(onChatComplete((payload: ChatCompleteEvent) => {
      setIsLoading(false);
      setActivities([]);
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1 && m.isStreaming
            ? { ...m, isStreaming: false }
            : m
        )
      );
      if (payload.session_id) {
        setSessionId(payload.session_id);
      }
    }));

    unlisteners.push(onChatError((payload: ChatErrorEvent) => {
      setIsLoading(false);
      setActivities([]);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Error: ${payload.error}`,
          timestamp: new Date().toISOString(),
          isStreaming: false,
        },
      ]);
    }));

    return () => {
      unlisteners.forEach((u) => u());
    };
  }, []);

  // --- handleSend ---

  const handleSend = useCallback(
    async (text: string, modeOverride?: string) => {
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setActivities([]);

      // Mode: modeOverride takes priority, otherwise "ongoing".
      // (appPhase is always "main" when AppShell/ChatProvider is mounted —
      // ClaritySessionFlow has its own independent streaming.)
      const mode = modeOverride || "ongoing";

      try {
        const newSessionId = await sendMessage(
          text,
          sessionIdRef.current || undefined,
          activeUser
            ? {
                slug: activeUser.slug,
                display_name: activeUser.display_name,
                mode,
                coaching_style: activeUser.coaching_style,
                roles: activeUser.roles,
                goal_cascade: activeUser.goal_cascade,
                focus_area: activeUser.focus_area,
                declared_challenges: activeUser.declared_challenges,
                is_business_owner: activeUser.is_business_owner,
                business_description: activeUser.business_description,
                business_stage: activeUser.business_stage,
                current_business_focus: activeUser.current_business_focus,
                business_challenges: activeUser.business_challenges,
                career_situation: activeUser.career_situation,
                career_stage: activeUser.career_stage,
                career_focus: activeUser.career_focus,
                career_challenges: activeUser.career_challenges,
              }
            : undefined,
        );
        if (newSessionId) {
          setSessionId(newSessionId);
        }
      } catch (err) {
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: `Error: ${err instanceof Error ? err.message : String(err)}`,
            timestamp: new Date().toISOString(),
            isStreaming: false,
          },
        ]);
      }
    },
    [activeUser],
  );

  // Keep handleSend ref in sync (for import processing)
  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  // --- Import processing (detects localStorage items from import modals) ---

  useEffect(() => {
    const processImports = () => {
      if (!activeUser?.slug) return;

      if (importTimerRef.current) {
        clearTimeout(importTimerRef.current);
        importTimerRef.current = null;
      }

      const aiKey = `neurow_pending_import_${activeUser.slug}`;
      const fileKey = `neurow_pending_file_import_${activeUser.slug}`;

      const aiRaw = localStorage.getItem(aiKey);
      const fileRaw = localStorage.getItem(fileKey);

      if (!aiRaw && !fileRaw) return;

      const parts: string[] = [];

      if (aiRaw) {
        try {
          const pending = JSON.parse(aiRaw);
          if (pending.text?.trim()) {
            parts.push(
              `I want to import memories from my other AI into Brain Cloud. Here is the export from my other AI:\n\n${pending.text}`,
            );
          }
        } catch {
          /* ignore malformed */
        }
      }

      if (fileRaw) {
        try {
          const pending = JSON.parse(fileRaw);
          if (pending.content?.trim()) {
            parts.push(
              `I have a data file to import into Brain Cloud. File: ${pending.fileName} (${pending.recordCount} records):\n\n${pending.content}`,
            );
          }
        } catch {
          /* ignore malformed */
        }
      }

      if (parts.length === 0) return;

      const importMessage = parts.join("\n\n---\n\n");

      importTimerRef.current = setTimeout(() => {
        importTimerRef.current = null;
        if (handleSendRef.current) {
          handleSendRef.current(importMessage);
          if (aiRaw) localStorage.removeItem(aiKey);
          if (fileRaw) localStorage.removeItem(fileKey);
        } else {
          console.warn("ChatContext: import message dropped — handleSend not available");
        }
      }, 200);
    };

    // Path 1: mount check (onboarding → main app transition)
    processImports();

    // Path 2: event listener (Settings import while ChatView is already mounted)
    window.addEventListener("neurow-import-ready", processImports);

    return () => {
      window.removeEventListener("neurow-import-ready", processImports);
      if (importTimerRef.current) {
        clearTimeout(importTimerRef.current);
        importTimerRef.current = null;
      }
    };
  }, [activeUser?.slug]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        sessionId,
        activities,
        handleSend,
        resetChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
