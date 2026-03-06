"use client";

import { Bell } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { View } from "./MainNavSidebar";
import { UserDropdown } from "./UserDropdown";

interface GlobalHeaderProps {
  /** Page title to display in center (e.g., "NEUROW CHAT", "DAY MAP") */
  title: string;
  /** Optional element to render in the left section */
  leftContent?: ReactNode;
  /** View navigation callback — used by avatar dropdown */
  onViewChange?: (view: View) => void;
}

export function GlobalHeader({ title, leftContent, onViewChange }: GlobalHeaderProps) {
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

        <UserDropdown onViewChange={onViewChange} />
      </div>
    </div>
  );
}

export function ChatTopBar({ leftContent }: { leftContent?: ReactNode }) {
  return <GlobalHeader title="NEUROW CHAT" leftContent={leftContent} />;
}
