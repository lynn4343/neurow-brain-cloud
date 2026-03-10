"use client";

import { useState } from "react";
import { Export, Check, X as XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { exportData, saveJsonFile } from "@/lib/electron";

// ---------------------------------------------------------------------------
// ExportSection — Direct Supabase API (model-agnostic)
//
// Exports user data directly via IPC → Supabase REST API.
// No AI model in the loop. No view switching. Instant download.
// Post-export: success card with counts, filename, and location guidance.
//
// See: BUILD_SPECS/Direct_Profile_API_Spec.md
//      BUILD_SPECS/Wave_5/W5-4_Export_UX_Spec.md
// ---------------------------------------------------------------------------

interface ExportResult {
  memoryCount: number;
  sessionCount: number;
  categoryCount: number;
  filename: string;
  filePath: string;
}

export function ExportSection() {
  const { activeUser } = useUser();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);

  async function handleExport() {
    if (!activeUser || isExporting) return;
    setIsExporting(true);
    setError(null);
    setExportResult(null);

    try {
      const data = await exportData(activeUser.id);
      const json = JSON.stringify(data, null, 2);
      const date = new Date().toISOString().split("T")[0];
      const filename = `brain-cloud-export-${activeUser.slug}-${date}.json`;
      const saveResult = await saveJsonFile(json, filename);
      if (!saveResult.saved) {
        setIsExporting(false);
        return; // User cancelled save dialog
      }

      setExportResult({
        memoryCount: Array.isArray(data.episodic) ? data.episodic.length : 0,
        sessionCount: Array.isArray(data.coaching_sessions) ? data.coaching_sessions.length : 0,
        categoryCount: Array.isArray(data.metadata?.categories) ? data.metadata.categories.length : 0,
        filename,
        filePath: saveResult.filePath!,
      });
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

  const isEmpty = exportResult !== null
    && exportResult.memoryCount === 0
    && exportResult.sessionCount === 0;

  return (
    <section>
      <h2 className="font-albra text-xl font-medium text-[#1E1E1E] mb-1">
        Export Your Data
      </h2>
      <p className="text-sm text-muted-foreground mb-1.5">
        Export your data as a portable JSON file. Everything about you is yours.
      </p>
      <p className="text-sm text-muted-foreground mb-4">
        Structured JSON — your memories, coaching history, and profile. Yours to keep.
      </p>

      {/* Success card */}
      {exportResult && (
        <div className="rounded-lg border border-[#E6E5E3] bg-[#FAF8F8]/50 p-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-5 items-center justify-center rounded-full bg-green-100">
                <Check className="size-3 text-green-600" weight="bold" />
              </div>
              <span className="text-sm font-medium text-[#1E1E1E]">Export complete</span>
            </div>
            <button
              onClick={() => setExportResult(null)}
              className="text-[#8e8b86] hover:text-[#5f5e5b] transition-colors"
              aria-label="Dismiss export notification"
            >
              <XIcon className="size-3.5" weight="bold" />
            </button>
          </div>

          <div className="mt-3 space-y-1 pl-7">
            {isEmpty ? (
              <p className="text-sm text-[#5f5e5b]">
                Your Brain Cloud is empty — start a coaching session to build your memory.
              </p>
            ) : (
              <p className="text-sm text-[#5f5e5b]">
                {exportResult.memoryCount} {exportResult.memoryCount === 1 ? "memory" : "memories"}
                {exportResult.categoryCount > 0 && (
                  <> across {exportResult.categoryCount} {exportResult.categoryCount === 1 ? "category" : "categories"}</>
                )}
                {" · "}
                {exportResult.sessionCount} coaching {exportResult.sessionCount === 1 ? "session" : "sessions"}
              </p>
            )}
            <p className="text-xs text-[#8e8b86] font-mono break-all">{exportResult.filePath}</p>
          </div>
        </div>
      )}

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
