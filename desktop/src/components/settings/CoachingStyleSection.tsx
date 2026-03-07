"use client";

import { useUser } from "@/contexts/UserContext";
import { COACHING_STYLES } from "@/components/onboarding/onboarding-data";
import { cn } from "@/lib/utils";

export function CoachingStyleSection() {
  const { activeUser, updateProfile } = useUser();
  const current = activeUser?.coaching_style ?? "balanced";

  return (
    <section>
      <h2 className="text-sm font-medium uppercase tracking-wider text-[#1E1E1E] mb-1">
        Coaching Style
      </h2>
      <p className="text-sm text-muted-foreground mb-5">
        How Neurow communicates with you.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {COACHING_STYLES.map((style) => {
          const isActive = current === style.id;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => updateProfile({ coaching_style: style.id })}
              className={cn(
                "rounded-lg border px-4 py-3.5 text-left transition-all",
                isActive
                  ? "border-[#1E1E1E] bg-[#FAFAF9]"
                  : "border-[#E6E5E3] bg-white hover:border-[#C5C3C0]"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{style.emoji}</span>
                <span className="text-sm font-medium text-[#1E1E1E]">
                  {style.title}
                </span>
                {style.tag && (
                  <span className="text-[10px] text-muted-foreground">
                    {style.tag}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {style.description}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
