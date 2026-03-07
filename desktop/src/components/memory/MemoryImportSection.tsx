"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MemoryImportModal } from "./MemoryImportModal";
import { FileImportModal } from "./FileImportModal";
import { useUser } from "@/contexts/UserContext";
import { BrainIcon } from "@/components/icons/BrainIcon";

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
      const payload = JSON.stringify({
        slug,
        content,
        fileName,
        recordCount,
        timestamp: new Date().toISOString(),
      });

      if (payload.length > 4 * 1024 * 1024) {
        console.warn(
          "Import payload exceeds 4MB, may fail to store in localStorage",
        );
      }

      try {
        localStorage.setItem(key, payload);
        window.dispatchEvent(new Event("neurow-import-ready"));
      } catch (err) {
        console.error("Failed to store file import:", err);
        return;
      }
      setFileImportOpen(false);
    },
    [activeUser?.slug],
  );

  return (
    <>
      <section>
        <div className="flex items-center gap-2.5">
          <BrainIcon className="size-7 text-[#1E1E1E] opacity-60" />
          <h2 className="font-albra text-2xl font-medium text-[#1E1E1E]">
            Brain Cloud
          </h2>
        </div>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          We structure and organize your data and memories into your own
          personal knowledge graph — connecting your information similar to how
          your brain stores it, for better insights and synthesis. Think of it
          as a cognitive extension, so you don&apos;t have to hold all that
          stuff in your head all the time. Brain Cloud does it for you.
        </p>
        <div className="space-y-6">
          {/* AI Memory Import */}
          <div>
            <h3 className="text-sm font-medium text-[#1E1E1E]">
              Import memory from other AI providers
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
              Import from file
            </h3>
            <div className="mt-1 flex items-start justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Import DTP exports, Google Takeout, or structured data files
                (.json, .jsonl) directly into Brain Cloud.
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
        onOpenChange={setFileImportOpen}
        onImport={handleFileImport}
      />
    </>
  );
}
