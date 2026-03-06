"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { ChatInput } from "./ChatInput";
import { ChatMessage, type Message } from "./ChatMessage";
import { NeurowLogo } from "@/components/icons/NeurowLogo";
import {
  Sun,
  ChartLineUp,
  PencilSimple,
  BookOpen,
  Brain,
} from "@phosphor-icons/react";
import { useUser } from "@/contexts/UserContext";
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
import { ActivityIndicator, type ActivityItem } from "./ActivityIndicator";

// ---------------------------------------------------------------------------
// ChatView
// ---------------------------------------------------------------------------

export function ChatView() {
  const { activeUser, appPhase } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Refs for event listener callbacks (prevents stale closures — BUG-000b)
  const sessionIdRef = useRef<string | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Ref for handleSend — allows import processing useEffect to call it
  // without adding handleSend to its dependency array (same pattern as
  // sessionIdRef/messagesRef above — prevents stale closures).
  const handleSendRef = useRef<((text: string, modeOverride?: string) => Promise<void>) | null>(null);

  // Ref for import processing timer — persists across processImports calls
  // and ensures cleanup always clears the correct timer.
  const importTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Reset chat state when user or mode changes
  useEffect(() => {
    setMessages([]);
    setSessionId(null);
    sessionIdRef.current = null;
    setActivities([]);
    setIsLoading(false);
  }, [activeUser?.slug, appPhase]);

  // Auto-scroll to bottom when messages or activities change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activities]);

  // Set up event listeners — synchronous registration for correct
  // React Strict Mode cleanup (no .then() race with double-mount)
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

      // Mode derivation: modeOverride (from quick-action buttons) takes priority.
      // Then: clarity_session from appPhase, otherwise ongoing.
      const mode = modeOverride || (appPhase === "clarity_session" ? "clarity_session" : "ongoing");

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
            content: `Error: ${err}`,
            timestamp: new Date().toISOString(),
            isStreaming: false,
          },
        ]);
      }
    },
    [activeUser, appPhase],
  );

  // Keep handleSend ref in sync (for import processing useEffect)
  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  // ---------------------------------------------------------------------------
  // Pending import processing — detects localStorage items from import modals
  // and auto-sends them to Claude for brain_remember ingestion.
  //
  // Two activation paths:
  //   1. Mount check — fires when ChatView first renders (after Clarity Session)
  //   2. Event listener — fires when import modals dispatch 'neurow-import-ready'
  //      (covers Settings path where ChatView is already mounted but CSS-hidden)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const processImports = () => {
      if (!activeUser?.slug) return;

      // Clear any pending timer to prevent stale callbacks from earlier calls
      if (importTimerRef.current) {
        clearTimeout(importTimerRef.current);
        importTimerRef.current = null;
      }

      const aiKey = `neurow_pending_import_${activeUser.slug}`;
      const fileKey = `neurow_pending_file_import_${activeUser.slug}`;

      // Atomic claim: read + clear to prevent double-fire (Strict Mode, races).
      // Trade-off: if component unmounts within the 200ms send delay, claimed
      // data is lost. This window is acceptably small — the alternative
      // (deferred removal) risks double-processing which is worse.
      const aiRaw = localStorage.getItem(aiKey);
      const fileRaw = localStorage.getItem(fileKey);
      if (aiRaw) localStorage.removeItem(aiKey);
      if (fileRaw) localStorage.removeItem(fileKey);

      if (!aiRaw && !fileRaw) return;

      // Build import message
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

      // Short delay ensures event listeners are registered and state is settled
      importTimerRef.current = setTimeout(() => {
        importTimerRef.current = null;
        handleSendRef.current?.(importMessage);
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

  // Personalized greeting for welcome screen
  const firstName = activeUser?.display_name?.trim().split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Welcome state — centered logo, gradient heading, input
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="w-full max-w-[767px] flex flex-col items-center gap-8 -translate-y-1/4">
            <NeurowLogo className="h-[69px] w-[49px]" />
            <h1 className="w-full text-center text-2xl font-normal leading-8 animate-gradient">
              {greeting}, {firstName}.
            </h1>
            <div className="w-full">
              <ChatInput onSend={handleSend} disabled={isLoading} />
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center -mt-4">
              {[
                { icon: Sun, label: "Morning brief", prompt: "Give me my morning brief", mode: "morning_brief" as string | undefined },
                { icon: ChartLineUp, label: "Strategize", prompt: "Let's strategize", mode: undefined as string | undefined },
                { icon: PencilSimple, label: "Write", prompt: "Help me write", mode: undefined as string | undefined },
                { icon: BookOpen, label: "Learn", prompt: "Help me learn something new", mode: undefined as string | undefined },
                { icon: Brain, label: "Brainstorm", prompt: "Let's brainstorm", mode: undefined as string | undefined },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleSend(item.prompt, item.mode)}
                  className="flex items-center gap-1.5 rounded-lg border border-[#E6E5E3] bg-white px-3 py-1.5 text-sm text-[#1E1E1E] hover:bg-[#FAF8F8] transition-colors"
                >
                  <item.icon className="size-4" weight="regular" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active chat state — messages scrolling, input fixed at bottom
  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="w-full max-w-[767px] mx-auto flex flex-col gap-4 pt-6 pb-6 px-4">
          {messages.map((msg) => (
            <Fragment key={msg.id}>
              <ChatMessage message={msg} />
            </Fragment>
          ))}
          {activities.length > 0 && (
            <ActivityIndicator activities={activities} />
          )}
          {isLoading && activities.length === 0 && messages[messages.length - 1]?.role === "user" && (
            <ThinkingIndicator />
          )}
        </div>
      </div>
      <div className="flex-shrink-0 w-full flex justify-center px-4 pb-4">
        <div className="w-full max-w-[767px]">
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1.5 px-4 py-3 text-muted-foreground">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
        </div>
        <span className="text-sm ml-2">Thinking...</span>
      </div>
    </div>
  );
}
