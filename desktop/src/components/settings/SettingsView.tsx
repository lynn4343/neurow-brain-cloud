"use client";

import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { MemoryImportSection } from "@/components/memory/MemoryImportSection";
import { ExportSection } from "./ExportSection";
import { BYOKSection } from "./BYOKSection";
import { BrainCloudStandaloneSection } from "./BrainCloudStandaloneSection";
import { CoachingStyleSection } from "./CoachingStyleSection";
import { DataPrivacySection } from "./DataPrivacySection";
import { PrivacyPolicyContent } from "./PrivacyPolicyContent";

export function SettingsView() {
  const [subPage, setSubPage] = useState<"main" | "privacy">("main");

  if (subPage === "privacy") {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 pt-18 pb-8">
          <button
            onClick={() => setSubPage("main")}
            className="flex w-fit items-center gap-1.5 text-sm text-[#5f5e5b] transition-colors hover:text-[#1e1e1e] mb-8"
          >
            <ArrowLeft size={12} weight="regular" className="text-[#8e8b86]" />
            Back to Settings
          </button>

          <PrivacyPolicyContent />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-8 px-6 pt-18 pb-8">
        <MemoryImportSection />
        <div className="h-px bg-[#E6E5E3]" />
        <BrainCloudStandaloneSection />
        <div className="h-px bg-[#E6E5E3]" />
        <ExportSection />
        <div className="h-px bg-[#E6E5E3]" />
        <CoachingStyleSection />
        <div className="h-px bg-[#E6E5E3]" />
        <BYOKSection />
        <div className="h-px bg-[#E6E5E3]" />
        <DataPrivacySection onViewPolicy={() => setSubPage("privacy")} />
      </div>
    </div>
  );
}
