"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GoalCascade {
  vision: string;
  quarterly_goal: string;
  goal_why: string;
  identity_traits: string[];
  release_items: string[];
  next_action_step: string;
  focus_area?: string;
  declared_challenges?: string[];
  context_line?: string;
}

export interface UserProfile {
  id: string;
  slug: string;
  display_name: string;
  onboarding_completed: boolean;
  clarity_session_completed: boolean;
  coaching_style: string;
  roles: string[];
  goal_cascade: GoalCascade | null;
}

export type AppPhase = "loading" | "main" | "onboarding" | "clarity_session";

export interface UserContextType {
  // State
  activeUser: UserProfile | null;
  profiles: UserProfile[];
  appPhase: AppPhase;
  pendingChatAction: string | null;

  // Low-level setters (use sparingly — prefer action methods)
  setActiveUser: (profile: UserProfile | null) => void;
  setAppPhase: (phase: AppPhase) => void;
  setPendingChatAction: (action: string | null) => void;

  // Action methods (encapsulate state transitions — preferred API)
  switchProfile: (slug: string) => void;
  startNewProfile: () => void;
  addProfile: (profile: UserProfile) => void;
  completeOnboarding: (profile: UserProfile) => void;
  completeClaritySession: () => void;
}

// ---------------------------------------------------------------------------
// Default profile — Theo (always present, pre-populated for demo)
// ---------------------------------------------------------------------------

const THEO_PROFILE: UserProfile = {
  id: "0c4831b5-8df3-4fba-94be-57e4e3112116",
  slug: "theo",
  display_name: "Theo Nakamura",
  onboarding_completed: true,
  clarity_session_completed: true,
  coaching_style: "balanced",
  roles: ["business_owner"],
  goal_cascade: {
    context_line:
      "Theo is a 23-year-old freelance graphic designer in East Austin, growing his creative practice.",
    vision:
      "Self-sustaining creative practice \u2014 brand identity + motion design, debt cleared, recognized in Austin creative community",
    quarterly_goal:
      "$100/hour for new clients, 3 concurrent projects, School of Motion modules 1-6",
    goal_why: "I'm tired of the feast-or-famine cycle",
    identity_traits: [
      "bold with pricing",
      "disciplined with the unsexy stuff",
      "someone who finishes what he starts",
    ],
    release_items: [
      "saying yes to underpriced projects",
      "the barista survival story",
      "putting off systems until later",
    ],
    next_action_step: "Update my rate sheet and send to my next inquiry",
    focus_area: "career and professional growth",
    declared_challenges: [
      "inconsistent income",
      "pricing and knowing my worth",
      "following through on plans",
      "managing finances",
    ],
  },
};

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = "neurow_profiles";

function loadProfiles(): UserProfile[] {
  if (typeof window === "undefined") return [THEO_PROFILE];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [THEO_PROFILE];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [THEO_PROFILE];
    return parsed;
  } catch {
    // Corrupted localStorage — reset to defaults
    localStorage.setItem(STORAGE_KEY, JSON.stringify([THEO_PROFILE]));
    return [THEO_PROFILE];
  }
}

function saveProfiles(profiles: UserProfile[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

// ---------------------------------------------------------------------------
// Phase resolution
// ---------------------------------------------------------------------------

function phaseForProfile(profile: UserProfile): AppPhase {
  if (!profile.onboarding_completed) return "onboarding";
  if (!profile.clarity_session_completed) return "clarity_session";
  return "main";
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const UserContext = createContext<UserContextType | null>(null);

export function useUser(): UserContextType {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function UserProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<UserProfile[]>([THEO_PROFILE]);
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [appPhase, setAppPhase] = useState<AppPhase>("loading");
  const [pendingChatAction, setPendingChatAction] = useState<string | null>(null);

  // Client-side initialization — loads profiles from localStorage, sets phase.
  // This is a one-time hydration effect: server renders 'loading', client reads
  // localStorage and transitions. Not a cascading render — fires once on mount.
  useEffect(() => {
    const loaded = loadProfiles();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time SSR hydration */
    setProfiles(loaded);
    const first = loaded[0];
    setActiveUser(first);
    setAppPhase(phaseForProfile(first));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // --- Action methods ---

  const switchProfile = useCallback(
    (slug: string) => {
      const profile = profiles.find((p) => p.slug === slug);
      if (!profile) return;
      setActiveUser(profile);
      setAppPhase(phaseForProfile(profile));
    },
    [profiles],
  );

  const startNewProfile = useCallback(() => {
    setActiveUser(null);
    setAppPhase("onboarding");
  }, []);

  const addProfile = useCallback((profile: UserProfile) => {
    setProfiles((prev) => {
      if (prev.some((p) => p.slug === profile.slug)) {
        return prev;
      }
      const updated = [...prev, profile];
      saveProfiles(updated);
      return updated;
    });
    setActiveUser(profile);
    setAppPhase(phaseForProfile(profile));
  }, []);

  const completeOnboarding = useCallback((profile: UserProfile) => {
    const withOnboarding = { ...profile, onboarding_completed: true };
    setProfiles((prev) => {
      const exists = prev.some((p) => p.slug === withOnboarding.slug);
      const updated = exists
        ? prev.map((p) => (p.slug === withOnboarding.slug ? withOnboarding : p))
        : [...prev, withOnboarding];
      saveProfiles(updated);
      return updated;
    });
    setActiveUser(withOnboarding);
    setAppPhase("clarity_session");
  }, []);

  const completeClaritySession = useCallback(() => {
    if (!activeUser) return;
    const withClarity = {
      ...activeUser,
      clarity_session_completed: true,
    };
    setProfiles((prev) => {
      const updated = prev.map((p) =>
        p.slug === withClarity.slug ? withClarity : p,
      );
      saveProfiles(updated);
      return updated;
    });
    setActiveUser(withClarity);
    setAppPhase("main");
  }, [activeUser]);

  return (
    <UserContext.Provider
      value={{
        activeUser,
        profiles,
        appPhase,
        pendingChatAction,
        setActiveUser,
        setAppPhase,
        setPendingChatAction,
        switchProfile,
        startNewProfile,
        addProfile,
        completeOnboarding,
        completeClaritySession,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
