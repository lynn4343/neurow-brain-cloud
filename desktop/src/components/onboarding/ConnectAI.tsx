"use client";

import { useState, useEffect, useRef } from "react";
import { NeurowLogo } from "@/components/icons/NeurowLogo";
import { OnboardingLayout } from "./OnboardingLayout";
import { checkChatAvailable } from "@/lib/electron";
import { Info } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  PROVIDER_PRESETS,
  STORAGE_KEY,
  DEFAULT_CONFIG,
  type BYOKConfig,
} from "@/lib/byok-constants";

// ---------------------------------------------------------------------------
// ConnectAI — Onboarding step: configure AI model access before Clarity Session.
// Three paths: Provided Key (judges), Your Own Key (BYOK), Claude CLI.
// Auto-skips if .env key or CLI already detected.
// ---------------------------------------------------------------------------

type ConnectionTab = "provided" | "byok" | "cli";

interface ConnectAIProps {
  onComplete: () => void;
}

export function ConnectAI({ onComplete }: ConnectAIProps) {
  const mountedRef = useRef(true);
  const [tab, setTab] = useState<ConnectionTab>("provided");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cliDetected, setCliDetected] = useState<boolean | null>(null);

  // BYOK tab state
  const [byokProvider, setByokProvider] = useState("anthropic");
  const [byokModel, setByokModel] = useState("claude-sonnet-4-6");
  const [byokEndpoint, setByokEndpoint] = useState("https://api.anthropic.com/v1");
  const [byokKey, setByokKey] = useState("");

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // Auto-skip if .env key already provides API access.
  // Uses a 2-second timeout to avoid hanging the screen if IPC is slow.
  useEffect(() => {
    const timeout = setTimeout(() => {
      // IPC didn't resolve in time — just show the screen
      if (mountedRef.current) setCliDetected(false);
    }, 2000);

    checkChatAvailable().then((result) => {
      clearTimeout(timeout);
      if (!mountedRef.current) return;
      if (result.mode === "api") {
        onComplete();
      } else if (result.mode === "cli") {
        setCliDetected(true);
        setTab("cli");
      } else {
        setCliDetected(false);
      }
    }).catch(() => {
      clearTimeout(timeout);
      if (mountedRef.current) setCliDetected(false);
    });

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  function handleByokProviderChange(providerId: string) {
    const preset = PROVIDER_PRESETS.find((p) => p.id === providerId);
    if (!preset) return;
    setByokProvider(providerId);
    setByokEndpoint(preset.endpoint);
    setByokModel(preset.models[0]?.value ?? "");
  }

  async function handleConnect() {
    // If already connected, just advance
    if (status === "connected") { onComplete(); return; }

    setStatus("connecting");
    setErrorMessage(null);

    // Build config based on active tab
    let config: BYOKConfig;
    if (tab === "provided") {
      config = {
        ...DEFAULT_CONFIG,
        apiKey: apiKey.trim(),
      };
    } else if (tab === "byok") {
      config = {
        provider: byokProvider,
        endpoint: byokEndpoint,
        model: byokModel,
        apiKey: byokKey.trim(),
      };
    } else {
      // CLI tab — verify with a timeout so it doesn't hang forever
      setStatus("connecting");
      try {
        const result = await Promise.race([
          checkChatAvailable(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 5000)
          ),
        ]);
        if (result.mode === "cli" || result.mode === "api") {
          setStatus("connected");
          setTimeout(() => { if (mountedRef.current) onComplete(); }, 400);
        } else {
          setStatus("error");
          setErrorMessage(
            "Claude CLI not detected. Make sure you've installed Claude Code and run `claude` in your terminal to authenticate, then try again."
          );
        }
      } catch {
        setStatus("error");
        setErrorMessage(
          "Could not verify Claude CLI. Make sure Claude Code is installed and authenticated, or use the Provided Key tab instead."
        );
      }
      return;
    }

    // Persist non-sensitive config to localStorage for UI hydration across reloads.
    // API key is acceptable in localStorage for this Electron app: contextIsolation is
    // enabled, nodeIntegration is disabled, and no remote content is loaded — so there
    // are no XSS vectors. In a production web app, keys should go through secure storage.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

    // Bridge to main process
    try {
      const result = await window.neurow.setBYOKConfig(config);
      window.dispatchEvent(
        new CustomEvent("neurow-chat-mode-change", { detail: result })
      );

      if (result.mode === "api") {
        setStatus("connected");
        setTimeout(() => {
          if (mountedRef.current) onComplete();
        }, 600);
      } else {
        setStatus("error");
        setErrorMessage("Key could not be activated. Check the key and try again.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Connection failed. Please try again.");
    }
  }

  // CTA state
  const activeKey = tab === "provided" ? apiKey : byokKey;
  const canConnect =
    tab === "cli"
      ? true
      : activeKey.trim().length > 0 && status !== "connecting";

  const ctaLabel =
    status === "connecting"
      ? "Connecting..."
      : status === "connected"
        ? "Connected"
        : tab === "cli"
          ? "Continue"
          : "Connect";

  const activeByokPreset =
    PROVIDER_PRESETS.find((p) => p.id === byokProvider) ?? PROVIDER_PRESETS[0];
  const isByokCustom = byokProvider === "custom";

  return (
    <OnboardingLayout
      ctaLabel={ctaLabel}
      ctaEnabled={canConnect}
      onCta={handleConnect}
    >
      <div className="flex flex-col items-center gap-6">
        <NeurowLogo className="h-[69px] w-[49px]" />

        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-albra text-[28px] font-medium leading-8 text-[#1e1e1e]">
            Connect your <em className="font-medium italic">intelligence.</em>
          </h1>
          <p className="text-sm leading-5 text-[#5f5e5b]">
            Neurow is model-agnostic — however we recommend models
            <br />
            such as Claude Sonnet or Opus for best results. Connect to get started.
          </p>
        </div>

        {/* Tab selector */}
        <div className="inline-flex gap-1 rounded-lg bg-[#F4F1F1] p-1">
          {([
            { id: "provided" as const, label: "Provided Key" },
            { id: "byok" as const, label: "Your Own Key" },
            { id: "cli" as const, label: "Claude CLI" },
          ]).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTab(t.id); setStatus("idle"); setErrorMessage(null); }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                tab === t.id
                  ? "bg-white text-[#1E1E1E] shadow-sm"
                  : "text-[#5f5e5b] hover:text-[#1E1E1E]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="w-full space-y-4">
          {tab === "provided" && (
            <>
              <input
                type="password"
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && canConnect) handleConnect(); }}
                autoFocus
                className="h-8 w-full rounded-md border border-[#6579EE] bg-transparent px-3 text-center text-sm placeholder:text-[#a8a49c] transition-all duration-150 focus:border-[#6579EE] focus:outline-none focus:ring-2 focus:ring-[#6579EE]/20"
              />
              <p className="text-center text-xs text-[#5f5e5b]">
                Paste the API key from your welcome materials.
              </p>
            </>
          )}

          {tab === "byok" && (
            <div className="space-y-4">
              {/* Provider selector */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#1E1E1E]">Provider</label>
                <div className="inline-flex gap-1 rounded-lg bg-[#F4F1F1] p-1">
                  {PROVIDER_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleByokProviderChange(preset.id)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                        byokProvider === preset.id
                          ? "bg-white text-[#1E1E1E] shadow-sm"
                          : "text-[#5f5e5b] hover:text-[#1E1E1E]"
                      )}
                    >
                      {preset.tabLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#1E1E1E]">Model</label>
                {isByokCustom ? (
                  <input
                    value={byokModel}
                    onChange={(e) => setByokModel(e.target.value)}
                    placeholder="e.g., llama-3.1-70b"
                    className="h-8 w-full rounded-md border border-[#e6e5e3] bg-transparent px-3 text-sm placeholder:text-[#a8a49c] focus:border-[#6579EE] focus:outline-none focus:ring-1 focus:ring-[#6579EE]/20"
                  />
                ) : (
                  <select
                    value={byokModel}
                    onChange={(e) => setByokModel(e.target.value)}
                    className="h-8 w-full rounded-md border border-[#e6e5e3] bg-transparent px-3 text-sm focus:border-[#6579EE] focus:outline-none focus:ring-1 focus:ring-[#6579EE]/20"
                  >
                    {activeByokPreset.models.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Endpoint (editable only for Custom) */}
              {isByokCustom && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#1E1E1E]">Endpoint</label>
                  <input
                    value={byokEndpoint}
                    onChange={(e) => setByokEndpoint(e.target.value)}
                    placeholder="https://api.example.com/v1"
                    className="h-8 w-full rounded-md border border-[#e6e5e3] bg-transparent px-3 text-sm placeholder:text-[#a8a49c] focus:border-[#6579EE] focus:outline-none focus:ring-1 focus:ring-[#6579EE]/20"
                  />
                </div>
              )}

              {/* API Key */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#1E1E1E]">API Key</label>
                <input
                  type="password"
                  placeholder={activeByokPreset.keyPlaceholder}
                  value={byokKey}
                  onChange={(e) => setByokKey(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && canConnect) handleConnect(); }}
                  className="h-8 w-full rounded-md border border-[#6579EE] bg-transparent px-3 text-sm placeholder:text-[#a8a49c] transition-all duration-150 focus:border-[#6579EE] focus:outline-none focus:ring-2 focus:ring-[#6579EE]/20"
                />
              </div>

              {/* OpenAI warning */}
              {byokProvider === "openai" && byokKey && (
                <span className="flex items-center gap-1.5 text-xs text-amber-600">
                  <Info size={14} />
                  OpenAI support coming soon
                </span>
              )}
            </div>
          )}

          {tab === "cli" && (
            <div className="flex flex-col items-center gap-4 py-2">
              <p className="text-center text-sm leading-relaxed text-[#5f5e5b]">
                If you have Claude Code CLI installed and authenticated,
                Neurow will use it automatically. No additional configuration needed.
              </p>
              <p className="text-center text-xs leading-relaxed text-[#5f5e5b]">
                Don&apos;t have it? Install via{" "}
                <code className="rounded bg-[#F4F1F1] px-1 py-0.5 text-[11px] text-[#1e1e1e]">
                  npm install -g @anthropic-ai/claude-code
                </code>{" "}
                then run{" "}
                <code className="rounded bg-[#F4F1F1] px-1 py-0.5 text-[11px] text-[#1e1e1e]">
                  claude
                </code>{" "}
                to authenticate.
              </p>
            </div>
          )}
        </div>

        {/* Status feedback */}
        {status === "connected" && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Connected — cognitive intelligence ready
          </span>
        )}
        {status === "error" && errorMessage && (
          <p className="text-center text-xs text-red-500">{errorMessage}</p>
        )}
      </div>
    </OnboardingLayout>
  );
}
