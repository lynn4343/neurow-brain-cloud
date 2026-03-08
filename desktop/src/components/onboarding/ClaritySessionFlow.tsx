"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage, type Message } from "@/components/chat/ChatMessage";
import { ActivityIndicator, type ActivityItem } from "@/components/chat/ActivityIndicator";
import { Button } from "@/components/ui/button";
import { NeurowLogo } from "@/components/icons/NeurowLogo";
import { useUser } from "@/contexts/UserContext";
import {
  sendMessage,
  onChatStream,
  onChatComplete,
  onChatError,
  onToolActivity,
  onSessionComplete,
  type ChatStreamEvent,
  type ChatCompleteEvent,
  type ChatErrorEvent,
  type ToolActivityEvent,
} from "@/lib/electron";
import type { GoalCascade } from "@/contexts/UserContext";
import { useSessions } from "@/contexts/SessionContext";
import { extractClaritySummary, type ChatSession } from "@/types/sessions";
import { GoalCascadeFetcher } from "./GoalCascadeFetcher";

// Close phrase from the Turn 9 verbatim close template.
// Both apostrophe variants: straight (U+0027) and curly (U+2019).
const CLOSE_PHRASES = [
  "Don\u2019t worry about perfection",
  "Don't worry about perfection",
] as const;

// ---------------------------------------------------------------------------
// ClaritySessionFlow
// ---------------------------------------------------------------------------

export function ClaritySessionFlow() {
  const { activeUser, completeClaritySession } = useUser();
  const { saveSession } = useSessions();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [closeDelivered, setCloseDelivered] = useState(false);
  const [phase, setPhase] = useState<"chat" | "syncing">("chat");

  // Refs for event listener callbacks (prevents stale closures in useEffect([]))
  const sessionIdRef = useRef<string | null>(null);
  const goalCascadeRef = useRef<GoalCascade | null>(null);
  const closeDeliveredRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoStartedRef = useRef(false);

  // Keep session ID ref in sync
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Auto-scroll on new messages/activities
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activities]);

  // --- IPC listeners ---

  useEffect(() => {
    // Synchronous registration — no .then() race with React Strict Mode cleanup.
    // The preload API is synchronous. Unlisteners are in the array immediately.
    const unlisteners: Array<() => void> = [];

    // Layer 3: suppress post-close activity indicators.
    unlisteners.push(onToolActivity((payload: ToolActivityEvent) => {
      if (closeDeliveredRef.current) return;

      setActivities((prev) => {
        if (prev.some((a) => a.summary === payload.summary)) return prev;
        return [
          ...prev,
          { tool_name: payload.tool_name, summary: payload.summary },
        ];
      });
    }));

    unlisteners.push(onChatStream((payload: ChatStreamEvent) => {
      // Layer 3: suppress post-close stream events.
      if (closeDeliveredRef.current) return;

      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1
              ? { ...m, content: payload.content, isStreaming: payload.is_partial }
              : m,
          );
        }
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
      });

      // Layer 2: detect the close. is_partial is now false when the assistant
      // message is complete (Layer 1 fix), so this fires on the finalized message.
      if (
        !payload.is_partial &&
        !closeDeliveredRef.current &&
        CLOSE_PHRASES.some((phrase) => payload.content.includes(phrase))
      ) {
        closeDeliveredRef.current = true;
        setCloseDelivered(true);
      }
    }));

    unlisteners.push(onChatComplete((payload: ChatCompleteEvent) => {
      setIsLoading(false);
      setActivities([]);
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1 && m.isStreaming
            ? { ...m, isStreaming: false }
            : m,
        ),
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

    // Goal cascade capture + fallback button trigger.
    unlisteners.push(onSessionComplete((payload) => {
      goalCascadeRef.current = payload.goal_cascade as GoalCascade;

      if (!closeDeliveredRef.current) {
        closeDeliveredRef.current = true;
        setCloseDelivered(true);
      }
    }));

    return () => {
      unlisteners.forEach((u) => u());
    };
  }, []);

  // --- Send message ---

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setActivities([]);

      try {
        const newSessionId = await sendMessage(
          text,
          sessionIdRef.current || undefined,
          activeUser
            ? {
                slug: activeUser.slug,
                display_name: activeUser.display_name,
                mode: "clarity_session",
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
        const errorMessage = err instanceof Error ? err.message : String(err);
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: `Error: ${errorMessage}`,
            timestamp: new Date().toISOString(),
            isStreaming: false,
          },
        ]);
      }
    },
    [activeUser],
  );

  // --- Auto-start: send initial message on mount ---
  // Reset ref in cleanup so React StrictMode's second mount can retry.
  // StrictMode: mount→cleanup→remount. Without the reset, the ref stays
  // true after cleanup cancels the timer, and the remount never fires.

  useEffect(() => {
    if (!autoStartedRef.current && activeUser) {
      autoStartedRef.current = true;
      let fired = false;
      const timer = setTimeout(() => {
        fired = true;
        handleSend(
          "Just finished setting up my profile — ready to close the gap between vision and reality.",
        );
      }, 0);
      return () => {
        clearTimeout(timer);
        // Only reset if the timer was cancelled before firing (StrictMode case)
        if (!fired) {
          autoStartedRef.current = false;
        }
      };
    }
  }, [activeUser, handleSend]);

  // --- "Continue to Neurow" handler ---

  function handleComplete() {
    // Save the Clarity Session transcript before transitioning
    const claritySession: ChatSession = {
      id: `clarity-${Date.now()}`,
      type: "clarity",
      title: "Clarity Session",
      messages: [...messages],
      createdAt: messages[0]?.timestamp || new Date().toISOString(),
      updatedAt: messages[messages.length - 1]?.timestamp || new Date().toISOString(),
      personaId: activeUser?.slug || "unknown",
      summary: extractClaritySummary(messages),
      goalCascade: goalCascadeRef.current ?? undefined,
    };

    try {
      saveSession(claritySession);
    } catch (err) {
      console.error("Failed to save Clarity Session:", err);
    }

    // Fast path: IPC already delivered goal_cascade
    if (goalCascadeRef.current) {
      completeClaritySession(goalCascadeRef.current);
      return;
    }
    // Slow path: fetch from Supabase (server wrote it on Turn 9)
    setPhase("syncing");
  }

  // --- Render ---

  if (phase === "syncing") {
    if (!activeUser) return null;
    return (
      <GoalCascadeFetcher
        userId={activeUser.id}
        onComplete={(gc) => completeClaritySession(gc ?? undefined)}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="relative flex flex-col items-center overflow-hidden border-b bg-[#faf8f8] px-4 pb-3 pt-3">
        {/* Background ellipse — matches onboarding screens */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 z-0 -translate-x-1/2 rounded-full"
          style={{
            width: 607,
            height: 607,
            background:
              "linear-gradient(313deg, rgba(178,160,232,0.2) 0%, rgba(178,200,255,0.2) 50%, rgba(232,178,220,0.2) 100%)",
            filter: "blur(80px)",
          }}
        />
        <NeurowLogo className="relative z-10 h-6 w-[17px]" />
        <div className="relative z-10 mt-1 inline-flex flex-col">
          <h1 className="font-albra-sans text-2xl font-normal uppercase tracking-wide text-black">
            The Clarity Flow
          </h1>
          <p
            className="mt-0.5 self-stretch text-sm font-semibold uppercase text-black"
            style={{ textAlignLast: "justify" }}
          >
            Vision. Focus. Action.
          </p>
        </div>
        <p className="relative z-10 mt-1 text-center text-sm text-black">
          We&apos;ll help you get <span className="font-extrabold italic">clear</span> about your <span className="font-extrabold italic">vision</span>, and help you <span className="font-extrabold italic">stay aligned</span> with <span className="font-extrabold italic">what to do next</span>. (Even when life gets &ldquo;life-y&rdquo;)
        </p>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[767px] flex-col gap-4 px-4 pt-6 pb-6">
          {messages.map((msg) => (
            <Fragment key={msg.id}>
              <ChatMessage message={msg} />
            </Fragment>
          ))}
          {!closeDelivered && activities.length > 0 && (
            <ActivityIndicator activities={activities} />
          )}
          {!closeDelivered && isLoading && activities.length === 0 && messages[messages.length - 1]?.role === "user" && (
            <ThinkingIndicator />
          )}
        </div>
      </div>

      {/* Input area + completion button */}
      <div className="flex-shrink-0 bg-white">
        {closeDelivered ? (
          <div className="flex justify-center px-4 py-6">
            <Button onClick={handleComplete} size="lg" className="px-8">
              Continue to Neurow
            </Button>
          </div>
        ) : (
          <div className="flex w-full justify-center px-4 pb-4">
            <div className="w-full max-w-[767px]">
              <ChatInput
                onSend={handleSend}
                disabled={isLoading}
                placeholder="Share what's on your mind..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex justify-start" role="status" aria-label="Loading response">
      <div className="flex items-center gap-1.5 px-4 py-3 text-muted-foreground">
        <div className="flex gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
        </div>
        <span className="ml-2 text-sm">Thinking...</span>
      </div>
    </div>
  );
}
