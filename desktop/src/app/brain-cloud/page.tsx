"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { UserProvider, useUser } from "@/contexts/UserContext";

// BrainCloudShell uses window.neurow (Electron IPC) — must prevent SSR.
const BrainCloudShell = dynamic(
  () =>
    import("@/brain-cloud/BrainCloudShell").then((m) => m.BrainCloudShell),
  { ssr: false },
);

/**
 * Ensures the Brain Cloud window always has an active user.
 * Priority: URL hash (#user=slug) → current activeUser → first profile.
 * Without this, the window can end up with activeUser=null (button disabled)
 * when opened without a hash or with a separate localStorage origin.
 */
function ProfileSync() {
  const { switchProfile, activeUser, profiles, appPhase } = useUser();

  useEffect(() => {
    // Wait for UserProvider to finish loading from localStorage
    if (appPhase === "loading") return;

    // If URL hash specifies a user, switch to that profile
    const hash = window.location.hash; // e.g. "#user=theo"
    if (hash) {
      const match = hash.match(/user=([^&]+)/);
      if (match?.[1]) {
        try {
          switchProfile(decodeURIComponent(match[1]));
        } catch {
          switchProfile(match[1]);
        }
        return;
      }
    }

    // No hash and no active user — select first available profile.
    // Brain Cloud should always have a user (no onboarding flow here).
    if (!activeUser && profiles.length > 0) {
      switchProfile(profiles[0].slug);
    }
  }, [switchProfile, activeUser, profiles, appPhase]);

  return null;
}

export default function BrainCloudPage() {
  return (
    <UserProvider>
      <ProfileSync />
      <BrainCloudShell />
    </UserProvider>
  );
}
