"use client";

import { useEffect, useRef, useState } from "react";
import { NeurowLogo } from "@/components/icons/NeurowLogo";
import { updateProfile } from "@/lib/electron";
import type { OnboardingData } from "./OnboardingScreens";

// ---------------------------------------------------------------------------
// ProfileUpdateLoader — Direct Supabase API (model-agnostic)
//
// Persists onboarding data to Supabase via the direct IPC handler.
// No AI model in the loop — deterministic, fast (<1s), reliable.
// Retry once on failure, then proceed with degraded voice modifiers.
//
// See: BUILD_SPECS/Direct_Profile_API_Spec.md
// ---------------------------------------------------------------------------

interface ProfileUpdateLoaderProps {
  userId: string;
  profileData: OnboardingData;
  onComplete: () => void;
}

export function ProfileUpdateLoader({
  userId,
  profileData,
  onComplete,
}: ProfileUpdateLoaderProps) {
  const startedRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "retrying">("loading");

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const payload: Record<string, unknown> = {
      roles: profileData.roles,
      focus_area: profileData.focus_area,
      coaching_style: profileData.coaching_style,
      is_business_owner: profileData.is_business_owner,
      declared_challenges: profileData.declared_challenges,
      onboarding_completed: true,
      // Conditional fields — only include if present
      ...(profileData.side_hustle_goal && {
        side_hustle_goal: profileData.side_hustle_goal,
      }),
      ...(profileData.love_partner_situation && {
        love_partner_situation: profileData.love_partner_situation,
      }),
      ...(profileData.business_description && {
        business_description: profileData.business_description,
      }),
      ...(profileData.business_stage && {
        business_stage: profileData.business_stage,
      }),
      ...(profileData.current_business_focus && {
        current_business_focus: profileData.current_business_focus,
      }),
      ...(profileData.business_challenges &&
        profileData.business_challenges.length > 0 && {
          business_challenges: profileData.business_challenges,
        }),
      ...(profileData.career_situation && {
        career_situation: profileData.career_situation,
      }),
      ...(profileData.career_stage && {
        career_stage: profileData.career_stage,
      }),
      ...(profileData.career_focus && {
        career_focus: profileData.career_focus,
      }),
      ...(profileData.career_challenges &&
        profileData.career_challenges.length > 0 && {
          career_challenges: profileData.career_challenges,
        }),
    };

    async function run() {
      try {
        await updateProfile(userId, payload);
        onComplete();
      } catch (error) {
        console.warn("ProfileUpdateLoader: direct update failed, retrying...", error);
        setStatus("retrying");
        try {
          await updateProfile(userId, payload);
          onComplete();
        } catch (retryError) {
          console.error("ProfileUpdateLoader: update failed after retry", retryError);
          // Proceed with degraded voice modifiers (same behavior as previous implementation)
          onComplete();
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
          {status === "retrying" ? "Retrying" : "Personalizing your experience"}
          <span className="inline-flex w-6">
            <LoadingDots />
          </span>
        </p>
      </div>
    </div>
  );
}

// Simple animated dots
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
