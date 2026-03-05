"use client";

import { Bell } from "@phosphor-icons/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ReactNode } from "react";
import { useUser } from "@/contexts/UserContext";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function UserAvatar() {
  const { activeUser } = useUser();
  const displayName = activeUser?.display_name?.trim() || "Neurow";

  return (
    <Avatar className="size-9">
      <AvatarFallback className="bg-[#FAF8F8] text-sm font-normal">
        {getInitials(displayName)}
      </AvatarFallback>
    </Avatar>
  );
}

interface GlobalHeaderProps {
  /** Page title to display in center (e.g., "NEUROW CHAT", "DAY MAP") */
  title: string;
  /** Optional element to render in the left section */
  leftContent?: ReactNode;
}

export function GlobalHeader({ title, leftContent }: GlobalHeaderProps) {
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

        <UserAvatar />
      </div>
    </div>
  );
}

export function ChatTopBar({ leftContent }: { leftContent?: ReactNode }) {
  return <GlobalHeader title="NEUROW CHAT" leftContent={leftContent} />;
}
