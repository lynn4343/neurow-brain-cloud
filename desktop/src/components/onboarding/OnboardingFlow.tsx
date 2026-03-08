"use client";

import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { ProfileCreation } from "./ProfileCreation";
import { MemoryImportStep } from "./MemoryImportStep";
import { ConsentScreen } from "./ConsentScreen";
import { OnboardingScreens, type OnboardingData } from "./OnboardingScreens";
import { ProfileUpdateLoader } from "./ProfileUpdateLoader";
import type { UserProfile } from "@/contexts/UserContext";

// profile → import → consent → screens → updating_profile
type OnboardingStep = "profile" | "import" | "consent" | "screens" | "updating_profile";

interface OnboardingFlowProps {
  onComplete: (profile: UserProfile) => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { activeUser, updateProfile } = useUser();

  // If we already have an active profile (e.g., switching to an incomplete profile),
  // skip to consent step. Otherwise start with profile creation.
  const [step, setStep] = useState<OnboardingStep>(() =>
    activeUser ? "consent" : "profile",
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
          onComplete={() => setStep("consent")}
          onSkip={() => setStep("consent")}
        />
      );

    case "consent":
      return (
        <ConsentScreen
          onConsent={async (consented) => {
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
