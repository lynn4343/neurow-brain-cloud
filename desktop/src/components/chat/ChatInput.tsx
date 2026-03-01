"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Paperclip,
  Microphone,
  ArrowUp,
  Sparkle,
  CaretDown,
  Check,
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
  const [selectedCoach, setSelectedCoach] = useState("Executive Coach");
  const [coachMenuOpen, setCoachMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const coachMenuRef = useRef<HTMLDivElement>(null);

  const coachOptions = ["Executive Coach", "Chief of Staff", "Thinking Partner", "Creative Director", "Challenge Me"];

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!coachMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (coachMenuRef.current && !coachMenuRef.current.contains(e.target as Node)) {
        setCoachMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [coachMenuOpen]);

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

            <div className="relative" ref={coachMenuRef}>
              <button
                type="button"
                className="flex h-7 items-center gap-2 rounded-full bg-[#FAF8F8] px-2 hover:bg-[#E6E5E3]"
                onClick={() => setCoachMenuOpen((prev) => !prev)}
              >
                <Sparkle className="size-3" weight="regular" />
                <span className="text-sm font-normal leading-5 text-[#1E1E1E]">
                  {selectedCoach}
                </span>
                <CaretDown className="size-3" weight="regular" />
              </button>

              {coachMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-[200px] rounded-lg border border-[#E6E5E3] bg-white py-1 shadow-lg z-50">
                  {coachOptions.map((coach) => (
                    <button
                      key={coach}
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-1.5 text-sm text-[#1E1E1E] hover:bg-[#FAF8F8]"
                      onClick={() => {
                        setSelectedCoach(coach);
                        setCoachMenuOpen(false);
                      }}
                    >
                      <span>{coach}</span>
                      {selectedCoach === coach && (
                        <Check className="size-3.5" weight="bold" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
