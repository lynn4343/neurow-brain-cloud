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
// Extraction prompt — Anthropic's battle-tested format (5 categories, strict
// date format). Proven at scale across ChatGPT, Gemini, etc. See W5-3A spec
// for comparison with our original 7-header custom version.
// ---------------------------------------------------------------------------

const EXTRACTION_PROMPT = `Export all of my stored memories and any context you've learned about me from past conversations. Preserve my words verbatim where possible, especially for instructions and preferences.

## Categories (output in this order):

1. **Instructions**: Rules I've explicitly asked you to follow going forward — tone, format, style, "always do X", "never do Y", and corrections to your behavior. Only include rules from stored memories, not from conversations.

2. **Identity**: Name, age, location, education, family, relationships, languages, and personal interests.

3. **Career**: Current and past roles, companies, and general skill areas.

4. **Projects**: Projects I meaningfully built or committed to. Ideally ONE entry per project. Include what it does, current status, and any key decisions. Use the project name or a short descriptor as the first words of the entry.

5. **Preferences**: Opinions, tastes, and working-style preferences that apply broadly.

## Format:

Use section headers for each category. Within each category, list one entry per line, sorted by oldest date first. Format each line as:

[YYYY-MM-DD] - Entry content here.

If no date is known, use [unknown] instead.

## Output:
- Wrap the entire export in a single code block for easy copying.
- After the code block, state whether this is the complete set or if more remain.`;

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
