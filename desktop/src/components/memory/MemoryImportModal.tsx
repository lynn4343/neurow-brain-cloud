"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// Extraction prompt — 7 structured headers map to Brain Cloud's knowledge graph.
// The modal shows a SHORT summary for clean UX. Copy sends the FULL prompt.
// ---------------------------------------------------------------------------

const EXTRACTION_PROMPT = `I'm consolidating my data across AI services and need to export everything you know about me. List every memory you have stored about me, as well as any context you've learned from our conversations. Output everything in a single code block so I can easily copy it.

Organize entries under these headers:

## My Instructions to You
How I've asked you to respond — tone, format, style, recurring instructions, "always do X" or "never do Y" rules.

## Personal Details
Name, location, job/role, family, relationships, key life facts.

## Goals & Projects
Active projects, goals I've mentioned, recurring topics, things I'm working toward.

## Tools & Preferences
Tools, apps, languages, frameworks, workflows I use or prefer.

## Patterns & Insights
Behavioral patterns you've noticed, recurring themes, things I tend to do or avoid, communication style, decision-making tendencies.

## Corrections & Feedback
Times I've corrected you, preferences I've stated, things you should or shouldn't do based on my feedback.

## Everything Else
Any stored context not covered above.

For each entry: preserve my exact words where possible. Include dates if available. Do not summarize, group, or omit any entries.

After the code block, confirm: is this the complete set, or are there more?`;

export { EXTRACTION_PROMPT };

// ---------------------------------------------------------------------------
// MemoryImportModal — shared between onboarding and settings
// ---------------------------------------------------------------------------

interface MemoryImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (text: string) => void;
}

export function MemoryImportModal({
  open,
  onOpenChange,
  onImport,
}: MemoryImportModalProps) {
  const [copied, setCopied] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [added, setAdded] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(EXTRACTION_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }, []);

  const handleImport = useCallback(() => {
    if (!pastedText.trim() || added) return;
    onImport(pastedText.trim());
    setAdded(true);
    setPastedText("");
  }, [pastedText, added, onImport]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setPastedText("");
        setCopied(false);
        setAdded(false);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#1E1E1E]">
            Import memory to your Brain Cloud
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1 — Copy prompt */}
          <div className="flex gap-4">
            <span className="mt-0.5 text-base font-semibold text-[#1E1E1E]">
              1
            </span>
            <div className="flex-1 space-y-3">
              <p className="text-sm leading-relaxed text-[#5f5e5b]">
                Copy this prompt into a chat with your other AI provider
              </p>
              <div className="relative rounded-lg border border-[#E6E5E3] bg-[#FAF8F8] p-4 pb-14">
                <p className="text-sm leading-relaxed text-[#5f5e5b]">
                  Export all of my stored memories and any context you&apos;ve
                  learned about me from past conversations. Preserve my words
                  verbatim where possible, especially for instructions and
                  preferences.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute bottom-3 right-3"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5" weight="bold" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" weight="regular" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Step 2 — Paste response */}
          <div className="flex gap-4">
            <span className="mt-0.5 text-base font-semibold text-[#1E1E1E]">
              2
            </span>
            <div className="flex-1 space-y-3">
              <p className="text-sm leading-relaxed text-[#5f5e5b]">
                Paste results below to add to your Brain Cloud
              </p>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                aria-label="Paste your memory details here"
                placeholder="Paste your memory details here"
                rows={8}
                className="w-full resize-none rounded-lg border border-[#E6E5E3] bg-[#FAF8F8] p-4 text-sm leading-relaxed text-[#1E1E1E] placeholder:text-[#a8a49c] focus:border-[#6579EE] focus:outline-none focus:ring-2 focus:ring-[#6579EE]/20"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!pastedText.trim() || added}
            className="bg-[#1E1E1E] text-white hover:bg-[#1E1E1E]/90"
          >
            {added ? (
              <>
                <Check className="size-3.5" weight="bold" />
                Added!
              </>
            ) : (
              "Add to your Brain Cloud"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
