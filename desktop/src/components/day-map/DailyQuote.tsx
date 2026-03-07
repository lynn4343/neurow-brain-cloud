"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const QUOTES = [
  { text: "To accomplish great things we must not only act but also dream; not only plan but also believe.", author: "Anatole France" },
  { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear" },
  { text: "Lack of time is actually lack of priorities.", author: "Tim Ferriss" },
  { text: "You have power over your mind \u2014 not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "It is not that we have a short space of time, but that we waste much of it.", author: "Seneca" },
  { text: "If you don\u2019t prioritize your life, someone else will.", author: "Greg McKeown" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
];

export function DailyQuote() {
  const [index, setIndex] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const next = useCallback(() => {
    setSpinning(true);
    setIndex((prev) => (prev + 1) % QUOTES.length);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSpinning(false), 500);
  }, []);

  const quote = QUOTES[index];

  return (
    <div className="rounded-lg border border-[#E6E5E3] bg-white p-3">
      <div className="space-y-3 text-center">
        <p className="font-serif italic text-xs leading-relaxed text-[#1E1E1E]">
          &ldquo;{quote.text}&rdquo;
        </p>
        <div className="relative flex items-center justify-center">
          <p className="text-[9px] font-medium uppercase tracking-wide text-[#949494]">
            {quote.author}
          </p>
          <button
            onClick={next}
            className="absolute right-0 flex h-5 w-5 items-center justify-center rounded hover:bg-[#E6E5E3] transition-colors"
            aria-label="Next quote"
          >
            <ArrowsClockwise
              className={cn(
                "h-3 w-3 text-[#949494] transition-transform duration-500",
                spinning && "rotate-180",
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
