import type { ChatSession, Workspace } from "@/types/sessions";

// ---------------------------------------------------------------------------
// Session storage
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = "neurow_sessions_";

function storageKey(slug: string): string {
  return `${STORAGE_PREFIX}${slug}`;
}

export function loadSessions(slug: string): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveSessions(slug: string, sessions: ChatSession[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(sessions));
  } catch {
    // localStorage full -- fail silently. Acceptable for hackathon.
  }
}

export function saveSession(slug: string, session: ChatSession): void {
  const existing = loadSessions(slug);
  const idx = existing.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    existing[idx] = session;
  } else {
    existing.unshift(session); // newest first
  }
  saveSessions(slug, existing);
}

export function deleteSession(slug: string, sessionId: string): void {
  const existing = loadSessions(slug);
  saveSessions(slug, existing.filter((s) => s.id !== sessionId));
}

// ---------------------------------------------------------------------------
// Workspace storage
// ---------------------------------------------------------------------------

const WORKSPACE_PREFIX = "neurow_workspaces_";

function workspaceKey(slug: string): string {
  return `${WORKSPACE_PREFIX}${slug}`;
}

export function loadWorkspaces(slug: string): Workspace[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(workspaceKey(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveWorkspaces(slug: string, workspaces: Workspace[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(workspaceKey(slug), JSON.stringify(workspaces));
  } catch {
    // localStorage full -- fail silently
  }
}

export function addWorkspace(slug: string, workspace: Workspace): void {
  const existing = loadWorkspaces(slug);
  existing.push(workspace);
  saveWorkspaces(slug, existing);
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

export function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}
