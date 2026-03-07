"use client";

import { useEffect, useRef, Fragment } from "react";
import { X, NotePencil, Sun, ChartLineUp, Moon, ListChecks, Brain, ClockCountdown } from "@phosphor-icons/react";
import { useUser } from "@/contexts/UserContext";
import { useChat } from "@/contexts/ChatContext";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { ActivityIndicator } from "./ActivityIndicator";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { NeurowLogo } from "@/components/icons/NeurowLogo";

// ---------------------------------------------------------------------------
// ChatPanel — sliding right-side drawer (consumes shared ChatContext)
// ---------------------------------------------------------------------------

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const { activeUser } = useUser();
  const { messages, isLoading, activities, handleSend, resetChat } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages or activities change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activities]);

  const firstName = activeUser?.display_name?.trim().split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (!open) return null;

  const hasMessages = messages.length > 0 || isLoading;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Panel Header */}
      <div className="flex h-[52px] items-center justify-between px-4 border-b border-[#E6E5E3] flex-shrink-0">
        <div className="flex items-center gap-2">
          <NeurowLogo className="h-5 w-3.5" />
          <span className="text-sm font-medium text-[#1E1E1E]">
            Neurow Chat
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={resetChat}
            className="flex size-8 items-center justify-center rounded-lg hover:bg-[#FAF8F8] transition-colors"
            aria-label="New chat"
            title="New chat"
          >
            <NotePencil className="size-4 text-[#1E1E1E]" weight="regular" />
          </button>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg hover:bg-[#FAF8F8] transition-colors"
            aria-label="Close chat panel"
          >
            <X className="size-4 text-[#1E1E1E]" weight="regular" />
          </button>
        </div>
      </div>

      {/* Content area */}
      {!hasMessages ? (
        /* Welcome state */
        <div className="flex flex-1 flex-col items-center px-4 pt-12">
          <NeurowLogo className="h-10 w-7 mb-4" />
          <p className="text-xl text-center mb-6 animate-gradient">
            {greeting}, {firstName}.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              // Time-aware contextual action (slot 1)
              hour >= 4 && hour < 12
                ? { icon: Sun, label: "Morning brief", prompt: "Give me my morning brief", mode: "morning_brief" as string | undefined }
                : hour >= 12 && hour < 17
                ? { icon: ChartLineUp, label: "Strategize", prompt: "Let's strategize", mode: undefined as string | undefined }
                : { icon: Moon, label: "Evening reflection", prompt: "Let's do an evening reflection on my day", mode: undefined as string | undefined },
              // Static actions
              { icon: ListChecks, label: "Review tasks", prompt: "Review my tasks for today", mode: undefined as string | undefined },
              { icon: Brain, label: "Brainstorm", prompt: "Let's brainstorm", mode: undefined as string | undefined },
              { icon: ClockCountdown, label: "Daily review", prompt: "Let's do a daily review", mode: undefined as string | undefined },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleSend(item.prompt, item.mode)}
                className="flex items-center gap-1.5 rounded-full border border-[#E6E5E3] bg-white px-3 py-1.5 text-xs text-[#1E1E1E] hover:bg-[#FAF8F8] transition-colors"
              >
                <item.icon className="size-3.5 flex-shrink-0 text-[#949494]" weight="regular" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Messages area */
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3 pt-4 pb-4 px-3">
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
      )}

      {/* Compact input */}
      <div className="flex-shrink-0 px-3 pb-3">
        <ChatInput
          onSend={handleSend}
          disabled={isLoading}
          compact
          autoFocus={open}
          placeholder="What's on your mind?"
        />
      </div>
    </div>
  );
}
