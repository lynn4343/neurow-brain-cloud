"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Info } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  PROVIDER_PRESETS,
  STORAGE_KEY,
  DEFAULT_CONFIG,
  loadBYOK,
  type BYOKConfig,
} from "@/lib/byok-constants";

export function BYOKSection() {
  const [config, setConfig] = useState<BYOKConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time SSR hydration from localStorage */
    const loaded = loadBYOK();
    setConfig(loaded);
    setConnected(!!loaded.apiKey);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const activePreset =
    PROVIDER_PRESETS.find((p) => p.id === config.provider) ?? PROVIDER_PRESETS[0];
  const isCustom = config.provider === "custom";

  function handleProviderChange(providerId: string) {
    const preset = PROVIDER_PRESETS.find((p) => p.id === providerId);
    if (!preset) return;
    setConfig((prev) => ({
      ...prev,
      provider: providerId,
      endpoint: preset.endpoint,
      model: preset.models[0]?.value ?? "",
    }));
  }

  async function handleSave() {
    // Persist to localStorage (survives reload)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

    // Bridge to main process (activates for current session)
    if (typeof window !== "undefined" && window.neurow?.setBYOKConfig) {
      try {
        const result = await window.neurow.setBYOKConfig({
          provider: config.provider,
          endpoint: config.endpoint,
          apiKey: config.apiKey,
          model: config.model,
        });
        // Broadcast availability change so AppShell can update chatMode
        window.dispatchEvent(
          new CustomEvent("neurow-chat-mode-change", { detail: result })
        );
        setSaved(true);
        setConnected(!!config.apiKey);
        setError(null);
      } catch {
        setError("Failed to configure API key");
        setConnected(false);
      }
    } else {
      setSaved(true);
      setConnected(!!config.apiKey);
    }

    setTimeout(() => setSaved(false), 2000);
  }

  // Status line
  const activeModelLabel = isCustom
    ? config.model || "Not configured"
    : activePreset.models.find((m) => m.value === config.model)?.label ?? config.model;

  return (
    <section>
      <h2 className="text-sm font-medium uppercase tracking-wider text-[#1E1E1E] mb-1">
        Model Configuration
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        Connect your API key to use Neurow with any model. Neurow is
        model-agnostic — your insights, memories, and knowledge graph
        work with any AI.
      </p>
      <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
        For the best executive intelligence experience, we recommend sticking with our
        carefully curated model. Stronger reasoning, planning, and behavioral synthesis
        produce better insights. But the choice is always yours.
      </p>

      <div className="space-y-5">
        {/* Provider selector — segmented control */}
        <div>
          <label className="block mb-2 text-sm font-medium text-[#1E1E1E]">Provider</label>
          <div className="inline-flex gap-1 rounded-lg bg-[#F4F1F1] p-1">
            {PROVIDER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleProviderChange(preset.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  config.provider === preset.id
                    ? "bg-white text-[#1E1E1E] shadow-sm"
                    : "text-muted-foreground hover:text-[#1E1E1E]"
                )}
              >
                {preset.tabLabel}
              </button>
            ))}
          </div>
        </div>

        {/* API Endpoint */}
        <div>
          <label htmlFor="byok-endpoint" className="block mb-2 text-sm font-medium text-[#1E1E1E]">
            API Endpoint
          </label>
          <Input
            id="byok-endpoint"
            value={config.endpoint}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, endpoint: e.target.value }))
            }
            placeholder="https://api.example.com/v1"
            readOnly={!isCustom}
            className={cn(
              "max-w-sm",
              !isCustom && "bg-[#FAF8F8] text-muted-foreground cursor-default"
            )}
          />
        </div>

        {/* Model */}
        <div className="space-y-1.5">
          <label htmlFor="byok-model" className="text-sm font-medium text-[#1E1E1E]">
            Model
          </label>
          {isCustom ? (
            <Input
              id="byok-model"
              value={config.model}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, model: e.target.value }))
              }
              placeholder="e.g., llama-3.1-70b"
              className="max-w-sm"
            />
          ) : (
            <select
              id="byok-model"
              value={config.model}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, model: e.target.value }))
              }
              className="flex h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {activePreset.models.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* API Key */}
        <div>
          <label htmlFor="byok-api-key" className="block mb-2 text-sm font-medium text-[#1E1E1E]">
            API Key
          </label>
          <Input
            id="byok-api-key"
            type="password"
            value={config.apiKey}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, apiKey: e.target.value }))
            }
            placeholder={activePreset.keyPlaceholder}
            className="max-w-sm"
          />
        </div>

        {/* Save + Disconnect + status */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} variant="outline" size="sm">
            {saved ? (
              <span className="flex items-center gap-1.5">
                <Check size={14} weight="bold" className="text-emerald-600" />
                Saved
              </span>
            ) : (
              "Save"
            )}
          </Button>

          {connected && config.apiKey && (
            <Button
              onClick={async () => {
                if (window.neurow?.setBYOKConfig) {
                  try {
                    const result = await window.neurow.setBYOKConfig(null);
                    const cleared = { ...config, apiKey: "" };
                    setConfig(cleared);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared));
                    setConnected(false);
                    setError(null);
                    window.dispatchEvent(
                      new CustomEvent("neurow-chat-mode-change", { detail: result })
                    );
                  } catch {
                    setError("Failed to disconnect");
                  }
                } else {
                  const cleared = { ...config, apiKey: "" };
                  setConfig(cleared);
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared));
                  setConnected(false);
                }
              }}
              variant="outline"
              size="sm"
            >
              Disconnect
            </Button>
          )}

          {/* Connection status — persists after save */}
          {config.apiKey && connected && config.provider !== "openai" && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Connected — cognitive intelligence ready
            </span>
          )}
          {config.provider === "openai" && config.apiKey && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600">
              <Info size={14} />
              OpenAI support coming soon
            </span>
          )}
          {error && (
            <span className="text-xs text-destructive">{error}</span>
          )}
        </div>
      </div>
    </section>
  );
}
