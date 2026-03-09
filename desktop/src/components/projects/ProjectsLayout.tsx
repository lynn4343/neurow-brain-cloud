"use client";

import { ProjectsProvider, useProjectsContext } from "./ProjectsContext";
import { ProjectsSidebar } from "./ProjectsSidebar";
import { ProjectsContent } from "./ProjectsContent";
import { ProjectsHeader } from "./ProjectsHeader";
import { PriorityGoals } from "./PriorityGoals";
import { PinnedProjects } from "./PinnedProjects";
import { Workspaces } from "./Workspaces";
import { ComingUp } from "./ComingUp";
import { GoalComingSoon } from "./GoalComingSoon";

function ProjectsMain() {
  const { activePage } = useProjectsContext();

  if (activePage.startsWith("goal-")) {
    return <GoalComingSoon subtitle="YOUR GOALS DASHBOARD" />;
  }
  if (activePage.startsWith("project-")) {
    return <GoalComingSoon subtitle="PROJECT WORKSPACES" />;
  }
  if (activePage.startsWith("workspace-")) {
    return <GoalComingSoon subtitle="PROJECT WORKSPACES" />;
  }
  if (activePage !== "hub") {
    return <GoalComingSoon />;
  }

  return (
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
  );
}

export function ProjectsLayout() {
  return (
    <ProjectsProvider>
      <div className="flex flex-1 overflow-hidden">
        <ProjectsSidebar />
        <ProjectsMain />
      </div>
    </ProjectsProvider>
  );
}
