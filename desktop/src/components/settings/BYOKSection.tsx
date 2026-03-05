"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Info } from "@phosphor-icons/react";

const MODEL_OPTIONS = [
  { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5 (default)" },
  { value: "claude-opus-4-5", label: "Claude Opus 4.5" },
  { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
];

const STORAGE_KEY = "neurow_byok";

interface BYOKConfig {
  apiKey: string;
  model: string;
}

function loadBYOK(): BYOKConfig {
  if (typeof window === "undefined") return { apiKey: "", model: "claude-sonnet-4-5" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { apiKey: "", model: "claude-sonnet-4-5" };
    return JSON.parse(raw);
  } catch {
    return { apiKey: "", model: "claude-sonnet-4-5" };
  }
}

export function BYOKSection() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("claude-sonnet-4-5");
  const [saved, setSaved] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const config = loadBYOK();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time SSR hydration from localStorage */
    setApiKey(config.apiKey);
    setModel(config.model);
    setHasKey(!!config.apiKey);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ apiKey, model }));
    setHasKey(!!apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section>
      <h2 className="text-sm font-medium uppercase tracking-wider text-[#1E1E1E] mb-1">
        Model Configuration
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Connect your own API key to use Brain Cloud with any model.
      </p>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="byok-api-key" className="text-sm font-medium text-[#1E1E1E]">
            API Key
          </label>
          <Input
            id="byok-api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="max-w-sm"
          />
          <p className="text-xs text-muted-foreground">
            Your key is stored locally on this device only.
          </p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="byok-model" className="text-sm font-medium text-[#1E1E1E]">
            Model
          </label>
          <select
            id="byok-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="flex h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {MODEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={handleSave} variant="outline" size="sm">
          {saved ? "Saved" : "Save"}
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {hasKey ? (
            <>
              <Check className="size-4 text-green-600" weight="bold" />
              <span>Custom API key configured.</span>
            </>
          ) : (
            <>
              <Info className="size-4" weight="regular" />
              <span>Using default configuration.</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
