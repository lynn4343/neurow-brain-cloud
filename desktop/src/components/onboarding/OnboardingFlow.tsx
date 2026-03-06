"use client";

import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { ProfileCreation } from "./ProfileCreation";
import { MemoryImportStep } from "./MemoryImportStep";
import { OnboardingScreens, type OnboardingData } from "./OnboardingScreens";
import { ProfileUpdateLoader } from "./ProfileUpdateLoader";
import type { UserProfile } from "@/contexts/UserContext";

// profile → import → screens → updating_profile
type OnboardingStep = "profile" | "import" | "screens" | "updating_profile";

interface OnboardingFlowProps {
  onComplete: (profile: UserProfile) => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { activeUser } = useUser();

  // If we already have an active profile (e.g., switching to an incomplete profile),
  // skip directly to onboarding screens. Otherwise start with profile creation.
  const [step, setStep] = useState<OnboardingStep>(() =>
    activeUser ? "screens" : "profile",
  );

  // Hold onboarding data between screens completion and profile update
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(
    null,
  );

  switch (step) {
    case "profile":
      return <ProfileCreation onComplete={() => setStep("import")} />;

    case "import":
      return (
        <MemoryImportStep
          onComplete={() => setStep("screens")}
          onSkip={() => setStep("screens")}
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

    case "updating_profile":
      if (!activeUser || !onboardingData) {
        console.error("OnboardingFlow: Missing activeUser or onboardingData at updating_profile step");
        return null;
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
