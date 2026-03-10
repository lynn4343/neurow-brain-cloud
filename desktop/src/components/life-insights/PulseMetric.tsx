"use client";

import { cn } from "@/lib/utils";
import {
  ArrowUp,
  ArrowDown,
  Minus,
  Fire,
  Target,
  ChatCircle,
  Trophy,
  type IconProps,
} from "@phosphor-icons/react";
import type { PulseMetricData } from "@/lib/demo-data";

const METRIC_ICONS: Record<string, React.ComponentType<IconProps>> = {
  coachingStreak: Fire,
  top3Completion: Target,
  sessionsThisWeek: ChatCircle,
  winsCaptured: Trophy,
};

const METRIC_LABELS: Record<string, string> = {
  coachingStreak: "Streak",
  top3Completion: "Top 3 Rate",
  sessionsThisWeek: "Sessions",
  winsCaptured: "Wins",
};

interface PulseMetricProps {
  metricKey: string;
  data: PulseMetricData;
}

export function PulseMetric({ metricKey, data }: PulseMetricProps) {
  const Icon = METRIC_ICONS[metricKey];
  const label = METRIC_LABELS[metricKey] ?? metricKey;
  const hasData = data.value !== null;

  const trendColor =
    data.trend > 0
      ? "text-emerald-600"
      : data.trend < 0
      ? "text-rose-500"
      : "text-[#949494]";
  const TrendIcon = data.trend > 0 ? ArrowUp : data.trend < 0 ? ArrowDown : Minus;

  return (
    <div className="flex-1 min-w-[140px] rounded-[12px] border border-[#E6E5E3] bg-white p-4">
      <div className="flex items-center gap-1.5 mb-2">
        {Icon && <Icon size={14} weight="duotone" className="text-[#949494]" />}
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#949494]">
          {label}
        </span>
      </div>

      <div className="flex items-end gap-2">
        {hasData ? (
          <>
            <span className="text-2xl font-semibold text-[#1E1E1E]">
              {data.value}{data.isPercentage ? "%" : ""}
            </span>
            {data.trend !== 0 && (
              <div className={cn("flex items-center gap-0.5 text-xs font-medium mb-0.5", trendColor)}>
                <TrendIcon size={12} weight="bold" />
                <span>{Math.abs(data.trend)}{data.isPercentage ? "%" : ""}</span>
              </div>
            )}
          </>
        ) : (
          <span className="text-2xl font-semibold text-[#CACACA]">&mdash;</span>
        )}
      </div>

      {hasData && <span className="text-[11px] text-[#949494]">{data.unit}</span>}
    </div>
  );
}
