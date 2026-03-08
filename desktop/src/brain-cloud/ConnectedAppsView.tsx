"use client";

import { useState } from "react";
import { Terminal, Plus } from "@phosphor-icons/react";
import { Switch } from "@/components/ui/switch";
import { BrainIcon } from "@/components/icons/BrainIcon";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// AppCard — a connected app with toggle switch
// ---------------------------------------------------------------------------

interface AppCardProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  connected: boolean;
  onToggle: (v: boolean) => void;
}

function AppCard({
  icon,
  name,
  description,
  connected,
  onToggle,
}: AppCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[#e6e5e3] bg-white p-5 transition-all duration-200",
        !connected && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F1F1] flex-shrink-0">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-[#1e1e1e]">{name}</p>
            <p className="text-sm text-[#5f5e5b]">{description}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  connected ? "bg-green-500" : "bg-[#a8a49c]",
                )}
              />
              <span
                className={cn(
                  "text-xs",
                  connected ? "text-green-600" : "text-[#a8a49c]",
                )}
              >
                {connected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
        <Switch
          checked={connected}
          onCheckedChange={onToggle}
          aria-label={`Toggle ${name} connection`}
          className="mt-0.5"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConnectedAppsView
// ---------------------------------------------------------------------------

export function ConnectedAppsView() {
  const [neurowConnected, setNeurowConnected] = useState(true);
  const [claudeCodeConnected, setClaudeCodeConnected] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[600px] px-6 pt-12 pb-12 space-y-6">
        {/* Header */}
        <div>
          <h2 className="font-albra text-[28px] font-medium leading-8 text-[#1e1e1e]">
            Connected Apps
          </h2>
          <p className="mt-1 text-sm text-[#5f5e5b]">
            Control which AI services access your Brain Cloud via MCP.
          </p>
        </div>

        {/* App cards */}
        <div className="space-y-3">
          <AppCard
            icon={<BrainIcon className="size-5 text-[#1E1E1E]" />}
            name="Neurow"
            description="Coaching & Life Operating System"
            connected={neurowConnected}
            onToggle={setNeurowConnected}
          />
          <AppCard
            icon={
              <Terminal
                className="size-5 text-[#1E1E1E]"
                weight="regular"
              />
            }
            name="Claude Code"
            description="AI Assistant (Terminal)"
            connected={claudeCodeConnected}
            onToggle={setClaudeCodeConnected}
          />
        </div>

        {/* Add App — informational */}
        <div className="rounded-lg border border-dashed border-[#c9c8c6] p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Plus className="size-4 text-[#a8a49c]" weight="regular" />
            <p className="text-sm font-medium text-[#1e1e1e]">
              Connect a New App
            </p>
          </div>
          <p className="text-sm text-[#5f5e5b]">
            Any AI agent with MCP support can connect to your Brain Cloud.
          </p>
          <p className="text-xs text-[#a8a49c]">
            Brain Cloud speaks MCP &mdash; an open protocol. Your knowledge
            graph works with any compatible AI.
          </p>
        </div>
      </div>
    </div>
  );
}
