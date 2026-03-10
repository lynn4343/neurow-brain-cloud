"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MemoryImportModal } from "./MemoryImportModal";
import { FileImportModal } from "./FileImportModal";
import { useUser } from "@/contexts/UserContext";

// ---------------------------------------------------------------------------
// MemoryImportSection — settings placement for AI memory + file import
//
// Rendered in SettingsView as the "Brain Cloud" section.
// Two rows: AI memory import + file import, each opening their modal.
// ---------------------------------------------------------------------------

export function MemoryImportSection() {
  const [memoryImportOpen, setMemoryImportOpen] = useState(false);
  const [fileImportOpen, setFileImportOpen] = useState(false);
  const { activeUser } = useUser();

  const handleMemoryImport = useCallback(
    (text: string) => {
      const slug = activeUser?.slug ?? "unknown";
      const key = `neurow_pending_import_${slug}`;
      try {
        localStorage.setItem(
          key,
          JSON.stringify({ slug, text, timestamp: new Date().toISOString() }),
        );
        window.dispatchEvent(new Event("neurow-import-ready"));
      } catch (err) {
        console.error("Failed to store import data:", err);
      }
      setMemoryImportOpen(false);
    },
    [activeUser?.slug],
  );

  const handleFileImport = useCallback(
    (content: string, fileName: string, recordCount: number) => {
      const slug = activeUser?.slug ?? "unknown";
      const key = `neurow_pending_file_import_${slug}`;

      const newEntry = {
        content,
        fileName,
        recordCount,
        timestamp: new Date().toISOString(),
      };

      // Accumulate: read existing array, append new entry
      let files: Array<typeof newEntry> = [];
      try {
        const existing = localStorage.getItem(key);
        if (existing) {
          const parsed = JSON.parse(existing);
          if (Array.isArray(parsed)) {
            files = parsed;
          } else if (parsed.content) {
            // Old format: single object → wrap in array
            files = [parsed];
          }
        }
      } catch {
        files = [];
      }

      files.push(newEntry);

      const payload = JSON.stringify(files);

      if (payload.length > 4 * 1024 * 1024) {
        console.warn(
          "Import payload exceeds 4MB, may fail to store in localStorage",
        );
      }

      try {
        localStorage.setItem(key, payload);
      } catch (err) {
        console.error("Failed to store file import:", err);
        return;
      }

      // Modal stays open for more files — event dispatched on modal close
    },
    [activeUser?.slug],
  );

  // When file import modal closes AND files were imported, trigger processing
  const handleFileModalClose = useCallback(
    (open: boolean) => {
      setFileImportOpen(open);
      if (!open) {
        const slug = activeUser?.slug ?? "unknown";
        const key = `neurow_pending_file_import_${slug}`;
        const existing = localStorage.getItem(key);
        if (existing) {
          window.dispatchEvent(new Event("neurow-import-ready"));
        }
      }
    },
    [activeUser?.slug],
  );

  return (
    <>
      <section>
        <div className="space-y-6">
          {/* AI Memory Import */}
          <div>
            <h3 className="text-sm font-medium text-[#1E1E1E]">
              IMPORT memory from other AI providers
            </h3>
            <div className="mt-1 flex items-start justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Bring relevant context and data from other AI providers to
                Neurow. We&apos;ll provide a prompt you can use to fetch the
                memory from your other account. Brain Cloud turns flat memories
                into a connected knowledge graph.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setMemoryImportOpen(true)}
              >
                Start import
              </Button>
            </div>
          </div>

          {/* File Import */}
          <div>
            <h3 className="text-sm font-medium text-[#1E1E1E]">
              IMPORT from file
            </h3>
            <div className="mt-1 flex items-start justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Import .json and .jsonl files from Google Takeout, ChatGPT,
                Meta, and other services directly into Brain Cloud.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setFileImportOpen(true)}
              >
                Import file
              </Button>
            </div>
          </div>
        </div>
      </section>

      <MemoryImportModal
        open={memoryImportOpen}
        onOpenChange={setMemoryImportOpen}
        onImport={handleMemoryImport}
      />
      <FileImportModal
        open={fileImportOpen}
        onOpenChange={handleFileModalClose}
        onImport={handleFileImport}
      />
    </>
  );
}
