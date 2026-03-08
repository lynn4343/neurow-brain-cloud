"use client";

import { useState, useCallback, useRef } from "react";
import { NeurowLogo } from "@/components/icons/NeurowLogo";
import { OnboardingLayout } from "./OnboardingLayout";
import { MemoryImportModal } from "@/components/memory/MemoryImportModal";
import { FileImportModal } from "@/components/memory/FileImportModal";
import { useUser } from "@/contexts/UserContext";

// ---------------------------------------------------------------------------
// MemoryImportStep — onboarding placement for AI memory + file import
//
// Appears after profile creation, before onboarding screens.
// Two import paths: "Import from AI" (primary) + "Import file" (secondary).
// "Skip for now" advances directly to onboarding screens.
// ---------------------------------------------------------------------------

interface MemoryImportStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function MemoryImportStep({ onComplete, onSkip }: MemoryImportStepProps) {
  const [memoryImportOpen, setMemoryImportOpen] = useState(false);
  const [fileImportOpen, setFileImportOpen] = useState(false);
  const { activeUser } = useUser();
  const filesImportedRef = useRef(false);

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
      onComplete();
    },
    [activeUser?.slug, onComplete],
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
            files = [parsed];
          }
        }
      } catch {
        files = [];
      }

      files.push(newEntry);

      try {
        localStorage.setItem(key, JSON.stringify(files));
        filesImportedRef.current = true;
      } catch (err) {
        console.error("Failed to store file import:", err);
        // Surface the failure so the user knows data wasn't persisted
        alert("Import failed to save. Your browser storage may be full. Please try a smaller file or clear some space.");
      }

      // Modal stays open for more files — event dispatched on modal close
    },
    [activeUser?.slug],
  );

  // When file import modal closes AND files were imported this session, advance onboarding
  const handleFileModalClose = useCallback(
    (open: boolean) => {
      setFileImportOpen(open);
      if (!open && filesImportedRef.current) {
        try {
          const slug = activeUser?.slug ?? "unknown";
          const key = `neurow_pending_file_import_${slug}`;
          const existing = localStorage.getItem(key);
          if (existing) {
            window.dispatchEvent(new Event("neurow-import-ready"));
            onComplete();
          }
        } catch (err) {
          console.error("Failed to read file import data:", err);
        } finally {
          filesImportedRef.current = false;
        }
      }
    },
    [activeUser?.slug, onComplete],
  );

  return (
    <>
      <OnboardingLayout>
        <div className="flex flex-col items-center gap-6">
          <NeurowLogo className="h-[69px] w-[49px]" />

          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="font-albra text-[28px] font-medium leading-8 text-[#1e1e1e]">
              Your Life Operating System should
              <br />
              <em className="font-medium italic">know you from day one.</em>
            </h1>
            <p className="w-full text-justify text-sm leading-5 text-[#5f5e5b]">
              You&apos;ve spent months — maybe years — working with AI
              assistants, apps, and platforms. All that context shouldn&apos;t
              stay locked away. With one import, we build a knowledge graph in
              your own Brain Cloud — so your first session feels like your
              hundredth. And your Brain Cloud goes wherever you go.
            </p>
          </div>

          <div className="flex w-full max-w-[450px] flex-col items-center gap-3 pt-4">
            <button
              onClick={() => setMemoryImportOpen(true)}
              className="h-11 w-full rounded-lg bg-[#1e1e1e] text-sm font-medium text-white transition-all duration-200 hover:bg-[#1e1e1e]/90"
              style={{
                boxShadow: "-4px 5px 30px rgba(101, 121, 238, 0.5)",
              }}
            >
              Import from another AI (ChatGPT, Claude, Gemini, etc.)
            </button>
            <button
              onClick={() => setFileImportOpen(true)}
              className="h-11 w-full rounded-lg border border-[#E6E5E3] bg-white text-sm font-medium text-[#1e1e1e] transition-all duration-200 hover:bg-[#FAF8F8]"
              style={{
                boxShadow: "-4px 5px 30px rgba(101, 121, 238, 0.5)",
              }}
            >
              Import .json or .jsonl file (Google Takeout, etc.)
            </button>
            <button
              onClick={onSkip}
              className="mt-1 text-sm text-[#5f5e5b] underline underline-offset-2 transition-colors hover:text-[#1e1e1e]"
            >
              Skip for now
            </button>
            <p className="mt-3 text-sm" style={{ color: "#7a90da" }}>
              You can always import from settings.
            </p>
          </div>
        </div>
      </OnboardingLayout>

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
