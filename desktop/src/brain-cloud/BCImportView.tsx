"use client";

import { useState, useCallback } from "react";
import { DownloadSimple } from "@phosphor-icons/react";
import { MemoryImportModal } from "@/components/memory/MemoryImportModal";
import { FileImportModal } from "@/components/memory/FileImportModal";
import { BrainIcon } from "@/components/icons/BrainIcon";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";

interface FileEntry {
  content: string;
  fileName: string;
  recordCount: number;
  timestamp: string;
}

export function BCImportView() {
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
        setMemoryImportOpen(false);
      } catch (err) {
        console.error("Failed to store import data:", err);
      }
    },
    [activeUser?.slug],
  );

  const handleFileImport = useCallback(
    (content: string, fileName: string, recordCount: number) => {
      const slug = activeUser?.slug ?? "unknown";
      const key = `neurow_pending_file_import_${slug}`;
      const newEntry: FileEntry = {
        content,
        fileName,
        recordCount,
        timestamp: new Date().toISOString(),
      };
      const MAX_PENDING_FILES = 10;
      let files: FileEntry[] = [];
      try {
        const existing = localStorage.getItem(key);
        if (existing) {
          const parsed = JSON.parse(existing);
          files = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch {
        files = [];
      }
      files.push(newEntry);
      // Cap pending entries to prevent localStorage quota exhaustion
      while (files.length > MAX_PENDING_FILES) {
        files.shift();
      }
      try {
        localStorage.setItem(key, JSON.stringify(files));
      } catch (err) {
        console.error("Failed to store file import:", err);
      }
    },
    [activeUser?.slug],
  );

  const handleFileModalClose = useCallback(
    (open: boolean) => {
      setFileImportOpen(open);
      if (!open) {
        const slug = activeUser?.slug ?? "unknown";
        const existing = localStorage.getItem(
          `neurow_pending_file_import_${slug}`,
        );
        if (existing) window.dispatchEvent(new Event("neurow-import-ready"));
      }
    },
    [activeUser?.slug],
  );

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[500px] px-6 pt-12 pb-12 space-y-8">
          <div>
            <h2 className="font-albra text-[28px] font-medium leading-8 text-[#1e1e1e]">
              Import
            </h2>
            <p className="mt-1 text-sm text-[#5f5e5b]">
              Bring your data into Brain Cloud from anywhere.
            </p>
          </div>

          {/* Import from AI */}
          <div className="rounded-lg border border-[#e6e5e3] bg-white p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F1F1] flex-shrink-0">
                <BrainIcon className="size-5 text-[#1E1E1E]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1e1e1e]">
                  Import from AI
                </p>
                <p className="text-sm text-[#5f5e5b] mt-0.5">
                  Import memory from ChatGPT, Claude, Gemini, or any AI
                  provider.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!activeUser}
              onClick={() => setMemoryImportOpen(true)}
            >
              Start import
            </Button>
          </div>

          {/* Import from File */}
          <div className="rounded-lg border border-[#e6e5e3] bg-white p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F1F1] flex-shrink-0">
                <DownloadSimple
                  className="size-5 text-[#1E1E1E]"
                  weight="regular"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1e1e1e]">
                  Import from File
                </p>
                <p className="text-sm text-[#5f5e5b] mt-0.5">
                  Import .json or .jsonl files &mdash; Google
                  Takeout, DTP format.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!activeUser}
              onClick={() => setFileImportOpen(true)}
            >
              Import file
            </Button>
          </div>
        </div>
      </div>

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
