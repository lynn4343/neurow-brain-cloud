"use client";

import Image from "next/image";
import { Terminal } from "@phosphor-icons/react";
import { BrainIcon } from "@/components/icons/BrainIcon";
import { useUser } from "@/contexts/UserContext";
import type { BCView } from "./BrainCloudSidebar";

interface DashboardViewProps {
  onNavigate: (view: BCView) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { activeUser } = useUser();
  const displayName = activeUser?.display_name;

  return (
    <div className="flex-1 overflow-y-auto relative">
      {/* Background ambient ellipse — same as onboarding */}
      <div
        className="pointer-events-none absolute left-1/2 top-[60px] z-0 -translate-x-1/2 rounded-full"
        style={{
          width: 607,
          height: 607,
          background:
            "linear-gradient(313deg, rgba(178,160,232,0.2) 0%, rgba(178,200,255,0.2) 50%, rgba(232,178,220,0.2) 100%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[450px] px-6 pt-16 pb-12 space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <Image
            src="/brain-cloud-mark.svg"
            alt="Brain Cloud"
            width={56}
            height={40}
            className="h-10 w-auto mb-1"
          />
          <h1 className="font-albra text-[28px] font-medium leading-8 text-[#1e1e1e]">
            {displayName ? `${displayName}\u2019s Brain Cloud` : "Your Brain Cloud"}
          </h1>
          <p className="text-sm text-[#5f5e5b]">
            Your personal knowledge graph
          </p>
        </div>

        {/* Memory Count Card */}
        <div className="rounded-lg border border-[#e6e5e3] bg-white p-8 text-center">
          <p className="font-albra text-[72px] font-medium leading-none text-[#1e1e1e]">
            193
          </p>
          <p className="mt-2 text-sm text-[#5f5e5b]">memories stored</p>
        </div>

        {/* Connected Apps Preview Card */}
        <button
          onClick={() => onNavigate("connected-apps")}
          className="w-full rounded-lg border border-[#e6e5e3] bg-white p-5 text-left transition-all duration-200 hover:border-[#c9c8c6] hover:shadow-sm active:scale-[0.99]"
        >
          <p className="text-sm font-medium text-[#1e1e1e] mb-3">
            2 apps connected
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F4F1F1]">
                <BrainIcon className="size-4 text-[#1E1E1E]" />
              </div>
              <span className="text-xs text-[#5f5e5b]">Neurow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F4F1F1]">
                <Terminal
                  className="size-4 text-[#1E1E1E]"
                  weight="regular"
                />
              </div>
              <span className="text-xs text-[#5f5e5b]">Claude Code</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#6579EE]">
            View Connected Apps &rarr;
          </p>
        </button>
      </div>
    </div>
  );
}
