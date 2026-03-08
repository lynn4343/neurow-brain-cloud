import type { Priority } from "@/lib/demo-data";

// Re-export for convenience
export type { Priority };

// ---------------------------------------------------------------------------
// Priority Goals
// ---------------------------------------------------------------------------

export interface PriorityGoal {
  id: string;
  position: 1 | 2 | 3;
  title: string;
  nextMilestone: string;
  milestoneDate: string;
  backgroundColor: string;
  goalId?: string;
}

// ---------------------------------------------------------------------------
// Pinned Projects
// ---------------------------------------------------------------------------

export interface PinnedProject {
  id: string;
  name: string;
  tag: string;
  workspace: string;
  isPinned: boolean;
  projectId?: string;
}

// ---------------------------------------------------------------------------
// Workspaces
// ---------------------------------------------------------------------------

export type WorkspaceIconName =
  | "house"
  | "dollar"
  | "heart"
  | "brain"
  | "people"
  | "candle"
  | "sparkle"
  | "briefcase"
  | "rocket"
  | "gradcap";

export interface Workspace {
  id: string;
  name: string;
  icon: WorkspaceIconName;
  bgColor: string;
  type: "personal" | "professional";
  taskCount?: number;
}

// ---------------------------------------------------------------------------
// Coming Up Tasks
// ---------------------------------------------------------------------------

export interface ComingUpTask {
  id: string;
  name: string;
  priority: Priority;
  dueDate: string;
  project: string;
  hasSubtasks?: boolean;
  subtaskCount?: number;
  isCompleted?: boolean;
  workspaceType?: "personal" | "professional";
}

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

export type ComingUpSort =
  | "default"
  | "priority-asc"
  | "priority-desc"
  | "due-asc"
  | "due-desc"
  | "project-asc"
  | "project-desc";

// ---------------------------------------------------------------------------
// Sidebar Navigation
// ---------------------------------------------------------------------------

export interface SidebarNavItem {
  id: string;
  label: string;
  icon?: WorkspaceIconName;
  children?: SidebarNavItem[];
}

// ---------------------------------------------------------------------------
// Color rotation for project tags
// ---------------------------------------------------------------------------

export const PROJECT_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-green-100 text-green-700 border-green-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-pink-100 text-pink-700 border-pink-200",
] as const;
