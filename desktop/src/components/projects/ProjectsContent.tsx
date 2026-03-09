"use client";

import type { ReactNode } from "react";

export function ProjectsContent({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-8 py-6">
        {children}
      </div>
    </div>
  );
}
