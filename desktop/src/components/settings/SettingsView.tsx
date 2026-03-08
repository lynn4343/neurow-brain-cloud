"use client";

import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { MemoryImportSection } from "@/components/memory/MemoryImportSection";
import { ExportSection } from "./ExportSection";
import { BYOKSection } from "./BYOKSection";
import { BrainCloudStandaloneSection } from "./BrainCloudStandaloneSection";
import { CoachingStyleSection } from "./CoachingStyleSection";
import { DataPrivacySection } from "./DataPrivacySection";
import { AccountSection } from "./AccountSection";
import { PrivacyPolicyContent } from "./PrivacyPolicyContent";

type SettingsSection = "brain-cloud" | "privacy" | "account";

const NAV_ITEMS: { id: SettingsSection; label: string }[] = [
  { id: "brain-cloud", label: "Brain Cloud" },
  { id: "privacy", label: "Privacy" },
  { id: "account", label: "Account" },
];

export function SettingsView() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("brain-cloud");
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  if (showPrivacyPolicy) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 pt-18 pb-8">
          <button
            onClick={() => setShowPrivacyPolicy(false)}
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
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar nav */}
      <nav className="w-44 shrink-0 pt-18 pl-6 pr-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveSection(item.id)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                  activeSection === item.id
                    ? "bg-[#F0EFED] text-[#1E1E1E] font-medium"
                    : "text-[#5f5e5b] hover:text-[#1E1E1E] hover:bg-[#F7F7F6]"
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl space-y-8 px-6 pt-18 pb-8">
          {activeSection === "brain-cloud" && (
            <>
              <MemoryImportSection />
              <div className="h-px bg-[#E6E5E3]" />
              <BrainCloudStandaloneSection />
              <div className="h-px bg-[#E6E5E3]" />
              <ExportSection />
            </>
          )}
          {activeSection === "privacy" && (
            <DataPrivacySection onViewPolicy={() => setShowPrivacyPolicy(true)} />
          )}
          {activeSection === "account" && (
            <>
              <CoachingStyleSection />
              <div className="h-px bg-[#E6E5E3]" />
              <BYOKSection />
              <div className="h-px bg-[#E6E5E3]" />
              <AccountSection />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
