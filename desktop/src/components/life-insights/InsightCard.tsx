"use client";

import { Sparkle } from "@phosphor-icons/react";
import type { InsightData } from "@/lib/demo-data";

interface InsightCardProps {
  insight: InsightData;
}

export function InsightCard({ insight }: InsightCardProps) {
  const isWelcome = insight.type === "welcome";

  return (
    <div className="rounded-[12px] border border-[#E6E5E3] bg-white p-5 relative overflow-hidden">
      {/* Gradient left accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{
          background: "linear-gradient(180deg, #B997F8, #637DF5, #DEB4F2)",
        }}
      />

      <div className="pl-3">
        <div className="flex items-center gap-2 mb-3">
          <Sparkle
            size={16}
            weight="fill"
            className="text-[#6579EE]"
          />
          <span className="text-sm font-albra-sans font-semibold uppercase tracking-wide text-[#1E1E1E]">
            {isWelcome ? "Welcome" : "Cross-Domain Insight"}
          </span>
        </div>

        <p className="text-sm text-[#1E1E1E] leading-relaxed">
          {insight.text}
        </p>

        {!isWelcome && (insight.domains || insight.lastUpdated) && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F4F1F1]">
            {insight.domains && (
              <div className="flex items-center gap-1.5">
                {insight.domains.map((d) => (
                  <span
                    key={d}
                    className="text-[11px] font-medium text-[#6579EE] bg-[#6579EE]/[0.08] rounded-full px-2 py-0.5"
                  >
                    {d}
                  </span>
                ))}
              </div>
            )}
            {insight.lastUpdated && (
              <span className="text-[10px] text-[#949494] ml-auto">
                Updated {insight.lastUpdated}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
