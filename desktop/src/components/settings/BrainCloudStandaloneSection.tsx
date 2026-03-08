"use client";

import { Plugs } from "@phosphor-icons/react";
import { useUser } from "@/contexts/UserContext";

export function BrainCloudStandaloneSection() {
  const { activeUser } = useUser();
  return (
    <section>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-sm font-medium uppercase tracking-wider text-[#1E1E1E]">
          Brain Cloud Standalone
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Your personal knowledge graph, independent of Neurow.
      </p>

      <div className="rounded-lg border border-[#E6E5E3] bg-[#FAFAF9] p-5">
        <div className="flex gap-4">
          <div className="flex-shrink-0 flex items-start pt-0.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F1F1]">
              <Plugs className="size-5 text-[#1E1E1E]" weight="regular" />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-[#1E1E1E] leading-relaxed">
              Connect any AI service directly to your personal knowledge graph.
              Your coaching history, memories, and behavioral insights,
              accessible from any AI provider you choose.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Brain Cloud uses MCP &mdash; an open protocol that works with any
              AI model. Your data is never locked in.
            </p>
            <button
              onClick={() => window.neurow?.openBrainCloud?.(activeUser?.slug)}
              className="h-11 rounded-lg bg-[#1e1e1e] px-6 text-sm font-medium text-white transition-all duration-200 hover:bg-[#1e1e1e]/90"
              style={{
                boxShadow: "-4px 5px 30px rgba(101, 121, 238, 0.5)",
              }}
            >
              Open Brain Cloud
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
