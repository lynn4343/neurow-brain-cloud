"use client";

import { TopPriorities } from "./TopPriorities";
import { BrainCloudCard } from "./BrainCloudCard";
import { SecondaryTasks } from "./SecondaryTasks";
import { GratitudeSection } from "./GratitudeSection";
import { NotesSection } from "./NotesSection";

export function DayMapRightPanel() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#FAF8F8] p-4">
      <div className="space-y-4">
        <TopPriorities />
        <BrainCloudCard />
        <SecondaryTasks />
        <GratitudeSection />
        <NotesSection />
      </div>
    </div>
  );
}
