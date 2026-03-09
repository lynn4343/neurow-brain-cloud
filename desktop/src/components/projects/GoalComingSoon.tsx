"use client";

import { NeurowLogo } from "@/components/icons/NeurowLogo";

interface GoalComingSoonProps {
  subtitle?: string;
}

export function GoalComingSoon({ subtitle = "YOUR GOALS DASHBOARD" }: GoalComingSoonProps) {
  return (
    <div className="relative flex-1 overflow-hidden bg-[#faf8f8] flex items-center justify-center p-10">
      {/* Card with gradient background */}
      <div
        className="relative w-full max-w-[680px] aspect-[4/3] rounded-2xl overflow-hidden"
        style={{
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)",
        }}
      >
        {/* Card background */}
        <div className="absolute inset-0 bg-[#faf8f8]" />

        {/* Blurred ellipse — matches onboarding BackgroundEllipse */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 500,
            height: 500,
            background:
              "linear-gradient(313deg, rgba(178,160,232,0.25) 0%, rgba(178,200,255,0.25) 50%, rgba(232,178,220,0.25) 100%)",
            filter: "blur(70px)",
          }}
        />

        {/* Centered content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6">
          <NeurowLogo className="h-[69px] w-[49px]" />
          <div className="flex flex-col items-center gap-2">
            <h1 className="font-albra-display text-[28px] font-light text-[#1E1E1E]">
              Coming soon
            </h1>
            <p className="text-[11px] font-medium uppercase tracking-[2px] text-[#949494]">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
