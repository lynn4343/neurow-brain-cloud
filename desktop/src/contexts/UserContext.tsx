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
  quarterly_goal_headline?: string;
  goal_why: string;
  identity_traits: string[];
  release_items: string[];
  next_action_step: string;
  next_action_due?: string; // ISO date "YYYY-MM-DD" — computed server-side at session completion
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
  focus_area?: string;
  declared_challenges?: string[];
  goal_cascade: GoalCascade | null;
  // Onboarding fields (W4-4a port)
  is_business_owner?: boolean;
  side_hustle_goal?: string;
  business_description?: string;
  business_stage?: string;
  current_business_focus?: string;
  business_challenges?: string[];
  career_situation?: string;
  career_stage?: string;
  career_focus?: string;
  career_challenges?: string[];
  love_partner_situation?: string;
  avatar_color?: string; // hex color for avatar circle
  deeper_insights_enabled?: boolean; // opt-in for emotional/health/wellbeing pattern recognition
  pattern_consent?: boolean; // TDPSA § 541.001 — affirmative consent for sensitive data processing
  pattern_consent_at?: string; // ISO 8601 timestamp of consent grant or withdrawal (audit trail)
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
  completeClaritySession: (goalCascade?: GoalCascade) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

// ---------------------------------------------------------------------------
// Avatar color palette — cycles for new profiles
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  "#E9FF27", // Highlighter Yellow
  "#9FA3FF", // Liliac
  "#34C38F", // Jungle
  "#4456FF", // Cobalt
  "#A6FFE8", // Mint
  "#FF7C5E", // Coral
];

// ---------------------------------------------------------------------------
// Default profile — Theo (always present, pre-populated for demo)
// ---------------------------------------------------------------------------

const THEO_PROFILE: UserProfile = {
  id: "0c4831b5-8df3-4fba-94be-57e4e3112116",
  slug: "theo",
  display_name: "Theo Nakamura",
  avatar_color: "#E9FF27",
  onboarding_completed: true,
  clarity_session_completed: true,
  coaching_style: "balanced",
  pattern_consent: true,
  pattern_consent_at: "2026-02-28T10:00:00.000Z",
  roles: ["business_owner"],
  focus_area: "career-business",
  declared_challenges: [
    "inconsistent income",
    "pricing and knowing my worth",
    "following through on plans",
    "managing finances",
  ],
  goal_cascade: {
    context_line:
      "Theo is a 23-year-old freelance graphic designer in East Austin, growing his creative practice.",
    vision:
      "Self-sustaining creative practice \u2014 brand identity + motion design, debt cleared, recognized in Austin creative community",
    quarterly_goal:
      "$100/hour for new clients, 3 concurrent projects, School of Motion modules 1-6",
    quarterly_goal_headline:
      "Hit $100/hr, 3 active projects, start School of Motion",
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
    next_action_step: "Send Meridian brand guide revisions",
    next_action_due: "2026-03-12",
    focus_area: "career-business",
    declared_challenges: [
      "inconsistent income",
      "pricing and knowing my worth",
      "following through on plans",
      "managing finances",
    ],
  },
};

// ---------------------------------------------------------------------------
// Default profile — Avery (judge onboarding persona, pre-populated)
// ---------------------------------------------------------------------------

const AVERY_PROFILE: UserProfile = {
  id: "6afa0062-93f6-427e-bad3-b0542d6692a5",
  slug: "avery",
  display_name: "Avery Alfonso",
  onboarding_completed: true,
  clarity_session_completed: false,
  coaching_style: "balanced",
  roles: ["founder", "creative"],
  focus_area: "career-business",
  declared_challenges: [
    "procrastination",
    "perfectionism",
    "overwhelm",
    "dont-know-next",
    "time-scarcity",
    "money-scarcity",
  ],
  goal_cascade: null,
  is_business_owner: true,
  business_description:
    "I have a supplement business called Mastermind, we make nootropics",
  business_stage: "momentum",
  current_business_focus:
    "building the social media presence and consistency and doing brand collaborations",
  business_challenges: [
    "procrastination",
    "perfectionism",
    "overwhelm",
    "dont-know-next",
    "time-scarcity",
    "money-scarcity",
  ],
};

const DEFAULT_PROFILES = [THEO_PROFILE, AVERY_PROFILE];

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = "neurow_profiles";

function loadProfiles(): UserProfile[] {
  if (typeof window === "undefined") return DEFAULT_PROFILES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_PROFILES;
    return parsed;
  } catch {
    // Corrupted localStorage — reset to defaults
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROFILES));
    return DEFAULT_PROFILES;
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
  const [profiles, setProfiles] = useState<UserProfile[]>(DEFAULT_PROFILES);
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
      const existing = prev.find((p) => p.slug === profile.slug);
      if (existing) {
        setActiveUser(existing);
        setAppPhase(phaseForProfile(existing));
        return prev;
      }
      const withColor = profile.avatar_color
        ? profile
        : { ...profile, avatar_color: AVATAR_COLORS[prev.length % AVATAR_COLORS.length] };
      const updated = [...prev, withColor];
      saveProfiles(updated);
      setActiveUser(withColor);
      setAppPhase(phaseForProfile(withColor));
      return updated;
    });
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

  const completeClaritySession = useCallback((goalCascade?: GoalCascade) => {
    if (!activeUser) return;
    const withClarity: UserProfile = {
      ...activeUser,
      clarity_session_completed: true,
      goal_cascade: goalCascade
        ? {
            ...goalCascade,
            // Merge onboarding data from top-level profile fields (preserve goalCascade values as fallback)
            focus_area: activeUser.focus_area ?? goalCascade.focus_area,
            declared_challenges: activeUser.declared_challenges ?? goalCascade.declared_challenges,
          }
        : activeUser.goal_cascade,
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

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    if (!activeUser) return;
    const merged = { ...activeUser, ...updates };
    setProfiles((prev) => {
      const updated = prev.map((p) =>
        p.slug === merged.slug ? merged : p,
      );
      saveProfiles(updated);
      return updated;
    });
    setActiveUser(merged);
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
        updateProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
