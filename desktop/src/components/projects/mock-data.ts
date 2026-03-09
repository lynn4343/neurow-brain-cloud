import type {
  PriorityGoal,
  PinnedProject,
  Workspace,
} from "./types";

// ---------------------------------------------------------------------------
// Priority Goals — per-user
// ---------------------------------------------------------------------------

export const PRIORITY_GOALS: Record<string, PriorityGoal[]> = {
  theo: [
    {
      id: "g1",
      position: 1,
      title: "Launch freelance design practice full-time by Q2",
      nextMilestone: "Complete Meridian brand guide and bill at full rate",
      milestoneDate: "Mar 15, 2026",
      backgroundColor: "#D5CCDB",
    },
    {
      id: "g2",
      position: 2,
      title: "Build portfolio site showcasing restaurant/cafe niche",
      nextMilestone: "Finalize 3 case studies with before/after",
      milestoneDate: "Mar 22, 2026",
      backgroundColor: "#EAE6ED",
    },
    {
      id: "g3",
      position: 3,
      title: "Clear invoice backlog and establish billing cadence",
      nextMilestone: "Follow up on 3 outstanding January invoices",
      milestoneDate: "Mar 10, 2026",
      backgroundColor: "#EAE6ED",
    },
  ],
  default: [
    {
      id: "g1",
      position: 1,
      title: "Define your #1 priority goal",
      nextMilestone: "Complete your first coaching session to identify it",
      milestoneDate: "",
      backgroundColor: "#D5CCDB",
    },
    {
      id: "g2",
      position: 2,
      title: "Set your #2 priority goal",
      nextMilestone: "Start a Clarity Session to align your #2 and #3 Priority Goals",
      milestoneDate: "",
      backgroundColor: "#EAE6ED",
    },
    {
      id: "g3",
      position: 3,
      title: "Set a weekly rhythm",
      nextMilestone: "Schedule your weekly review to reflect and plan ahead",
      milestoneDate: "",
      backgroundColor: "#EAE6ED",
    },
  ],
};

// ---------------------------------------------------------------------------
// Pinned Projects — per-user
// ---------------------------------------------------------------------------

export const PINNED_PROJECTS: Record<string, PinnedProject[]> = {
  theo: [
    { id: "pp1", name: "Meridian Brand Guide", tag: "Client Work", workspace: "Freelance", isPinned: true },
    { id: "pp2", name: "Portfolio Site Rebuild", tag: "Marketing", workspace: "Freelance", isPinned: true },
    { id: "pp3", name: "Invoice & Billing System", tag: "Admin", workspace: "Freelance", isPinned: true },
    { id: "pp4", name: "Motion Design Practice", tag: "Learning", workspace: "Personal", isPinned: true },
    { id: "pp5", name: "ADHD Focus Optimization", tag: "Health", workspace: "Personal", isPinned: true },
    { id: "pp6", name: "Coffee Shop Shifts", tag: "Schedule", workspace: "Personal", isPinned: true },
  ],
  default: [
    { id: "pp1", name: "Getting Started with Neurow", tag: "Onboarding", workspace: "Personal", isPinned: true },
    { id: "pp2", name: "My First Project", tag: "Example", workspace: "Personal", isPinned: true },
  ],
};

// ---------------------------------------------------------------------------
// Workspaces — per-user
// ---------------------------------------------------------------------------

export const WORKSPACES: Record<string, Workspace[]> = {
  theo: [
    { id: "w1", name: "Home & Living", icon: "house", bgColor: "#21504E", type: "personal", taskCount: 3 },
    { id: "w2", name: "Finances", icon: "dollar", bgColor: "#E4E279", type: "personal", taskCount: 2 },
    { id: "w3", name: "Health & Body", icon: "heart", bgColor: "#FD8B71", type: "personal", taskCount: 4 },
    { id: "w4", name: "Mental Health", icon: "brain", bgColor: "#C3B5EE", type: "personal", taskCount: 1 },
    { id: "w5", name: "Relationships", icon: "people", bgColor: "#F6D6DA", type: "personal", taskCount: 0 },
    { id: "w6", name: "Spirituality", icon: "candle", bgColor: "#21504E", type: "personal", taskCount: 0 },
    { id: "w7", name: "Fun & Creativity", icon: "sparkle", bgColor: "#E4E279", type: "personal", taskCount: 2 },
    { id: "w8", name: "Freelance Design", icon: "briefcase", bgColor: "#C3B5EE", type: "professional", taskCount: 6 },
    { id: "w9", name: "Barista Job", icon: "rocket", bgColor: "#FD8B71", type: "professional", taskCount: 1 },
    { id: "w10", name: "Learning & Growth", icon: "gradcap", bgColor: "#F6D6DA", type: "professional", taskCount: 3 },
  ],
  default: [
    { id: "w1", name: "Home & Living", icon: "house", bgColor: "#21504E", type: "personal", taskCount: 0 },
    { id: "w2", name: "Finances", icon: "dollar", bgColor: "#E4E279", type: "personal", taskCount: 0 },
    { id: "w3", name: "Health & Body", icon: "heart", bgColor: "#FD8B71", type: "personal", taskCount: 0 },
    { id: "w4", name: "Mental Health", icon: "brain", bgColor: "#C3B5EE", type: "personal", taskCount: 0 },
    { id: "w5", name: "Relationships", icon: "people", bgColor: "#F6D6DA", type: "personal", taskCount: 0 },
    { id: "w6", name: "Spirituality", icon: "candle", bgColor: "#21504E", type: "personal", taskCount: 0 },
    { id: "w7", name: "Fun & Recreation", icon: "sparkle", bgColor: "#E4E279", type: "personal", taskCount: 0 },
    { id: "w8", name: "Work", icon: "briefcase", bgColor: "#C3B5EE", type: "professional", taskCount: 0 },
    { id: "w9", name: "Learning", icon: "gradcap", bgColor: "#F6D6DA", type: "professional", taskCount: 0 },
  ],
};
