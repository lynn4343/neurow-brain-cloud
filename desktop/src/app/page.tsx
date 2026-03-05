"use client";

import dynamic from "next/dynamic";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { NeurowLogo } from "@/components/icons/NeurowLogo";

// CRITICAL: AppShell uses window.neurow (Electron IPC) which doesn't exist during
// Next.js server-side rendering. dynamic() with ssr:false prevents SSR entirely.
// "use client" alone is NOT sufficient — Next.js still pre-renders client components
// on the server for the initial HTML. The dynamic import is what truly prevents that.
const AppShell = dynamic(
  () => import("@/components/layout/AppShell").then((m) => m.AppShell),
  { ssr: false },
);

export default function Home() {
  return (
    <UserProvider>
      <AppRouter />
    </UserProvider>
  );
}

function AppRouter() {
  const { appPhase } = useUser();

  if (appPhase === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <NeurowLogo className="h-[69px] w-[49px] animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (appPhase === "onboarding") {
    // Replaced in W4-4 with real OnboardingFlow
    return <div>Onboarding placeholder</div>;
  }

  if (appPhase === "clarity_session") {
    // Replaced in W4-4 with ClaritySessionFlow
    return <div>Clarity Session placeholder</div>;
  }

  return <AppShell />;
}
