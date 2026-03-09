"use client";

import { TopPriorities } from "./TopPriorities";
import { SecondaryTasks } from "./SecondaryTasks";
import { GratitudeSection } from "./GratitudeSection";
import { NotesSection } from "./NotesSection";

export function DayMapRightPanel() {
  return (
    <div className="@container flex-1 min-w-0 overflow-y-auto bg-[#FAF8F8] p-4">
      <div className="space-y-4">
        <TopPriorities />
        <SecondaryTasks />
        <GratitudeSection />
        <NotesSection />
      </div>
    </div>
  );
}
