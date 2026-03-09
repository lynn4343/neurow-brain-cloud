"use client";

import { useState } from "react";
import { NeurowLogo } from "@/components/icons/NeurowLogo";
import { OnboardingLayout } from "./OnboardingLayout";
import { PrivacyPolicyContent } from "@/components/settings/PrivacyPolicyContent";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ConsentScreenProps {
  onConsent: (consented: boolean) => void;
  onBack: () => void;
}

export function ConsentScreen({ onConsent, onBack }: ConsentScreenProps) {
  const [policyOpen, setPolicyOpen] = useState(false);

  return (
    <OnboardingLayout onBack={onBack} contentGap="gap-0">
      <div className="flex flex-col items-center gap-6">
        <NeurowLogo className="h-[69px] w-[49px]" />

        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="font-albra text-[28px] font-medium leading-8 text-[#1e1e1e]">
            Data <em className="font-medium italic">and</em> Privacy
          </h1>

          {/* Section B — Privacy Notice (TDPSA § 541.102) */}
          <p className="w-full text-sm leading-5 text-[#5f5e5b]">
          <span className="font-semibold text-[#1e1e1e]">
            Your data belongs to you.
          </span>{" "}
          Read our full{" "}
          <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
            <DialogTrigger asChild>
              <button type="button" className="text-[#6579EE] underline">
                Privacy Policy
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
              <DialogTitle className="sr-only">Privacy Policy</DialogTitle>
              <PrivacyPolicyContent />
            </DialogContent>
          </Dialog>{" "}
          to understand how we collect, use, and protect your information.
          </p>
        </div>

        {/* Section C — Sensitive Data Consent (TDPSA § 541.001) */}
        <div className="-mt-3 flex w-full flex-col items-center gap-1.5 text-center">
          <h2 className="text-sm font-semibold text-[#1e1e1e]">
            Synthesized Insights
          </h2>
          <p className="text-sm leading-relaxed text-[#5f5e5b]">
            Neurow uses executive intelligence to process information related to
            your emotional states, health habits, and mental wellbeing to help
            you achieve your goals.
          </p>
          <p className="text-xs italic text-[#5f5e5b]">
            (Change anytime in Settings.)
          </p>
        </div>

        {/* CTA */}
        <div className="flex w-full max-w-[450px] flex-col items-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => onConsent(true)}
            className="h-11 w-full rounded-lg bg-[#1e1e1e] text-sm font-medium text-white transition-all duration-200 hover:bg-[#1e1e1e]/90"
            style={{ boxShadow: "-4px 5px 30px rgba(101, 121, 238, 0.5)" }}
          >
            Agree and continue
          </button>
          <button
            type="button"
            onClick={() => onConsent(false)}
            className="mt-1 text-sm text-[#5f5e5b] underline underline-offset-2 transition-colors hover:text-[#1e1e1e]"
          >
            No thanks
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
