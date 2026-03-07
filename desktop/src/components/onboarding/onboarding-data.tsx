// ---------------------------------------------------------------------------
// Extracted onboarding data — editable without remounting OnboardingScreens.
// React Fast Refresh preserves component state when only dependencies change.
// ---------------------------------------------------------------------------

import {
  Lightbulb,
  Hammer,
  TrendUp,
  RocketLaunch,
  Buildings,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";

export interface BusinessStageOption {
  id: string;
  icon?: ReactNode;
  title: string;
  description: string;
}

export const BUSINESS_STAGES: BusinessStageOption[] = [
  {
    id: "idea",
    icon: <Lightbulb size={28} weight="fill" className="text-[#1e1e1e]" />,
    title: "Idea Stage",
    description:
      "You have a concept but haven't built anything tangible yet",
  },
  {
    id: "building",
    icon: <Hammer size={28} weight="fill" className="text-[#1e1e1e]" />,
    title: "Building Stage",
    description:
      "Creating your offer or product and getting your first customers",
  },
  {
    id: "momentum",
    icon: <TrendUp size={28} weight="fill" className="text-[#1e1e1e]" />,
    title: "Building Momentum",
    description:
      "You have customers, working on consistency and revenue",
  },
  {
    id: "scaling",
    icon: <RocketLaunch size={28} weight="fill" className="text-[#1e1e1e]" />,
    title: "Scaling Up",
    description:
      "Consistent revenue, growing your team and systems",
  },
  {
    id: "established",
    icon: <Buildings size={28} weight="fill" className="text-[#1e1e1e]" />,
    title: "Established Business",
    description:
      "Profitable and stable, focused on optimization and expansion",
  },
];

// ---------------------------------------------------------------------------
// Coaching styles — shared between onboarding + settings
// ---------------------------------------------------------------------------

export interface CoachingStyle {
  id: string;
  emoji: string;
  title: string;
  description: string;
  tag?: string;
}

export const COACHING_STYLES: CoachingStyle[] = [
  {
    id: "balanced",
    emoji: "\u2696\uFE0F",
    title: "Balanced",
    tag: "(Recommended)",
    description:
      "I'll adapt based on what you need\u2014gentle when you're struggling, direct when you need momentum.",
  },
  {
    id: "gentle",
    emoji: "\uD83C\uDF38",
    title: "Gentle Guidance",
    description:
      "Warm, supportive, and encouraging, I'll be your cheerleader.",
  },
  {
    id: "direct",
    emoji: "\uD83C\uDFAF",
    title: "Direct",
    description: "Straightforward. Tell it to me blunt.",
  },
  {
    id: "peak-performance",
    emoji: "\uD83D\uDD25",
    title: "Peak Performance",
    description: "Full accountability mode. Push me to be my best.",
  },
];
