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
