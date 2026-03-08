"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useUser } from "@/contexts/UserContext";
import type { ChatSession, Workspace } from "@/types/sessions";
import { isCoachingSession, isUnorganizedChat } from "@/types/sessions";
import {
  loadSessions,
  saveSessions,
  saveSession as storeSaveSession,
  loadWorkspaces,
  saveWorkspaces,
  addWorkspace as storeAddWorkspace,
} from "@/lib/session-store";
import { SESSIONS, WORKSPACES } from "@/lib/demo-data";

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

interface SessionContextType {
  sessions: ChatSession[];
  coachingSessions: ChatSession[];
  yourChats: ChatSession[];
  activeSessionId: string | null;
  saveSession: (session: ChatSession) => void;
  setActiveSessionId: (id: string | null) => void;
  clearActiveSession: () => void;
  workspaces: Workspace[];
  getWorkspaceChats: (workspaceId: string) => ChatSession[];
  createWorkspace: (name: string) => Workspace | null;
  deleteWorkspace: (workspaceId: string) => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SessionProvider({ children }: { children: ReactNode }) {
  const { activeUser } = useUser();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Load sessions + workspaces on mount / user change.
  // This is a one-time hydration pattern matching UserContext — setState in effect
  // is intentional for client-side localStorage rehydration.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time localStorage hydration */
    const slug = activeUser?.slug;
    if (!slug) {
      setSessions([]);
      setWorkspaces([]);
      setActiveSessionId(null);
      return;
    }

    // Sessions: load from localStorage, seed from demo data if empty
    let loaded = loadSessions(slug);
    if (loaded.length === 0) {
      const demoSessions = SESSIONS[slug];
      if (demoSessions && demoSessions.length > 0) {
        loaded = demoSessions;
        saveSessions(slug, loaded);
      }
    }
    setSessions(loaded);

    // Workspaces: load from localStorage, seed from demo data if empty
    let loadedWs = loadWorkspaces(slug);
    if (loadedWs.length === 0) {
      const demoWs = WORKSPACES[slug];
      if (demoWs && demoWs.length > 0) {
        loadedWs = demoWs;
        saveWorkspaces(slug, loadedWs);
      }
    }
    setWorkspaces(loadedWs);

    // Clear active session on user switch
    setActiveSessionId(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [activeUser?.slug]);

  // --- Derived data ---

  const coachingSessions = sessions.filter(isCoachingSession);
  const yourChats = sessions.filter(isUnorganizedChat);

  // --- Session actions ---

  const saveSession = useCallback(
    (session: ChatSession) => {
      const slug = activeUser?.slug;
      if (!slug) return;
      storeSaveSession(slug, session);
      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === session.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = session;
          return updated;
        }
        return [session, ...prev];
      });
    },
    [activeUser?.slug],
  );

  const clearActiveSession = useCallback(() => {
    setActiveSessionId(null);
  }, []);

  // --- Workspace actions ---

  const getWorkspaceChats = useCallback(
    (workspaceId: string): ChatSession[] => {
      return sessions
        .filter((s) => s.workspaceId === workspaceId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    },
    [sessions],
  );

  const createWorkspace = useCallback(
    (name: string): Workspace | null => {
      const slug = activeUser?.slug;
      if (!slug) return null;
      const ws: Workspace = {
        id: `ws-${Date.now()}`,
        name,
        personaId: slug,
        createdAt: new Date().toISOString(),
      };
      storeAddWorkspace(slug, ws);
      setWorkspaces((prev) => [...prev, ws]);
      return ws;
    },
    [activeUser?.slug],
  );

  const deleteWorkspace = useCallback(
    (workspaceId: string) => {
      const slug = activeUser?.slug;
      if (!slug) return;

      // Compute updated collections, then set state + persist.
      // Side effects (saveSessions/saveWorkspaces) stay outside the
      // functional updater to keep updaters pure (React Strict Mode safe).
      const updatedSessions = sessions.map((s) =>
        s.workspaceId === workspaceId ? { ...s, workspaceId: undefined } : s,
      );
      const updatedWorkspaces = workspaces.filter((w) => w.id !== workspaceId);

      setSessions(updatedSessions);
      setWorkspaces(updatedWorkspaces);
      saveSessions(slug, updatedSessions);
      saveWorkspaces(slug, updatedWorkspaces);
    },
    [activeUser?.slug, sessions, workspaces],
  );

  return (
    <SessionContext.Provider
      value={{
        sessions,
        coachingSessions,
        yourChats,
        activeSessionId,
        saveSession,
        setActiveSessionId,
        clearActiveSession,
        workspaces,
        getWorkspaceChats,
        createWorkspace,
        deleteWorkspace,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSessions(): SessionContextType {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSessions must be used within a SessionProvider");
  }
  return ctx;
}
