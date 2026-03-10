"use client";

import { useState, useEffect } from "react";
import { Terminal, Check, ArrowClockwise } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { checkChatAvailable } from "@/lib/electron";

// ---------------------------------------------------------------------------
// ClaudeCLISection — Claude Code CLI connection status + setup guidance
//
// Checks if Claude CLI is detected via IPC and shows status.
// Provides install instructions if not found.
// ---------------------------------------------------------------------------

export function ClaudeCLISection() {
  const [cliStatus, setCliStatus] = useState<"checking" | "detected" | "not-found">("checking");

  useEffect(() => {
    checkCli();
  }, []);

  async function checkCli() {
    setCliStatus("checking");
    try {
      const result = await Promise.race([
        checkChatAvailable(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 3000)
        ),
      ]);
      setCliStatus(result.mode === "cli" ? "detected" : "not-found");
    } catch {
      setCliStatus("not-found");
    }
  }

  return (
    <section>
      <h2 className="text-sm font-medium uppercase tracking-wider text-[#1E1E1E] mb-1">
        Claude CLI
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        If you have Claude Code CLI installed and authenticated, Neurow will use
        it automatically. No additional configuration needed.
      </p>

      {/* Status */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-[#1E1E1E]" weight="regular" />
          <span className="text-sm font-medium text-[#1E1E1E]">Status:</span>
        </div>
        {cliStatus === "checking" && (
          <span className="text-xs text-muted-foreground">Checking...</span>
        )}
        {cliStatus === "detected" && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600">
            <Check size={14} weight="bold" />
            Claude CLI detected
          </span>
        )}
        {cliStatus === "not-found" && (
          <span className="text-xs text-muted-foreground">Not detected</span>
        )}
        <Button
          variant="outline"
          size="sm"
          className="ml-auto gap-1.5"
          onClick={checkCli}
          disabled={cliStatus === "checking"}
        >
          <ArrowClockwise className="size-3.5" weight="regular" />
          Recheck
        </Button>
      </div>

      {/* Install instructions */}
      {cliStatus === "not-found" && (
        <div className="rounded-lg border border-[#E6E5E3] bg-[#FAFAF9] p-4 space-y-2">
          <p className="text-sm text-[#1E1E1E]">
            To connect via Claude CLI:
          </p>
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">
              1. Install Claude Code:{" "}
              <code className="rounded bg-[#F4F1F1] px-1.5 py-0.5 text-xs text-[#1e1e1e]">
                npm install -g @anthropic-ai/claude-code
              </code>
            </p>
            <p className="text-sm text-muted-foreground">
              2. Authenticate:{" "}
              <code className="rounded bg-[#F4F1F1] px-1.5 py-0.5 text-xs text-[#1e1e1e]">
                claude
              </code>
            </p>
            <p className="text-sm text-muted-foreground">
              3. Click <strong>Recheck</strong> above to verify.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
