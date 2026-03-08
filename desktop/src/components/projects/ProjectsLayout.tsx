"use client";

import { ProjectsProvider } from "./ProjectsContext";
import { ProjectsSidebar } from "./ProjectsSidebar";
import { ProjectsContent } from "./ProjectsContent";
import { ProjectsHeader } from "./ProjectsHeader";
import { PriorityGoals } from "./PriorityGoals";
import { PinnedProjects } from "./PinnedProjects";
import { Workspaces } from "./Workspaces";
import { ComingUp } from "./ComingUp";

export function ProjectsLayout() {
  return (
    <ProjectsProvider>
      <div className="flex flex-1 overflow-hidden">
        <ProjectsSidebar />
        <ProjectsContent>
          <ProjectsHeader />
          <section className="mb-10">
            <PriorityGoals />
          </section>
          <section className="mb-10">
            <PinnedProjects />
          </section>
          <section className="mb-10">
            <Workspaces />
          </section>
          <section>
            <ComingUp />
          </section>
        </ProjectsContent>
      </div>
    </ProjectsProvider>
  );
}
