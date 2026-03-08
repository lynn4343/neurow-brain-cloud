"use client";

import { useState, useEffect } from "react";
import { Cloud } from "@phosphor-icons/react";
import { useUser } from "@/contexts/UserContext";

/**
 * Brain Cloud Integration Card — shows on DayMap when user has imported data.
 *
 * Visible when: (1) user is NOT Theo (his world is fully populated), AND
 * (2) neurow_import_completed_{slug} exists in localStorage.
 *
 * Points user to Chat as the current way to interact with imported data.
 * W5-1C spec. Language follows BD-001 (instance data = "your memories").
 */
export function BrainCloudCard() {
  const { activeUser } = useUser();
  const [hasImported, setHasImported] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time localStorage hydration */
    if (activeUser && activeUser.slug !== "theo") {
      const completionKey = `neurow_import_completed_${activeUser.slug}`;
      setHasImported(!!localStorage.getItem(completionKey));
    } else {
      setHasImported(false);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [activeUser]);

  if (!activeUser) return null;
  if (activeUser.slug === "theo") return null;
  if (!hasImported) return null;

  const handleOpenChat = () => {
    window.dispatchEvent(new Event("neurow-open-chat-panel"));
  };

  return (
    <div className="flex flex-col gap-2 rounded-[12px] border border-[#E6E5E3] bg-white p-4">
      <div className="flex items-center gap-2">
        <Cloud size={18} weight="duotone" className="text-[#6B7280]" />
        <span className="text-sm font-semibold uppercase text-[#1E1E1E]">
          Brain Cloud
        </span>
      </div>
      <p className="text-sm text-[#6B6B6B] leading-relaxed">
        Your memories are in Brain Cloud. Task and calendar sync is coming
        &mdash; ask Neurow about your imported data in Chat.
      </p>
      <button
        onClick={handleOpenChat}
        className="mt-1 self-end rounded-lg border border-[#E6E5E3] bg-[#FAF8F8] px-3 py-1.5 text-xs font-medium text-[#1E1E1E] transition-colors hover:bg-[#F0EEEE]"
      >
        Open Chat
      </button>
    </div>
  );
}
