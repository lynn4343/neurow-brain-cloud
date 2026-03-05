"use client";

import { useState, useRef, useCallback } from "react";
import {
  Paperclip,
  Microphone,
  ArrowUp,
} from "@phosphor-icons/react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "What's on your mind?",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 224);
      textarea.style.height = `${newHeight}px`;
    }
  };

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    autoResize();
  };

  const hasText = value.trim().length > 0;
  const isSendDisabled = !hasText || disabled;

  return (
    <div className={`w-full ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex w-full h-[125px] flex-col gap-2.5 rounded-[20px] border border-[#E6E5E3] bg-white p-2 pt-4">
        {/* Text Input Area */}
        <div className="flex flex-1 items-start gap-2.5 px-3">
          <textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="flex-1 resize-none bg-transparent text-sm font-normal leading-5 text-[#1E1E1E] placeholder:text-[#7F7F7F] focus:outline-none overflow-y-auto"
            style={{ maxHeight: "224px", minHeight: "20px" }}
          />
        </div>

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between">
          {/* Left Tools */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex size-7 items-center justify-center rounded-lg p-1 hover:bg-accent"
              aria-label="Attach files"
              onClick={() => console.log("Attach files clicked")}
            >
              <Paperclip className="size-4" weight="regular" />
            </button>
          </div>

          {/* Right Tools */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex size-7 items-center justify-center rounded-lg p-1 hover:bg-accent"
              aria-label="Voice input"
              onClick={() => console.log("Voice input clicked")}
            >
              <Microphone className="size-5" weight="regular" />
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSendDisabled}
              className={`flex size-8 items-center justify-center rounded-full p-1 transition-colors ${
                !isSendDisabled
                  ? "bg-[#1e1e1e]"
                  : "bg-[rgba(220,218,215,1)]"
              }`}
              aria-label="Send message"
            >
              <ArrowUp className="size-5 text-white" weight="regular" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
