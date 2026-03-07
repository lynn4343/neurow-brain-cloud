"use client";

import { Plugs } from "@phosphor-icons/react";

export function BrainCloudStandaloneSection() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-sm font-medium uppercase tracking-wider text-[#1E1E1E]">
          Brain Cloud Standalone
        </h2>
        <span className="rounded-full bg-[#F4F1F1] px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          Coming Soon
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Take your Brain Cloud with you.
      </p>

      <div className="rounded-lg border border-[#E6E5E3] bg-[#FAFAF9] p-5">
        <div className="flex gap-4">
          <div className="flex-shrink-0 flex items-start pt-0.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F1F1]">
              <Plugs className="size-5 text-[#1E1E1E]" weight="regular" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-[#1E1E1E] leading-relaxed">
              Connect any AI service directly to your personal knowledge graph
              &mdash; without Neurow. Your coaching history, memories, and
              behavioral insights, accessible from any AI provider you choose.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Brain Cloud uses MCP &mdash; an open protocol that works with any
              AI model. Your data is never locked in.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
