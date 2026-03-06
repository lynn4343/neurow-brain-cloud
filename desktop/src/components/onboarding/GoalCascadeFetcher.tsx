"use client";

import { useEffect, useRef, useState } from "react";
import { NeurowLogo } from "@/components/icons/NeurowLogo";
import { getProfile } from "@/lib/electron";
import type { GoalCascade } from "@/contexts/UserContext";

// ---------------------------------------------------------------------------
// GoalCascadeFetcher — Direct Supabase Read (model-agnostic)
//
// After the Clarity Session completes, the server writes the consolidated
// goal_cascade to user_profiles. This component fetches it directly from
// Supabase (no AI model in the loop) and passes it to completeClaritySession.
//
// Pattern: identical to ProfileUpdateLoader — deterministic, fast, retry once.
// ---------------------------------------------------------------------------

interface GoalCascadeFetcherProps {
  userId: string; // Supabase UUID (activeUser.id)
  onComplete: (goalCascade: GoalCascade | null) => void;
}

export function GoalCascadeFetcher({
  userId,
  onComplete,
}: GoalCascadeFetcherProps) {
  const startedRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "retrying">("loading");

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    async function run() {
      try {
        const profile = await getProfile(userId);
        const gc = (profile.goal_cascade as GoalCascade) ?? null;
        onComplete(gc);
      } catch (error) {
        console.warn(
          "GoalCascadeFetcher: fetch failed, retrying...",
          error,
        );
        setStatus("retrying");
        try {
          const profile = await getProfile(userId);
          onComplete((profile.goal_cascade as GoalCascade) ?? null);
        } catch (retryError) {
          console.error(
            "GoalCascadeFetcher: fetch failed after retry",
            retryError,
          );
          // Proceed without goal cascade — degraded but functional
          onComplete(null);
        }
      }
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#faf8f8]">
      <div className="flex flex-col items-center gap-6">
        <NeurowLogo className="h-[48px] w-[34px]" />
        <p className="text-sm text-[#5f5e5b]">
          {status === "retrying" ? "Retrying" : "Syncing your coaching session"}
          <span className="inline-flex w-6">
            <LoadingDots />
          </span>
        </p>
      </div>
    </div>
  );
}

function LoadingDots() {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return <>{".".repeat(dots)}</>;
}
