import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('neurow', {
  sendMessage: (prompt: string, sessionId?: string) => {
    return ipcRenderer.invoke('send-message', prompt, sessionId);
  },
  checkClaudeInstalled: () => {
    return ipcRenderer.invoke('check-claude-installed');
  },
  onChatStream: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('chat_stream', handler);
    return () => { ipcRenderer.removeListener('chat_stream', handler); };
  },
  onChatComplete: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('chat_complete', handler);
    return () => { ipcRenderer.removeListener('chat_complete', handler); };
  },
  onChatError: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('chat_error', handler);
    return () => { ipcRenderer.removeListener('chat_error', handler); };
  },
  onToolActivity: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('chat_activity', handler);
    return () => { ipcRenderer.removeListener('chat_activity', handler); };
  },
});
