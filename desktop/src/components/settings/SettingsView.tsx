"use client";

import { ExportSection } from "./ExportSection";
import { BYOKSection } from "./BYOKSection";
import type { View } from "@/components/layout/MainNavSidebar";

interface SettingsViewProps {
  onViewChange: (view: View) => void;
}

export function SettingsView({ onViewChange }: SettingsViewProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
        <ExportSection onViewChange={onViewChange} />
        <div className="h-px bg-[#E6E5E3]" />
        <BYOKSection />
      </div>
    </div>
  );
}
