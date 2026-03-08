"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import { NeurowLogo } from "@/components/icons/NeurowLogo";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Gradient progress bar (matches production 3-stop diagonal gradient)
// ---------------------------------------------------------------------------

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="fixed left-0 right-0 top-0 z-50 h-1 w-full bg-[#e6e5e3]">
      <div
        className="h-full rounded-r-full transition-all duration-500"
        style={{
          width: `${progress}%`,
          backgroundImage:
            "linear-gradient(161deg, rgba(104,125,224,1) 13.6%, rgba(196,161,232,1) 79.6%, rgba(218,179,234,1) 97.6%)",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Blurred ellipse background decoration
// ---------------------------------------------------------------------------

function BackgroundEllipse() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-[97px] z-0 -translate-x-1/2 rounded-full"
      style={{
        width: 607,
        height: 607,
        background:
          "linear-gradient(313deg, rgba(178,160,232,0.2) 0%, rgba(178,200,255,0.2) 50%, rgba(232,178,220,0.2) 100%)",
        filter: "blur(80px)",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// OnboardingLayout
// ---------------------------------------------------------------------------

interface OnboardingLayoutProps {
  children: ReactNode;
  /** Progress bar percentage (0-100). Omit to hide the bar. */
  progress?: number;
  /** Show back button. Calls onBack when clicked. */
  onBack?: () => void;
  /** CTA button label */
  ctaLabel?: string;
  /** CTA enabled state — controls purple glow + fade-in */
  ctaEnabled?: boolean;
  /** CTA click handler */
  onCta?: () => void;
  /** Gap between content sections. Production uses gap-14 for roles, gap-8 for focus. */
  contentGap?: string;
  /** Hint text rendered above the CTA button (e.g. selection counter). Grouped with button in gap-6. */
  ctaHint?: ReactNode;
}

export function OnboardingLayout({
  children,
  progress,
  onBack,
  ctaLabel = "Next",
  ctaEnabled = false,
  onCta,
  contentGap = "gap-14",
  ctaHint,
}: OnboardingLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#faf8f8]">
      {/* Progress bar */}
      {progress !== undefined && <ProgressBar progress={progress} />}

      {/* Background ellipse */}
      <BackgroundEllipse />

      {/* Header */}
      <div className="absolute left-0 right-0 top-1 z-20 flex h-14 items-center justify-between px-5">
        <NeurowLogo className="h-[31px] w-[22px]" />
        {onBack && (
          <button
            onClick={onBack}
            className="flex w-fit items-center gap-1.5 text-sm text-[#5f5e5b] transition-colors hover:text-[#1e1e1e]"
          >
            <ArrowLeft size={12} weight="regular" className="text-[#8e8b86]" />
            Back
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 pb-8 pt-[90px]">
        <div className={`flex w-full max-w-[450px] flex-col ${contentGap}`}>
          {children}

          {/* CTA: hint + button grouped tightly */}
          {onCta && (
            <div className={`flex flex-col gap-3${ctaHint ? " -mt-8" : ""}`}>
              {ctaHint}
              <div
                className={`transition-all duration-200 ${
                  ctaEnabled
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-2 opacity-0"
                }`}
              >
                <button
                  onClick={onCta}
                  disabled={!ctaEnabled}
                  tabIndex={ctaEnabled ? 0 : -1}
                  aria-hidden={!ctaEnabled}
                  className="h-11 w-full rounded-lg bg-[#1e1e1e] text-sm font-medium text-white transition-all duration-200 hover:bg-[#1e1e1e]/90 disabled:opacity-50"
                  style={
                    ctaEnabled
                      ? { boxShadow: "-4px 5px 30px rgba(101, 121, 238, 0.5)" }
                      : undefined
                  }
                >
                  {ctaLabel}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
