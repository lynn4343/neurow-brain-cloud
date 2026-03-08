"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { SessionProvider } from "@/contexts/SessionContext";
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
      <SessionProvider>
        <AppRouter />
        <DevPhaseSwitcher />
      </SessionProvider>
    </UserProvider>
  );
}

// DEV: Floating phase switcher — remove before submission
function DevPhaseSwitcher() {
  const { appPhase, activeUser, profiles, setAppPhase, startNewProfile, switchProfile } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

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
      {/* Profile name — clickable dropdown for switching */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className={`rounded px-1.5 py-0.5 font-medium transition-colors hover:bg-[#f0eef8] hover:text-[#4f5bb3] ${hasUser ? "text-[#1e1e1e]" : "text-[#c9c8c6] italic"}`}
          title="Click to switch profiles"
        >
          [{profileName}] <span className="text-[9px] text-[#b0afac]">&#9662;</span>
        </button>
        {dropdownOpen && (
          <div className="absolute bottom-full left-0 mb-1 min-w-[160px] rounded-md border border-[#e6e5e3] bg-white py-1 shadow-lg">
            {profiles.map((p) => (
              <button
                key={p.slug}
                onClick={() => {
                  switchProfile(p.slug);
                  setDropdownOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] transition-colors hover:bg-[#f0eef8] ${activeUser?.slug === p.slug ? "font-medium text-[#4f5bb3]" : "text-[#5f5e5b]"}`}
              >
                {activeUser?.slug === p.slug && <span className="text-[9px]">&#10003;</span>}
                <span className={activeUser?.slug === p.slug ? "" : "pl-[14px]"}>{p.display_name}</span>
                <span className="ml-auto text-[9px] text-[#b0afac]">{p.slug}</span>
              </button>
            ))}
            <div className="my-1 border-t border-[#e6e5e3]" />
            <button
              onClick={() => {
                startNewProfile();
                setDropdownOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] text-[#8a6ee4] transition-colors hover:bg-[#f0eef8]"
            >
              <span className="pl-[14px]">+ New Profile</span>
            </button>
          </div>
        )}
      </div>
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
