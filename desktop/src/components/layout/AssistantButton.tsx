"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface AssistantButtonProps {
  onClick: () => void;
  visible?: boolean;
}

export function AssistantButton({ onClick, visible = true }: AssistantButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-4 right-4 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#1E1E1E] shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl",
        visible
          ? "opacity-100 scale-100"
          : "opacity-0 scale-90 pointer-events-none"
      )}
      aria-label="Open Assistant"
    >
      <Image
        src="/neurow-logo-icon.svg"
        alt="Neurow Assistant"
        width={32}
        height={32}
        style={{ filter: "invert(1) brightness(2)" }}
      />
    </button>
  );
}
