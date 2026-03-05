"use client";

import { Export } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import type { View } from "@/components/layout/MainNavSidebar";

interface ExportSectionProps {
  onViewChange: (view: View) => void;
}

export function ExportSection({ onViewChange }: ExportSectionProps) {
  const { setPendingChatAction } = useUser();

  function handleExport() {
    setPendingChatAction("Export my data");
    onViewChange("chat");
  }

  return (
    <section>
      <h2 className="text-sm font-medium uppercase tracking-wider text-[#1E1E1E] mb-1">
        Your Data
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Export your complete Brain Cloud as a portable JSON file.
        Everything about you is yours.
      </p>
      <Button onClick={handleExport} variant="outline" className="gap-2">
        <Export className="size-4" weight="bold" />
        Export My Data
      </Button>
    </section>
  );
}
