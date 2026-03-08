"use client";

import { cn } from "@/lib/utils";

interface WorkspaceToggleProps {
  value: "all" | "personal" | "professional";
  onChange: (value: "all" | "personal" | "professional") => void;
}

export function WorkspaceToggle({ value, onChange }: WorkspaceToggleProps) {
  return (
    <div role="group" aria-label="Workspace filter" className="inline-flex items-center rounded-full bg-[#FAF8F8] p-1">
      <button
        onClick={() => onChange("all")}
        aria-pressed={value === "all"}
        className={cn(
          "px-3 py-1 rounded-full text-[10px] font-semibold transition-colors",
          value === "all"
            ? "bg-[#1E1E1E] text-white"
            : "text-[#5F5E5B] hover:text-[#1E1E1E]"
        )}
      >
        All
      </button>
      <button
        onClick={() => onChange("personal")}
        aria-pressed={value === "personal"}
        className={cn(
          "px-3 py-1 rounded-full text-[10px] font-semibold transition-colors",
          value === "personal"
            ? "bg-[#1E1E1E] text-white"
            : "text-[#5F5E5B] hover:text-[#1E1E1E]"
        )}
      >
        Personal
      </button>
      <button
        onClick={() => onChange("professional")}
        aria-pressed={value === "professional"}
        className={cn(
          "px-3 py-1 rounded-full text-[10px] font-semibold transition-colors",
          value === "professional"
            ? "bg-[#1E1E1E] text-white"
            : "text-[#5F5E5B] hover:text-[#1E1E1E]"
        )}
      >
        Professional
      </button>
    </div>
  );
}
