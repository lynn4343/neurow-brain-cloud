"use client";

import { Check, Plus, GearSix } from "@phosphor-icons/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/contexts/UserContext";
import type { View } from "./MainNavSidebar";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface UserDropdownProps {
  onViewChange?: (view: View) => void;
}

export function UserDropdown({ onViewChange }: UserDropdownProps) {
  const { activeUser, profiles, switchProfile, startNewProfile } = useUser();
  const displayName = activeUser?.display_name?.trim() || "Neurow";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`User menu for ${displayName}`}
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="size-9 cursor-pointer">
            <AvatarFallback
              className="bg-transparent text-sm font-normal"
              style={{ backgroundColor: activeUser?.avatar_color || "#FAF8F8" }}
            >
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {profiles.map((profile) => (
          <DropdownMenuItem
            key={profile.slug}
            onClick={() => switchProfile(profile.slug)}
          >
            <Check
              className="size-4 shrink-0"
              weight="bold"
              style={{ opacity: profile.slug === activeUser?.slug ? 1 : 0 }}
            />
            {profile.display_name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => startNewProfile()}>
          <Plus className="size-4 shrink-0" weight="bold" />
          New Profile
        </DropdownMenuItem>
        {onViewChange && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onViewChange("settings")}>
              <GearSix className="size-4 shrink-0" weight="regular" />
              Settings
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
