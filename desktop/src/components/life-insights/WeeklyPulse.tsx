"use client";

import type { PulseMetrics } from "@/lib/demo-data";
import { PulseMetric } from "./PulseMetric";

interface WeeklyPulseProps {
  metrics: PulseMetrics;
}

export function WeeklyPulse({ metrics }: WeeklyPulseProps) {
  const hasAnyData = Object.values(metrics).some((m) => m.value !== null);
  const metricEntries = Object.entries(metrics) as [string, typeof metrics.coachingStreak][];

  return (
    <section>
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#949494] mb-3">
        Weekly Pulse
      </h3>
      {hasAnyData ? (
        <div className="flex flex-wrap gap-3">
          {metricEntries.map(([key, data]) => (
            <PulseMetric key={key} metricKey={key} data={data} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#949494] mt-2">
          Your rhythm will appear after your first week of sessions.
        </p>
      )}
    </section>
  );
}
