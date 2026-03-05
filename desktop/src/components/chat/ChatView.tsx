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
  DownloadSimple,
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
// Export download utilities
// ---------------------------------------------------------------------------

function extractJsonFromCodeBlock(content: string): string | null {
  const match = content.match(/```json\s*\n([\s\S]*?)\n```/);
  return match ? match[1] : null;
}

function downloadJson(jsonData: string, filename: string) {
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function isExportMessage(content: string): boolean {
  return content.includes('"exported_at"') && content.includes('"episodic"');
}

// ---------------------------------------------------------------------------
// Export Download Button
// ---------------------------------------------------------------------------

function ExportDownloadButton({ content }: { content: string }) {
  const { activeUser } = useUser();

  function handleDownload() {
    const json = extractJsonFromCodeBlock(content);
    if (!json) {
      console.warn("[ExportDownloadButton] Failed to extract JSON from export message");
      return;
    }
    const slug = activeUser?.slug || "user";
    const date = new Date().toISOString().split("T")[0];
    downloadJson(json, `brain-cloud-export-${slug}-${date}.json`);
  }

  return (
    <div className="flex justify-start">
      <button
        onClick={handleDownload}
        type="button"
        className="flex items-center gap-1.5 rounded-lg border border-[#E6E5E3] bg-white px-3 py-1.5 text-sm text-[#1E1E1E] hover:bg-[#FAF8F8] transition-colors"
      >
        <DownloadSimple className="size-4" weight="bold" />
        <span>Download Export</span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatView
// ---------------------------------------------------------------------------

export function ChatView() {
  const { activeUser, appPhase, pendingChatAction, setPendingChatAction } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Refs for event listener callbacks (prevents stale closures — BUG-000b)
  const sessionIdRef = useRef<string | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Set up event listeners
  useEffect(() => {
    const unlisteners: Array<() => void> = [];

    onToolActivity((payload: ToolActivityEvent) => {
      setActivities((prev) => {
        // Dedup: React strict mode double-mounts listeners in dev
        if (prev.some((a) => a.summary === payload.summary)) return prev;
        return [
          ...prev,
          { tool_name: payload.tool_name, summary: payload.summary },
        ];
      });
    }).then((u) => unlisteners.push(u));

    onChatStream((payload: ChatStreamEvent) => {
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === "assistant" && lastMsg.isStreaming) {
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
    }).then((u) => unlisteners.push(u));

    onChatComplete((payload: ChatCompleteEvent) => {
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
    }).then((u) => unlisteners.push(u));

    onChatError((payload: ChatErrorEvent) => {
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
    }).then((u) => unlisteners.push(u));

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

  // Pick up pending chat actions from other views (e.g. Settings → Export)
  useEffect(() => {
    if (pendingChatAction && !isLoading) {
      handleSend(pendingChatAction);
      setPendingChatAction(null);
    }
  }, [pendingChatAction, handleSend, setPendingChatAction, isLoading]);

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
              {msg.role === "assistant" &&
                !msg.isStreaming &&
                isExportMessage(msg.content) && (
                  <ExportDownloadButton content={msg.content} />
                )}
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
