"use client";

import { useState, useCallback } from "react";
import { NeurowLogo } from "@/components/icons/NeurowLogo";
import { useUser } from "@/contexts/UserContext";
import { OnboardingLayout } from "./OnboardingLayout";
import { createProfile } from "@/lib/electron";
import type { UserProfile } from "@/contexts/UserContext";

// ---------------------------------------------------------------------------
// ProfileCreation — Direct Supabase API (model-agnostic)
//
// Creates a user profile via the direct IPC handler (no AI model in the loop).
// Returns the Supabase-generated UUID — no regex parsing of AI responses.
// See: BUILD_SPECS/Direct_Profile_API_Spec.md
// ---------------------------------------------------------------------------

interface ProfileCreationProps {
  onComplete: () => void;
}

export function ProfileCreation({ onComplete }: ProfileCreationProps) {
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addProfile } = useUser();

  const handleCreate = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed || isCreating) return;

    setIsCreating(true);
    setError(null);

    try {
      const result = await createProfile(trimmed);

      const profile: UserProfile = {
        id: result.id,
        slug: result.slug,
        display_name: result.display_name,
        onboarding_completed: false,
        clarity_session_completed: false,
        coaching_style: "balanced",
        roles: [],
        goal_cascade: null,
      };

      addProfile(profile);
      onComplete();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsCreating(false);
    }
  }, [name, isCreating, addProfile, onComplete]);

  const canProceed = name.trim().length > 0;

  // Loading state — same visual treatment as onboarding screens
  if (isCreating) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#faf8f8]">
        {/* Background ellipse */}
        <div
          className="pointer-events-none absolute left-1/2 top-[97px] z-0 -translate-x-1/2 rounded-full"
          style={{
            width: 607,
            height: 607,
            background:
              "linear-gradient(313deg, rgba(178,160,232,0.2) 0%, rgba(178,200,255,0.2) 50%, rgba(232,178,220,0.2) 100%)",
            filter: "blur(80px)",
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <NeurowLogo className="h-[69px] w-[49px] animate-pulse" />
          <p className="text-sm text-[#5f5e5b]">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingLayout
      ctaLabel="Get Started"
      ctaEnabled={canProceed}
      onCta={handleCreate}
    >
      <div className="flex flex-col items-center gap-6">
        <NeurowLogo className="h-[69px] w-[49px]" />

        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-albra text-[28px] font-medium leading-8 text-[#1e1e1e]">
            Let&apos;s get you <em className="font-medium italic">set up.</em>
          </h1>
          <p className="text-sm leading-5 text-[#5f5e5b]">
            We&apos;ll walk you through a quick setup,
            <br />
            then start your first coaching session.
          </p>
        </div>

        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canProceed) handleCreate();
          }}
          autoFocus
          className="h-8 w-full rounded-md border border-[#6579EE] bg-transparent px-3 text-center text-sm placeholder:text-[#a8a49c] transition-all duration-150 focus:border-[#6579EE] focus:outline-none focus:ring-2 focus:ring-[#6579EE]/20"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </OnboardingLayout>
  );
}
