"use client";

import { useState, useCallback, useRef } from "react";
import { Check, File as FileIcon, X as XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// FileImportModal — DTP / structured file import
//
// Shared between onboarding and settings. Drop zone + file preview + import.
// Accepts .json (DTP standard) and .jsonl (hackathon format).
// ---------------------------------------------------------------------------

interface ParsedFile {
  name: string;
  format: "Hackathon JSONL" | "DTP JSON";
  content: string;
  recordCount: number;
}

interface FileImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (content: string, fileName: string, recordCount: number) => void;
}

function parseFile(file: File, text: string): ParsedFile | { error: string } {
  const isJsonl = file.name.endsWith(".jsonl");

  if (!file.name.endsWith(".json") && !isJsonl) {
    return { error: "This file format isn't supported. Brain Cloud accepts .json and .jsonl files." };
  }

  if (!text.trim()) {
    return { error: "This file appears to be empty." };
  }

  if (isJsonl) {
    const lines = text.split("\n").filter((l) => l.trim());
    // Validate that at least the first line parses as JSON
    try {
      JSON.parse(lines[0]);
    } catch {
      return { error: "This file doesn't appear to contain valid JSONL data." };
    }
    return {
      name: file.name,
      format: "Hackathon JSONL",
      content: text,
      recordCount: lines.length,
    };
  }

  // JSON file
  try {
    const parsed = JSON.parse(text);
    const count = Array.isArray(parsed) ? parsed.length : 1;
    return {
      name: file.name,
      format: "DTP JSON",
      content: text,
      recordCount: count,
    };
  } catch {
    return { error: "This file doesn't appear to contain valid JSON data." };
  }
}

export function FileImportModal({
  open,
  onOpenChange,
  onImport,
}: FileImportModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setParsedFile(null);
    try {
      const text = await file.text();
      const result = parseFile(file, text);
      if ("error" in result) {
        setError(result.error);
      } else {
        setParsedFile(result);
      }
    } catch {
      setError("Unable to read this file. Please try again.");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleImport = useCallback(() => {
    if (!parsedFile || added) return;
    onImport(parsedFile.content, parsedFile.name, parsedFile.recordCount);
    setAdded(true);
    setParsedFile(null);
  }, [parsedFile, added, onImport]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setParsedFile(null);
        setError(null);
        setIsDragging(false);
        setAdded(false);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const handleRemoveFile = useCallback(() => {
    setParsedFile(null);
    setError(null);
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#1E1E1E]">
            Import file to your Brain Cloud
          </DialogTitle>
          <DialogDescription className="text-sm text-[#5f5e5b]">
            Brain Cloud accepts DTP exports, Google Takeout, and structured data
            files.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone OR file preview */}
          {!parsedFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
                isDragging
                  ? "border-[#6579EE] bg-[#6579EE]/5"
                  : "border-[#E6E5E3]"
              }`}
            >
              <p className="text-sm text-[#5f5e5b]">
                Drop a .json or .jsonl file here
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-[#6579EE] underline underline-offset-2 transition-colors hover:text-[#4a5ec7]"
              >
                or click to browse
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.jsonl"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  // Reset input so the same file can be selected again
                  e.target.value = "";
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-[#E6E5E3] bg-[#FAF8F8] p-4">
              <FileIcon
                className="size-8 shrink-0 text-[#5f5e5b]"
                weight="regular"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#1E1E1E]">
                  {parsedFile.name}
                </p>
                <p className="text-xs text-[#5f5e5b]">
                  {parsedFile.format} &middot; {parsedFile.recordCount}{" "}
                  {parsedFile.recordCount === 1 ? "record" : "records"}
                </p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="shrink-0 rounded p-1 text-[#5f5e5b] transition-colors hover:bg-[#E6E5E3] hover:text-[#1E1E1E]"
                aria-label="Remove file"
              >
                <XIcon className="size-4" weight="regular" />
              </button>
            </div>
          )}

          {/* Error state */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parsedFile || added}
            className="bg-[#1E1E1E] text-white hover:bg-[#1E1E1E]/90"
          >
            {added ? (
              <>
                <Check className="size-3.5" weight="bold" />
                Added!
              </>
            ) : parsedFile ? (
              `Import ${parsedFile.recordCount} ${parsedFile.recordCount === 1 ? "record" : "records"} to your Brain Cloud`
            ) : (
              "Import to your Brain Cloud"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
