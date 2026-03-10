"use client";

import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { NeurowLogo } from "@/components/icons/NeurowLogo";
import { ProfileCreation } from "./ProfileCreation";
import { ConnectAI } from "./ConnectAI";
import { MemoryImportStep } from "./MemoryImportStep";
import { ConsentScreen } from "./ConsentScreen";
import { OnboardingScreens, type OnboardingData } from "./OnboardingScreens";
import { ProfileUpdateLoader } from "./ProfileUpdateLoader";
import type { UserProfile } from "@/contexts/UserContext";

// profile → connect → import → consent → screens → updating_profile
type OnboardingStep = "profile" | "connect" | "import" | "consent" | "screens" | "updating_profile";

interface OnboardingFlowProps {
  onComplete: (profile: UserProfile) => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { activeUser, updateProfile, demoWalkthrough } = useUser();

  // If we already have an active profile (e.g., switching to an incomplete profile),
  // skip to consent step. Otherwise start with profile creation.
  // Demo walkthrough: if activeUser is already set, start at import (not consent)
  // so the import screen is always shown during the demo flow.
  const [step, setStep] = useState<OnboardingStep>(() => {
    if (!activeUser) return "profile";
    return demoWalkthrough ? "import" : "consent";
  });

  // Hold onboarding data between screens completion and profile update
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(
    null,
  );

  switch (step) {
    case "profile":
      return <ProfileCreation onComplete={() => setStep(demoWalkthrough ? "import" : "connect")} />;

    case "connect":
      return <ConnectAI onComplete={() => setStep("import")} />;

    case "import":
      return (
        <MemoryImportStep
          onComplete={() => setStep("consent")}
          onSkip={() => setStep("consent")}
        />
      );

    case "consent":
      return (
        <ConsentScreen
          onConsent={async (consented) => {
            if (demoWalkthrough) {
              setStep("screens");
              return;
            }
            try {
              await updateProfile({
                pattern_consent: consented,
                pattern_consent_at: new Date().toISOString(),
              });
              setStep("screens");
            } catch (error) {
              console.error("Failed to save consent:", error);
            }
          }}
          onBack={() => setStep("import")}
        />
      );

    case "screens":
      return (
        <OnboardingScreens
          onComplete={(data) => {
            setOnboardingData(data);
            setStep("updating_profile");
          }}
        />
      );

    case "updating_profile": {
      if (!activeUser || !onboardingData) {
        console.error("OnboardingFlow: Missing activeUser or onboardingData at updating_profile step");
        return null;
      }
      // Demo walkthrough: skip Supabase API call, complete immediately with Theo's full profile
      if (demoWalkthrough) {
        // Use setTimeout to avoid calling onComplete during render
        setTimeout(() => {
          onComplete({
            ...activeUser,
            ...onboardingData,
            onboarding_completed: true,
          });
        }, 0);
        return (
          <div className="relative flex min-h-screen items-center justify-center bg-[#faf8f8]">
            <div className="flex flex-col items-center gap-6">
              <NeurowLogo className="h-[48px] w-[34px]" />
              <p className="text-sm text-[#5f5e5b]">Personalizing your experience...</p>
            </div>
          </div>
        );
      }
      return (
        <ProfileUpdateLoader
          userId={activeUser.id}
          profileData={onboardingData}
          onComplete={() => {
            onComplete({
              ...activeUser,
              ...onboardingData,
              onboarding_completed: true,
            });
          }}
        />
      );
    }
  }
}
