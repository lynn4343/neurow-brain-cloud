"use client";

import { ShieldCheck } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// DataPrivacySection — Summary card in settings
//
// Compact summary with "View Full Privacy Policy" button.
// Clicking the button navigates to the full policy sub-page
// (handled by SettingsView via onViewPolicy callback).
//
// Source: Data_Privacy_Legal/Draft_Privacy_Policy.md
// Governing decision: BD-001 — "Full Access, Curated Format"
// ---------------------------------------------------------------------------

interface DataPrivacySectionProps {
  onViewPolicy: () => void;
}

export function DataPrivacySection({ onViewPolicy }: DataPrivacySectionProps) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-sm font-medium uppercase tracking-wider text-[#1E1E1E]">
          Data &amp; Privacy
        </h2>
        <ShieldCheck className="size-4 text-muted-foreground" weight="regular" />
      </div>

      <p className="text-sm font-medium text-[#1E1E1E] mb-2">
        Everything about you is yours. How we help you is ours.
      </p>

      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        Your memories, coaching sessions, behavioral patterns, and knowledge
        graph belong to you &mdash; fully exportable, inspectable, and
        deletable. Our coaching methodology, algorithms, and system architecture
        remain ours. DTI-aligned across all five AI Transfer Principles.
      </p>

      <Button
        onClick={onViewPolicy}
        variant="outline"
        className="gap-2 text-sm"
      >
        <ShieldCheck className="size-4" weight="regular" />
        View Full Privacy Policy
      </Button>

      <p className="text-xs text-muted-foreground mt-3">
        19 sections &middot; GDPR &middot; CCPA &middot; EU AI Act &middot; DTI
        5/5
      </p>
    </section>
  );
}
