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

/** Reads #user=slug from the URL hash and switches to that profile. */
function ProfileSync() {
  const { switchProfile } = useUser();

  useEffect(() => {
    const hash = window.location.hash; // e.g. "#user=theo"
    if (!hash) return;
    const match = hash.match(/user=([^&]+)/);
    if (match?.[1]) {
      try {
        switchProfile(decodeURIComponent(match[1]));
      } catch {
        switchProfile(match[1]);
      }
    }
  }, [switchProfile]);

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
