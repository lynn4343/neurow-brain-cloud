"use client";

import { MemoryImportSection } from "@/components/memory/MemoryImportSection";
import { ExportSection } from "./ExportSection";
import { BYOKSection } from "./BYOKSection";

export function SettingsView() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
        <MemoryImportSection />
        <div className="h-px bg-[#E6E5E3]" />
        <ExportSection />
        <div className="h-px bg-[#E6E5E3]" />
        <BYOKSection />
      </div>
    </div>
  );
}
