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

contextBridge.exposeInMainWorld('neurow', {
  sendMessage: (prompt: string, sessionId?: string, userContext?: UserContext) => {
    return ipcRenderer.invoke('send-message', prompt, sessionId, userContext);
  },
  checkClaudeInstalled: () => {
    return ipcRenderer.invoke('check-claude-installed');
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
});
