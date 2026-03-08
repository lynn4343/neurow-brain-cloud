"use client";

import { ShieldCheck } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/contexts/UserContext";

// ---------------------------------------------------------------------------
// DataPrivacySection — Privacy controls + policy summary
//
// 1. Deeper Insights toggle — opt-in for emotional/health/wellbeing pattern
//    recognition. Legal requirement: explicit consent for sensitive data
//    processing. Persists to UserProfile.
// 2. Privacy policy summary card with "View Full Privacy Policy" button.
//
// Source: Data_Privacy_Legal/Privacy_Policy_v3.md
// Governing decision: BD-001 — "Full Access, Curated Format"
// ---------------------------------------------------------------------------

interface DataPrivacySectionProps {
  onViewPolicy: () => void;
}

export function DataPrivacySection({ onViewPolicy }: DataPrivacySectionProps) {
  const { activeUser, updateProfile } = useUser();

  const deeperInsightsEnabled = activeUser?.deeper_insights_enabled ?? false;

  function handleToggleDeeperInsights(checked: boolean) {
    updateProfile({ deeper_insights_enabled: checked });
  }

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-[#1E1E1E]" weight="regular" />
        <h2 className="text-sm font-medium uppercase tracking-wider text-[#1E1E1E]">
          Privacy
        </h2>
      </div>

      {/* Privacy policy card */}
      <div>
        <p className="text-sm font-medium text-[#1E1E1E] mb-2">
          Everything about you is yours.
        </p>

        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Your memories, executive coaching sessions, and behavioral insights belong to
          you &mdash; exportable, inspectable, and deletable. We do not use
          your data to train AI models, and we do not sell it. Your data is
          encrypted and isolated to your account.
        </p>

        <Button
          onClick={onViewPolicy}
          variant="outline"
          className="gap-2 text-sm"
        >
          <ShieldCheck className="size-4" weight="regular" />
          View Full Privacy Policy
        </Button>

      </div>

      <div className="h-px bg-[#E6E5E3]" />

      {/* Deeper Insights toggle */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <p className="text-sm font-medium text-[#1E1E1E] mb-1.5">
            Deeper Insights
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When enabled, Neurow connects patterns across your emotional states,
            health habits, and mental well-being for deeper executive insights to assist with goal attainment.
          </p>
        </div>
        <Switch
          checked={deeperInsightsEnabled}
          onCheckedChange={handleToggleDeeperInsights}
          aria-label="Toggle Deeper Insights"
          className="mt-0.5"
        />
      </div>
    </section>
  );
}
