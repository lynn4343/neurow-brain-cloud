"use client";

import { useState } from "react";
import { Export, Check, X as XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { exportData, saveJsonFile } from "@/lib/electron";

// ---------------------------------------------------------------------------
// BCExportView — Brain Cloud standalone export page
//
// Mirrors the BCImportView layout pattern. Reuses the exact same export
// pipeline as the Neurow ExportSection: exportData() → saveJsonFile().
// ---------------------------------------------------------------------------

interface ExportResult {
  memoryCount: number;
  sessionCount: number;
  categoryCount: number;
  filename: string;
  filePath: string;
}

export function BCExportView() {
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
        sessionCount: Array.isArray(data.coaching_sessions)
          ? data.coaching_sessions.length
          : 0,
        categoryCount: Array.isArray(data.metadata?.categories)
          ? data.metadata.categories.length
          : 0,
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

  const isEmpty =
    exportResult !== null &&
    exportResult.memoryCount === 0 &&
    exportResult.sessionCount === 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[500px] px-6 pt-12 pb-12 space-y-8">
        {/* Header */}
        <div>
          <h2 className="font-albra text-[28px] font-medium leading-8 text-[#1e1e1e]">
            Export
          </h2>
          <p className="mt-1 text-sm text-[#5f5e5b]">
            Take your data with you. Everything about you is yours.
          </p>
        </div>

        {/* Export card */}
        <div className="rounded-lg border border-[#e6e5e3] bg-white p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F1F1] flex-shrink-0">
              <Export className="size-5 text-[#1E1E1E]" weight="regular" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1e1e1e]">
                Export to JSON
              </p>
              <p className="text-sm text-[#5f5e5b] mt-0.5">
                Structured JSON &mdash; your memories, coaching history, and
                profile. Yours to keep.
              </p>
            </div>
          </div>

          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isExporting || !activeUser}
          >
            <Export className="size-4" weight="bold" />
            {isExporting ? "Exporting..." : "Export My Data"}
          </Button>

          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        </div>

        {/* Success card */}
        {exportResult && (
          <div className="rounded-lg border border-[#e6e5e3] bg-white p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-5 items-center justify-center rounded-full bg-green-100">
                  <Check className="size-3 text-green-600" weight="bold" />
                </div>
                <span className="text-sm font-medium text-[#1E1E1E]">
                  Export complete
                </span>
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
                  Your Brain Cloud is empty &mdash; start a coaching session to
                  build your memory.
                </p>
              ) : (
                <p className="text-sm text-[#5f5e5b]">
                  {exportResult.memoryCount}{" "}
                  {exportResult.memoryCount === 1 ? "memory" : "memories"}
                  {exportResult.categoryCount > 0 && (
                    <>
                      {" "}
                      across {exportResult.categoryCount}{" "}
                      {exportResult.categoryCount === 1
                        ? "category"
                        : "categories"}
                    </>
                  )}
                  {" · "}
                  {exportResult.sessionCount} coaching{" "}
                  {exportResult.sessionCount === 1 ? "session" : "sessions"}
                </p>
              )}
              <p className="text-xs text-[#8e8b86] font-mono break-all">
                {exportResult.filePath}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
