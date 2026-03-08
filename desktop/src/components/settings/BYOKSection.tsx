"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Info } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Provider presets — curated for demo, not technical gates.
// Brain Cloud is model-agnostic: the MCP server doesn't know or care
// which model calls its tools. These presets are UX convenience.
// See: BUILD_SPECS/Model_Provider_Spec.md (Tier 3)
// ---------------------------------------------------------------------------

interface ProviderPreset {
  id: string;
  name: string;
  tabLabel: string;
  endpoint: string;
  models: { value: string; label: string }[];
  keyPlaceholder: string;
}

const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    tabLabel: "Anthropic",
    endpoint: "https://api.anthropic.com/v1",
    models: [
      { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
      { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
      { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
    ],
    keyPlaceholder: "sk-ant-...",
  },
  {
    id: "openai",
    name: "OpenAI",
    tabLabel: "OpenAI",
    endpoint: "https://api.openai.com/v1",
    models: [
      { value: "gpt-5.4", label: "GPT-5.4" },
      { value: "gpt-5.4-pro", label: "GPT-5.4 Pro" },
      { value: "gpt-5", label: "GPT-5" },
    ],
    keyPlaceholder: "sk-...",
  },
  {
    id: "nvidia",
    name: "NVIDIA Nemotron",
    tabLabel: "NVIDIA",
    endpoint: "https://integrate.api.nvidia.com/v1",
    models: [
      { value: "nvidia/nemotron-3-nano-30b-a3b", label: "Nemotron 3 Nano 30B (DGX Spark)" },
      { value: "nvidia/nvidia-nemotron-nano-9b-v2", label: "Nemotron Nano 9B v2" },
    ],
    keyPlaceholder: "nvapi-...",
  },
  {
    id: "custom",
    name: "Custom Provider",
    tabLabel: "Custom",
    endpoint: "",
    models: [],
    keyPlaceholder: "Your API key",
  },
];

const STORAGE_KEY = "neurow_byok";

interface BYOKConfig {
  provider: string;
  endpoint: string;
  model: string;
  apiKey: string;
}

const DEFAULT_CONFIG: BYOKConfig = {
  provider: "anthropic",
  endpoint: "https://api.anthropic.com/v1",
  model: "claude-sonnet-4-6",
  apiKey: "",
};

function loadBYOK(): BYOKConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    // Migration from old format (no provider field)
    if (!parsed.provider) {
      return {
        ...DEFAULT_CONFIG,
        apiKey: parsed.apiKey || "",
        model: parsed.model || DEFAULT_CONFIG.model,
      };
    }
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function BYOKSection() {
  const [config, setConfig] = useState<BYOKConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time SSR hydration from localStorage */
    setConfig(loadBYOK());
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
        setError(null);
      } catch {
        setError("Failed to configure API key");
      }
    } else {
      setSaved(true);
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

        {/* Save + status */}
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

          {/* Connection status */}
          {config.apiKey && saved && config.provider !== "openai" && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Connected — coaching ready
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
