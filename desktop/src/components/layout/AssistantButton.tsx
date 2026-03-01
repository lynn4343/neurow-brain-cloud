"use client";

export function AssistantButton() {
  return (
    <button
      className="fixed bottom-4 right-4 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#1E1E1E] shadow-lg transition-all hover:scale-105 hover:shadow-xl"
      aria-label="Open Assistant"
    >
      <img
        src="/neurow-logo-icon.svg"
        alt="Neurow Assistant"
        width={32}
        height={32}
        style={{ filter: "invert(1) brightness(2)" }}
      />
    </button>
  );
}
