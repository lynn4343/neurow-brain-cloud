// --- Types (same as tauri.ts — exact same interface) ---

export interface ChatStreamEvent {
  session_id: string;
  content: string;
  is_partial: boolean;
}

export interface ChatCompleteEvent {
  session_id: string;
  cost_usd: number;
  duration_ms: number;
}

export interface ChatErrorEvent {
  session_id: string;
  error: string;
}

export interface ToolActivityEvent {
  session_id: string;
  tool_name: string;
  summary: string;
}

// --- Neurow API type (exposed by preload via contextBridge) ---

interface NeurowAPI {
  sendMessage: (prompt: string, sessionId?: string) => Promise<string>;
  checkClaudeInstalled: () => Promise<boolean>;
  onChatStream: (callback: (data: ChatStreamEvent) => void) => () => void;
  onChatComplete: (callback: (data: ChatCompleteEvent) => void) => () => void;
  onChatError: (callback: (data: ChatErrorEvent) => void) => () => void;
  onToolActivity: (callback: (data: ToolActivityEvent) => void) => () => void;
}

declare global {
  interface Window {
    neurow: NeurowAPI;
  }
}

// --- Commands (same function signatures as tauri.ts) ---

export async function sendMessage(
  prompt: string,
  sessionId?: string
): Promise<string> {
  return window.neurow.sendMessage(prompt, sessionId);
}

export async function checkClaudeInstalled(): Promise<boolean> {
  return window.neurow.checkClaudeInstalled();
}

// --- Event Listeners (same function signatures as tauri.ts) ---
// Return Promise<() => void> to match tauri.ts API exactly

export function onChatStream(
  callback: (payload: ChatStreamEvent) => void
): Promise<() => void> {
  const unlisten = window.neurow.onChatStream(callback);
  return Promise.resolve(unlisten);
}

export function onChatComplete(
  callback: (payload: ChatCompleteEvent) => void
): Promise<() => void> {
  const unlisten = window.neurow.onChatComplete(callback);
  return Promise.resolve(unlisten);
}

export function onChatError(
  callback: (payload: ChatErrorEvent) => void
): Promise<() => void> {
  const unlisten = window.neurow.onChatError(callback);
  return Promise.resolve(unlisten);
}

export function onToolActivity(
  callback: (payload: ToolActivityEvent) => void
): Promise<() => void> {
  const unlisten = window.neurow.onToolActivity(callback);
  return Promise.resolve(unlisten);
}
