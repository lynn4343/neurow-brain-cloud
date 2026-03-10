"use client";

import type { DomainHealth } from "@/lib/demo-data";
import { DomainCard } from "./DomainCard";

interface DomainHealthGridProps {
  domains: DomainHealth[];
}

export function DomainHealthGrid({ domains }: DomainHealthGridProps) {
  return (
    <section>
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#949494] mb-3">
        Domain Health
      </h3>
      <div className="@container">
        <div className="grid grid-cols-2 @[840px]:grid-cols-3 gap-3">
          {domains.map((domain) => (
            <DomainCard key={domain.id} domain={domain} />
          ))}
        </div>
      </div>
    </section>
  );
}
