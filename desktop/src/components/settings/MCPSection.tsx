"use client";

import { SealCheck, ArrowsClockwise } from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// MCPSection — MCP protocol status + connected apps
//
// Informational card showing Brain Cloud's MCP layer:
// - Protocol status (active)
// - Connected apps (Neurow)
// - Available tools
// Ties into Brain Cloud standalone app which shows the same connections.
// ---------------------------------------------------------------------------

const MCP_TOOLS = [
  { name: "brain_remember", description: "Store memories" },
  { name: "brain_recall", description: "Retrieve memories" },
  { name: "brain_export", description: "Export all data" },
  { name: "brain_create_profile", description: "Create user" },
  { name: "brain_update_profile", description: "Update profile" },
  { name: "coaching_get_prompt", description: "Coaching turns" },
  { name: "coaching_store_turn", description: "Store turn data" },
  { name: "coaching_get_session_prompt", description: "Session prompts" },
];

export function MCPSection() {
  return (
    <section>
      <h2 className="text-sm font-medium uppercase tracking-wider text-[#1E1E1E] mb-1">
        MCP Protocol
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Brain Cloud uses MCP (Model Context Protocol) &mdash; an open standard
        that lets any AI connect to your personal knowledge graph. Your data is
        never locked into a single provider.
      </p>

      <div className="rounded-lg border border-[#E6E5E3] bg-[#FAFAF9] p-5 space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowsClockwise className="size-4 text-[#1E1E1E]" weight="regular" />
            <span className="text-sm font-medium text-[#1E1E1E]">Protocol Status</span>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>

        {/* Connected Apps */}
        <div>
          <p className="text-xs font-medium text-[#5f5e5b] uppercase tracking-wider mb-2">
            Connected Apps
          </p>
          <div className="flex items-center gap-3 rounded-md border border-[#E6E5E3] bg-white px-3 py-2.5">
            <SealCheck className="size-4 text-emerald-500" weight="fill" />
            <span className="text-sm font-medium text-[#1E1E1E]">Neurow</span>
            <span className="text-xs text-muted-foreground ml-auto">via stdio</span>
          </div>
        </div>

        {/* Available Tools */}
        <div>
          <p className="text-xs font-medium text-[#5f5e5b] uppercase tracking-wider mb-2">
            Available Tools
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {MCP_TOOLS.map((tool) => (
              <div key={tool.name} className="flex items-baseline gap-2 text-xs">
                <code className="rounded bg-[#F4F1F1] px-1.5 py-0.5 text-[11px] text-[#1e1e1e] font-mono">
                  {tool.name}
                </code>
                <span className="text-muted-foreground truncate">{tool.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
