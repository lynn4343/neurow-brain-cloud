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

// --- Session Complete Event (Goal Cascade from Clarity Session Turn 9) ---

import type { GoalCascade } from '@/contexts/UserContext';

export interface SessionCompleteEvent {
  session_id: string;
  goal_cascade: GoalCascade;
}

// --- User Context (passed to claude.ts for system prompt assembly) ---

export interface UserContext {
  slug: string;
  display_name: string;
  mode: string;
  coaching_style: string;
  roles: string[];
  goal_cascade: GoalCascade | null;
  // Onboarding context (W4-4a port)
  focus_area?: string;
  declared_challenges?: string[];
  is_business_owner?: boolean;
  business_description?: string;
  business_stage?: string;
  current_business_focus?: string;
  business_challenges?: string[];
  career_situation?: string;
  career_stage?: string;
  career_focus?: string;
  career_challenges?: string[];
}

// --- Chat Available Result ---

export interface ChatAvailableResult {
  mode: 'api' | 'cli' | 'none';
  detail: string;
}

// --- Neurow API type (exposed by preload via contextBridge) ---

// --- Direct Data API types (model-agnostic, no AI in the loop) ---

export interface CreateProfileResult {
  id: string;
  slug: string;
  display_name: string;
  first_name: string;
}

export interface UpdateProfileResult {
  updated: boolean;
  fields: string[];
}

export interface BrainExportData {
  version: string;
  exported_at: string;
  user: Record<string, unknown>;
  metadata: Record<string, unknown>;
  episodic: Record<string, unknown>[];
  coaching_sessions: Record<string, unknown>[];
}

// --- Neurow API type (exposed by preload via contextBridge) ---

interface NeurowAPI {
  sendMessage: (prompt: string, sessionId?: string, userContext?: unknown) => Promise<string>;
  checkClaudeInstalled: () => Promise<boolean>;
  checkChatAvailable: () => Promise<ChatAvailableResult>;
  onChatStream: (callback: (data: ChatStreamEvent) => void) => () => void;
  onChatComplete: (callback: (data: ChatCompleteEvent) => void) => () => void;
  onChatError: (callback: (data: ChatErrorEvent) => void) => () => void;
  onToolActivity: (callback: (data: ToolActivityEvent) => void) => () => void;
  onSessionComplete: (callback: (data: SessionCompleteEvent) => void) => () => void;
  // Direct Data API (model-agnostic)
  createProfile: (displayName: string) => Promise<CreateProfileResult>;
  updateProfile: (userId: string, profileData: Record<string, unknown>) => Promise<UpdateProfileResult>;
  getProfile: (userId: string) => Promise<Record<string, unknown>>;
  exportData: (userId: string) => Promise<BrainExportData>;
  deleteUserData: (userId: string) => Promise<{ deleted: true; tables: string[] }>;
  deleteAccount: (userId: string) => Promise<{ deleted: true; tables: string[] }>;
  openBrainCloud: (slug?: string) => Promise<void>;
  setBYOKConfig: (config: { provider: string; endpoint: string; apiKey: string; model: string } | null) => Promise<ChatAvailableResult>;
}

declare global {
  interface Window {
    neurow: NeurowAPI;
  }
}

// --- Commands (renderer-to-main IPC wrappers) ---

export async function sendMessage(
  prompt: string,
  sessionId?: string,
  userContext?: UserContext,
): Promise<string> {
  return window.neurow.sendMessage(prompt, sessionId, userContext);
}

export async function checkClaudeInstalled(): Promise<boolean> {
  return window.neurow.checkClaudeInstalled();
}

export async function checkChatAvailable(): Promise<ChatAvailableResult> {
  return window.neurow.checkChatAvailable();
}

// --- Event Listeners ---
// Synchronous — the preload API registers ipcRenderer.on and returns
// an unlistener function immediately. No Promise wrapper needed.

export function onChatStream(
  callback: (payload: ChatStreamEvent) => void
): () => void {
  return window.neurow.onChatStream(callback);
}

export function onChatComplete(
  callback: (payload: ChatCompleteEvent) => void
): () => void {
  return window.neurow.onChatComplete(callback);
}

export function onChatError(
  callback: (payload: ChatErrorEvent) => void
): () => void {
  return window.neurow.onChatError(callback);
}

export function onToolActivity(
  callback: (payload: ToolActivityEvent) => void
): () => void {
  return window.neurow.onToolActivity(callback);
}

export function onSessionComplete(
  callback: (payload: SessionCompleteEvent) => void
): () => void {
  return window.neurow.onSessionComplete(callback);
}

// --- Direct Data API (model-agnostic, no AI in the loop) ---

export async function createProfile(displayName: string): Promise<CreateProfileResult> {
  return window.neurow.createProfile(displayName);
}

export async function updateProfile(
  userId: string,
  profileData: Record<string, unknown>,
): Promise<UpdateProfileResult> {
  return window.neurow.updateProfile(userId, profileData);
}

export async function getProfile(userId: string): Promise<Record<string, unknown>> {
  return window.neurow.getProfile(userId);
}

export async function exportData(userId: string): Promise<BrainExportData> {
  return window.neurow.exportData(userId);
}

export async function deleteUserData(userId: string): Promise<{ deleted: true; tables: string[] }> {
  return window.neurow.deleteUserData(userId);
}

export async function deleteAccount(userId: string): Promise<{ deleted: true; tables: string[] }> {
  return window.neurow.deleteAccount(userId);
}

export async function openBrainCloud(slug?: string): Promise<void> {
  return window.neurow.openBrainCloud(slug);
}

export async function setBYOKConfig(
  config: { provider: string; endpoint: string; apiKey: string; model: string } | null,
): Promise<ChatAvailableResult> {
  return window.neurow.setBYOKConfig(config);
}
