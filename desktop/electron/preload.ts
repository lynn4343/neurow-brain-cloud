import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type { UserContext } from './claude';

// IPC payload types — contract between main process (claude.ts) and renderer.
// Must match the shapes emitted by window.webContents.send() in claude.ts.

interface ChatStreamPayload {
  session_id: string;
  content: string;
  is_partial: boolean;
}

interface ChatCompletePayload {
  session_id: string;
  cost_usd: number;
  duration_ms: number;
}

interface ChatErrorPayload {
  session_id: string;
  error: string;
}

interface ToolActivityPayload {
  session_id: string;
  tool_name: string;
  summary: string;
}

interface SessionCompletePayload {
  session_id: string;
  goal_cascade: Record<string, unknown>;
}

contextBridge.exposeInMainWorld('neurow', {
  sendMessage: (prompt: string, sessionId?: string, userContext?: UserContext) => {
    return ipcRenderer.invoke('send-message', prompt, sessionId, userContext);
  },
  checkClaudeInstalled: () => {
    return ipcRenderer.invoke('check-claude-installed');
  },
  checkChatAvailable: () => {
    return ipcRenderer.invoke('check-chat-available');
  },
  // --- Direct Data API (model-agnostic, no AI in the loop) ---
  createProfile: (displayName: string) => {
    return ipcRenderer.invoke('create-profile', displayName);
  },
  updateProfile: (userId: string, profileData: Record<string, unknown>) => {
    return ipcRenderer.invoke('update-profile', userId, profileData);
  },
  getProfile: (userId: string) => {
    return ipcRenderer.invoke('get-profile', userId);
  },
  exportData: (userId: string) => {
    return ipcRenderer.invoke('export-data', userId);
  },
  deleteUserData: (userId: string) => {
    return ipcRenderer.invoke('delete-user-data', userId);
  },
  deleteAccount: (userId: string) => {
    return ipcRenderer.invoke('delete-account', userId);
  },
  openBrainCloud: (slug?: string) => {
    return ipcRenderer.invoke('open-brain-cloud', slug);
  },
  setBYOKConfig: (config: { provider: string; endpoint: string; apiKey: string; model: string } | null) => {
    return ipcRenderer.invoke('set-byok-config', config);
  },
  onChatStream: (callback: (data: ChatStreamPayload) => void) => {
    const handler = (_event: IpcRendererEvent, data: ChatStreamPayload) => callback(data);
    ipcRenderer.on('chat_stream', handler);
    return () => { ipcRenderer.removeListener('chat_stream', handler); };
  },
  onChatComplete: (callback: (data: ChatCompletePayload) => void) => {
    const handler = (_event: IpcRendererEvent, data: ChatCompletePayload) => callback(data);
    ipcRenderer.on('chat_complete', handler);
    return () => { ipcRenderer.removeListener('chat_complete', handler); };
  },
  onChatError: (callback: (data: ChatErrorPayload) => void) => {
    const handler = (_event: IpcRendererEvent, data: ChatErrorPayload) => callback(data);
    ipcRenderer.on('chat_error', handler);
    return () => { ipcRenderer.removeListener('chat_error', handler); };
  },
  onToolActivity: (callback: (data: ToolActivityPayload) => void) => {
    const handler = (_event: IpcRendererEvent, data: ToolActivityPayload) => callback(data);
    ipcRenderer.on('chat_activity', handler);
    return () => { ipcRenderer.removeListener('chat_activity', handler); };
  },
  onSessionComplete: (callback: (data: SessionCompletePayload) => void) => {
    const handler = (_event: IpcRendererEvent, data: SessionCompletePayload) => callback(data);
    ipcRenderer.on('session_complete', handler);
    return () => { ipcRenderer.removeListener('session_complete', handler); };
  },
});
