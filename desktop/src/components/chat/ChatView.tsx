"use client";

import { useEffect, useRef, Fragment } from "react";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { NeurowLogo } from "@/components/icons/NeurowLogo";
import {
  Sun,
  ChartLineUp,
  Moon,
  PencilSimple,
  BookOpen,
  Brain,
} from "@phosphor-icons/react";
import { useUser } from "@/contexts/UserContext";
import { useChat } from "@/contexts/ChatContext";
import { ActivityIndicator } from "./ActivityIndicator";
import { ThinkingIndicator } from "./ThinkingIndicator";

// ---------------------------------------------------------------------------
// ChatView — full-page chat surface (consumes shared ChatContext)
// ---------------------------------------------------------------------------

export function ChatView() {
  const { activeUser } = useUser();
  const { messages, isLoading, activities, handleSend } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages or activities change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activities]);

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
                // Time-aware contextual action (slot 1)
                hour >= 4 && hour < 12
                  ? { icon: Sun, label: "Morning brief", prompt: "Give me my morning brief", mode: "morning_brief" as string | undefined }
                  : hour >= 12 && hour < 17
                  ? { icon: ChartLineUp, label: "Strategize", prompt: "Let's strategize", mode: undefined as string | undefined }
                  : { icon: Moon, label: "Evening reflection", prompt: "Let's do an evening reflection on my day", mode: undefined as string | undefined },
                // Static actions
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
