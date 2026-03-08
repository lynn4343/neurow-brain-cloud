"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { ReactNode } from "react";

export function ProjectsContent({ children }: { children: ReactNode }) {
  return (
    <ScrollArea className="flex-1">
      <div className="max-w-[1400px] mx-auto px-8 py-6">
        {children}
      </div>
    </ScrollArea>
  );
}
