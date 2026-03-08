"use client";

import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { BYOKSection } from "@/components/settings/BYOKSection";
import { ExportSection } from "@/components/settings/ExportSection";
import { DataPrivacySection } from "@/components/settings/DataPrivacySection";
import { AccountSection } from "@/components/settings/AccountSection";
import { PrivacyPolicyContent } from "@/components/settings/PrivacyPolicyContent";

type BCSettingsSection = "brain-cloud" | "privacy" | "account";

const NAV_ITEMS: { id: BCSettingsSection; label: string }[] = [
  { id: "brain-cloud", label: "Brain Cloud" },
  { id: "privacy", label: "Privacy" },
  { id: "account", label: "Account" },
];

export function BCSettingsView() {
  const [activeSection, setActiveSection] =
    useState<BCSettingsSection>("brain-cloud");
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  if (showPrivacyPolicy) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 pt-18 pb-8">
          <button
            onClick={() => setShowPrivacyPolicy(false)}
            className="flex w-fit items-center gap-1.5 text-sm text-[#5f5e5b] transition-colors hover:text-[#1e1e1e] mb-8"
          >
            <ArrowLeft
              size={12}
              weight="regular"
              className="text-[#8e8b86]"
            />
            Back to Settings
          </button>
          <PrivacyPolicyContent />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
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
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl space-y-8 px-6 pt-18 pb-8">
          {activeSection === "brain-cloud" && (
            <>
              <BYOKSection />
              <div className="h-px bg-[#E6E5E3]" />
              <ExportSection />
            </>
          )}
          {activeSection === "privacy" && (
            <DataPrivacySection
              onViewPolicy={() => setShowPrivacyPolicy(true)}
            />
          )}
          {activeSection === "account" && <AccountSection />}
        </div>
      </div>
    </div>
  );
}
