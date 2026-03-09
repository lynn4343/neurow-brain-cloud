// ---------------------------------------------------------------------------
// Shared BYOK (Bring Your Own Key) constants and utilities.
// Used by: onboarding ConnectAI screen + Settings BYOKSection.
// See: BUILD_SPECS/Model_Provider_Spec.md (Tier 3)
// ---------------------------------------------------------------------------

export interface ProviderPreset {
  id: string;
  name: string;
  tabLabel: string;
  endpoint: string;
  models: { value: string; label: string }[];
  keyPlaceholder: string;
}

export const PROVIDER_PRESETS: [ProviderPreset, ...ProviderPreset[]] = [
  {
    id: "anthropic",
    name: "Anthropic",
    tabLabel: "Anthropic",
    endpoint: "https://api.anthropic.com/v1",
    models: [
      { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
      { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
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

export const STORAGE_KEY = "neurow_byok";

export interface BYOKConfig {
  provider: string;
  endpoint: string;
  model: string;
  apiKey: string;
}

export const DEFAULT_CONFIG: BYOKConfig = {
  provider: "anthropic",
  endpoint: "https://api.anthropic.com/v1",
  model: "claude-sonnet-4-6",
  apiKey: "",
};

export function loadBYOK(): BYOKConfig {
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
