"use client";

import { cn } from "@/lib/utils";
import type { DomainHealth, DomainDirection } from "@/lib/demo-data";
import {
  Heartbeat,
  Brain,
  UsersThree,
  Briefcase,
  CurrencyCircleDollar,
  BookOpenText,
  House,
  SmileyWink,
  Sparkle,
  type IconProps,
} from "@phosphor-icons/react";

const ICON_MAP: Record<string, React.ComponentType<IconProps>> = {
  Heartbeat,
  Brain,
  UsersThree,
  Briefcase,
  CurrencyCircleDollar,
  BookOpenText,
  House,
  SmileyWink,
  Sparkle,
};

const DIRECTION_STYLES: Record<DomainDirection, {
  border: string;
  dot: string;
  label: string;
  labelText: string;
  icon: string;
}> = {
  growth: {
    border: "border-l-emerald-400",
    dot: "bg-emerald-500",
    label: "text-emerald-700",
    labelText: "Growing",
    icon: "text-emerald-600",
  },
  steady: {
    border: "border-l-[#5F769D]",
    dot: "bg-[#5F769D]",
    label: "text-[#5F769D]",
    labelText: "Steady",
    icon: "text-[#5F769D]",
  },
  needs_attention: {
    border: "border-l-[#7F133D]",
    dot: "bg-[#7F133D]",
    label: "text-[#7F133D]",
    labelText: "Needs Attention",
    icon: "text-[#7F133D]",
  },
  baseline: {
    border: "border-l-gray-300",
    dot: "bg-gray-300",
    label: "text-gray-500",
    labelText: "Baseline",
    icon: "text-gray-400",
  },
};

interface DomainCardProps {
  domain: DomainHealth;
}

export function DomainCard({ domain }: DomainCardProps) {
  const Icon = ICON_MAP[domain.icon];
  const style = DIRECTION_STYLES[domain.direction];

  return (
    <div
      className={cn(
        "rounded-[12px] border border-[#E6E5E3] bg-white p-4 border-l-[3px] hover:shadow-sm transition-shadow",
        style.border
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={20} weight="duotone" className={style.icon} />}
          <span className="text-sm font-semibold text-[#1E1E1E]">
            {domain.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={cn("h-2 w-2 rounded-full", style.dot)} />
          <span className={cn("text-[11px] font-medium", style.label)}>
            {style.labelText}
          </span>
        </div>
      </div>
      <p className="text-xs text-[#5F5E5B] leading-relaxed">
        {domain.observation}
      </p>
    </div>
  );
}
