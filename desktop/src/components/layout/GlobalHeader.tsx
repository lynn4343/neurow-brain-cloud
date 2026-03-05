"use client";

import { Bell, GearSix } from "@phosphor-icons/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReactNode } from "react";
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

interface GlobalHeaderProps {
  /** Page title to display in center (e.g., "NEUROW CHAT", "DAY MAP") */
  title: string;
  /** Optional element to render in the left section */
  leftContent?: ReactNode;
  /** View navigation callback — used by avatar dropdown */
  onViewChange?: (view: View) => void;
}

export function GlobalHeader({ title, leftContent, onViewChange }: GlobalHeaderProps) {
  const { activeUser } = useUser();
  const displayName = activeUser?.display_name?.trim() || "Neurow";
  const slug = activeUser?.slug || "";

  return (
    <div className="flex h-[60px] items-center justify-between gap-2.5 bg-white px-6">
      {/* Left section */}
      <div className="flex h-7 flex-1 items-center">
        {leftContent}
      </div>

      {/* Page Title */}
      <h1 className="font-albra-sans text-center text-2xl font-medium uppercase leading-[100%] tracking-normal text-[#1E1E1E]">
        {title}
      </h1>

      {/* Right Navigation */}
      <div className="flex flex-1 items-center justify-end gap-2">
        <button
          onClick={() => {
            // TODO: Implement notification panel
          }}
          className="flex size-9 items-center justify-center rounded-lg p-1 hover:bg-accent"
          aria-label="Notifications"
        >
          <Bell className="size-[18px]" weight="regular" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label={`User menu for ${displayName}`} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="size-9 cursor-pointer">
                <AvatarFallback className="bg-[#FAF8F8] text-sm font-normal">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">{displayName}</p>
                {slug && <p className="text-xs text-muted-foreground">{slug}</p>}
              </div>
            </DropdownMenuLabel>
            {onViewChange && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onViewChange("settings")}>
                  <GearSix className="mr-2 size-4" weight="regular" />
                  Settings
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function ChatTopBar({ leftContent }: { leftContent?: ReactNode }) {
  return <GlobalHeader title="NEUROW CHAT" leftContent={leftContent} />;
}
