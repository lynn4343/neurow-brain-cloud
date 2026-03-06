"use client";

import dynamic from "next/dynamic";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { NeurowLogo } from "@/components/icons/NeurowLogo";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { ClaritySessionFlow } from "@/components/onboarding/ClaritySessionFlow";

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
      <DevPhaseSwitcher />
    </UserProvider>
  );
}

// DEV: Floating phase switcher — remove before submission
function DevPhaseSwitcher() {
  const { appPhase, activeUser, setAppPhase, startNewProfile, switchProfile } = useUser();
  if (appPhase === "loading") return null;

  const profileName = activeUser?.display_name ?? "none";
  const hasUser = !!activeUser;
  const disabledClass = "opacity-30 cursor-not-allowed";
  const btnBase = "rounded px-1.5 py-0.5 transition-colors";
  const btnHover = "hover:bg-[#f0eef8] hover:text-[#4f5bb3]";
  const btnActive = "bg-[#f0eef8] text-[#4f5bb3] font-medium";

  return (
    <div className="fixed bottom-3 left-3 z-[9999] flex items-center gap-1 rounded-md border border-dashed border-[#c9c8c6] bg-white/90 px-2 py-1 text-[11px] text-[#5f5e5b] shadow-sm backdrop-blur-sm">
      <span className="font-mono font-semibold text-[#8a6ee4]">DEV</span>
      <span className={`rounded px-1.5 py-0.5 font-medium ${hasUser ? "text-[#1e1e1e]" : "text-[#c9c8c6] italic"}`}>
        [{profileName}]
      </span>
      <span className="text-[#e6e5e3]">|</span>
      <button
        onClick={() => switchProfile("theo")}
        className={`${btnBase} ${btnHover}`}
        title="Reset to Theo + main (known-good state)"
      >
        Theo
      </button>
      <button
        onClick={() => startNewProfile()}
        className={`${btnBase} ${btnHover}`}
        title="Start fresh profile → full judge journey"
      >
        New
      </button>
      <span className="text-[#e6e5e3]">|</span>
      <button
        onClick={() => setAppPhase("onboarding")}
        className={`${btnBase} ${btnHover} ${appPhase === "onboarding" ? btnActive : ""}`}
        title="Re-enter onboarding as current user"
      >
        Onboarding
      </button>
      <button
        onClick={() => hasUser && setAppPhase("clarity_session")}
        disabled={!hasUser}
        className={`${btnBase} ${hasUser ? btnHover : disabledClass} ${appPhase === "clarity_session" ? btnActive : ""}`}
        title={hasUser ? "Switch to clarity session" : "No active profile — click Theo or New first"}
      >
        Clarity
      </button>
      <button
        onClick={() => hasUser && setAppPhase("main")}
        disabled={!hasUser}
        className={`${btnBase} ${hasUser ? btnHover : disabledClass} ${appPhase === "main" ? btnActive : ""}`}
        title={hasUser ? "Switch to main app" : "No active profile — click Theo or New first"}
      >
        Main
      </button>
    </div>
  );
}

function AppRouter() {
  const { appPhase, activeUser, completeOnboarding } = useUser();

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
    return <OnboardingFlow onComplete={completeOnboarding} />;
  }

  // Guard: don't mount ClaritySessionFlow until activeUser is available
  // (prevents race condition from React state batching during phase transition)
  if (appPhase === "clarity_session") {
    if (!activeUser) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <NeurowLogo className="h-[69px] w-[49px] animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }
    return <ClaritySessionFlow />;
  }

  return <AppShell />;
}
