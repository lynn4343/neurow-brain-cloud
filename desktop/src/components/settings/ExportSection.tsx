"use client";

import { useState } from "react";
import { Export } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { exportData } from "@/lib/electron";
import { downloadJson } from "@/lib/download";

// ---------------------------------------------------------------------------
// ExportSection — Direct Supabase API (model-agnostic)
//
// Exports user data directly via IPC → Supabase REST API.
// No AI model in the loop. No view switching. Instant download.
//
// See: BUILD_SPECS/Direct_Profile_API_Spec.md
// ---------------------------------------------------------------------------

export function ExportSection() {
  const { activeUser } = useUser();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    if (!activeUser || isExporting) return;
    setIsExporting(true);
    setError(null);

    try {
      const data = await exportData(activeUser.id);
      const json = JSON.stringify(data, null, 2);
      const date = new Date().toISOString().split("T")[0];
      downloadJson(json, `brain-cloud-export-${activeUser.slug}-${date}.json`);
    } catch (err) {
      console.error("Export failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Export failed. Please try again.",
      );
    } finally {
      setIsExporting(false);
    }
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
      <Button
        onClick={handleExport}
        variant="outline"
        className="gap-2"
        disabled={isExporting || !activeUser}
      >
        <Export className="size-4" weight="bold" />
        {isExporting ? "Exporting..." : "Export My Data"}
      </Button>
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </section>
  );
}
