"use client";

import {
  House,
  CurrencyDollar,
  Heart,
  Brain,
  Users,
  Flame,
  Sparkle,
  Briefcase,
  Rocket,
  GraduationCap,
  type Icon,
} from "@phosphor-icons/react";
import type { WorkspaceIconName } from "./types";

interface WorkspaceIconProps {
  icon: WorkspaceIconName;
  size?: number;
  color?: string;
  className?: string;
}

const iconMap: Record<WorkspaceIconName, Icon> = {
  house: House,
  dollar: CurrencyDollar,
  heart: Heart,
  brain: Brain,
  people: Users,
  candle: Flame,
  sparkle: Sparkle,
  briefcase: Briefcase,
  rocket: Rocket,
  gradcap: GraduationCap,
};

export function WorkspaceIcon({
  icon,
  size = 32,
  color,
  className,
}: WorkspaceIconProps) {
  const IconComponent = iconMap[icon];
  return (
    <IconComponent
      size={size}
      className={className}
      color={color}
      weight="light"
    />
  );
}
