"use client";

import { useUser } from "@/contexts/UserContext";
import {
  getUserData,
  DOMAIN_HEALTH,
  QUARTERLY_GOALS,
  WEEKLY_PULSE,
  CROSS_DOMAIN_INSIGHT,
} from "@/lib/demo-data";
import { DomainHealthGrid } from "./DomainHealthGrid";
import { GoalProgress } from "./GoalProgress";
import { WeeklyPulse } from "./WeeklyPulse";
import { InsightCard } from "./InsightCard";
import { Compass } from "@phosphor-icons/react";

export function LifeInsightsView() {
  const { activeUser } = useUser();

  if (!activeUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAF8F8]">
        <p className="text-sm text-[#949494]">Loading...</p>
      </div>
    );
  }

  const slug = activeUser.slug;
  const firstName = activeUser.display_name?.split(" ")[0] ?? "there";

  const domains = getUserData(DOMAIN_HEALTH, slug);
  const goals = getUserData(QUARTERLY_GOALS, slug);
  const pulse = getUserData(WEEKLY_PULSE, slug);
  const insight = getUserData(CROSS_DOMAIN_INSIGHT, slug);

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAF8F8] relative">
      {/* Ambient radial gradient — matches onboarding */}
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
      <div className="relative z-10 max-w-[1120px] mx-auto px-8 pt-6 pb-16 space-y-8">
        {/* Greeting + Time Toggle */}
        <div>
          <h2 className="font-albra text-4xl font-medium text-[#1E1E1E] flex items-center gap-3">
            <Compass size={36} weight="fill" className="text-[#1E1E1E]" />
            Hey, {firstName}
          </h2>
          <p className="text-sm text-[#949494] mt-0.5">
            Here&apos;s how your life is looking.
          </p>
        </div>

        {/* Section 1: Cross-Domain Insight */}
        <InsightCard insight={insight} />

        {/* Section 2: Domain Health */}
        <DomainHealthGrid domains={domains} />

        {/* Section 3: Goal Progress */}
        <GoalProgress goals={goals} />

        {/* Section 4: Weekly Pulse */}
        <WeeklyPulse metrics={pulse} />
      </div>
    </div>
  );
}
